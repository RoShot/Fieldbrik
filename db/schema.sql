-- FieldBrik 0.3 schema.
--
-- Fresh database: nothing here is copied from 0.2. Every table that the site
-- needs exists from the start, so pages can move off fixtures one service at a
-- time instead of needing a migration per page.
--
-- Conventions:
--   * Timestamps are ISO-8601 UTC text, so they sort correctly and read back
--     without a parser (SQLite has no date type).
--   * Money and currency are INTEGER whole units. There is no floating point
--     anywhere near a balance.
--   * Anything a moderator does is written to moderation_log, which is only
--     ever appended to.

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------------
-- Accounts
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  username        TEXT    NOT NULL,
  -- Lowercased username. Uniqueness and lookup go through this so BrikFounder
  -- and brikfounder cannot both be registered.
  username_lower  TEXT    NOT NULL UNIQUE,
  email           TEXT,
  email_lower     TEXT    UNIQUE,
  password_hash   TEXT    NOT NULL,
  password_salt   TEXT    NOT NULL,
  -- 100,000 is the highest count Cloudflare's PBKDF2 accepts, and each row
  -- stores its own, so a lower or higher value here only affects new accounts.
  password_iterations INTEGER NOT NULL DEFAULT 100000,
  role            TEXT    NOT NULL DEFAULT 'user'
                  CHECK (role IN ('user', 'support_staff', 'moderator', 'administrator', 'super_administrator')),
  created_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  last_seen_at    TEXT,
  description     TEXT    NOT NULL DEFAULT '',
  -- Cached balances. The ledger below is the record of truth; these columns
  -- exist so a page does not have to sum the ledger to draw a header.
  tickets         INTEGER NOT NULL DEFAULT 0 CHECK (tickets >= 0),
  bucks           INTEGER NOT NULL DEFAULT 0 CHECK (bucks >= 0),
  -- Set when the account is closed rather than deleted, so history survives.
  closed_at       TEXT
);

CREATE INDEX IF NOT EXISTS idx_users_created ON users (created_at);

-- Six independent colours and one face ID, matching the client renderer
-- exactly (DECISIONS D19). One row per user, created with the account.
CREATE TABLE IF NOT EXISTS avatars (
  user_id    INTEGER PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  head       TEXT NOT NULL,
  torso      TEXT NOT NULL,
  left_arm   TEXT NOT NULL,
  right_arm  TEXT NOT NULL,
  left_leg   TEXT NOT NULL,
  right_leg  TEXT NOT NULL,
  face       TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Sessions. Only the SHA-256 of the token is stored, so a database dump cannot
-- be replayed as a login.
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT    PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  expires_at TEXT    NOT NULL,
  last_used  TEXT,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_user    ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions (expires_at);

-- Failed sign-ins, counted rather than kept: rows older than a day are swept
-- when a new failure is written. This has to live in the database rather than in
-- the process, or every Worker isolate would get its own allowance.
CREATE TABLE IF NOT EXISTS login_attempts (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  username_lower TEXT    NOT NULL DEFAULT '',
  ip             TEXT    NOT NULL DEFAULT '',
  attempted_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_name ON login_attempts (username_lower, attempted_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip   ON login_attempts (ip, attempted_at);

-- ---------------------------------------------------------------------------
-- Moderation
-- ---------------------------------------------------------------------------

-- Warnings and restrictions live together. A restriction is evaluated on every
-- request, and an expired one still appears in the account's history, so a
-- repeat offender is visible rather than starting clean.
CREATE TABLE IF NOT EXISTS restrictions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  kind       TEXT    NOT NULL CHECK (kind IN ('warning', 'restriction', 'ban')),
  reason     TEXT    NOT NULL,
  issued_by  INTEGER REFERENCES users (id),
  issued_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  expires_at TEXT,
  -- Lifted early. The row stays; it is history, not state.
  lifted_at  TEXT,
  lifted_by  INTEGER REFERENCES users (id)
);

CREATE INDEX IF NOT EXISTS idx_restrictions_user ON restrictions (user_id, expires_at);

-- Append-only. No UPDATE or DELETE is ever issued against this table.
CREATE TABLE IF NOT EXISTS moderation_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_id   INTEGER REFERENCES users (id),
  target_id  INTEGER REFERENCES users (id),
  action     TEXT    NOT NULL,
  detail     TEXT    NOT NULL DEFAULT '',
  created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_modlog_target ON moderation_log (target_id, created_at);
CREATE INDEX IF NOT EXISTS idx_modlog_actor  ON moderation_log (actor_id, created_at);

-- ---------------------------------------------------------------------------
-- Economy
-- ---------------------------------------------------------------------------

-- Every balance change is an entry. balance_after is stored so a balance can
-- always be explained by the entries that produced it, rather than being a
-- number somebody typed.
CREATE TABLE IF NOT EXISTS ledger (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  currency      TEXT    NOT NULL CHECK (currency IN ('tickets', 'bucks')),
  delta         INTEGER NOT NULL,
  balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
  reason        TEXT    NOT NULL,
  -- Free-form pointer at whatever caused the entry, e.g. 'item:12'.
  ref           TEXT,
  created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_ledger_user ON ledger (user_id, currency, created_at);

-- Carpenters Club. Payment is not live, so rows are written only when a
-- purchase is actually recorded; nothing here is simulated.
CREATE TABLE IF NOT EXISTS memberships (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  tier       TEXT    NOT NULL CHECK (tier IN ('carpenters_club', 'carpenters_club_senior', 'outrageous_carpenters_club')),
  term       TEXT    NOT NULL CHECK (term IN ('monthly', 'quarterly', 'yearly', 'permanent')),
  amount_cents INTEGER NOT NULL,
  currency   TEXT    NOT NULL DEFAULT 'AUD',
  started_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  -- Null means permanent.
  expires_at TEXT,
  cancelled_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships (user_id, expires_at);

-- ---------------------------------------------------------------------------
-- Social
-- ---------------------------------------------------------------------------

-- One row per friendship. user_a is always the lower id, so a pair cannot be
-- stored twice in opposite directions.
CREATE TABLE IF NOT EXISTS friendships (
  user_a     INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  user_b     INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  status     TEXT    NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
  requested_by INTEGER NOT NULL REFERENCES users (id),
  created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  responded_at TEXT,
  PRIMARY KEY (user_a, user_b),
  CHECK (user_a < user_b)
);

CREATE INDEX IF NOT EXISTS idx_friendships_b ON friendships (user_b, status);

CREATE TABLE IF NOT EXISTS messages (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  from_id    INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  to_id      INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  subject    TEXT    NOT NULL DEFAULT '',
  body       TEXT    NOT NULL,
  created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  read_at    TEXT,
  -- Kept after a delete so the other side's copy survives.
  from_deleted_at TEXT,
  to_deleted_at   TEXT
);

CREATE INDEX IF NOT EXISTS idx_messages_to   ON messages (to_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_from ON messages (from_id, created_at);

-- ---------------------------------------------------------------------------
-- Places and catalog
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS games (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT    NOT NULL UNIQUE,
  name        TEXT    NOT NULL,
  creator_id  INTEGER NOT NULL REFERENCES users (id),
  description TEXT    NOT NULL DEFAULT '',
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  visits      INTEGER NOT NULL DEFAULT 0,
  featured    INTEGER NOT NULL DEFAULT 0 CHECK (featured IN (0, 1)),
  -- Place data itself arrives with the client; nothing renders from it yet.
  place_data  TEXT,
  published   INTEGER NOT NULL DEFAULT 0 CHECK (published IN (0, 1))
);

CREATE INDEX IF NOT EXISTS idx_games_creator ON games (creator_id);
CREATE INDEX IF NOT EXISTS idx_games_visits  ON games (visits DESC);

-- Prices are nullable: a creator sets Tickets, Bucks, or both. When both are
-- set the rate is 1 Buck = 10 Tickets (D11), enforced by the app, not by the
-- table, because the table only stores what was asked for.
CREATE TABLE IF NOT EXISTS catalog_items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  category    TEXT    NOT NULL,
  creator_id  INTEGER NOT NULL REFERENCES users (id),
  tickets     INTEGER CHECK (tickets IS NULL OR tickets >= 0),
  bucks       INTEGER CHECK (bucks IS NULL OR bucks >= 0),
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  on_sale     INTEGER NOT NULL DEFAULT 1 CHECK (on_sale IN (0, 1)),
  CHECK (tickets IS NOT NULL OR bucks IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_catalog_category ON catalog_items (category, on_sale);

CREATE TABLE IF NOT EXISTS user_items (
  user_id    INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  item_id    INTEGER NOT NULL REFERENCES catalog_items (id) ON DELETE CASCADE,
  acquired_at TEXT   NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  equipped   INTEGER NOT NULL DEFAULT 0 CHECK (equipped IN (0, 1)),
  PRIMARY KEY (user_id, item_id)
);

-- ---------------------------------------------------------------------------
-- Badges
-- ---------------------------------------------------------------------------

-- Badge definitions are site structure, so they are seeded rather than created
-- by members. A badge is granted from a server-side row, never from the client.
CREATE TABLE IF NOT EXISTS badges (
  key         TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  color       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_badges (
  user_id   INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  badge_key TEXT    NOT NULL REFERENCES badges (key) ON DELETE CASCADE,
  granted_at TEXT   NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  granted_by INTEGER REFERENCES users (id),
  PRIMARY KEY (user_id, badge_key)
);

-- ---------------------------------------------------------------------------
-- Forum
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS forum_sections (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT    NOT NULL UNIQUE,
  name        TEXT    NOT NULL,
  description TEXT    NOT NULL DEFAULT '',
  position    INTEGER NOT NULL DEFAULT 0,
  -- Staff only, checked on the server when a thread is created.
  staff_only  INTEGER NOT NULL DEFAULT 0 CHECK (staff_only IN (0, 1))
);

CREATE TABLE IF NOT EXISTS forum_threads (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  section_id INTEGER NOT NULL REFERENCES forum_sections (id) ON DELETE CASCADE,
  author_id  INTEGER NOT NULL REFERENCES users (id),
  title      TEXT    NOT NULL,
  created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  pinned     INTEGER NOT NULL DEFAULT 0 CHECK (pinned IN (0, 1)),
  locked     INTEGER NOT NULL DEFAULT 0 CHECK (locked IN (0, 1))
);

CREATE INDEX IF NOT EXISTS idx_threads_section ON forum_threads (section_id, created_at DESC);

CREATE TABLE IF NOT EXISTS forum_posts (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  thread_id  INTEGER NOT NULL REFERENCES forum_threads (id) ON DELETE CASCADE,
  author_id  INTEGER NOT NULL REFERENCES users (id),
  body       TEXT    NOT NULL,
  created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  edited_at  TEXT
);

CREATE INDEX IF NOT EXISTS idx_posts_thread ON forum_posts (thread_id, created_at);

-- ---------------------------------------------------------------------------
-- News
-- ---------------------------------------------------------------------------

-- Platform announcements only. Member content never lands here. The body is
-- stored as the article itself, one entry per paragraph, so the article page
-- renders stored text instead of regenerating it from the summary.
CREATE TABLE IF NOT EXISTS news (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  slug       TEXT    NOT NULL UNIQUE,
  title      TEXT    NOT NULL,
  author_id  INTEGER NOT NULL REFERENCES users (id),
  category   TEXT    NOT NULL DEFAULT 'Platform',
  summary    TEXT    NOT NULL DEFAULT '',
  body       TEXT    NOT NULL,
  published_at TEXT  NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_news_published ON news (published_at DESC);
