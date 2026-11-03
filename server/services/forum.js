/**
 * Forum sections, threads and posts, read from and written to D1.
 *
 * Sections are site structure, seeded in db/seed.sql. Thread and post counts are
 * counted from the tables rather than stored, so a number on a page cannot drift
 * away from the rows behind it.
 *
 * Writing is here rather than in the route because a post has rules the route
 * should not have to remember: a locked thread takes no replies, a staff-only
 * section takes no threads from members, and the first post of a thread is
 * written with the thread so a thread cannot exist with no posts in it.
 */

const permissions = require('./permissions');

/** Rank that may lock, pin and delete threads: Forum Moderator and above. */
const FORUM_MODERATE_RANK = 180;

const TITLE_MIN = 3;
const TITLE_MAX = 120;
const BODY_MAX = 10000;

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

/** Same shape the templates used with the phase 1 fixtures, plus staffOnly. */
function shape(row) {
  return {
    slug: row.slug,
    name: row.name,
    description: row.description,
    threads: Number(row.thread_count) || 0,
    posts: Number(row.post_count) || 0,
    // A date is enough here; the page renders a string either way.
    lastPost: row.last_post_at ? String(row.last_post_at).slice(0, 10) : null,
    staffOnly: Boolean(row.staff_only),
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

/** Threads in one section, pinned first, then most recently active. */
async function listThreads(db, sectionSlug) {
  const result = await db
    .prepare(
      `SELECT t.id, t.title, t.created_at, t.pinned, t.locked,
              u.username AS author,
              (SELECT COUNT(*) FROM forum_posts p WHERE p.thread_id = t.id) AS post_count,
              (SELECT MAX(p.created_at) FROM forum_posts p WHERE p.thread_id = t.id) AS last_post_at
         FROM forum_threads t
         JOIN users u ON u.id = t.author_id
         JOIN forum_sections s ON s.id = t.section_id
        WHERE s.slug = ?
        ORDER BY t.pinned DESC,
                 COALESCE((SELECT MAX(p.created_at) FROM forum_posts p WHERE p.thread_id = t.id), t.created_at) DESC`
    )
    .bind(String(sectionSlug || '').toLowerCase())
    .all();

  return (result.results || []).map((row) => {
    const posts = Number(row.post_count) || 0;
    return {
      id: Number(row.id),
      title: row.title,
      author: row.author,
      pinned: Boolean(row.pinned),
      locked: Boolean(row.locked),
      posts,
      replies: Math.max(0, posts - 1),
      lastPost: String(row.last_post_at || row.created_at || '').slice(0, 10),
    };
  });
}

/** One thread and its posts, or null when it is not in that section. */
async function thread(db, sectionSlug, threadId) {
  const row = await db
    .prepare(
      `SELECT t.id, t.title, t.created_at, t.pinned, t.locked, t.author_id,
              u.username AS author,
              s.slug AS section_slug, s.name AS section_name, s.staff_only
         FROM forum_threads t
         JOIN users u ON u.id = t.author_id
         JOIN forum_sections s ON s.id = t.section_id
        WHERE t.id = ? AND s.slug = ?`
    )
    .bind(Number(threadId) || 0, String(sectionSlug || '').toLowerCase())
    .first();

  if (!row) return null;

  const posts = await db
    .prepare(
      `SELECT p.id, p.body, p.created_at, p.edited_at, p.author_id, u.username AS author
         FROM forum_posts p
         JOIN users u ON u.id = p.author_id
        WHERE p.thread_id = ?
        ORDER BY p.created_at ASC, p.id ASC`
    )
    .bind(row.id)
    .all();

  return {
    thread: {
      id: Number(row.id),
      title: row.title,
      author: row.author,
      authorId: Number(row.author_id),
      pinned: Boolean(row.pinned),
      locked: Boolean(row.locked),
      staffOnly: Boolean(row.staff_only),
      sectionSlug: row.section_slug,
      sectionName: row.section_name,
      created: String(row.created_at || '').slice(0, 10),
    },
    posts: (posts.results || []).map((post, index) => ({
      id: Number(post.id),
      number: index + 1,
      body: post.body,
      author: post.author,
      authorId: Number(post.author_id),
      when: String(post.created_at || '').replace('T', ' ').slice(0, 16),
      edited: post.edited_at ? String(post.edited_at).replace('T', ' ').slice(0, 16) : '',
    })),
  };
}

/**
 * Start a thread, with its first post.
 *
 * Codes: nosection, title (length), empty, long, staffonly, refused.
 */
async function createThread(db, options) {
  const opts = options || {};
  const section = await findOne(db, opts.sectionSlug);
  if (!section) return { ok: false, code: 'nosection' };

  const title = String(opts.title || '').trim();
  const body = String(opts.body || '').trim();

  if (title.length < TITLE_MIN || title.length > TITLE_MAX) return { ok: false, code: 'title' };
  if (!body) return { ok: false, code: 'empty' };
  if (body.length > BODY_MAX) return { ok: false, code: 'long' };

  if (section.staffOnly) {
    const role = await permissions.roleOf(db, opts.userId);
    if (!role || role.rank < permissions.MIN_STAFF) return { ok: false, code: 'staffonly' };
  }

  const inserted = await db
    .prepare(
      `INSERT INTO forum_threads (section_id, author_id, title)
       VALUES ((SELECT id FROM forum_sections WHERE slug = ?), ?, ?)`
    )
    .bind(section.slug, opts.userId, title)
    .run();

  const threadId = inserted && inserted.meta ? Number(inserted.meta.last_row_id) || 0 : 0;
  if (!threadId) return { ok: false, code: 'refused' };

  await db
    .prepare('INSERT INTO forum_posts (thread_id, author_id, body) VALUES (?, ?, ?)')
    .bind(threadId, opts.userId, body)
    .run();

  return { ok: true, code: 'thread', threadId, sectionSlug: section.slug };
}

/** Codes: nothread, locked, empty, long, posted. */
async function addPost(db, options) {
  const opts = options || {};
  const record = await thread(db, opts.sectionSlug, opts.threadId);
  if (!record) return { ok: false, code: 'nothread' };
  if (record.thread.locked) return { ok: false, code: 'locked' };

  const body = String(opts.body || '').trim();
  if (!body) return { ok: false, code: 'empty' };
  if (body.length > BODY_MAX) return { ok: false, code: 'long' };

  await db
    .prepare('INSERT INTO forum_posts (thread_id, author_id, body) VALUES (?, ?, ?)')
    .bind(record.thread.id, opts.userId, body)
    .run();

  return { ok: true, code: 'posted', threadId: record.thread.id, sectionSlug: record.thread.sectionSlug };
}

/**
 * Lock, unlock, pin, unpin or delete a thread.
 *
 * The rank is checked here rather than in the route, because the route is only
 * where the button is drawn. A delete takes the posts with it through the
 * foreign key.
 */
async function moderate(db, options) {
  const opts = options || {};
  const actor = opts.actor || {};

  if ((Number(actor.rank) || 0) < FORUM_MODERATE_RANK) return { ok: false, code: 'rank' };

  const record = await thread(db, opts.sectionSlug, opts.threadId);
  if (!record) return { ok: false, code: 'nothread' };

  const action = String(opts.action || '');
  const threadId = record.thread.id;
  const now = new Date().toISOString();

  let code = '';

  if (action === 'lock') {
    await db.prepare('UPDATE forum_threads SET locked = 1 WHERE id = ?').bind(threadId).run();
    code = 'locked';
  } else if (action === 'unlock') {
    await db.prepare('UPDATE forum_threads SET locked = 0 WHERE id = ?').bind(threadId).run();
    code = 'unlocked';
  } else if (action === 'pin') {
    await db.prepare('UPDATE forum_threads SET pinned = 1 WHERE id = ?').bind(threadId).run();
    code = 'pinned';
  } else if (action === 'unpin') {
    await db.prepare('UPDATE forum_threads SET pinned = 0 WHERE id = ?').bind(threadId).run();
    code = 'unpinned';
  } else if (action === 'delete') {
    await db.prepare('DELETE FROM forum_threads WHERE id = ?').bind(threadId).run();
    code = 'thread_deleted';
  } else {
    return { ok: false, code: 'unknown' };
  }

  await db
    .prepare(
      `INSERT INTO moderation_log (actor_id, target_id, action, detail, created_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(actor.id || null, record.thread.authorId, `forum_${code}`, `${record.thread.title} - ${record.thread.sectionName}`, now)
    .run();

  return { ok: true, code, threadId, sectionSlug: record.thread.sectionSlug };
}

module.exports = {
  BODY_MAX,
  FORUM_MODERATE_RANK,
  TITLE_MAX,
  TITLE_MIN,
  addPost,
  createThread,
  findOne,
  list,
  listThreads,
  moderate,
  shape,
  thread,
};
