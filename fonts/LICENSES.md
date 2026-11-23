# Font licenses

Every file here is a woff2 subset built from originals kept outside the repo
(`~/Documents/Font_Library`; build scripts in `scripts/`), except the three
Latin files (Erikas Farbband regular and bold, Radio Newsman), which since
2026-11-23 are modified versions built by
`engineering/glyph-extension-20261123/build_full.py`. Codepoint counts
below were measured from the shipped files with fontTools on 2026-09-04
(Latin files: 2026-11-23).
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
- `ErikasFarbband-subset.woff2` (344 codepoints, 465 KB) and
  `ErikasFarbband-Bold-subset.woff2` (344 codepoints, 730 KB) — modified
  version of Erikas Farbband, Copyright (c) 2017 Peter Wiegel. Dual-licensed
  per the source TTFs' name table: "GPL (General Public License) with
  font-exception and OFL (Open Font License)", license URLs
  <http://www.fsf.org/licenses/gpl.html> and <http://scripts.sil.org/OFL>.
  Open license; redistribution and web embedding permitted. Some mirror
  sites (whatfontis.com, ffonts.net) label a build of this font
  "personal-use only" — that string is absent from our source files, and the
  embedded dual license governs the files we actually subset.
  Modification (2026-11-23): U+0113, U+014A, U+014B composed from the font's
  own outlines (ē from e plus the macron contours of ō; Ŋ ŋ from N/n plus
  the descender hook of j) and U+00A0 mapped to space. The family name inside
  the files is changed to "Erikas Farbband Phenom"; Peter Wiegel's copyright
  and designer fields are kept unchanged. The upstream name table carries no
  Reserved Font Name statement; the upstream OFL.txt has not been located.
  Build script: `engineering/glyph-extension-20261123/build_full.py`.
- `RadioNewsman-subset.woff2` (330 codepoints, 32 KB) — modified version of
  Radio Newsman, 2016 Shara Weber. The source TTF's name table (ID 13) states
  "free for personal and commercial use"; 1001fonts additionally lists it as
  CC BY-ND 3.0 (<https://www.1001fonts.com/radio-newsman-font.html>).
  Attribution to Shara Weber is kept here and in the files' copyright field.
  Modification (2026-11-23): the source has only 95 ASCII codepoints; 239
  glyphs (Latin-1 Supplement, Latin Extended-A, common punctuation, and the
  missing ASCII < > ` ~) were composed from the font's own outlines, and
  OS/2 winAscent/winDescent were enlarged to cover the new accents. The
  family name inside the file is changed to "Radio Newsman Phenom".
  Under a CC BY-ND reading this is a derivative work; the user was informed
  of that risk on 2026-11-23 and directed the modification, with the
  renamed family and attribution as conditions. Build script:
  `engineering/glyph-extension-20261123/build_full.py`.

All seven files above are cleared for the shared public asset origin
(`assets.phenomcanvas.com`) on this basis.
