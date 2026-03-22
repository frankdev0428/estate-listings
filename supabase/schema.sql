-- Cities table
create table if not exists cities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  state text not null,
  image_url text,
  listing_count integer not null default 0,
  created_at timestamptz default now()
);

-- Agents table
create table if not exists agents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  bio text,
  avatar_url text,
  city_id uuid references cities(id) on delete set null,
  listings_sold integer not null default 0,
  rating numeric(3,1) not null default 0.0,
  created_at timestamptz default now()
);

-- Listings table
create table if not exists listings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  price integer not null,
  address text not null,
  city_id uuid not null references cities(id) on delete cascade,
  agent_id uuid not null references agents(id) on delete cascade,
  bedrooms integer not null default 0,
  bathrooms integer not null default 0,
  sqft integer not null default 0,
  image_url text,
  description text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table cities enable row level security;
alter table agents enable row level security;
alter table listings enable row level security;

-- Public read policies
create policy "Allow public read on cities" on cities for select using (true);
create policy "Allow public read on agents" on agents for select using (true);
create policy "Allow public read on listings" on listings for select using (true);

-- Sample data
insert into cities (name, state, listing_count) values
  ('New York', 'NY', 142),
  ('Los Angeles', 'CA', 89),
  ('Chicago', 'IL', 67),
  ('Austin', 'TX', 54),
  ('Miami', 'FL', 71),
  ('Seattle', 'WA', 48);
