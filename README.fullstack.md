Fullstack (Next.js + Prisma)

This project was migrated to a fullstack approach using Next.js and Prisma. The original NestJS backend was removed/neutralized and the Prisma schema is now inside `prisma/schema.prisma` in this folder.

Quick start

1. Use the existing `.env` file in this folder (`frontend-app/.env`) and make sure `DATABASE_URL` is set correctly.
2. Install dependencies:

   npm install

3. Generate Prisma client and run migrations (if you have migrations):

   npx prisma generate
   npx prisma migrate dev

4. Run Next dev:

   npm run dev

Notes
- Use `frontend-app/lib/prisma.ts` to import the Prisma client in API routes or server components.
- The previous backend was intentionally removed; keep a copy of `backend-api` if you need to refer to previous controllers/services.

Note: this repo already contains an environment file at `frontend-app/.env`. If you need a fresh template, recreate it from `README.fullstack.md` instructions or request a sample.
