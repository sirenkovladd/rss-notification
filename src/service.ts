import crypto from 'node:crypto';
import { createClient } from "redis";
import webpush from "web-push";

const requireEnv = (name: string) => {
  const value = process.env[name];
  if (value === undefined) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return value;
};

export const redis = await createClient({
  password: requireEnv("REDIS_PASSWORD"),
  socket: {
    host: requireEnv("REDIS_HOST"),
    port: +requireEnv("REDIS_PORT"),
  },
})
  .on("error", (err) => console.log("Redis Client Error", err))
  .connect();

class Logger {
  log(level: string, obj: Record<string, unknown>, msg?: string, log: (data: unknown) => void = console.log) {
    const objV = {
      ...obj,
      level,
      ...(msg ? { msg } : {})
    }
    log(JSON.stringify(objV));
  }

  wrap(level: string, v: Record<string, unknown> | string, msg?: string, log?: (data: unknown) => void) {
    if (typeof v === "string") {
      this.log(level, {}, v, console.log);
    } else {
      this.log(level, v, msg, console.log);
    }
  }

  debug(v: Record<string, unknown>): void;
  debug(v: string): void;
  debug(v: Record<string, unknown>, msg?: string): void;
  debug(v: Record<string, unknown> | string, msg?: string): void {
    this.wrap("debug", v, msg, console.log);
  }

  info(v: Record<string, unknown>): void;
  info(v: string): void;
  info(v: Record<string, unknown>, msg?: string): void;
  info(v: Record<string, unknown> | string, msg?: string): void {
    this.wrap("info", v, msg, console.log);
  }

  warn(v: Record<string, unknown>): void;
  warn(v: string): void;
  warn(v: Record<string, unknown>, msg?: string): void;
  warn(v: Record<string, unknown> | string, msg?: string): void {
    this.wrap("warn", v, msg, console.log);
  }

  error(v: Record<string, unknown>): void;
  error(v: string): void;
  error(v: Record<string, unknown>, msg?: string): void;
  error(v: Record<string, unknown> | string, msg?: string): void {
    this.wrap("error", v, msg, console.error);
  }
}
export const logger = new Logger();

const telegramToken = requireEnv("TELEGRAM_TOKEN");

export async function sendTelegram(body: unknown) {
  const result = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return result;
}

webpush.setVapidDetails(requireEnv("VAPID_SUBJECT"), requireEnv("VAPID_PUBLIC_KEY"), requireEnv("VAPID_PRIVATE_KEY"));

export const serverPort = +(process.env.PORT || "3000");

const tokenSecret = requireEnv("TOKEN_SECRET");
const keySecret = Buffer.from(tokenSecret, 'base64url').subarray(0, 32);
const ivSecret = Buffer.from(tokenSecret, 'base64url').subarray(32, 48);

export type TokenPayload = {
  username: string;
}
export async function signToken(payload: TokenPayload) {
  const random = crypto.randomBytes(31).toString("base64url");
  const cipher = crypto.createCipheriv("aes-256-cbc", keySecret, ivSecret);
  const token = cipher.update(random, "base64url", "base64url") + cipher.final("base64url");
  await redis.set(`token:${payload.username}:${random}`, JSON.stringify(payload), {})
  return token;
}

export async function verifyToken(username: string, token: string): Promise<TokenPayload | null> {
  let random;
  try {
    const decipher = crypto.createDecipheriv("aes-256-cbc", keySecret, ivSecret);
    random = decipher.update(token, "base64url", "base64url") + decipher.final("base64url");
  } catch (e) {
    return null;
  }
  const payload = await redis.get(`token:${username}:${random}`);
  if (payload === null) {
    return null;
  }
  try {
    return JSON.parse(random);
  } catch (e) {
    logger.error({ e, token, random }, "Failed to parse token");
    return null;
  }
}

export { webpush };
