# Font licenses

Every file here is a woff2 subset built from originals kept outside the repo
(`~/Documents/Font_Library`; build scripts in `scripts/`). Codepoint counts
below were measured from the shipped files on 2026-09-04 with fontTools.
License evidence was read from the actual source TTFs' name tables (IDs 0,
13, 14) on the same date — mirror-site labels were not relied on.

- `HuiwenMincho-core-subset.woff2` (4,490 codepoints, 2.35 MB) and
  `HuiwenMincho-ext-subset.woff2` (8,644 codepoints, 5.77 MB) — Huiwen-mincho
  (汇文明朝体). CC0 1.0 / Public Domain; full text at
  `Font_Library/licenses/huiwen-mincho/LICENSE`. The two faces partition one
  coverage set: core is the high-frequency face, ext carries the rest behind
  a CJK unicode-range.
- `HuiwenMincho-anglebrackets.woff2` (2 codepoints, 1.3 KB) — full-width
  U+3008/U+3009 rebuilt from the same Huiwen master by
  `scripts/build-angle-bracket-face.mjs` (advance/offset changed, outlines
  untouched). Same CC0 basis as above.
- `ChironSungHK-fallback-subset.woff2` (17,142 codepoints, 3.38 MB) — Chiron
  Sung HK (昭源宋體), SIL Open Font License 1.1
  (<https://github.com/chiron-fonts/chiron-sung-hk>). unicode-range fallback
  for the codepoints Huiwen Mincho cannot draw; served under the
  'Huiwen Mincho' family in `src/fonts-local.css`.
- `ErikasFarbband-subset.woff2` (340 codepoints, 463 KB) and
  `ErikasFarbband-Bold-subset.woff2` (340 codepoints, 727 KB) — Erikas
  Farbband, Copyright (c) 2017 Peter Wiegel. Dual-licensed per the source
  TTFs' name table: "GPL (General Public License) with font-exception and
  OFL (Open Font License)", license URLs
  <http://www.fsf.org/licenses/gpl.html> and <http://scripts.sil.org/OFL>.
  Open license; redistribution and web embedding permitted. Some mirror
  sites (whatfontis.com, ffonts.net) label a build of this font
  "personal-use only" — that string is absent from our source files, and the
  embedded dual license governs the files we actually subset.
- `RadioNewsman-subset.woff2` (91 codepoints, 18 KB) — Radio Newsman, 2016
  Shara Weber. The source TTF's name table (ID 13) states "free for personal
  and commercial use"; 1001fonts additionally lists it as CC BY-ND 3.0
  (<https://www.1001fonts.com/radio-newsman-font.html>). Attribution to
  Shara Weber is kept here. Caveat recorded 2026-09-04: no author foundry
  page exists, and under a strict CC BY-ND reading a subset could count as a
  modified copy; the embedded commercial-use grant plus attribution is the
  basis for shipping it, per the user's standing direction of 2026-07-30
  (see `SOURCE-NOTES.md`).

All seven files above are cleared for the shared public asset origin
(`assets.phenomcanvas.com`) on this basis.
