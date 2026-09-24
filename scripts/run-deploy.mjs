import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.dirname(scriptsDir);

function findBash() {
  if (process.env.DEPLOY_BASH) return process.env.DEPLOY_BASH;
  if (process.platform !== 'win32') return 'bash';

  const candidates = [
    process.env.ProgramFiles && path.join(process.env.ProgramFiles, 'Git', 'bin', 'bash.exe'),
    process.env['ProgramFiles(x86)'] && path.join(process.env['ProgramFiles(x86)'], 'Git', 'bin', 'bash.exe'),
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Programs', 'Git', 'bin', 'bash.exe'),
  ].filter(Boolean);

  const bash = candidates.find(existsSync);
  if (!bash) {
    throw new Error('Git Bash was not found. Install Git for Windows or set DEPLOY_BASH to bash.exe');
  }
  return bash;
}

const result = spawnSync(findBash(), [path.join(scriptsDir, 'deploy.sh'), ...process.argv.slice(2)], {
  cwd: projectDir,
  stdio: 'inherit',
});

if (result.error) throw result.error;
process.exit(result.status ?? 1);
