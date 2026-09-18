import { ActorManagerParent } from "resource://gre/modules/ActorManagerParent.sys.mjs";

ActorManagerParent.addJSWindowActors({
    PDFInvertAuto: {
        child: {
            esModuleURI:
                "chrome://userscripts/content/PDFInvertAuto/PDFInvertAutoChild.sys.mjs",
            events: {
                DOMDocElementInserted: { capture: true },
                DOMContentLoaded: {},
            },
        },

        /*
         * Deliberately don't use `matches` here.
         *
         * The child checks the PDF.js principal and viewer DOM. This avoids
         * both the fx-autoconfig @WindowActor remote-type restriction and any
         * ambiguity over the externally visible PDF URL versus the internal
         * PDF.js document URI.
         */
        safeForUntrustedWebProcess: true,
    },
});
