# Stoic Quotes

A browser extension with one Stoic quote a day, a short reflection prompt and a private journal. Built with React and [WXT](https://wxt.dev).

- 365 quotes from Marcus Aurelius, Seneca and Epictetus, each with its source (for example *Meditations 4.49*), shipped inside the extension so it works offline
- Everyone sees the same quote on the same day, and no quote repeats within a year
- **Today · Reflect · Journal** views, saved quotes, Markdown export
- Optional new tab page, morning reminder and keyboard shortcut (Alt+Shift+S)
- Settings and saved quotes sync through the browser. Journal notes stay on the device.

## Develop

```bash
npm install
npm run dev            # opens Chrome with the extension loaded; reloads as you save
npm run dev:firefox    # same, in Firefox
```

## Build for the stores

```bash
npm run zip:all
```

Creates in `.output/`:

| File | Upload to |
| --- | --- |
| `stoic-<version>-chrome.zip` | Chrome Web Store |
| `stoic-<version>-edge.zip` | Microsoft Edge Add-ons |
| `stoic-<version>-firefox.zip` | addons.mozilla.org (extension) |
| `stoic-<version>-sources.zip` | addons.mozilla.org (“source code” step, required for bundled code) |

Bump `version` in `package.json` before each release; the manifest reads it from there. The manifest itself is generated from `wxt.config.js`, with Firefox-only settings added for the Firefox build. Store icon: `store/icon-300.png`.

Mozilla’s reviewers rebuild the extension from the sources zip with `npm install && npm run zip:firefox` (Node 20+).

## Project layout

```
src/
  entrypoints/   popup/, newtab/, background.js  → become the extension’s pages
  components/    Quote, Icons
  lib/           daily quote logic, storage, theme
  data/          quotes.json
public/icon/     extension icons
```

## Sources

Translations are public domain and lightly modernised (“thou” → “you”):
George Long, *Meditations* (1862); T. W. Higginson, *Enchiridion* (1865); Hastings Crossley, *Golden Sayings of Epictetus* (1903); R. M. Gummere, *Moral Letters to Lucilius* (1917–25). Texts via Project Gutenberg and Wikisource. Quotes without a source come from the original v2 collection.
