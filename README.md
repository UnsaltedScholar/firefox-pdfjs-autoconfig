# Firefox PDF AutoConfig Scripts

Firefox customizations for the built-in PDF viewer:

* **Automatic dark mode** for PDF content, with a configurable text-selection highlight.
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

## Toggling dark mode

This can be accomplished by adding this bookmarklet to your bookmarks bar:

```javascript
javascript:(()=>{const v=document.getElementById("viewer")||document.querySelector(".pdfViewer");if(!v){alert("PDF.js viewer element not found");return}const on=v.dataset.pdfi==="1";if(on){v.dataset.pdfi="0";v.style.filter="";v._pdfiCleanup?.();delete v._pdfiCleanup;return}v.dataset.pdfi="1";v.style.filter="invert(100%) hue-rotate(180deg)";const o=document.createElement("div");o.id="pdfi-selection-overlay";Object.assign(o.style,{position:"fixed",inset:"0",pointerEvents:"none",zIndex:"2147483647",overflow:"hidden"});document.body.appendChild(o);let raf=0;const paint=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{o.replaceChildren();const s=getSelection();if(!s||s.isCollapsed||!s.rangeCount)return;const n=s.anchorNode;if(!n||!v.contains(n.nodeType===1?n:n.parentElement))return;for(let i=0;i<s.rangeCount;i++)for(const r of s.getRangeAt(i).getClientRects()){if(r.width<1||r.height<1)continue;const d=document.createElement("div");Object.assign(d.style,{position:"fixed",left:r.left+"px",top:r.top+"px",width:r.width+"px",height:r.height+"px",background:"rgba(255,110,110,.62)",borderRadius:"2px"});o.appendChild(d)}})};document.addEventListener("selectionchange",paint);window.addEventListener("scroll",paint,true);window.addEventListener("resize",paint);paint();v._pdfiCleanup=()=>{cancelAnimationFrame(raf);document.removeEventListener("selectionchange",paint);window.removeEventListener("scroll",paint,true);window.removeEventListener("resize",paint);o.remove()}})()
```

## Updating

If this repository was cloned directly into `chrome/JS`:

```bash
git -C /path/to/firefox/profile/chrome/JS pull
```

Then restart Firefox and clear the startup cache.
