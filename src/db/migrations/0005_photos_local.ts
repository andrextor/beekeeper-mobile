// Photo files on the phone and how far their upload went (M9); plus small local settings.
export default `
alter table photos add column local_main_uri text;
alter table photos add column local_thumb_uri text;
alter table photos add column upload_step text not null default 'none';
alter table photos add column last_viewed_at text;
create table settings (key text primary key not null, value text not null);
`
