/**
 * Navigation model.
 *
 * The active state for every link is computed in exactly one place. Adding a
 * page to site.nav is enough for it to appear everywhere.
 */

const site = require('../config/site');

function isActive(href, currentPath) {
  if (href === '/') return currentPath === '/';
  return currentPath === href || currentPath.startsWith(href + '/');
}

function withActive(links, currentPath) {
  return links.map((link) => ({
    ...link,
    active: isActive(link.href, currentPath),
  }));
}

module.exports = function buildNavigation(currentPath = '/') {
  return {
    primary: withActive(site.nav, currentPath),
    user: withActive(site.userNav, currentPath),
  };
};
