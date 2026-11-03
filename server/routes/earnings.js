/**
 * The members' earnings page.
 *
 * Two things live here: today's daily award, and the visit milestones on places
 * this account owns. The daily award is claimed on any signed-in page load by
 * the Worker, so opening this page has usually already claimed it; the button
 * exists because the Express development server has no session and because a
 * member should be able to see the moment it lands.
 *
 * This page never promises a reward that cannot happen: visiting a place is not
 * built, so a member with no places is told exactly that instead of being shown
 * a progress bar that will never move.
 */

const { Router } = require('../lib/router');

const site = require('../config/site');
const pageContext = require('../services/pageContext');
const earnings = require('../services/earnings');

const router = Router();

const DONE = {
  daily: 'Daily Tickets collected.',
  visits: 'Visit milestone paid.',
  none: 'Nothing to collect right now.',
};

const FAILED = {
  signedout: 'Sign in to collect Tickets.',
  nodb: 'Collecting Tickets needs the database, which is not attached.',
};

function noticeFor(query) {
  if (query && DONE[query.done]) return DONE[query.done];
  if (query && FAILED[query.failed]) return FAILED[query.failed];
  return '';
}

async function render(req, res, status, extra) {
  const state = req.db && req.viewer ? await earnings.status(req.db, req.viewer.id) : null;

  return res.status(status).render('pages/earnings', {
    ...pageContext(req, { pageTitle: `Tickets - ${site.name}` }),
    site,
    signedIn: Boolean(req.viewer),
    notice: noticeFor(req.query),
    state,
    ...(extra || {}),
  });
}

router.get('/earnings', (req, res, next) => {
  return render(req, res, 200).catch(next);
});

/** Collect today's award, then look again. */
router.post('/earnings/claim', (req, res, next) => {
  return (async () => {
    if (!req.viewer) return res.redirect('/earnings?failed=signedout');
    if (!req.db) return res.redirect('/earnings?failed=nodb');

    const daily = await earnings.claimDaily(req.db, req.viewer.id);
    const visits = await earnings.claimVisits(req.db, req.viewer.id);

    if (visits.awarded > 0) return res.redirect('/earnings?done=visits');
    if (daily.claimed) return res.redirect('/earnings?done=daily');
    return res.redirect('/earnings?done=none');
  })().catch(next);
});

module.exports = router;
