-- 1) Conexao de WhatsApp por vendedor (usuario autenticado)
create table if not exists public.seller_whatsapp_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  evolution_base_url text not null,
  evolution_api_key text not null,
  instance_name text not null,
  message_template text null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create index if not exists idx_seller_whatsapp_connections_active
  on public.seller_whatsapp_connections (is_active, user_id);

-- 2) Log de envios para rastreio e bloqueio de duplicidade
create table if not exists public.whatsapp_message_logs (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  phone_number text not null,
  reminder_type text not null,
  days_remaining int not null,
  sent_on date not null,
  status text not null check (status in ('sent', 'failed')),
  provider_message_id text null,
  error_message text null,
  created_at timestamptz not null default now()
);

create unique index if not exists uq_whatsapp_logs_once_per_day
  on public.whatsapp_message_logs (customer_id, reminder_type, sent_on);

create index if not exists idx_whatsapp_logs_user_date
  on public.whatsapp_message_logs (user_id, sent_on desc);

-- Atualiza updated_at automaticamente
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_touch_seller_whatsapp_connections on public.seller_whatsapp_connections;
create trigger trg_touch_seller_whatsapp_connections
before update on public.seller_whatsapp_connections
for each row
execute function public.touch_updated_at();

-- RLS (vendedor so enxerga os proprios dados)
alter table public.seller_whatsapp_connections enable row level security;
alter table public.whatsapp_message_logs enable row level security;

drop policy if exists "seller_whatsapp_self_select" on public.seller_whatsapp_connections;
create policy "seller_whatsapp_self_select"
on public.seller_whatsapp_connections
for select
using (auth.uid() = user_id);

drop policy if exists "seller_whatsapp_self_upsert" on public.seller_whatsapp_connections;
create policy "seller_whatsapp_self_upsert"
on public.seller_whatsapp_connections
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "whatsapp_logs_self_select" on public.whatsapp_message_logs;
create policy "whatsapp_logs_self_select"
on public.whatsapp_message_logs
for select
using (auth.uid() = user_id);
