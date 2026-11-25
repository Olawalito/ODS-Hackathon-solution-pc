# BITMARK

A mobile-first university attendance app. Students use a six-character class code, browser geolocation, and live face matching to mark attendance. Lecturers manage courses, open sessions, monitor attendance, and review a student's attendance rate.

## Stack

- Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui
- Neon PostgreSQL with Drizzle ORM
- Email/password authentication with bcryptjs and a signed JWT in an HttpOnly cookie
- Zod validation and face-api.js browser descriptors

## Environment

Create `.env.local` in the project root:

```env
DATABASE_URL="your-postgresql-connection-string"
JWT_SECRET="a-random-secret-at-least-32-characters-long"
```

Generate a strong secret with `openssl rand -base64 32`. Never commit `.env.local` or share `JWT_SECRET`. `DATABASE_URL` should use your PostgreSQL provider's pooled runtime connection string. The connected BITMARK Neon database already has its tables; `scripts/schema.sql` is provided for another empty PostgreSQL database.

## Run locally

```bash
pnpm install
pnpm dev
```

Visit `http://localhost:3000`. Camera and geolocation permissions require HTTPS in deployed environments; localhost is permitted by modern browsers. Face-api.js downloads its model weights from the configured public model CDN the first time face capture is used, so the browser needs access to that host.

## Seed demo accounts

```bash
pnpm db:seed
```

The seed creates one lecturer, two students, and CSC301. All three demo accounts use the password `BITMARK-demo-2026`:

- `lecturer@bitmark.test`
- `amara@bitmark.test`
- `tunde@bitmark.test`

Seeded student face descriptors are zero-filled and are only intended to preview dashboards. To complete a real face-verified attendance check, register a student through the app so their descriptor is captured from their own camera.

## Attendance verification

The server finds an active, unexpired class code, checks for prior attendance, computes Haversine distance from server-trusted session coordinates and submitted GPS coordinates, applies the limited GPS accuracy allowance, compares the 128-dimensional Euclidean face descriptor (threshold `< 0.5`), and inserts one attendance row per student/session. The submitted distance is never trusted. Attendance records are scoped to the signed-in user or lecturer-owned course/session.

Face images are processed in the browser and are not uploaded or stored. Only a 128-value descriptor is sent to the server and stored for students.
