# Firefox PDF AutoConfig Scripts

Firefox customizations for the built-in PDF viewer:

* **Automatic dark mode** for light-background PDFs, with native PDF.js text-selection highlighting.
* **Vimium C support** inside the built-in PDF viewer, using Vimium C's real mappings, hints, modes, and settings.

The two features are independent and can be used separately.

## AI Usage Disclaimer

AI was used to generate much of the code and documentation. I have personally reviewed and tested all code, but I cannot guarantee that it is free of bugs or security issues. Use at your own risk.

## Requirements

* Firefox
* [MrOtherGuy/fx-autoconfig](https://github.com/MrOtherGuy/fx-autoconfig) (Please READ the security warnings detailed here)
* [Vimium C](https://github.com/gdh1995/vimium-c) for the Vimium integration

## Install fx-autoconfig

Clone fx-autoconfig:

```bash
git clone https://github.com/MrOtherGuy/fx-autoconfig.git
cd fx-autoconfig
```

Find your Firefox installation directory:

```bash
dirname "$(readlink -f "$(command -v firefox)")"
```

On many Linux distributions this is `/usr/lib/firefox`.

Copy the contents of `program/` into that directory:

```bash
FIREFOX_DIR="$(dirname "$(readlink -f "$(command -v firefox)")")"
sudo cp -a program/. "$FIREFOX_DIR/"
```

Then open:

```text
about:profiles
```

and find the **Root Directory** of the Firefox profile you want to modify.

Copy the contents of fx-autoconfig's `profile/` directory into it:

```bash
cp -a profile/. /path/to/firefox/profile/
```

This should create, among other files:

```text
<profile>/chrome/JS/
<profile>/chrome/resources/
<profile>/chrome/utils/
```

## Firefox preferences

Open:

```text
about:config
```

and verify:

```text
userChromeJS.enabled = true
```

fx-autoconfig normally creates and enables this preference automatically.

No `userContent.css`, `userChrome.css`, or `toolkit.legacyUserProfileCustomizations.stylesheets` setting is required for these scripts.

## Install these scripts

The scripts belong in:

```text
<profile>/chrome/JS/
```

If fx-autoconfig created a default `JS` directory and you do not need its sample scripts, remove it and clone this repository directly in its place:

```bash
rm -rf /path/to/firefox/profile/chrome/JS

git clone https://github.com/UnsaltedScholar/firefox-pdfjs-autoconfig.git \
    /path/to/firefox/profile/chrome/JS
```

If you already keep other fx-autoconfig scripts there, clone this repository elsewhere and copy its contents into `chrome/JS` instead.

## Finish installation

Open:

```text
about:support
```

and click **Clear startup cache…**, then allow Firefox to restart.

Alternatively, once fx-autoconfig is running, use:

```text
Tools → userScripts → Restart and clear startup cache
```

Open a new PDF to test the scripts.

## Automatic background detection

Before applying dark mode, the script renders a small off-screen sample of **page 2**, or page 1 for a single-page PDF. It uses the already loaded PDF.js document, without navigating to that page or fetching a second copy of the PDF. Sampling the second page avoids basing the decision on a differently styled title page.

The sample is at most 128 by 128 pixels. A document is treated as already dark when at least 70% of the outer border band and 60% of the whole sample have relative luminance below 0.18. Checking both regions helps distinguish dark slides from white pages containing large dark figures. Already-dark documents retain their original colors; other documents receive the inversion filter.

This is a heuristic: full-page photographs, unusual borders, and documents mixing light and dark pages can be misclassified. The decision applies to the whole document, once per load. Use the bookmarklet below to override it.

Detection leaves the document unchanged if rendering fails or takes longer than 15 seconds; it also preserves a manual filter change made while sampling is in progress.

While detection is pending, the PDF pages are hidden, exposing PDF.js's own background color; the toolbar and dialogs remain available. Pages are revealed only after the final filter is applied. The cover is also removed on failure or timeout, and does not apply to printing.

Individual pages also reveal PDF.js's current background while they load or render, including later slides and redraws after zooming. Partially rendered canvases remain hidden until PDF.js finishes them. Transparent page shells follow light, dark, and custom viewer backgrounds automatically, even when inversion is toggled; completed pages retain their normal PDF.js background and canvas colors. These loading styles apply only on screen outside forced-colors mode.

To sample a different page, change `SAMPLE_PAGE` at the top of `PDFInvertAuto/PDFInvertAutoChild.sys.mjs` to a positive page number (for example, `1`); documents with fewer pages use their last page. Restart Firefox and clear the startup cache after editing the script.

The rendering uses PDF.js's [page viewport and canvas render APIs](https://mozilla.github.io/pdf.js/examples/). The sample canvas is discarded after the decision; PDF decoding and rendering costs still depend on the document's complexity.

## Text selection

Text selection uses Firefox/PDF.js's native highlighting. The dark-mode script only applies the inversion filter to PDF content; it does not draw a custom selection overlay or attach selection, scroll, or resize listeners.

If upgrading from the version with the custom overlay, restart Firefox and clear the startup cache as described above. Replace any previously saved dark-mode bookmarklet with the version below as well.

## Toggling dark mode

Add this bookmarklet to your bookmarks bar to toggle the inversion filter, including dark mode already applied by the AutoConfig script:

```javascript
javascript:(()=>{const v=document.querySelector(".pdfViewer");if(!v){alert("PDF.js viewer element not found");return}v.dataset.pdfAutoInvertManual="1";const filter="invert(100%) hue-rotate(180deg)";v.style.filter=v.style.filter===filter?"":filter})()
```

## Updating

If this repository was cloned directly into `chrome/JS`:

```bash
git -C /path/to/firefox/profile/chrome/JS pull
```

Then restart Firefox and clear the startup cache.
