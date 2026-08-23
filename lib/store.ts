import { promises as fs } from "fs";
import path from "path";
import { BOT_ID, START_RATING, type DB, type User } from "./types";

const FILE = path.join(
  process.env.VERCEL ? "/tmp" : process.cwd(),
  process.env.VERCEL ? "rosso-db.json" : ".data/db.json",
);
const BLOB_PATH = "rosso-db.json";

function emptyDb(): DB {
  const bot: User = {
    id: BOT_ID,
    username: "PACE",
    passwordHash: "",
    rating: 1000,
    wins: 0,
    losses: 0,
    draws: 0,
    createdAt: 0,
    lastSeen: Date.now(),
    queuedAt: null,
  };
  return { users: [bot], friendships: [], duels: [] };
}

function useBlob() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

let chain: Promise<unknown> = Promise.resolve();

export function mutate<T>(fn: (db: DB) => T | Promise<T>): Promise<T> {
  const run = chain.then(async () => {
    for (let attempt = 0; attempt < 6; attempt++) {
      const { db, etag } = await load();
      const result = await fn(db);
      try {
        await save(db, etag);
        return result;
      } catch (err) {
        const name = (err as { name?: string; constructor?: { name?: string } })
          ?.constructor?.name;
        if (name === "BlobPreconditionFailedError" && attempt < 5) {
          continue;
        }
        throw err;
      }
    }
    throw new Error("store write conflict");
  });
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function read<T>(fn: (db: DB) => T | Promise<T>): Promise<T> {
  return mutate(fn);
}

async function load(): Promise<{ db: DB; etag?: string }> {
  if (useBlob() && process.env.BLOB_READ_WRITE_TOKEN) {
    const { get } = await import("@vercel/blob");
    try {
      const res = await get(BLOB_PATH, { access: "private", useCache: false });
      if (!res || res.statusCode !== 200 || !res.stream) {
        return { db: emptyDb() };
      }
      const text = await new Response(res.stream).text();
      const db = JSON.parse(text) as DB;
      ensureBot(db);
      return { db, etag: res.blob.etag };
    } catch {
      return { db: emptyDb() };
    }
  }

  try {
    const text = await fs.readFile(FILE, "utf8");
    const db = JSON.parse(text) as DB;
    ensureBot(db);
    return { db };
  } catch {
    return { db: emptyDb() };
  }
}

async function save(db: DB, etag?: string) {
  const body = JSON.stringify(db);
  if (useBlob() && process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    await put(BLOB_PATH, body, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 0,
      contentType: "application/json",
      ...(etag ? { ifMatch: etag } : {}),
    });
    return;
  }
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, body);
}

function ensureBot(db: DB) {
  if (!db.users.some((u) => u.id === BOT_ID)) {
    db.users.push({
      id: BOT_ID,
      username: "PACE",
      passwordHash: "",
      rating: START_RATING,
      wins: 0,
      losses: 0,
      draws: 0,
      createdAt: 0,
      lastSeen: Date.now(),
      queuedAt: null,
    });
  }
  db.friendships ??= [];
  db.duels ??= [];
  db.users ??= [];
}
