/**
 * Badge artwork.
 *
 * The database holds the badge itself - key, name, description, colour - and
 * this file says which of them have a drawing. Keeping the list here rather
 * than deriving `/img/<key>.png` means a badge with no art keeps its coloured
 * square instead of rendering a broken image, which is the difference between
 * "not drawn yet" and "broken".
 *
 * Files live flat in public/img/, which is what the operator uploaded.
 */

const ART = {
  super_administrator: '/img/superadmin.png',
  administrator: '/img/administrator.png',
  image_moderator: '/img/imagemod.png',
  forum_moderator: '/img/formmod.png',
  carpenters_club: '/img/ccb.png',
  carpenters_club_senior: '/img/ccs.png',
  outrageous_carpenters_club: '/img/occ.png',
  official_model_maker: '/img/officialmodelmaker.png',
  ambassador: '/img/ambassador.png',
  one_year: '/img/1year.png',
  friends_20: '/img/20friends.png',
  brikker: '/img/brikker.png',
  briksmith: '/img/briksmith.png',
  // The invite badge is stored under the key the referral grant already writes.
  referral: '/img/inviter.png',
};

/** The drawing for a badge key, or '' when it has none yet. */
function artFor(key) {
  return ART[String(key || '')] || '';
}

module.exports = { ART, artFor };
