-- ============================================================
-- TABLES
-- ============================================================

-- Cities
create table if not exists cities (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  state         text not null,
  image_url     text,
  listing_count integer not null default 0,
  created_at    timestamptz default now()
);

-- Agents
create table if not exists agents (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  email          text not null unique,
  phone          text,
  bio            text,
  avatar_url     text,
  city_id        uuid references cities(id) on delete set null,
  listings_sold  integer not null default 0,
  rating         numeric(3,1) not null default 0.0,
  specialties    text[]  not null default '{}',
  is_active      boolean not null default true,
  created_at     timestamptz default now()
);

-- Leads
create table if not exists leads (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  phone       text,
  message     text,
  city_id     uuid references cities(id) on delete set null,
  agent_id    uuid references agents(id) on delete set null,
  budget      text,
  timeline    text,
  status      text not null default 'new'
                check (status in ('new', 'contacted', 'qualified', 'closed', 'lost')),
  source      text default 'website',
  created_at  timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table cities  enable row level security;
alter table agents  enable row level security;
alter table leads   enable row level security;

-- Public read access for cities and agents
create policy "public_read_cities"  on cities for select using (true);
create policy "public_read_agents"  on agents for select using (true);

-- Leads: public insert only; no public read (protect PII)
create policy "public_insert_leads" on leads for insert with check (true);

-- ============================================================
-- SQL FUNCTIONS
-- ============================================================

-- 1. Fetch active agents by city_id (with city info joined)
create or replace function get_agents_by_city(p_city_id uuid)
returns table (
  id            uuid,
  name          text,
  email         text,
  phone         text,
  bio           text,
  avatar_url    text,
  city_id       uuid,
  city_name     text,
  city_state    text,
  listings_sold integer,
  rating        numeric
)
language sql
stable
security definer
as $$
  select
    a.id,
    a.name,
    a.email,
    a.phone,
    a.bio,
    a.avatar_url,
    a.city_id,
    c.name  as city_name,
    c.state as city_state,
    a.listings_sold,
    a.rating
  from agents a
  left join cities c on c.id = a.city_id
  where a.city_id = p_city_id
    and a.is_active = true
  order by a.rating desc;
$$;

-- 2. Insert a lead and return the new row
create or replace function insert_lead(
  p_name     text,
  p_email    text,
  p_phone    text    default null,
  p_message  text    default null,
  p_budget   text    default null,
  p_timeline text    default null,
  p_city_id  uuid    default null,
  p_agent_id uuid    default null,
  p_source   text    default 'website'
)
returns leads
language sql
security definer
as $$
  insert into leads (name, email, phone, message, budget, timeline, city_id, agent_id, source)
  values (p_name, p_email, p_phone, p_message, p_budget, p_timeline, p_city_id, p_agent_id, p_source)
  returning *;
$$;

-- 3. Auto-assign: pick the highest-rated active agent in a city
create or replace function assign_agent_for_city(p_city_id uuid)
returns uuid
language sql
stable
security definer
as $$
  select id from agents
  where city_id = p_city_id and is_active = true
  order by rating desc
  limit 1;
$$;

-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists idx_agents_city_id  on agents(city_id);
create index if not exists idx_leads_agent_id  on leads(agent_id);
create index if not exists idx_leads_city_id   on leads(city_id);
create index if not exists idx_leads_status    on leads(status);
create index if not exists idx_leads_email     on leads(email);

-- ============================================================
-- SAMPLE DATA
-- ============================================================

insert into cities (name, state, listing_count) values
  ('New York',     'NY', 142),
  ('Los Angeles',  'CA',  89),
  ('Chicago',      'IL',  67),
  ('Austin',       'TX',  54),
  ('Miami',        'FL',  71),
  ('Seattle',      'WA',  48)
on conflict do nothing;
