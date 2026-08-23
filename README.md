# SIXTY

Sixty-second mental math 1v1. Same problems. Most correct wins.

- Sign up with a username
- Friend other players
- Challenge them, queue for a ranked match, or run a practice lap against CPU
- Elo, K=32

## Local

```bash
cp .env.example .env.local
# set AUTH_SECRET
npm install
npm run dev
```

## Vercel

Needs `AUTH_SECRET` and `DATABASE_URL` (Postgres) so accounts persist.
