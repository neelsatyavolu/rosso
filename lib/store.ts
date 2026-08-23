import { promises as fs } from "fs";
import path from "path";
import { neon } from "@neondatabase/serverless";
import {
  BOT_ID,
  BOT_NAME,
  START_RATING,
  type DB,
  type Duel,
  type Friendship,
  type User,
} from "./types";

const FILE = path.join(process.cwd(), ".data", "db.json");

function emptyDb(): DB {
  return {
    users: [
      {
        id: BOT_ID,
        username: BOT_NAME,
        passwordHash: "",
        rating: START_RATING,
        wins: 0,
        losses: 0,
        draws: 0,
        createdAt: 0,
        lastSeen: Date.now(),
        queuedAt: null,
      },
    ],
    friendships: [],
    duels: [],
  };
}

function sqlClient() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  return neon(url) as (strings: TemplateStringsArray, ...values: unknown[]) => Promise<Record<string, unknown>[]>;
}

let schemaReady = false;
let chain: Promise<unknown> = Promise.resolve();

export function mutate<T>(fn: (db: DB) => T | Promise<T>): Promise<T> {
  const run = chain.then(async () => {
    const db = await load();
    const result = await fn(db);
    await save(db);
    return result;
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

async function ensureSchema(
  sql: (strings: TemplateStringsArray, ...values: unknown[]) => Promise<unknown>,
) {
  if (schemaReady) return;
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL DEFAULT '',
      rating INTEGER NOT NULL DEFAULT 1000,
      wins INTEGER NOT NULL DEFAULT 0,
      losses INTEGER NOT NULL DEFAULT 0,
      draws INTEGER NOT NULL DEFAULT 0,
      created_at BIGINT NOT NULL,
      last_seen BIGINT NOT NULL,
      queued_at BIGINT
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS friendships (
      id TEXT PRIMARY KEY,
      from_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      to_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL,
      created_at BIGINT NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS duels (
      id TEXT PRIMARY KEY,
      host_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      guest_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      kind TEXT NOT NULL,
      ranked BOOLEAN NOT NULL,
      status TEXT NOT NULL,
      seed INTEGER NOT NULL,
      problems JSONB NOT NULL,
      created_at BIGINT NOT NULL,
      countdown_at BIGINT,
      start_at BIGINT,
      ends_at BIGINT,
      host_index INTEGER NOT NULL DEFAULT 0,
      guest_index INTEGER NOT NULL DEFAULT 0,
      host_score INTEGER NOT NULL DEFAULT 0,
      guest_score INTEGER NOT NULL DEFAULT 0,
      winner_id TEXT,
      rating_delta JSONB,
      bot_solve_offsets JSONB NOT NULL DEFAULT '[]'::jsonb
    )
  `;
  schemaReady = true;
}

async function load(): Promise<DB> {
  const sql = sqlClient();
  if (sql) {
    await ensureSchema(sql);
    const userRows = await sql`SELECT * FROM users`;
    const friendRows = await sql`SELECT * FROM friendships`;
    const duelRows = await sql`SELECT * FROM duels`;
    const db: DB = {
      users: userRows.map(userFromRow),
      friendships: friendRows.map(friendFromRow),
      duels: duelRows.map(duelFromRow),
    };
    ensureBot(db);
    return db;
  }

  try {
    const text = await fs.readFile(FILE, "utf8");
    const db = JSON.parse(text) as DB;
    ensureBot(db);
    return db;
  } catch {
    return emptyDb();
  }
}

async function save(db: DB) {
  ensureBot(db);
  const sql = sqlClient();
  if (sql) {
    await ensureSchema(sql);
    const userIds = db.users.map((u) => u.id);
    const friendIds = db.friendships.map((f) => f.id);
    const duelIds = db.duels.map((d) => d.id);

    for (const u of db.users) {
      await sql`
        INSERT INTO users (
          id, username, password_hash, rating, wins, losses, draws,
          created_at, last_seen, queued_at
        ) VALUES (
          ${u.id}, ${u.username}, ${u.passwordHash}, ${u.rating},
          ${u.wins}, ${u.losses}, ${u.draws}, ${u.createdAt},
          ${u.lastSeen}, ${u.queuedAt}
        )
        ON CONFLICT (id) DO UPDATE SET
          username = EXCLUDED.username,
          password_hash = EXCLUDED.password_hash,
          rating = EXCLUDED.rating,
          wins = EXCLUDED.wins,
          losses = EXCLUDED.losses,
          draws = EXCLUDED.draws,
          last_seen = EXCLUDED.last_seen,
          queued_at = EXCLUDED.queued_at
      `;
    }
    for (const f of db.friendships) {
      await sql`
        INSERT INTO friendships (id, from_id, to_id, status, created_at)
        VALUES (${f.id}, ${f.fromId}, ${f.toId}, ${f.status}, ${f.createdAt})
        ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status
      `;
    }
    for (const d of db.duels) {
      await sql`
        INSERT INTO duels (
          id, host_id, guest_id, kind, ranked, status, seed, problems,
          created_at, countdown_at, start_at, ends_at,
          host_index, guest_index, host_score, guest_score,
          winner_id, rating_delta, bot_solve_offsets
        ) VALUES (
          ${d.id}, ${d.hostId}, ${d.guestId}, ${d.kind}, ${d.ranked},
          ${d.status}, ${d.seed}, ${JSON.stringify(d.problems)},
          ${d.createdAt}, ${d.countdownAt}, ${d.startAt}, ${d.endsAt},
          ${d.hostIndex}, ${d.guestIndex}, ${d.hostScore}, ${d.guestScore},
          ${d.winnerId}, ${d.ratingDelta ? JSON.stringify(d.ratingDelta) : null},
          ${JSON.stringify(d.botSolveOffsets)}
        )
        ON CONFLICT (id) DO UPDATE SET
          guest_id = EXCLUDED.guest_id,
          ranked = EXCLUDED.ranked,
          status = EXCLUDED.status,
          countdown_at = EXCLUDED.countdown_at,
          start_at = EXCLUDED.start_at,
          ends_at = EXCLUDED.ends_at,
          host_index = EXCLUDED.host_index,
          guest_index = EXCLUDED.guest_index,
          host_score = EXCLUDED.host_score,
          guest_score = EXCLUDED.guest_score,
          winner_id = EXCLUDED.winner_id,
          rating_delta = EXCLUDED.rating_delta
      `;
    }
    if (duelIds.length) {
      await sql`DELETE FROM duels WHERE NOT (id = ANY(${duelIds}))`;
    } else {
      await sql`DELETE FROM duels`;
    }
    if (friendIds.length) {
      await sql`DELETE FROM friendships WHERE NOT (id = ANY(${friendIds}))`;
    } else {
      await sql`DELETE FROM friendships`;
    }
    if (userIds.length) {
      await sql`DELETE FROM users WHERE NOT (id = ANY(${userIds}))`;
    }
    return;
  }

  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(db));
}

function num(v: unknown) {
  if (v == null) return 0;
  return typeof v === "number" ? v : Number(v);
}

function userFromRow(r: Record<string, unknown>): User {
  return {
    id: String(r.id),
    username: String(r.username),
    passwordHash: String(r.password_hash ?? ""),
    rating: num(r.rating),
    wins: num(r.wins),
    losses: num(r.losses),
    draws: num(r.draws),
    createdAt: num(r.created_at),
    lastSeen: num(r.last_seen),
    queuedAt: r.queued_at == null ? null : num(r.queued_at),
  };
}

function friendFromRow(r: Record<string, unknown>): Friendship {
  return {
    id: String(r.id),
    fromId: String(r.from_id),
    toId: String(r.to_id),
    status: r.status === "accepted" ? "accepted" : "pending",
    createdAt: num(r.created_at),
  };
}

function duelFromRow(r: Record<string, unknown>): Duel {
  return {
    id: String(r.id),
    hostId: String(r.host_id),
    guestId: r.guest_id == null ? null : String(r.guest_id),
    kind: r.kind as Duel["kind"],
    ranked: Boolean(r.ranked),
    status: r.status as Duel["status"],
    seed: num(r.seed),
    problems: Array.isArray(r.problems) ? (r.problems as Duel["problems"]) : [],
    createdAt: num(r.created_at),
    countdownAt: r.countdown_at == null ? null : num(r.countdown_at),
    startAt: r.start_at == null ? null : num(r.start_at),
    endsAt: r.ends_at == null ? null : num(r.ends_at),
    hostIndex: num(r.host_index),
    guestIndex: num(r.guest_index),
    hostScore: num(r.host_score),
    guestScore: num(r.guest_score),
    winnerId: r.winner_id == null ? null : String(r.winner_id),
    ratingDelta:
      r.rating_delta && typeof r.rating_delta === "object"
        ? (r.rating_delta as Duel["ratingDelta"])
        : null,
    botSolveOffsets: Array.isArray(r.bot_solve_offsets)
      ? (r.bot_solve_offsets as number[])
      : [],
  };
}

function ensureBot(db: DB) {
  if (!db.users.some((u) => u.id === BOT_ID)) {
    db.users.push({
      id: BOT_ID,
      username: BOT_NAME,
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
