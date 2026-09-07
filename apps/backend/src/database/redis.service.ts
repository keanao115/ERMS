import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private inMemoryFallback = new Map<string, { val: string; expiresAt?: number }>();

  onModuleInit() {
    const redisUrl = process.env.REDIS_URL;
    const redisHost = process.env.REDIS_HOST;
    const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

    if (redisUrl || (redisHost && redisHost !== 'localhost')) {
      try {
        this.client = redisUrl
          ? new Redis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: 2 })
          : new Redis({ host: redisHost, port: redisPort, lazyConnect: true, maxRetriesPerRequest: 2 });

        this.client.on('error', (err) => {
          this.logger.warn(`Redis connection error: ${err.message}. Using in-memory fallback.`);
        });
      } catch (err: any) {
        this.logger.warn(`Failed to initialize Redis client: ${err.message}. Using in-memory fallback.`);
        this.client = null;
      }
    } else {
      this.logger.log('No external REDIS_URL/REDIS_HOST configured; using in-memory token cache fallback.');
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      try {
        await this.client.quit();
      } catch {}
    }
  }

  getClient(): Redis | null {
    return this.client;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.client) {
      try {
        if (ttlSeconds) {
          await this.client.set(key, value, 'EX', ttlSeconds);
        } else {
          await this.client.set(key, value);
        }
        return;
      } catch (err) {
        this.logger.warn(`Redis set failed, falling back to memory: ${err}`);
      }
    }
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.inMemoryFallback.set(key, { val: value, expiresAt });
  }

  async get(key: string): Promise<string | null> {
    if (this.client) {
      try {
        return await this.client.get(key);
      } catch (err) {
        this.logger.warn(`Redis get failed, falling back to memory: ${err}`);
      }
    }
    const item = this.inMemoryFallback.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.inMemoryFallback.delete(key);
      return null;
    }
    return item.val;
  }

  async del(key: string): Promise<number> {
    if (this.client) {
      try {
        return await this.client.del(key);
      } catch (err) {
        this.logger.warn(`Redis del failed, falling back to memory: ${err}`);
      }
    }
    return this.inMemoryFallback.delete(key) ? 1 : 0;
  }

  async publish(channel: string, message: string): Promise<number> {
    if (this.client) {
      try {
        return await this.client.publish(channel, message);
      } catch {}
    }
    return 0;
  }
}

