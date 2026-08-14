import {
    ActorManagerParent,
} from "resource://gre/modules/ActorManagerParent.sys.mjs";

ActorManagerParent.addJSWindowActors({
    PDFVimiumAuto: {
        child: {
            esModuleURI:
                "chrome://userscripts/content/PDFVimiumAuto/PDFVimiumAutoChild.sys.mjs",
            events: {
                DOMContentLoaded: {},
            },
        },

        /*
         * Register broadly because Firefox's built-in PDF viewer does not
         * behave like an ordinary WebExtension-injectable web document.
         *
         * The child actor itself strictly checks for PDF.js before doing
         * anything.
         */
        safeForUntrustedWebProcess: true,
    },
});
