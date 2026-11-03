/**
 * Forum sections, read from D1.
 *
 * Sections are site structure, not posted content: they are seeded in
 * db/seed.sql and do not change when a member posts. Thread and post counts are
 * counted from the tables rather than stored, so a number on this page cannot
 * drift away from the rows behind it.
 *
 * Posting arrives with the forum service; until then every count is genuinely
 * zero, which is why the section pages show no threads instead of invented ones.
 */

const SECTION_COLUMNS = `
  s.id, s.slug, s.name, s.description, s.position, s.staff_only,
  (SELECT COUNT(*) FROM forum_threads t WHERE t.section_id = s.id) AS thread_count,
  (SELECT COUNT(*) FROM forum_posts p
     JOIN forum_threads t ON t.id = p.thread_id
    WHERE t.section_id = s.id) AS post_count,
  (SELECT MAX(p.created_at) FROM forum_posts p
     JOIN forum_threads t ON t.id = p.thread_id
    WHERE t.section_id = s.id) AS last_post_at
`;

/** Same shape the templates used with the phase 1 fixtures, so nothing changed. */
function shape(row) {
  return {
    slug: row.slug,
    name: row.name,
    description: row.description,
    threads: Number(row.thread_count) || 0,
    posts: Number(row.post_count) || 0,
    // A date is enough here; the panel renders a string either way.
    lastPost: row.last_post_at ? String(row.last_post_at).slice(0, 10) : null,
  };
}

async function list(db, options = {}) {
  const query = String(options.query || '').trim().toLowerCase();

  if (!query) {
    const result = await db
      .prepare(`SELECT ${SECTION_COLUMNS} FROM forum_sections s ORDER BY s.position ASC, s.name ASC`)
      .all();

    return (result.results || []).map(shape);
  }

  const result = await db
    .prepare(
      `SELECT ${SECTION_COLUMNS}
         FROM forum_sections s
        WHERE LOWER(s.name) LIKE ? OR LOWER(s.description) LIKE ?
        ORDER BY s.position ASC, s.name ASC`
    )
    .bind(`%${query}%`, `%${query}%`)
    .all();

  return (result.results || []).map(shape);
}

async function findOne(db, slug) {
  const wanted = String(slug || '').trim().toLowerCase();
  if (!wanted) return null;

  const row = await db
    .prepare(`SELECT ${SECTION_COLUMNS} FROM forum_sections s WHERE s.slug = ?`)
    .bind(wanted)
    .first();

  return row ? shape(row) : null;
}

module.exports = { findOne, list, shape };
