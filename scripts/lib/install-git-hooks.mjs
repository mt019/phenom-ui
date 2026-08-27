// git hooks 的安裝——站群唯一一份（2026-08-27 之前四個倉各一份副本）。
// npm 的 prepare script 呼叫；沒有 .git 的環境（CI 的 tarball 安裝）安靜跳過。
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

export function installGitHooks({ hooksPath = '.githooks' } = {}) {
  if (!existsSync('.git')) return;
  execFileSync('git', ['config', 'core.hooksPath', hooksPath], { stdio: 'inherit' });
  console.log(`Git hooks installed: ${hooksPath}`);
}
