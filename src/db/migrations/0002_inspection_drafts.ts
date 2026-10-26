// Local only, never synced: an inspection being recorded in the field (M7).
export default `
create table inspection_drafts (
  id text primary key not null,
  organization_id text not null,
  hive_id text not null,
  is_edit integer not null default 0,
  payload text not null,
  notes text not null default '[]',
  created_at text not null,
  updated_at text not null
);
create unique index inspection_drafts_new_per_hive on inspection_drafts (hive_id) where is_edit = 0;
`
