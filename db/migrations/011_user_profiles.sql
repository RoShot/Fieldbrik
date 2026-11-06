-- Profile details the sign-up form asks for.
--
-- Birthday and gender belong on the account, but this loop runs on every push,
-- so ALTER TABLE ADD COLUMN is not available: the second run would fail with
-- "duplicate column name". They live in their own table, one row per member,
-- the same way 007 and 010 handle later additions.
--
-- Nothing here is public. No page reads these columns yet; they exist because
-- the sign-up form asks, and a form field that is thrown away is a lie.
--
-- A missing row means the member has no stored profile, which is what every
-- account created before this pass has.

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id    INTEGER PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  birth_month INTEGER CHECK (birth_month BETWEEN 1 AND 12),
  birth_day   INTEGER CHECK (birth_day BETWEEN 1 AND 31),
  birth_year  INTEGER CHECK (birth_year BETWEEN 1900 AND 2100),
  gender      TEXT CHECK (gender IN ('male', 'female')),
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
