/**
 * News: the platform's announcements, read from D1 and written by the panel.
 *
 * The table is deliberately narrow. `news` holds the article, and `news_meta`
 * holds the only state that changes after it is written - published or draft -
 * because the baseline schema has no draft column and a migration that runs on
 * every push cannot add one. A missing meta row means published, so the
 * announcements migrated from the phase 1 fixtures need no companion row.
 *
 * The body is stored as the article itself, with a blank line between
 * paragraphs, and `paragraphs` splits it for the view. Nothing here builds copy
 * out of the summary: what an admin types is exactly what a member reads.
 */

/** Article categories. Fixed so the news facet list cannot fill with typos. */
const CATEGORIES = ['Platform', 'Development', 'Community'];

const TITLE_MIN = 4;
const TITLE_MAX = 120;
const SUMMARY_MAX = 300;
const BODY_MIN = 20;
const BODY_MAX = 20000;
const LIST_LIMIT = 200;

const SELECT = `
  SELECT n.id, n.slug, n.title, n.author_id, n.category, n.summary, n.body,
         n.published_at, u.username AS author,
         COALESCE(m.published, 1) AS published,
         m.updated_at AS updated_at
    FROM news n
    JOIN users u ON u.id = n.author_id
    LEFT JOIN news_meta m ON m.news_id = n.id
`;

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function isTrue(value) {
  return value === true || value === 1 || value === '1' || value === 'true';
}

async function uniqueSlug(db, base) {
  const wanted = base || 'article';
  let candidate = wanted;
  let suffix = 1;

  for (;;) {
    const row = await db.prepare('SELECT id FROM news WHERE slug = ?').bind(candidate).first();
    if (!row) return candidate;
    suffix += 1;
    candidate = `${wanted}-${suffix}`;
  }
}

function shape(row) {
  const body = String(row.body || '');

  return {
    id: Number(row.id),
    slug: row.slug,
    title: row.title,
    authorId: Number(row.author_id),
    author: row.author,
    category: row.category,
    summary: row.summary,
    body,
    paragraphs: body
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean),
    published: Boolean(row.published),
    publishedAt: row.published_at,
    // The list and the article page show a date, not a timestamp.
    date: String(row.published_at || '').slice(0, 10),
    updatedAt: row.updated_at || null,
  };
}

/** Published articles, newest first, optionally narrowed to one category. */
async function list(db, options = {}) {
  const category = String(options.category || '').trim();
  const limit = Math.min(Math.max(Number(options.limit) || 50, 1), LIST_LIMIT);

  const where = ['COALESCE(m.published, 1) = 1'];
  const params = [];

  if (category) {
    where.push('n.category = ?');
    params.push(category);
  }

  const result = await db
    .prepare(`${SELECT} WHERE ${where.join(' AND ')} ORDER BY n.published_at DESC LIMIT ?`)
    .bind(...params, limit)
    .all();

  return (result.results || []).map(shape);
}

/** The home page's panel. */
function latest(db, limit) {
  return list(db, { limit: limit || 3 });
}

/** Published article counts per category, for the facets. */
async function counts(db) {
  const result = await db
    .prepare(
      `SELECT n.category AS category, COUNT(*) AS n
         FROM news n
         LEFT JOIN news_meta m ON m.news_id = n.id
        WHERE COALESCE(m.published, 1) = 1
        GROUP BY n.category
        ORDER BY n.category ASC`
    )
    .all();

  return (result.results || []).map((row) => ({
    category: row.category,
    count: Number(row.n) || 0,
  }));
}

/** Everything, drafts included. The panel is the only caller. */
async function all(db) {
  const result = await db
    .prepare(`${SELECT} ORDER BY n.published_at DESC LIMIT ?`)
    .bind(LIST_LIMIT)
    .all();

  return (result.results || []).map(shape);
}

/** One published article by slug. A draft is a 404 to everybody else. */
async function findPublished(db, slug) {
  const wanted = String(slug || '').trim();
  if (!wanted) return null;

  const row = await db
    .prepare(`${SELECT} WHERE n.slug = ? AND COALESCE(m.published, 1) = 1`)
    .bind(wanted)
    .first();

  return row ? shape(row) : null;
}

/** One article by id, whatever its state. */
async function findById(db, id) {
  const row = await db
    .prepare(`${SELECT} WHERE n.id = ?`)
    .bind(Number(id) || 0)
    .first();

  return row ? shape(row) : null;
}

function validate(input) {
  const source = input || {};
  const title = String(source.title || '').trim().replace(/\s+/g, ' ');
  const category = CATEGORIES.includes(source.category) ? source.category : null;
  const summary = String(source.summary || '').trim();
  const body = String(source.body || '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (title.length < TITLE_MIN || title.length > TITLE_MAX) return { ok: false, code: 'title' };
  if (!category) return { ok: false, code: 'category' };
  if (summary.length > SUMMARY_MAX) return { ok: false, code: 'summary' };
  if (body.length < BODY_MIN || body.length > BODY_MAX) return { ok: false, code: 'body' };

  return { ok: true, value: { title, category, summary, body } };
}

async function setMeta(db, newsId, published, actorId, now) {
  await db
    .prepare(
      `INSERT INTO news_meta (news_id, published, updated_at, edited_by)
       VALUES (?, ?, ?, ?)
       ON CONFLICT (news_id) DO UPDATE SET
         published  = excluded.published,
         updated_at = excluded.updated_at,
         edited_by  = excluded.edited_by`
    )
    .bind(newsId, published ? 1 : 0, now, actorId)
    .run();
}

async function audit(db, actorId, action, detail) {
  await db
    .prepare(
      `INSERT INTO moderation_log (actor_id, target_id, action, detail, created_at)
       VALUES (?, NULL, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`
    )
    .bind(actorId, action, String(detail).slice(0, 400))
    .run();
}

async function create(db, input, authorId) {
  const checked = validate(input);
  if (!checked.ok) return checked;

  const published = isTrue((input || {}).published);
  const slug = await uniqueSlug(db, slugify(checked.value.title));
  const now = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO news (slug, title, author_id, category, summary, body, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      slug,
      checked.value.title,
      authorId,
      checked.value.category,
      checked.value.summary,
      checked.value.body,
      now
    )
    .run();

  const row = await db.prepare('SELECT id FROM news WHERE slug = ?').bind(slug).first();
  const id = Number(row.id);

  await setMeta(db, id, published, authorId, now);
  await audit(db, authorId, 'news_created', `${slug} (${published ? 'published' : 'draft'})`);

  return { ok: true, id, code: 'created' };
}

/**
 * Edits an article. The slug does not move with the title: a published URL is
 * something a member may have linked, and renaming an article should not break
 * the link. Publish state is changed by setPublished, not by this function.
 */
async function update(db, id, input, actorId) {
  const article = await findById(db, id);
  if (!article) return { ok: false, code: 'nobody' };

  const checked = validate(input);
  if (!checked.ok) return checked;

  const now = new Date().toISOString();

  await db
    .prepare('UPDATE news SET title = ?, category = ?, summary = ?, body = ? WHERE id = ?')
    .bind(checked.value.title, checked.value.category, checked.value.summary, checked.value.body, article.id)
    .run();

  await setMeta(db, article.id, article.published, actorId, now);
  await audit(db, actorId, 'news_saved', article.slug);

  return { ok: true, id: article.id, code: 'saved' };
}

/**
 * Publishes or unpublishes an article.
 *
 * Publishing sets published_at to now, because that is what puts the article at
 * the top of the list. Editing a live article does not touch the date.
 */
async function setPublished(db, id, published, actorId) {
  const article = await findById(db, id);
  if (!article) return { ok: false, code: 'nobody' };

  const now = new Date().toISOString();

  if (published) {
    await db.prepare('UPDATE news SET published_at = ? WHERE id = ?').bind(now, article.id).run();
  }

  await setMeta(db, article.id, published, actorId, now);
  await audit(db, actorId, published ? 'news_published' : 'news_unpublished', article.slug);

  return { ok: true, id: article.id, code: published ? 'published' : 'unpublished' };
}

module.exports = {
  BODY_MAX,
  BODY_MIN,
  CATEGORIES,
  LIST_LIMIT,
  SUMMARY_MAX,
  TITLE_MAX,
  TITLE_MIN,
  all,
  counts,
  create,
  findById,
  findPublished,
  latest,
  list,
  setPublished,
  shape,
  slugify,
  uniqueSlug,
  update,
};
