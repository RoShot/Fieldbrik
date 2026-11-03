/**
 * The locals every page needs: site config, navigation, the viewer and the auth
 * state.
 *
 * One place, because a page can be rendered from outside the page router - a
 * failed sign-in re-renders the login form from the account routes - and it
 * still has to arrive with a complete header rather than a blank one.
 */

const site = require('../config/site');
const buildNavigation = require('../services/navigation');
const fixtures = require('./fixtures');

module.exports = function pageContext(req, overrides) {
  const base = {
    site,
    nav: buildNavigation(req.path),
    // A real session wins; the fixture viewer is only the display fallback
    // while the rest of the site has not moved onto the database yet.
    viewer: req.viewer || fixtures.viewer,
    currentPath: req.path,
    pageTitle: site.name,
    authState: req.viewer ? 'member' : 'guest',
  };

  return Object.assign(base, overrides || {});
};
