import { execSync } from 'child_process';

const PORT = 9090;

console.log(`[RESTART] Checking for any running process on port ${PORT}...`);

try {
  let pid: string | null = null;
  if (process.platform === 'win32') {
    const output = execSync(`netstat -ano | findstr :${PORT}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const lines = output.trim().split('\n');
    for (const line of lines) {
      if (line.includes('LISTENING')) {
        const parts = line.trim().split(/\s+/);
        pid = parts[parts.length - 1];
        break;
      }
    }
  }

  if (pid) {
    console.log(`[RESTART] Found stale process PID ${pid} on port ${PORT}. Terminating...`);
    execSync(`taskkill /F /PID ${pid}`);
    console.log(`[RESTART] Process PID ${pid} terminated.`);
  } else {
    console.log(`[RESTART] No active process on port ${PORT}.`);
  }
} catch {
  console.log(`[RESTART] Port ${PORT} is clean.`);
}

console.log('[RESTART] Building latest TypeScript code...');
execSync('npm run build', { stdio: 'inherit' });
console.log('[RESTART] Rebuilt cleanly. Ready to start fresh daemon.');
