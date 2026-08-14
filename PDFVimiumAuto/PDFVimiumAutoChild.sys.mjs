import {
    ExtensionProcessScript,
} from "resource://gre/modules/ExtensionProcessScript.sys.mjs";

const VIMIUM_C_ID = "vimium-c@gdh1995.cn";

async function injectVimiumC(window) {
    try {
        const extension =
            ExtensionProcessScript.getExtensionChild(VIMIUM_C_ID);

        if (!extension) {
            console.error(
                "[PDFVimium] Vimium C extension not found:",
                VIMIUM_C_ID
            );
            return;
        }

        const scripts = [...extension.policy.contentScripts];

        if (scripts.length === 0) {
            console.error(
                "[PDFVimium] Vimium C has no registered content scripts"
            );
            return;
        }

        console.info(
            `[PDFVimium] injecting ${scripts.length} content-script bundle(s)`
        );

        for (const script of scripts) {
            try {
                await ExtensionProcessScript.loadContentScript(
                    script,
                    window
                );
            } catch (error) {
                console.error(
                    "[PDFVimium] content-script injection failed:",
                    error
                );
            }
        }

        console.info(
            "[PDFVimium] Vimium C content scripts injected"
        );
    } catch (error) {
        console.error(
            "[PDFVimium] failed to inject Vimium C:",
            error
        );
    }
}

export class PDFVimiumAutoChild extends JSWindowActorChild {
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

        const setup = () => {
            const viewer = document.querySelector(".pdfViewer");

            if (!viewer) {
                return false;
            }

            if (
                document.documentElement.dataset.pdfVimiumInjected === "1"
            ) {
                return true;
            }

            document.documentElement.dataset.pdfVimiumInjected = "1";

            injectVimiumC(window);

            return true;
        };

        if (setup()) {
            return;
        }

        /*
         * In case PDF.js constructs the viewer after DOMContentLoaded.
         */
        const observer = new window.MutationObserver(() => {
            if (setup()) {
                observer.disconnect();
            }
        });

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
        });
    }
}
