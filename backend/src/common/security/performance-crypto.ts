import crypto from 'crypto';
import { loadConfig } from '../config/env';

const ALGO = 'aes-256-gcm';
const IV_LENGTH = 12;

export class PerformanceCryptoService {
  private readonly env = loadConfig().env;
  private readonly key?: Buffer;

  constructor() {
    const cfg = loadConfig();
    this.key = cfg.perfEncryptionKey
      ? Buffer.from(cfg.perfEncryptionKey, 'base64')
      : undefined;

    if (cfg.env === 'prod' && !this.key) {
      throw new Error(
        'PERF_ENC_KEY must be configured in production for performance data encryption'
      );
    }
  }

  isProd() {
    return this.env === 'prod';
  }

  encrypt(value: string | number | Record<string, unknown> | null): string | null {
    if (value === null || value === undefined) return null;

    const plain =
      typeof value === 'string' ? value : JSON.stringify(value);

    if (!this.isProd()) {
      return plain;
    }

    if (!this.key) {
      throw new Error('Encryption key not configured');
    }

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGO, this.key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plain, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();

    return Buffer.concat([iv, tag, encrypted]).toString('base64');
  }

  decrypt<T = unknown>(cipherText: string | null): T | string | null {
    if (cipherText === null || cipherText === undefined) return null;

    if (!this.isProd()) {
      try {
        return JSON.parse(cipherText) as T;
      } catch {
        return cipherText;
      }
    }

    if (!this.key) {
      throw new Error('Encryption key not configured');
    }

    const buffer = Buffer.from(cipherText, 'base64');
    const iv = buffer.subarray(0, IV_LENGTH);
    const tag = buffer.subarray(IV_LENGTH, IV_LENGTH + 16);
    const encrypted = buffer.subarray(IV_LENGTH + 16);

    const decipher = crypto.createDecipheriv(ALGO, this.key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString('utf8');

    try {
      return JSON.parse(decrypted) as T;
    } catch {
      return decrypted;
    }
  }
}

export const performanceCrypto = new PerformanceCryptoService();


