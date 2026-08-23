export type PublicUser = {
  id: string;
  username: string;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  lastSeen: number;
  online: boolean;
};

export type User = {
  id: string;
  username: string;
  passwordHash: string;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  createdAt: number;
  lastSeen: number;
  queuedAt: number | null;
};

export type Friendship = {
  id: string;
  fromId: string;
  toId: string;
  status: "pending" | "accepted";
  createdAt: number;
};

export type Problem = {
  prompt: string;
  answer: number;
};

export type Duel = {
  id: string;
  hostId: string;
  guestId: string | null;
  kind: "challenge" | "queue" | "practice";
  ranked: boolean;
  status: "waiting" | "countdown" | "live" | "done";
  seed: number;
  problems: Problem[];
  createdAt: number;
  countdownAt: number | null;
  startAt: number | null;
  endsAt: number | null;
  hostIndex: number;
  guestIndex: number;
  hostScore: number;
  guestScore: number;
  winnerId: string | null;
  ratingDelta: { host: number; guest: number } | null;
  botSolveOffsets: number[];
};

export type DB = {
  users: User[];
  friendships: Friendship[];
  duels: Duel[];
};

export const BOT_ID = "bot-cpu";
export const BOT_NAME = "CPU";
export const RESERVED_NAMES = new Set([
  "cpu",
  "bot",
  "admin",
  "flash",
  "system",
  "pace",
]);
export const ONLINE_MS = 15_000;
export const DUEL_MS = 60_000;
export const COUNTDOWN_MS = 3_000;
export const QUEUE_BOT_MS = 10_000;
export const START_RATING = 1000;
