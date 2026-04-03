# Casino App

Selbstgehostete Casino-Webapp (Blackjack + Poker) für eine Freundesgruppe.

## Tech Stack

- **Frontend:** React 18, Vite, TailwindCSS, Zustand
- **Backend:** Node.js, Express, Socket.IO
- **Datenbank:** PostgreSQL 16
- **Cache:** Redis 7
- **Monorepo:** Turborepo + pnpm

## Setup (Entwicklung)

### Voraussetzungen

- Node.js 22+
- pnpm 10+
- PostgreSQL 16
- Redis 7

### Installation

```bash
pnpm install
```

### Datenbank einrichten

```bash
# .env in apps/server erstellen (siehe apps/server/.env.example)
cp apps/server/.env.example apps/server/.env

# Migrations ausführen
pnpm db:migrate
```

### Entwicklung starten

```bash
pnpm dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## Setup (Docker)

```bash
# .env im Root erstellen
cp .env.example .env
# DB_PASSWORD und JWT_SECRET setzen

docker compose up --build
```

## Projektstruktur

```
casino/
├── apps/
│   ├── web/        # React Frontend
│   └── server/     # Express Backend
├── packages/
│   └── shared/     # Shared Types & Validation
├── docker-compose.yml
└── turbo.json
```
