// Events recorded during a draft inspection other than notes (a dictated feeding, M8).
export default `
alter table inspection_drafts add column events text not null default '[]';
`
