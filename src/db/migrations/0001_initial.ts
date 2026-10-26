// Released steps are never edited: a schema change is a new step (migrations.test.ts checks it).

const common = `
  created_by text,
  created_at text,
  updated_at text,
  deleted_at text,
  _dirty integer not null default 0,
  _on_server integer not null default 0`

export default `
create table apiaries (
  id text primary key not null,
  organization_id text not null,
  name text not null,
  farm_name text,
  place text,
  latitude real,
  longitude real,
  altitude_m integer,
  flora_notes text,
  water_source text,
  notes text,${common}
);
create index apiaries_organization on apiaries (organization_id);

create table hives (
  id text primary key not null,
  organization_id text not null,
  apiary_id text not null,
  name text not null,
  qr_code text not null,
  hive_type text,
  brood_boxes integer,
  supers integer,
  colony_origin text,
  colony_started_on text,
  bee_race text,
  queen_year integer,
  queen_marked integer,
  queen_color text,
  queen_origin text,
  status text not null default 'active',
  notes text,${common}
);
create index hives_organization on hives (organization_id);
create index hives_apiary on hives (apiary_id);
create index hives_qr_code on hives (qr_code);

create table inspections (
  id text primary key not null,
  organization_id text not null,
  hive_id text not null,
  inspected_at text not null,
  inspected_by text,
  source text not null,
  transcript text,
  population_strength integer,
  temperament integer,
  queen_seen text,
  eggs_seen text,
  larvae_seen text,
  queen_cells text,
  brood_frames integer,
  honey_frames integer,
  pollen_frames integer,
  brood_pattern text,
  stores text,
  varroa_method text,
  varroa_count integer,
  varroa_sample_size integer,
  pests text,
  disease_signs text,
  weather text,
  temperature_c real,
  attention_level text,
  planned_actions text,
  next_inspection_on text,
  notes text,${common}
);
create index inspections_organization on inspections (organization_id);
create index inspections_hive on inspections (hive_id, inspected_at);

create table hive_events (
  id text primary key not null,
  organization_id text not null,
  hive_id text not null,
  inspection_id text,
  type text not null,
  occurred_at text not null,
  details text not null default '{}',${common}
);
create index hive_events_organization on hive_events (organization_id);
create index hive_events_hive on hive_events (hive_id, occurred_at);
create index hive_events_inspection on hive_events (inspection_id);

create table photos (
  id text primary key not null,
  organization_id text not null,
  hive_id text not null,
  inspection_id text,
  storage_path text not null,
  taken_at text not null,
  width integer,
  height integer,
  bytes integer,
  caption text,${common}
);
create index photos_organization on photos (organization_id);
create index photos_hive on photos (hive_id, taken_at);
create index photos_inspection on photos (inspection_id);

create table members_cache (
  organization_id text primary key not null,
  organization_name text not null,
  role text not null
);

create table profiles_cache (
  id text primary key not null,
  email text not null,
  display_name text,
  deactivated_at text,
  updated_at text not null
);

create table outbox (
  id text primary key not null,
  table_name text not null,
  row_id text not null,
  op text not null default 'upsert',
  payload text not null,
  attempts integer not null default 0,
  next_attempt_at text not null,
  last_error text,
  last_error_code text,
  state text not null default 'pending',
  created_at text not null,
  unique (table_name, row_id)
);

create table sync_state (
  organization_id text not null,
  table_name text not null,
  cursor text not null,
  initial_pull_done integer not null default 0,
  last_pull_at text,
  last_error text,
  primary key (organization_id, table_name)
);
`
