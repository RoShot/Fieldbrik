-- 004 - Carpenters Club grants and referrals.
--
-- memberships already exists from the baseline schema, but it records a
-- purchase: tier, term, amount. A staff grant has no purchase behind it, so the
-- actor and the note go in their own table rather than pretending an amount was
-- charged. Keeping it separate also means this migration is a plain
-- CREATE TABLE IF NOT EXISTS, which the deploy can re-run.

CREATE TABLE IF NOT EXISTS membership_grants (
  membership_id INTEGER PRIMARY KEY REFERENCES memberships (id) ON DELETE CASCADE,
  granted_by    INTEGER REFERENCES users (id),
  note          TEXT NOT NULL DEFAULT '',
  granted_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- One row per referred account. UNIQUE on referred_id is the rule that an
-- account can only be somebody's referral once, enforced by the table rather
-- than by hoping two requests did not race.
CREATE TABLE IF NOT EXISTS referrals (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  referrer_id  INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  referred_id  INTEGER NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
  granted_by   INTEGER REFERENCES users (id),
  reward_bucks INTEGER NOT NULL DEFAULT 15,
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals (referrer_id, created_at);
