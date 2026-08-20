// 判定在 scripts/lib/design-tokens.mjs（站群共用），這裡只宣告本倉的參數。
import { runDesignTokens } from './lib/design-tokens.mjs';

runDesignTokens({ root: 'src', exceptionsPath: 'scripts/design-token-exceptions.txt' });
