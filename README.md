# Firefox PDF AutoConfig Scripts

Firefox customizations for the built-in PDF viewer:

* **Automatic dark mode** for PDF content, with a configurable text-selection highlight.
* **Vimium C support** inside the built-in PDF viewer, using Vimium C's real mappings, hints, modes, and settings.

The two features are independent and can be used separately.

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

## Changing the selection highlight

The PDF dark-mode script draws its own selection overlay so that selected text remains visible after the PDF is inverted.

To change its color, edit `PDFInvertAuto/PDFInvertAutoChild.sys.mjs` and find:

```javascript
background: "rgba(255, 110, 110, 0.62)",
```

Replace the value with any CSS color. For example:

```javascript
background: "rgba(100, 160, 255, 0.55)",
```

The first three values are the red, green, and blue components from `0` to `255`; the final value is opacity from `0` to `1`.

After changing the script, restart Firefox and clear the startup cache.

## Updating

If this repository was cloned directly into `chrome/JS`:

```bash
git -C /path/to/firefox/profile/chrome/JS pull
```

Then restart Firefox and clear the startup cache.
