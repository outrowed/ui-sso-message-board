# UI SSO Message Board

A small message board and user directory for Universitas Indonesia accounts. Users sign in through SSO UI using CAS 2.0. The application validates the CAS ticket on the server, creates a local account, and keeps the session in an HTTP-only JWT cookie.

The application currently provides:

- a public message feed at `/messages`;
- a searchable user directory at `/users`;
- public user profiles at `/profile/:username`;
- an authenticated profile editor at `/me`.

## Repository layout

This is a pnpm workspace with two applications:

```text
ui-sso-message-board/
├── ui/       React, React Router, CSS Modules, and Vite
├── core/     Express API, CAS authentication, JWT sessions, and Drizzle ORM
└── db/       Local SQLite database files; ignored by Git
```

The UI development server forwards `/api` requests to the core server. The core server owns authentication, authorization, and database access; browser code never reads the JWT secret or SQLite file.

## Requirements

- Node.js 22 or newer, for the built-in `node:sqlite` module
- pnpm 10 or newer

## Setup

Install all workspace dependencies from the repository root:

```bash
pnpm install
```

Start the UI and core development servers together:

```bash
pnpm dev
```

Open <http://localhost:5173>. The core API listens on <http://localhost:3001>.

The SQLite database is created automatically at `db/profiles.sqlite` when the core server starts. Its tables are also created automatically, so a separate migration command is not required for a fresh development checkout.

To check both applications without starting them:

```bash
pnpm build
```

## Configuration

The core server reads these environment variables:

| Variable | Development default | Purpose |
| --- | --- | --- |
| `PORT` | `3001` | Core API port |
| `CLIENT_URL` | `http://localhost:5173` | Allowed UI origin and redirect destination |
| `SERVER_URL` | `http://localhost:3001` | Public core URL used to build the CAS callback URL |
| `CAS_SERVER` | `https://sso.ui.ac.id/cas2` | CAS server base URL |
| `JWT_SECRET` | Insecure development fallback | Secret used to sign session tokens |
| `NODE_ENV` | unset | Set to `production` to enable secure cookies |

Set a strong `JWT_SECRET` outside local development. Do not commit environment files or secrets.

The CAS service URL is derived from `SERVER_URL`:

```text
${SERVER_URL}/api/auth/cas/callback
```

SSO UI may reject an unregistered service URL, including a localhost callback. A deployed instance needs an HTTPS callback URL accepted by the SSO UI administrators.

## Main API routes

```text
GET  /api/health

GET  /api/auth/login
GET  /api/auth/cas/callback
GET  /api/auth/me
POST /api/auth/logout
GET  /api/auth/logout/cas

GET  /api/messages
POST /api/messages

GET  /api/users
GET  /api/users/:username
PUT  /api/users/me
```

Posting a message and updating a profile require a valid JWT session. Messages are limited to 1,000 characters. User profiles and messages are public once saved.

## License

MIT. See [LICENSE](LICENSE).
