import { setInterval, clearInterval, setTimeout, clearTimeout } from "resource://gre/modules/Timer.sys.mjs";

// Sample page 2 to avoid title pages; single-page documents use page 1.
const SAMPLE_PAGE = 2;
const SAMPLE_SIZE = 128;
const DETECTION_TIMEOUT_MS = 15000;
const INVERT_FILTER = "invert(100%) hue-rotate(180deg)";

// Estimate background from both the outer eighth and the whole rendered page.
// Requiring dark edges avoids mistaking a large dark figure on white paper for
// a dark document. This is a heuristic, not a PDF background-color property.
function hasDarkBackground({ data, width, height }) {
    const linear = value => {
        const s = value / 255;
        return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    const ramp = Array.from({ length: 256 }, (_, i) => linear(i));
    let dark = 0;
    let edgeDark = 0;
    let edges = 0;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            const alpha = data[i + 3] / 255;
            // Composite any residual transparency over white paper.
            const channel = offset => ramp[Math.round(
                data[i + offset] * alpha + 255 * (1 - alpha)
            )];
            const luminance = 0.2126 * channel(0) +
                0.7152 * channel(1) + 0.0722 * channel(2);
            const isDark = luminance < 0.18;
            dark += isDark;
            if (x < width / 8 || x >= width * 7 / 8 ||
                y < height / 8 || y >= height * 7 / 8) {
                edges++;
                edgeDark += isDark;
            }
        }
    }
    return edgeDark / edges >= 0.7 && dark / (width * height) >= 0.6;
}

export class PDFInvertAutoChild extends JSWindowActorChild {
    stopped = false;
    started = false;
    poll = null;
    timeout = null;
    renderTask = null;
    pendingStyle = null;
    viewer = null;
    originalFilter = "";

    handleEvent(event) {
        if (event.type === "DOMDocElementInserted") {
            this.prepare();
        } else if (event.type === "DOMContentLoaded") {
            this.initialize();
        }
    }

    prepare() {
        const document = this.document;
        if (this.stopped || !document?.documentElement ||
            Cu.getObjectPrincipal(document).originNoSuffix !== "resource://pdf.js") {
            return false;
        }
        if (this.pendingStyle) {
            return true;
        }
        if (document.documentElement.dataset.pdfAutoInvert) {
            return false;
        }
        document.documentElement.dataset.pdfAutoInvert = "pending";

        // Install before PDF.js creates any page canvases. Opacity preserves
        // their geometry and rendering, while exposing the viewer's actual
        // background instead of guessing a cover color. Keep the toolbar and
        // dialogs visible. Scope to screen so printing is never concealed.
        this.pendingStyle = document.createElement("style");
        this.pendingStyle.textContent = `
            @media screen {
                :root[data-pdf-auto-invert="pending"] .pdfViewer {
                    opacity: 0 !important;
                    pointer-events: none !important;
                }
            }
        `;
        document.documentElement.appendChild(this.pendingStyle);
        // Also release the concealment if viewer initialization never finishes.
        this.timeout = setTimeout(() => this.finish("unavailable"),
            DETECTION_TIMEOUT_MS);
        return true;
    }

    initialize() {
        if (this.started || !this.prepare()) {
            return;
        }
        this.started = true;
        const document = this.document;
        this.viewer = document.querySelector(".pdfViewer");
        if (!this.viewer) {
            this.finish("unavailable");
            return;
        }
        this.originalFilter = this.viewer.style.filter;
        const window = this.contentWindow;

        // Check immediately, then briefly poll until PDF.js exposes the loaded
        // document. This avoids the old mandatory first 100 ms wait.
        const checkDocument = () => {
            if (this.stopped) {
                return;
            }
            const pdf = window.wrappedJSObject.PDFViewerApplication?.pdfDocument;
            if (!pdf) {
                return;
            }
            clearInterval(this.poll);
            this.poll = null;
            this.sample(pdf, document).then(
                dark => this.finish(dark ? "dark" : "inverted"),
                error => {
                    if (!this.stopped) {
                        console.warn("PDF auto-invert: background detection failed; " +
                            "leaving the document unchanged.", error);
                        this.finish("unavailable");
                    }
                }
            );
        };
        this.poll = setInterval(checkDocument, 25);
        checkDocument();
    }

    finish(decision) {
        if (this.stopped) {
            return;
        }
        try {
            // Apply the final filter before revealing the pages, in one task.
            // Preserve manual toggles made while detection was in progress.
            if (this.viewer?.dataset.pdfAutoInvertManual === "1" ||
                (this.viewer && this.viewer.style.filter !== this.originalFilter)) {
                decision = "manual";
            } else if (decision === "inverted" && this.viewer) {
                this.viewer.style.filter = INVERT_FILTER;
            }
            this.document.documentElement.dataset.pdfAutoInvert = decision;
        } finally {
            this.stop();
        }
    }

    async sample(pdf, document) {
        // Promise results acquire Xrays again. Only waive them for the trusted
        // built-in PDF.js viewer, whose principal is checked in prepare().
        const page = Cu.waiveXrays(await pdf.getPage(
            Math.min(SAMPLE_PAGE, pdf.numPages)
        ));
        if (this.stopped) {
            return false;
        }
        const content = document.defaultView.wrappedJSObject;
        const options = new content.Object();
        options.scale = 1;
        const size = page.getViewport(options);
        options.scale = SAMPLE_SIZE / Math.max(size.width, size.height);
        const viewport = page.getViewport(options);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.min(SAMPLE_SIZE, Math.ceil(viewport.width)));
        canvas.height = Math.max(1, Math.min(SAMPLE_SIZE, Math.ceil(viewport.height)));
        const context = canvas.getContext("2d", { willReadFrequently: true });
        try {
            // Off-screen render: no viewer CSS filters, screenshots, extra PDF
            // downloads, or changes to the current page/zoom are involved.
            const renderOptions = new content.Object();
            renderOptions.canvasContext = context;
            renderOptions.viewport = viewport;
            renderOptions.background = "rgb(255, 255, 255)";
            this.renderTask = page.render(renderOptions);
            await this.renderTask.promise;
            return hasDarkBackground(context.getImageData(
                0, 0, canvas.width, canvas.height
            ));
        } finally {
            this.renderTask = null;
            canvas.width = canvas.height = 0;
            // Do not call page.cleanup(): this page is shared with the viewer.
        }
    }

    stop() {
        this.stopped = true;
        this.pendingStyle?.remove();
        this.pendingStyle = null;
        this.viewer = null;
        clearInterval(this.poll);
        clearTimeout(this.timeout);
        this.poll = this.timeout = null;
        if (this.renderTask && !Cu.isDeadWrapper(this.renderTask)) {
            this.renderTask.cancel();
        }
    }

    didDestroy() {
        this.stop();
    }
}
