/**
 * The admin panel's read side: the numbers in the status strip, the sidebar and
 * the audit log.
 *
 * Everything here is honest about what exists. A subsystem that is not built
 * says so in words rather than reporting a zero, because a zero reads as
 * "working, nothing happening" and that is not the same thing.
 */

const permissions = require('./permissions');

function isoNow() {
  return new Date().toISOString();
}

/**
 * Sidebar groups, in the reference's order.
 *
 * An empty group is dropped by nav(), so adding a page to a group is the only
 * edit needed when a pass lands. Nothing links to a route that does not exist.
 */
const NAV = [
  { label: 'Admin Dashboard', items: [{ label: 'Overview', href: '/admin', cap: 'admin.open' }] },
  { label: 'Configuration', items: [] },
  { label: 'People', items: [] },
  { label: 'Content', items: [] },
  { label: 'Moderation', items: [] },
  { label: 'System', items: [{ label: 'Audit Log', href: '/admin/logs', cap: 'log.view' }] },
  { label: 'Billing', items: [] },
  { label: 'Other', items: [] },
];

/** The groups this role can see, with the current page marked. */
function nav(role, path) {
  return NAV.map((group) => ({
    label: group.label,
    items: group.items
      .filter((item) => permissions.can(role, item.cap))
      .map((item) => ({ label: item.label, href: item.href, active: item.href === path })),
  })).filter((group) => group.items.length > 0);
}

async function count(db, sql, ...args) {
  const prepared = db.prepare(sql);
  const row = await (args.length ? prepared.bind(...args) : prepared).first();
  return row ? Number(row.n) || 0 : 0;
}

/**
 * Real counts and the status lines built from them.
 *
 * The strip is the one place a number could be invented, so each line names
 * something that exists.
 */
async function overview(db) {
  const [accounts, staff, places, live, threads, posts, bans] = await Promise.all([
    count(db, 'SELECT COUNT(*) AS n FROM users WHERE closed_at IS NULL'),
    count(
      db,
      'SELECT COUNT(*) AS n FROM user_roles ur JOIN roles r ON r.key = ur.role_key WHERE r.rank >= ?',
      permissions.MIN_STAFF
    ),
    count(db, 'SELECT COUNT(*) AS n FROM games'),
    count(db, 'SELECT COUNT(*) AS n FROM games WHERE published = 1'),
    count(db, 'SELECT COUNT(*) AS n FROM forum_threads'),
    count(db, 'SELECT COUNT(*) AS n FROM forum_posts'),
    count(
      db,
      "SELECT COUNT(*) AS n FROM restrictions WHERE kind = 'ban' AND lifted_at IS NULL AND (expires_at IS NULL OR expires_at > ?)",
      isoNow()
    ),
  ]);

  return {
    counts: { accounts, staff, places, live, threads, posts, bans },
    status: [
      'configs: site settings are built in a later pass',
      `${accounts} account${accounts === 1 ? '' : 's'}, ${staff} staff`,
      `${live} published place${live === 1 ? '' : 's'} of ${places}`,
      `${threads} forum thread${threads === 1 ? '' : 's'}, ${posts} post${posts === 1 ? '' : 's'}`,
      `${bans} active ban${bans === 1 ? '' : 's'}`,
      'players in games: no game servers are connected',
      'abuse reports: the report queue arrives in a later pass',
    ],
  };
}

/** The most recent administrative actions, newest first. */
async function recentLog(db, limit) {
  const rows = await db
    .prepare(
      `SELECT m.action, m.detail, m.created_at,
              a.username AS actor,
              t.username AS target
         FROM moderation_log m
         LEFT JOIN users a ON a.id = m.actor_id
         LEFT JOIN users t ON t.id = m.target_id
        ORDER BY m.id DESC
        LIMIT ?`
    )
    .bind(Math.max(1, Math.min(Number(limit) || 100, 200)))
    .all();

  return (rows.results || []).map((row) => ({
    when: String(row.created_at || '').replace('T', ' ').slice(0, 19),
    actor: row.actor || 'system',
    target: row.target || '-',
    action: row.action,
    detail: row.detail || '',
  }));
}

module.exports = { nav, overview, recentLog };
