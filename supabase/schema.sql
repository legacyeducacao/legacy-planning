-- Criação da tabela de perfis de usuário integrada com auth.users do Supabase
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  display_name text,
  role text default 'padrao' check (role in ('master', 'padrao')),
  photo_url text,
  discord_webhook_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS (Row Level Security) na tabela profiles
alter table public.profiles enable row level security;

-- Políticas de acesso para a tabela profiles
create policy "Allow public read profiles"
  on public.profiles for select
  using (true);

create policy "Allow users to update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Allow users to insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);
