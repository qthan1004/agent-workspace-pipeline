import spawn from 'cross-spawn';
import { fail } from './io.js';

export async function capture(command, args, cwd, { limit = 8 * 1024 * 1024, timeout = 30000 } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], shell: false });
    let stdout = Buffer.alloc(0), stderr = Buffer.alloc(0);
    const timer = setTimeout(() => { child.kill(); reject(new Error('Command timed out: ' + command)); }, timeout);
    const append = (name, chunk) => {
      if (stdout.length + stderr.length + chunk.length > limit) { child.kill(); reject(new Error('Command output exceeded limit: ' + command)); return; }
      if (name === 'stdout') stdout = Buffer.concat([stdout, chunk]); else stderr = Buffer.concat([stderr, chunk]);
    };
    child.stdout.on('data', (chunk) => append('stdout', chunk));
    child.stderr.on('data', (chunk) => append('stderr', chunk));
    child.on('error', (error) => { clearTimeout(timer); reject(error); });
    child.on('close', (code) => { clearTimeout(timer); resolve({ code, stdout: stdout.toString('utf8'), stderr: stderr.toString('utf8') }); });
  });
}
export async function launch(command, args, cwd, prompt) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, windowsHide: true, stdio: ['pipe', 'inherit', 'inherit'], shell: false });
    const interrupt = () => child.kill('SIGINT');
    process.on('SIGINT', interrupt);
    child.on('error', (error) => { process.off('SIGINT', interrupt); reject(error); });
    child.on('close', (code, signal) => {
      process.off('SIGINT', interrupt);
      resolve({ code: code ?? 1, signal });
    });
    child.stdin.on('error', (error) => { if (error.code !== 'EPIPE') reject(error); });
    child.stdin.end(prompt);
  });
}
export function assertCommand(result, command) {
  if (result.code !== 0) fail('COMMAND_FAILED', command + ' failed', [result.stderr.trim()]);
  return result;
}
