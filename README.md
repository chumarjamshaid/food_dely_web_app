# FoodDely

FoodDely is a Next.js food ordering and restaurant-management frontend. It includes customer ordering, cart and Stripe payment flows, plus restaurant menu, order, discount, review, and settings screens.

## Getting Started

Install dependencies and start the development server:

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Quality checks

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Environment variables

```text
NEXT_PUBLIC_API_URL=https://backend.fooddely.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_or_live_value_from_Stripe
```

## Deploy on Render

Deploy this application as a **Node Web Service**, not a Static Site. The
repository includes `render.yaml` with the production build, start, health
check, and Node runtime settings.

For a manually configured service, use:

- Runtime: `Node`
- Build command: `npm ci --include=dev && npm run build`
- Start command: `npm start`
- Health check path: `/`
- Auto-deploy: enabled for the production branch

Add these environment variables in the Render dashboard before deploying:

```text
NEXT_PUBLIC_API_URL=https://backend.fooddely.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_or_live_value_from_Stripe
```

Never add Stripe secret keys to this frontend service. Only the publishable
key (`pk_test_...` or `pk_live_...`) belongs here. Because variables prefixed
with `NEXT_PUBLIC_` are embedded during `next build`, trigger a new deployment
after changing either value.
