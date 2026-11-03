/**
 * Username policy.
 *
 * Checked on the server when an account is created, so the rule holds however
 * the request arrives. The refusal never repeats the word that matched, so the
 * reply cannot be used to probe the list one name at a time.
 *
 * Matching is done on a normalised form: lowercased, common lookalikes folded
 * back to letters, then everything that is not a letter removed. That way
 * "H1tl3r" and "h.i.t.l.e.r" are the same name as "hitler".
 */

/** Longer than three letters: matched anywhere inside the name. */
const BLOCKED_ANYWHERE = [
  'nigg', 'faggot', 'hitler', 'eichmann', 'auschwitz', 'nazi', 'siegheil',
  'whitepower', 'holocaust', 'gassing', 'rape', 'rapist', 'paedo', 'pedo',
  'childporn', 'molest', 'incest', 'bestiality', 'loli', 'shota',
  'cunt', 'fuck', 'fuk', 'phuck', 'bitch', 'slut', 'whore', 'twat', 'prick',
  'wank', 'jizz', 'semen', 'smegma', 'anus', 'porn', 'hentai', 'milf',
  'dildo', 'orgy', 'nudes', 'blowjob', 'handjob',
];

/**
 * Three letters or fewer: only when the whole name is that word, so ordinary
 * names that happen to contain the letters are not refused. The trade-off is
 * that "sexgod" gets through where "sex" does not.
 */
const BLOCKED_WHOLE = ['sex', 'cum', 'fag', 'jew', 'jews', 'kkk', 'xxx', 'ass', 'tit', 'anal'];

/** Names that would look like staff or like the site itself. */
const RESERVED_WHOLE = [
  'admin', 'administrator', 'mod', 'moderator', 'staff', 'support', 'system',
  'owner', 'root', 'official', 'fieldbrik', 'guest', 'anonymous', 'null',
  'undefined', 'test', 'testing',
];

const RESERVED_PREFIX = ['admin', 'moderator', 'support', 'staff', 'fieldbrik', 'official'];

function normalise(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/0/g, 'o')
    .replace(/[1|!]/g, 'i')
    .replace(/3/g, 'e')
    .replace(/[4@]/g, 'a')
    .replace(/[5$]/g, 's')
    .replace(/7/g, 't')
    .replace(/8/g, 'b')
    .replace(/[^a-z]/g, '');
}

/**
 * @returns {{ok: true} | {ok: false, reason: string}}
 */
function check(username) {
  const name = normalise(username);

  if (!name) {
    return { ok: false, reason: 'That name has no letters in it.' };
  }

  if (RESERVED_WHOLE.includes(name) || RESERVED_PREFIX.some((prefix) => name.startsWith(prefix))) {
    return { ok: false, reason: 'That name is kept for FieldBrik staff. Please choose another.' };
  }

  if (BLOCKED_WHOLE.includes(name) || BLOCKED_ANYWHERE.some((word) => name.includes(word))) {
    return { ok: false, reason: 'That name is not allowed on FieldBrik. Please choose another.' };
  }

  return { ok: true };
}

module.exports = { check, normalise, BLOCKED_ANYWHERE, BLOCKED_WHOLE, RESERVED_WHOLE };
