// Rows pulled before 0.6.0 keep the server's "…ss.ffffff+00:00"; 0.6.0 writes "…ss.mmmZ". SQLite's
// strftime reads either and writes the second, so every stored timestamp compares correctly as text.
const columns: Record<string, string[]> = {
  apiaries: [],
  hives: [],
  inspections: ['inspected_at'],
  hive_events: ['occurred_at'],
  photos: ['taken_at'],
}

export default Object.entries(columns)
  .flatMap(([table, own]) =>
    ['created_at', 'updated_at', 'deleted_at', ...own].map(
      (column) =>
        `update ${table} set ${column} = strftime('%Y-%m-%dT%H:%M:%fZ', ${column})
         where ${column} is not null and ${column} not like '%Z' and strftime('%s', ${column}) is not null;`,
    ),
  )
  .join('\n')
