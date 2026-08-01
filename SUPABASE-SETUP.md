# Setting Up Sign In / Sign Up (Supabase)

## 1. Install the Supabase client

```bash
npm install @supabase/supabase-js
```

## 2. Add your project's file structure

Copy these into your Next.js project, keeping the same relative paths:

```
lib/supabase/client.ts
lib/supabase/useUser.ts
components/AuthModal.tsx
app/page.tsx   (replace your existing one)
```

> These files use the `@/` import alias (e.g. `@/lib/supabase/client`). Next.js projects created with `create-next-app` have this configured by default in `tsconfig.json` under `"paths"`. If yours doesn't, add:
> ```json
> "paths": { "@/*": ["./*"] }
> ```

## 3. Get your Supabase keys

1. Go to your project at [supabase.com/dashboard](https://supabase.com/dashboard)
2. **Settings → API**
3. Copy the **Project URL** and the **anon public** key

## 4. Add environment variables

Create `.env.local` in your project root:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Restart your dev server after adding this.

## 5. Turn on email sign-in (on by default)

In the Supabase dashboard: **Authentication → Providers → Email** should already be enabled. That's all you need for basic email/password sign up and sign in.

For testing, you may want to turn **off** "Confirm email" under **Authentication → Providers → Email** so new accounts can sign in immediately without clicking a confirmation link. Turn it back on before you go live.

## 6. (Optional) Enable "Continue with Google"

The modal includes a Google button. To make it work:

1. **Authentication → Providers → Google** → enable it
2. Follow Supabase's prompt to create a Google OAuth Client ID/Secret in the [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
3. **Authentication → URL Configuration** → set your **Site URL** (e.g. `https://houseofromano.com` or `http://localhost:3000` while developing) and add it to **Redirect URLs**

If you don't want Google sign-in yet, just remove the "Continue with Google" button and the divider in `components/AuthModal.tsx` — email/password sign-in works with zero extra setup.

## 7. (Optional but recommended) Store more customer details

Right now sign-up only captures name, email, and password. If you'll eventually want phone numbers or addresses like Shopee/Lazada collect, create a `profiles` table that fills in automatically when someone signs up:

```sql
-- Run this in the Supabase SQL Editor

create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  phone text,
  address text,
  created_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row whenever someone signs up
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

You'd then build a simple "Account" page later that reads/writes to `profiles` for phone and address — happy to build that next if you want it.

## What's already wired up

- Sign In / Sign Up modal (toggle between the two, matches your site's look)
- Email + password auth, with show/hide password and "Forgot password" (sends a reset email)
- Google sign-in button (needs step 6 above to activate)
- Signed-in state in the header: shows the customer's first name with a dropdown to sign out (desktop), and the same in the mobile menu
- Session persists across page reloads automatically (handled by Supabase)
