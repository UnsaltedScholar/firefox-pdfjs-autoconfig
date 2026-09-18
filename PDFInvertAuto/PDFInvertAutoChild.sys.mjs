export class PDFInvertAutoChild extends JSWindowActorChild {
    handleEvent(event) {
        if (event.type !== "DOMContentLoaded") {
            return;
        }

        this.initialize();
    }

    initialize() {
        const document = this.document;

        if (!document) {
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
         * Invert PDF content while leaving selection highlighting to PDF.js.
         */
        viewer.style.filter = "invert(100%) hue-rotate(180deg)";
    }
}
