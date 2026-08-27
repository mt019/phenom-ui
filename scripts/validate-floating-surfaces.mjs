// 判定在 scripts/lib/floating-surfaces.mjs（站群共用一份）。本套件驗的是自己的 src。
import { runFloatingSurfaces } from './lib/floating-surfaces.mjs';

runFloatingSurfaces({ roots: ['src/components'] });
