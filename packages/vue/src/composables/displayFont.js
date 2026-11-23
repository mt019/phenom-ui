// 標題用字型（font-display，Radio Newsman）畫不出的拉丁字元，整個標題改走 font-accent。
//
// Radio Newsman 的來源字型只有 95 個碼位（ASCII 可見字元，連 < > ` ~ 與 ’ – — 都沒有），
// 不是子集遺漏，重建子集生不出字。標題裡出現 ü、é、ō 或 ’ 時，那一個字母會落到字型堆疊
// 的下一個面，同一個詞裡兩種字面。Erikas Farbband（font-accent）固定收 ASCII、Latin-1
// 補充、擴充 A 與 B 與一般標點，所以這類標題整個改用 Erikas，詞內不換字型。
// 判準與兩個字型的覆蓋範圍由 scripts/validate-font-subsets.mjs 逐碼位驗證。

/** Radio Newsman 沒有、而 Erikas 有的拉丁字元：帶符字母、擴充拉丁、一般標點中的引號與破折號。 */
const OUTSIDE_DISPLAY_FACE = /[\u00c0-\u024f\u1e00-\u1eff\u2013\u2014\u2018-\u201d]/;
const HAS_LATIN_LETTER = /[A-Za-z]/;

/** 標題含拉丁字母，且含 Radio Newsman 畫不出的拉丁字元。純 CJK 標題（含間隔號）不受影響。 */
export function needsAccentDisplayFace(text) {
  return typeof text === 'string' && HAS_LATIN_LETTER.test(text) && OUTSIDE_DISPLAY_FACE.test(text);
}

/** 標題的字型 class；呼叫端明給 class 時以呼叫端為準。 */
export function displayTitleClass(text, explicit) {
  if (explicit) return explicit;
  return needsAccentDisplayFace(text) ? 'font-accent' : 'font-display';
}
