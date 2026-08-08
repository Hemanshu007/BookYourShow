# BookYourShow — Frontend

React customer app for [BookYourShow](../README.md), a movie ticket booking platform. Covers the full customer flow: OTP/Google login, browsing movies and theatres, seat selection with live locking, booking, booking history with cancellation, and profile management.

See the [root README](../README.md) for the full project overview and the [architecture doc](../docs/architecture.md) for how this talks to the backend.

## Stack

- React 19 + Vite + TypeScript
- Tailwind CSS
- TanStack Query for server state (caching, refetch, seat-layout polling)
- Zustand for session state (access/refresh tokens, current user)
- Axios with an automatic token-refresh interceptor
- Vitest + React Testing Library

## Development

```bash
npm install
cp .env.example .env
# edit VITE_API_BASE_URL if the backend isn't running on the default port
npm run dev
```

## Testing

```bash
npm run test        # Vitest + React Testing Library
npx tsc --noEmit    # Type check
npm run build        # Production build
```

## Structure

```
src/
├── api/            # Typed API client — one module per backend resource
├── components/     # SeatGrid, cards, layout, error boundary, skeletons
├── hooks/          # useAuth (session hydration, login/logout), useCountdown
├── pages/          # One component per route
├── stores/         # Zustand auth store (tokens, current user)
└── test/           # Vitest setup (jest-dom matchers, RTL cleanup)
```

## Notable implementation details

- **Seat-lock countdown**: derives remaining time from a `deadline` prop during render (not in a `useEffect`) — an effect-based reset was tried first but left a one-render window where a freshly acquired lock could read as already expired, since the effect committing the corrected value always lags one render behind the prop change.
- **Token refresh**: a single in-flight refresh request is shared across concurrent 401s (via a module-level promise) so a burst of expired requests doesn't trigger a refresh stampede.
- **Google OAuth handoff**: the backend redirects to `/auth/callback#access_token=...&refresh_token=...` — tokens travel in the URL *fragment*, not the query string, so they're never sent to the server, logged, or leaked via the `Referer` header. The callback page reads `window.location.hash` and clears it immediately via `history.replaceState`.
