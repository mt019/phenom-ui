// 判定在 scripts/lib/color-system.mjs（站群共用），這裡只宣告本倉的參數。
import { runColorSystem } from './lib/color-system.mjs';

runColorSystem({
  tokensPath: 'src/styles/tokens.css',
  markSourcePath: 'src/styles/palettes.js',
  requireMarks: true, // 母本要有 --mark-1..4；消費端的 tokens.css 目前沒有這一層。
});
