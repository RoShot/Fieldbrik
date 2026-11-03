/**
 * The admin panel's read side: the numbers in the status strip, the sidebar and
 * the audit log.
 *
 * Everything here is honest about what exists. A subsystem that is not built
 * says so in words rather than reporting a zero, because a zero reads as
 * "working, nothing happening" and that is not the same thing.
 */

const permissions = require('./permissions');
const badgeService = require('./badges');

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
  {
    label: 'People',
    items: [
      { label: 'Search Users', href: '/admin/users', cap: 'users.search', path: '/admin/users' },
      { label: 'User Admins', href: '/admin/users?staff=1', cap: 'users.role', path: '/admin/users', staff: true },
      { label: 'Blacklist Email', href: '/admin/blacklist', cap: 'users.blacklist_email' },
    ],
  },
  {
    label: 'Content',
    items: [
      { label: 'Catalog Items', href: '/admin/catalog', cap: 'content.review', path: '/admin/catalog' },
      { label: 'Badge Catalogue', href: '/admin/badges', cap: 'users.badge' },
    ],
  },
  {
    label: 'Moderation',
    items: [{ label: 'Abuse Reports', href: '/admin/reports', cap: 'reports.review' }],
  },
  { label: 'System', items: [{ label: 'Audit Log', href: '/admin/logs', cap: 'log.view' }] },
  {
    label: 'Billing',
    items: [{ label: 'Ticket Rates', href: '/admin/earnings', cap: 'settings.write' }],
  },
  { label: 'Other', items: [] },
];

/**
 * The groups this role can see, with the current page marked.
 *
 * Two entries share /admin/users (the search page and the staff list), so an
 * item can carry the route it belongs to and whether it is the staff view. The
 * query string is not compared literally, because that would leave both
 * entries looking active on one page.
 */
function nav(role, path, query) {
  const staffView = Boolean(query && query.staff);

  return NAV.map((group) => ({
    label: group.label,
    items: group.items
      .filter((item) => permissions.can(role, item.cap))
      .map((item) => {
        const route = item.path || item.href;
        let active = route === path;
        if (active && item.path) active = staffView === Boolean(item.staff);
        return { label: item.label, href: item.href, active };
      }),
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
  const [accounts, staff, places, live, threads, posts, bans, openReports] = await Promise.all([
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
    count(db, "SELECT COUNT(*) AS n FROM reports WHERE status = 'open'"),
  ]);

  return {
    counts: { accounts, staff, places, live, threads, posts, bans, openReports },
    status: [
      'configs: ticket rates are editable; no other site settings exist yet',
      `${accounts} account${accounts === 1 ? '' : 's'}, ${staff} staff`,
      `${live} published place${live === 1 ? '' : 's'} of ${places}`,
      `${threads} forum thread${threads === 1 ? '' : 's'}, ${posts} post${posts === 1 ? '' : 's'}`,
      `${bans} active ban${bans === 1 ? '' : 's'}`,
      `${openReports} open abuse report${openReports === 1 ? '' : 's'}`,
      'players in games: no game servers are connected',
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

/** A date the way the panel writes it: 3 nov 2026. */
function formatDate(iso) {
  const text = String(iso || '');
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const year = text.slice(0, 4);
  const month = Number(text.slice(5, 7));
  const day = Number(text.slice(8, 10));
  if (!year || !month || !day) return '-';
  return `${day} ${months[month - 1]} ${year}`;
}

/**
 * The account columns the panel lists.
 *
 * Roles are joined rather than read from users.role, which still holds the old
 * four-value text and is no longer the source of truth. is_online uses the same
 * five-minute rule as the rest of the site.
 */
const ACCOUNT_COLUMNS = `
  u.id, u.username, u.email, u.created_at, u.last_seen_at, u.closed_at,
  u.tickets, u.bucks, u.description,
  a.head, a.torso, a.left_arm, a.right_arm, a.left_leg, a.right_leg, a.face,
  r.key  AS role_key,
  r.name AS role_name,
  r.rank AS role_rank,
  CASE WHEN u.last_seen_at IS NOT NULL
        AND u.last_seen_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-5 minutes')
       THEN 1 ELSE 0 END AS is_online
`;

const ACCOUNT_FROM = `
  FROM users u
  LEFT JOIN avatars a    ON a.user_id = u.id
  LEFT JOIN user_roles ur ON ur.user_id = u.id
  LEFT JOIN roles r      ON r.key = ur.role_key
`;

function shapeAccount(row) {
  return {
    id: row.id,
    username: row.username,
    email: row.email || '',
    joined: formatDate(row.created_at),
    lastSeen: row.last_seen_at ? formatDate(row.last_seen_at) : 'never',
    status: row.closed_at ? 'closed' : Number(row.is_online) ? 'online' : 'offline',
    roleKey: row.role_key || 'member',
    roleName: row.role_name || 'Member',
    roleRank: Number(row.role_rank) || 0,
    tickets: Number(row.tickets) || 0,
    bucks: Number(row.bucks) || 0,
    description: row.description || '',
    avatar: {
      head: row.head,
      torso: row.torso,
      leftArm: row.left_arm,
      rightArm: row.right_arm,
      leftLeg: row.left_leg,
      rightLeg: row.right_leg,
      face: row.face,
    },
  };
}

/**
 * Account search.
 *
 * A query of digits is an account ID, which is how staff quote an account to
 * each other; anything else matches part of a username. Closed accounts are
 * included on purpose - "where did this account go" is a question the panel
 * exists to answer.
 */
async function searchAccounts(db, options) {
  const q = String((options || {}).q || '').trim();
  const staffOnly = Boolean((options || {}).staff);

  const where = [];
  const params = [];
  let order = 'u.created_at DESC, u.id DESC';
  let limit = 12;

  if (staffOnly) {
    where.push('r.rank IS NOT NULL');
    order = 'r.rank DESC, u.username_lower ASC';
    limit = 100;
  }

  if (q) {
    limit = 50;
    if (/^\d+$/.test(q)) {
      where.push('u.id = ?');
      params.push(Number(q));
    } else {
      where.push('u.username_lower LIKE ?');
      params.push(`%${q.toLowerCase()}%`);
    }
  }

  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const result = await db
    .prepare(`SELECT ${ACCOUNT_COLUMNS} ${ACCOUNT_FROM} ${clause} ORDER BY ${order} LIMIT ${limit}`)
    .bind(...params)
    .all();

  return (result.results || []).map(shapeAccount);
}

async function findAccount(db, id) {
  const row = await db
    .prepare(`SELECT ${ACCOUNT_COLUMNS} ${ACCOUNT_FROM} WHERE u.id = ?`)
    .bind(Number(id) || 0)
    .first();

  return row ? shapeAccount(row) : null;
}

/** Everything else the panel shows about one account. */
async function accountRecord(db, id) {
  const userId = Number(id) || 0;

  const [sessions, ledger, restrictions, log] = await Promise.all([
    db
      .prepare(
        `SELECT COUNT(*) AS n, MAX(last_used) AS last_used
           FROM sessions WHERE user_id = ? AND expires_at > ?`
      )
      .bind(userId, isoNow())
      .first(),
    db
      .prepare(
        `SELECT currency, delta, balance_after, reason, created_at
           FROM ledger WHERE user_id = ? ORDER BY id DESC LIMIT 5`
      )
      .bind(userId)
      .all(),
    db
      .prepare(
        `SELECT kind, reason, issued_at, expires_at, lifted_at
           FROM restrictions WHERE user_id = ? ORDER BY id DESC LIMIT 10`
      )
      .bind(userId)
      .all(),
    db
      .prepare(
        `SELECT action, detail, created_at
           FROM moderation_log WHERE target_id = ? ORDER BY id DESC LIMIT 10`
      )
      .bind(userId)
      .all(),
  ]);

  const badges = await db
    .prepare(
      `SELECT b.key, b.name, b.color, ub.granted_at
         FROM user_badges ub JOIN badges b ON b.key = ub.badge_key
        WHERE ub.user_id = ? ORDER BY ub.granted_at ASC`
    )
    .bind(userId)
    .all();

  return {
    sessions: {
      count: sessions ? Number(sessions.n) || 0 : 0,
      lastUsed: sessions && sessions.last_used ? String(sessions.last_used).replace('T', ' ').slice(0, 16) : 'never',
    },
    badges: (badges.results || []).map((row) => ({
      key: row.key,
      name: row.name,
      color: row.color,
      art: badgeService.artFor(row.key),
      when: formatDate(row.granted_at),
    })),
    ledger: (ledger.results || []).map((row) => ({
      currency: row.currency,
      delta: Number(row.delta) || 0,
      balanceAfter: Number(row.balance_after) || 0,
      reason: row.reason,
      when: formatDate(row.created_at),
    })),
    restrictions: (restrictions.results || []).map((row) => ({
      kind: row.kind,
      reason: row.reason,
      issued: formatDate(row.issued_at),
      expires: row.expires_at ? formatDate(row.expires_at) : 'never',
      lifted: row.lifted_at ? formatDate(row.lifted_at) : '',
    })),
    log: (log.results || []).map((row) => ({
      action: row.action,
      detail: row.detail || '',
      when: formatDate(row.created_at),
    })),
  };
}

/**
 * Changes an account's role, or returns it to Member.
 *
 * The rules are re-checked here rather than trusted from the form, because the
 * form is only a rendering of them:
 *
 *   - never your own account
 *   - never somebody at or above your own rank, except a Root acting on another
 *     Root, which is allowed because only Root may revoke Root
 *   - only a role you are allowed to grant
 */
async function setRole(db, actor, targetId, roleKey, now) {
  const account = await findAccount(db, targetId);
  if (!account) return { ok: false, code: 'nobody' };

  const wanted = String(roleKey || '').trim();

  if (String(account.id) === String(actor.id)) return { ok: false, code: 'self' };

  const rootOverRoot = Number(actor.rank) === 255 && account.roleRank === 255;
  if (account.roleRank >= Number(actor.rank) && !rootOverRoot) {
    return { ok: false, code: 'rank' };
  }

  let role = null;

  if (wanted !== 'member') {
    const row = await db.prepare('SELECT key, name, rank FROM roles WHERE key = ?').bind(wanted).first();
    if (!row) return { ok: false, code: 'unknown' };
    role = { key: row.key, name: row.name, rank: Number(row.rank) || 0 };
    if (!permissions.mayGrant(actor, role)) return { ok: false, code: 'grant' };
  }

  if (wanted === account.roleKey) return { ok: true, unchanged: true };

  if (wanted === 'member') {
    await db.prepare('DELETE FROM user_roles WHERE user_id = ?').bind(account.id).run();
  } else {
    await db
      .prepare(
        `INSERT INTO user_roles (user_id, role_key, granted_by)
         VALUES (?, ?, ?)
         ON CONFLICT (user_id) DO UPDATE SET
           role_key   = excluded.role_key,
           granted_by = excluded.granted_by,
           granted_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`
      )
      .bind(account.id, role.key, actor.id)
      .run();
  }

  // The badge that belongs to the job. Earned badges - club tier, knockouts,
  // invites - are left alone by syncRoleBadge, so a demotion cannot take away
  // something the member did not get from the position.
  await badgeService.syncRoleBadge(db, {
    userId: account.id,
    roleKey: wanted === 'member' ? '' : role.key,
    actorId: actor.id,
  });

  await db
    .prepare(
      `INSERT INTO moderation_log (actor_id, target_id, action, detail, created_at)
       VALUES (?, ?, 'role_changed', ?, ?)`
    )
    .bind(actor.id, account.id, `${account.roleName} -> ${role ? role.name : 'Member'}`, now)
    .run();

  return { ok: true, from: account.roleName, to: role ? role.name : 'Member' };
}

module.exports = {
  accountRecord,
  findAccount,
  nav,
  overview,
  recentLog,
  searchAccounts,
  setRole,
};
