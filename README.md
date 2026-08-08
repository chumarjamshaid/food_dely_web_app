This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

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
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://backend.fooddely.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_or_live_value_from_Stripe
```

Never add Stripe secret keys to this frontend service. Only the publishable
key (`pk_test_...` or `pk_live_...`) belongs here. Because variables prefixed
with `NEXT_PUBLIC_` are embedded during `next build`, trigger a new deployment
after changing either value.
