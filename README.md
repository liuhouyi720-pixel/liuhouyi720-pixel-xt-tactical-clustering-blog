# The Shape of Threat — Vercel edition

This is the Next.js version of the English xT tactical clustering article prepared for the UIUC women's soccer coaching staff. It preserves the verified research narrative and notebook outputs from `../xt-tactics-blog` while using the Next.js App Router for deployment on Vercel.

## Local development

```bash
npm install
npm run dev
```

## Content migration

The initial `app/page.tsx` is generated from the reviewed static article with:

```bash
node scripts/migrate-page.mjs
```

After migration, edit the Next.js page directly. Research assets remain in `public/assets/`.
