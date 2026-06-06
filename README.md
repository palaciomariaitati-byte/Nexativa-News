# Nexativa News

## How to run locally

```bash
npm install   # install dependencies (run once)
npm run dev   # start the development server at http://localhost:3000
```

## Environment variables

- **NEXT_PUBLIC_SUPABASE_URL** – The URL of your Supabase project (e.g., `https://xeheuscrttrbfnojwwqt.supabase.co`).
- **NEXT_PUBLIC_SUPABASE_ANON_KEY** – The anonymous public key used by the client to interact with Supabase.

Create a `.env.local` file in the project root (already provided) with the two variables above. The values are read automatically by Next.js both on the client and server side.
