# Firefox PDF AutoConfig Scripts

Firefox customizations for the built-in PDF viewer:

* **Automatic dark mode** for PDF content, with native PDF.js text-selection highlighting.
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

## Text selection

Text selection uses Firefox/PDF.js's native highlighting. The dark-mode script only applies the inversion filter to PDF content; it does not draw a custom selection overlay or attach selection, scroll, or resize listeners.

If upgrading from the version with the custom overlay, restart Firefox and clear the startup cache as described above. Replace any previously saved dark-mode bookmarklet with the version below as well.

## Toggling dark mode

Add this bookmarklet to your bookmarks bar to toggle the inversion filter, including dark mode already applied by the AutoConfig script:

```javascript
javascript:(()=>{const v=document.querySelector(".pdfViewer");if(!v){alert("PDF.js viewer element not found");return}const filter="invert(100%) hue-rotate(180deg)";v.style.filter=v.style.filter===filter?"":filter})()
```

## Updating

If this repository was cloned directly into `chrome/JS`:

```bash
git -C /path/to/firefox/profile/chrome/JS pull
```

Then restart Firefox and clear the startup cache.
