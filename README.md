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

## Technology stack

### Common (frontend + backend)

- **TypeScript** for both UI and core code
- **pnpm workspaces** for monorepo dependency and script management

### External services

- **Universitas Indonesia SSO UI** as the external identity provider
- **CAS 2.0** for login, ticket validation, and single logout

### Frontend

- **React 19** for the user interface
- **React Router** for `/messages`, `/users`, `/profile/:username`, and `/me`
- **CSS Modules** for component-scoped styling
- **Vite** for the development server and production bundle

### Backend

- **Node.js 22** as the core runtime
- **Express 5** for the HTTP API
- **JSON Web Tokens** stored in HTTP-only cookies for application sessions

### Database

- **Drizzle ORM** for typed queries, schema definitions, and migrations
- **SQLite** through Node.js's built-in `node:sqlite` driver

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

The SQLite database is created automatically at `db/profiles.sqlite` when the core server starts. Drizzle applies the migrations in `core/drizzle/` during startup, so a separate migration command is not required for a fresh development checkout.

To check both applications without starting them:

```bash
pnpm build
```

### Testing over plain HTTP

Session cookies are always marked `HttpOnly`, so browser JavaScript cannot read them. Their `Secure` attribute is controlled by `COOKIE_SECURE`. When the variable is omitted, secure cookies are enabled automatically in production mode and disabled otherwise.

For a production-mode deployment available only through plain HTTP, explicitly disable the `Secure` attribute:

```bash
NODE_ENV=production COOKIE_SECURE=false pnpm dev
```

This keeps the cookie `HttpOnly`, but allows the browser to send it over HTTP. Traffic and session tokens remain unencrypted on the network, so use this only for controlled testing. Public production deployments should use HTTPS with `COOKIE_SECURE=true`.

## Configuration

The core server reads these environment variables:

| Variable | Development default | Purpose |
| --- | --- | --- |
| `PORT` | `3001` | Core API port |
| `CLIENT_URL` | `http://localhost:5173` | Allowed UI origin and redirect destination |
| `SERVER_URL` | `http://localhost:3001` | Public core URL used to build the CAS callback URL |
| `CAS_SERVER` | `https://sso.ui.ac.id/cas2` | [Central Authentication Service](https://en.wikipedia.org/wiki/Central_Authentication_Service) (CAS) server base URL |
| `JWT_SECRET` | Insecure development fallback | Secret used to sign session tokens |
| `NODE_ENV` | unset | Selects the default cookie security behavior |
| `COOKIE_SECURE` | `true` in production, otherwise `false` | Explicitly enables or disables the cookie `Secure` attribute |
| `SQLITE_PATH` | `db/profiles.sqlite` | SQLite database file used by the current adapter |
| `PMB_PROFILES_ENABLED` | `false` | Uses read-only profiles from `pmb.cs.ui.ac.id` instead of locally editable profiles |
| `PMB_API_TOKEN` | unset | JWT token required when PMB profiles are enabled; sent as `Authorization: JWT <token>` |
| `PMB_API_BASE_URL` | `https://api.pmb.cs.ui.ac.id` | PMB profile API origin; primarily configurable for testing |

Set a strong `JWT_SECRET` outside local development. Do not commit environment files or secrets.

### PMB profile source

Local profiles are used by default. A server operator can instead enable the richer, read-only profile data provided by [pmb.cs.ui.ac.id](https://pmb.cs.ui.ac.id):

```bash
PMB_PROFILES_ENABLED=true PMB_API_TOKEN='<token>' pnpm dev
```

When enabled, the core server requests `https://api.pmb.cs.ui.ac.id/api/profile/<username>` using `Authorization: JWT <token>`. The username comes from the authenticated SSO UI account. Public profile pages clearly identify `pmb.cs.ui.ac.id` as their data source, while `/me` explains that editing and local avatar uploads are disabled. The application refuses to start with PMB profiles enabled unless `PMB_API_TOKEN` is set.

The CAS service URL is derived from `SERVER_URL`:

```text
${SERVER_URL}/api/auth/cas/callback
```

### SSO UI CAS endpoints

SSO UI provides two CAS endpoints with different service-registration policies:

- `https://sso.ui.ac.id/cas2` is the development endpoint and the default used by this project. It currently accepts service URLs on arbitrary domains without an apparent whitelist. RISTEK's [Susun Jadwal](https://github.com/ristekoss/susunjadwal-backend) also uses this endpoint for UI account authentication.
- `https://sso.ui.ac.id/cas` is the production endpoint used by official UI websites. It validates service URLs against a whitelist. Approved services are usually hosted under `ui.ac.id`, but a `ui.ac.id` hostname is not sufficient by itself; each service still needs to be accepted by the production CAS configuration.

Select the endpoint with `CAS_SERVER`:

```bash
# Development or testing
CAS_SERVER=https://sso.ui.ac.id/cas2 pnpm dev

# Registered production service
CAS_SERVER=https://sso.ui.ac.id/cas pnpm dev
```

The `service` value sent during login must exactly match the value used when validating the returned ticket. For a production deployment, register the callback URL with the relevant UI administrator before switching to the `/cas` endpoint.

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
