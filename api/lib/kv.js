const isProd = process.env.VERCEL === '1';

/**
 * Local 개발용 In-Memory KV (Redis 흉내)
 */
class MemoryKV {
  constructor() {
    this.store = new Map();
  }

  async get(key) {
    return this.store.get(key);
  }

  async set(key, value) {
    this.store.set(key, value);
  }

  async incr(key) {
    const value = Number(this.store.get(key) || 0) + 1;
    this.store.set(key, value);
    return value;
  }
}

/**
 * Production에서는 Vercel KV 사용
 */
let kv;

if (isProd) {
  const mod = await import('@vercel/kv');
  kv = mod.kv;
} else {
  console.log('🟡 Using Memory KV (local dev)');
  kv = new MemoryKV();
}

export { kv };