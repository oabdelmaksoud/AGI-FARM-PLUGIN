import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { ensureDirPath, safeReadJson, safeWriteJson } from './storage.js';

const SAFE_NAME_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/;

function validateSecretName(name) {
  return typeof name === 'string' && SAFE_NAME_PATTERN.test(name);
}

function getMasterKey() {
  const b64 = process.env.AGI_FARM_MASTER_KEY || '';
  try {
    const key = Buffer.from(b64, 'base64');
    if (key.length === 32) return key;
  } catch {
    // ignore
  }
  return null;
}

export class SecretsService {
  constructor(workspace) {
    this.dir = path.join(workspace, 'SECRETS');
    this.metaPath = path.join(this.dir, 'metadata.json');
    ensureDirPath(this.dir);
    if (!fs.existsSync(this.metaPath)) {
      safeWriteJson(this.metaPath, { keyId: 'k1', algorithm: 'aes-256-gcm', createdAt: new Date().toISOString() });
    }
  }

  encryptAndStore(name, plaintext) {
    if (!validateSecretName(name)) return { ok: false, error: 'invalid_secret_name' };
    const key = getMasterKey();
    if (!key) return { ok: false, error: 'missing_master_key' };
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const data = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    const meta = safeReadJson(this.metaPath, { keyId: 'k1', algorithm: 'aes-256-gcm' });
    const payload = {
      keyId: meta.keyId,
      algorithm: 'aes-256-gcm',
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
      data: data.toString('base64'),
      updatedAt: new Date().toISOString(),
    };
    safeWriteJson(path.join(this.dir, `${name}.json`), payload);
    return { ok: true };
  }

  loadAndDecrypt(name) {
    if (!validateSecretName(name)) return { ok: false, error: 'invalid_secret_name' };
    const key = getMasterKey();
    if (!key) return { ok: false, error: 'missing_master_key' };
    const p = path.join(this.dir, `${name}.json`);
    if (!fs.existsSync(p)) return { ok: false, error: 'secret_not_found' };
    const payload = safeReadJson(p, null);
    if (!payload) return { ok: false, error: 'invalid_secret_payload' };
    try {
      const iv = Buffer.from(payload.iv, 'base64');
      const tag = Buffer.from(payload.tag, 'base64');
      const data = Buffer.from(payload.data, 'base64');
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(tag);
      const clear = Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
      return { ok: true, plaintext: clear, keyId: payload.keyId };
    } catch {
      return { ok: false, error: 'decrypt_failed' };
    }
  }
}
