import { eloDelta } from "./elo";
import { botSolveOffsets, generateProblems } from "./problems";
import {
  BOT_ID,
  COUNTDOWN_MS,
  DUEL_MS,
  QUEUE_BOT_MS,
  type DB,
  type Duel,
} from "./types";

export function createDuel(
  hostId: string,
  guestId: string | null,
  kind: Duel["kind"],
  ranked: boolean,
): Duel {
  const seed = (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;
  const now = Date.now();
  const vsBot = guestId === BOT_ID;
  return {
    id: crypto.randomUUID(),
    hostId,
    guestId,
    kind,
    ranked: ranked && !vsBot,
    status: guestId ? "countdown" : "waiting",
    seed,
    problems: generateProblems(seed),
    createdAt: now,
    countdownAt: guestId ? now : null,
    startAt: guestId ? now + COUNTDOWN_MS : null,
    endsAt: guestId ? now + COUNTDOWN_MS + DUEL_MS : null,
    hostIndex: 0,
    guestIndex: 0,
    hostScore: 0,
    guestScore: 0,
    winnerId: null,
    ratingDelta: null,
    botSolveOffsets: vsBot ? botSolveOffsets(seed) : [],
  };
}

export function startDuel(duel: Duel, now = Date.now()) {
  duel.status = "countdown";
  duel.countdownAt = now;
  duel.startAt = now + COUNTDOWN_MS;
  duel.endsAt = now + COUNTDOWN_MS + DUEL_MS;
}

export function syncDuel(db: DB, duel: Duel, now = Date.now()) {
  if (duel.status === "waiting") {
    if (
      duel.kind === "queue" &&
      !duel.guestId &&
      now - duel.createdAt >= QUEUE_BOT_MS
    ) {
      duel.guestId = BOT_ID;
      duel.ranked = false;
      duel.botSolveOffsets = botSolveOffsets(duel.seed);
      startDuel(duel, now);
    }
    return;
  }

  if (duel.status === "countdown" && duel.startAt && now >= duel.startAt) {
    duel.status = "live";
  }

  if (duel.status === "live") {
    if (duel.guestId === BOT_ID && duel.startAt) {
      const elapsed = now - duel.startAt;
      const solved = duel.botSolveOffsets.filter((t) => elapsed >= t).length;
      if (solved > duel.guestScore) {
        const gained = solved - duel.guestScore;
        duel.guestScore = solved;
        duel.guestIndex += gained;
      }
    }
    if (duel.endsAt && now >= duel.endsAt) {
      finishDuel(db, duel);
    }
  }
}

function finishDuel(db: DB, duel: Duel) {
  if (duel.status === "done") return;
  duel.status = "done";
  if (duel.hostScore === duel.guestScore) {
    duel.winnerId = null;
  } else {
    duel.winnerId =
      duel.hostScore > duel.guestScore ? duel.hostId : duel.guestId;
  }

  const host = db.users.find((u) => u.id === duel.hostId);
  const guest = db.users.find((u) => u.id === duel.guestId);
  if (!host || !guest) return;

  if (duel.hostScore === duel.guestScore) {
    host.draws += 1;
    guest.draws += 1;
  } else if (duel.winnerId === host.id) {
    host.wins += 1;
    guest.losses += 1;
  } else {
    guest.wins += 1;
    host.losses += 1;
  }

  if (duel.ranked && guest.id !== BOT_ID) {
    if (duel.winnerId === null) {
      const d = eloDelta(host.rating, guest.rating, true);
      host.rating += d.winner;
      guest.rating += d.loser;
      duel.ratingDelta = { host: d.winner, guest: d.loser };
    } else if (duel.winnerId === host.id) {
      const d = eloDelta(host.rating, guest.rating, false);
      host.rating += d.winner;
      guest.rating += d.loser;
      duel.ratingDelta = { host: d.winner, guest: d.loser };
    } else {
      const d = eloDelta(guest.rating, host.rating, false);
      guest.rating += d.winner;
      host.rating += d.loser;
      duel.ratingDelta = { host: d.loser, guest: d.winner };
    }
  }

  host.queuedAt = null;
  guest.queuedAt = null;
}

export function publicDuel(duel: Duel, viewerId: string) {
  const youAreHost = duel.hostId === viewerId;
  const youIndex = youAreHost ? duel.hostIndex : duel.guestIndex;
  const problem = duel.problems[youIndex] ?? null;
  return {
    id: duel.id,
    kind: duel.kind,
    ranked: duel.ranked,
    status: duel.status,
    hostId: duel.hostId,
    guestId: duel.guestId,
    startAt: duel.startAt,
    endsAt: duel.endsAt,
    countdownAt: duel.countdownAt,
    hostScore: duel.hostScore,
    guestScore: duel.guestScore,
    winnerId: duel.winnerId,
    ratingDelta: duel.ratingDelta,
    yourIndex: youIndex,
    problem:
      duel.status === "live" && problem
        ? { prompt: problem.prompt, answer: problem.answer, index: youIndex }
        : null,
    ahead:
      duel.status === "live"
        ? duel.problems.slice(youIndex).map((p, i) => ({
            prompt: p.prompt,
            answer: p.answer,
            index: youIndex + i,
          }))
        : [],
  };
}
