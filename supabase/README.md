# Supabase setup

Manual one-time steps to enable cloud sync.

## 1. Create the project

1. Go to https://supabase.com and create a new project.
2. Wait for provisioning (~2 min).
3. Note the Project URL and the `anon` public key (Settings → API).

## 2. Run the schema migration

1. Open the SQL editor in the Supabase dashboard.
2. Copy the contents of `migrations/0001_initial_schema.sql` into a new query.
3. Run it. You should see 8 tables created with RLS enabled.

## 3. Update the app config

Edit `app.config.ts` `extra` block:

```ts
extra: {
  supabaseUrl: 'https://YOUR_PROJECT.supabase.co',  // from Settings → API
  supabaseAnonKey: 'YOUR_ANON_KEY',                  // from Settings → API
  // ...
}
```

The anon key is safe to commit — it has no privileges beyond what RLS allows.

## 4. Verify

After running the app, sign up with a new account and create some data. In the Supabase dashboard, open the Table Editor — you should see your rows appearing.
