export class PDFInvertAutoChild extends JSWindowActorChild {
    cleanup = null;

    handleEvent(event) {
        if (event.type !== "DOMContentLoaded") {
            return;
        }

        this.initialize();
    }

    initialize() {
        const document = this.document;
        const window = this.contentWindow;

        if (!document || !window) {
            return;
        }

        /*
         * Rather than trusting the externally visible URL, identify PDF.js
         * from its actual viewer DOM.
         */
        const viewer =
            document.querySelector(".pdfViewer") ||
            document.getElementById("viewer");

        if (!viewer) {
            return;
        }

        /*
         * Avoid accidentally acting on an unrelated webpage that happens to
         * contain #viewer.
         */
        if (
            !viewer.classList.contains("pdfViewer") &&
            !document.querySelector(".pdfViewer")
        ) {
            return;
        }

        if (document.documentElement.dataset.pdfAutoInvert === "1") {
            return;
        }

        document.documentElement.dataset.pdfAutoInvert = "1";

        /*
         * Same transformation as provided bookmarklet.
         */
        viewer.style.filter = "invert(100%) hue-rotate(180deg)";

        /*
         * Draw our selection highlight outside the filtered viewer.
         */
        const overlay = document.createElement("div");

        overlay.id = "pdf-auto-invert-selection-overlay";

        Object.assign(overlay.style, {
            position: "fixed",
            inset: "0",
            pointerEvents: "none",
            zIndex: "2147483647",
            overflow: "hidden",
        });

        document.body.appendChild(overlay);

        let raf = 0;

        const paintSelection = () => {
            window.cancelAnimationFrame(raf);

            raf = window.requestAnimationFrame(() => {
                overlay.replaceChildren();

                const selection = window.getSelection();

                if (
                    !selection ||
                    selection.isCollapsed ||
                    selection.rangeCount === 0
                ) {
                    return;
                }

                const anchor = selection.anchorNode;

                if (!anchor) {
                    return;
                }

                const anchorElement =
                    anchor.nodeType === 1
                        ? anchor
                        : anchor.parentElement;

                if (
                    !anchorElement ||
                    !viewer.contains(anchorElement)
                ) {
                    return;
                }

                for (
                    let rangeIndex = 0;
                    rangeIndex < selection.rangeCount;
                    ++rangeIndex
                ) {
                    const range = selection.getRangeAt(rangeIndex);

                    for (const rect of range.getClientRects()) {
                        if (rect.width < 1 || rect.height < 1) {
                            continue;
                        }

                        const highlight =
                            document.createElement("div");

                        Object.assign(highlight.style, {
                            position: "fixed",
                            left: `${rect.left}px`,
                            top: `${rect.top}px`,
                            width: `${rect.width}px`,
                            height: `${rect.height}px`,
                            background:
                                "rgba(255, 110, 110, 0.62)",
                            borderRadius: "2px",
                        });

                        overlay.appendChild(highlight);
                    }
                }
            });
        };

        document.addEventListener(
            "selectionchange",
            paintSelection
        );

        window.addEventListener(
            "scroll",
            paintSelection,
            true
        );

        window.addEventListener(
            "resize",
            paintSelection
        );

        this.cleanup = () => {
            window.cancelAnimationFrame(raf);

            document.removeEventListener(
                "selectionchange",
                paintSelection
            );

            window.removeEventListener(
                "scroll",
                paintSelection,
                true
            );

            window.removeEventListener(
                "resize",
                paintSelection
            );

            overlay.remove();

            delete document.documentElement.dataset.pdfAutoInvert;
        };
    }

    didDestroy() {
        this.cleanup?.();
        this.cleanup = null;
    }
}
