import fs from 'node:fs/promises';
import { fail, hash, safePath } from './io.js';

export function hasWikiVerification(metadata) {
  return Boolean(metadata.released_at?.trim() && (metadata.verified_against?.trim() || metadata.verified_sources?.length));
}
export async function capturedSourceDrift(workspace, metadata) {
  const affected = [];
  for (const source of metadata.verified_sources || []) {
    const file = await safePath(workspace.repo, source.file);
    try { if (hash(await fs.readFile(file)) !== source.sha256) affected.push(source.file); }
    catch (error) { if (error.code === 'ENOENT') affected.push(source.file); else throw error; }
  }
  return [...new Set(affected)];
}
export async function verifyCapturedSources(workspace, metadata) {
  if (metadata.verified_sources?.length && !metadata.verification_scope) fail('UNVERIFIED_WIKI', 'Captured sources need verification_scope: documentation or source.');
  const affected = await capturedSourceDrift(workspace, metadata);
  if (affected.length) fail('WIKI_SOURCE_CHANGED', 'Captured sources are missing or differ from the reviewed hashes.', affected);
}
