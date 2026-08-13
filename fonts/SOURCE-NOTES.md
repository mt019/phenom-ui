# Web font source and rights notes

The user confirmed on 2026-07-30 that all five existing Phenom web-font
binaries may be redistributed and embedded on the web. These files were
promoted unchanged from the tracked Canvas Lab font pack:

- `HuiwenMincho-subset.woff2` — body Traditional Chinese face.
- `ChironSungHK-fallback-subset.woff2` — Traditional Chinese fallback.
- `ErikasFarbband-subset.woff2` — accent face, regular.
- `ErikasFarbband-Bold-subset.woff2` — accent face, bold.
- `RadioNewsman-subset.woff2` — Latin display face.

## Subset coverage (2026-08-13)

The two Erikas faces used to carry a 130-glyph subset generated from one site's
text at the time. Any macron vowel fell outside it, so Hepburn romanisation
(`daimyō`, `taishōgun`, `bushidō`) rendered half the word in the accent face and
the macron letter in whatever came next in the stack. Both weights are now subset
to fixed Latin coverage — ASCII, Latin-1 Supplement, Latin Extended-A and B, 340
codepoints — the same "subset once, never rebuild for new text" strategy the CJK
body face already used. `scripts/validate-font-subsets.mjs` now fails the package
build if an accent face cannot draw the common Latin repertoire on its own; a
consumer's own font-coverage check cannot see this class of fault, because it
tests the whole stack's union and the missing glyph exists in the body face.

Three codepoints stay out because the upstream Erikas Farbband file has no glyph
for them: U+0113 ē, U+014A Ŋ, U+014B ŋ.

Upstream attribution and the previously recorded license summaries remain in
`LICENSES.md`. Package code uses the MIT license; each font remains governed by
its own upstream terms.
