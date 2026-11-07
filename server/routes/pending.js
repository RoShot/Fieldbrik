/**
 * Designed but not built: Groups, Advertising, Ambassadors and the Share
 * FieldBrik pages.
 *
 * The classic My FieldBrik strip carried all of these, so the strip carries them
 * too. Each one opens a page that says what it will do and what is missing,
 * rather than a 404 or a button that pretends to work. The copy is the scope
 * agreed for this build; none of it is stored yet.
 *
 * These are separate routes rather than one page with a query string so the
 * links in the menu are stable and each page has its own title.
 */

const { Router } = require('../lib/router');
const site = require('../config/site');
const pageContext = require('../services/pageContext');

const PAGES = {
  '/groups': {
    title: 'Groups',
    summary:
      'A group is a named place for members with a shared interest, with its own page, its own member list and a rank for each member.',
    planned: [
      'Creating a group with a name, a description and a badge',
      'Joining and leaving, with the member list shown on the group page',
      'Ranks inside a group, so an owner can hand out officer status',
      'A group wall, moderated the same way the forum is',
    ],
    note: 'There is no groups table yet, so no group can be created, joined or listed.',
  },

  '/advertising': {
    title: 'Advertising',
    summary:
      'Advertising is where a member buys one of the slots on the front page and has their place shown in it.',
    planned: [
      'Buying a slot by size, paid for in Bucks',
      'Uploading the image, with a review before it appears',
      'A start and end date per slot, so a slot cannot be held forever',
      'A record of what a member bought and when it ran',
    ],
    note: 'The front page does not carry member ads yet: the wide boxes there hold places from this database. When the slots open, they replace those boxes.',
  },

  '/ambassadors': {
    title: 'Ambassadors',
    summary:
      'Ambassadors are members who bring other members to FieldBrik and are recognised for it.',
    planned: [
      'A share link per member, so a new sign-up can be credited to whoever sent it',
      'A count of the members each ambassador brought in',
      'Recognition on the profile of whoever brought them in',
      'A leaderboard, once there are enough members for one to mean anything',
    ],
    note: 'Nothing is tracked yet: sign-ups are not credited to anybody, so there is no figure to show.',
  },

  '/share': {
    title: 'Share FieldBrik',
    summary:
      'Sharing is how a member brings a friend in, and how a member who wants more from the site finds the paid membership.',
    planned: [
      'Inviting a friend with a link that credits the invitation to you',
      'A referral leaderboard once invitations are counted',
      'A way to pass on the membership page to somebody who wants it',
    ],
    note: 'The three parts of the classic Share menu are separate pages: Please Upgrade Me opens Carpenters Club, and the other two are listed here.',
  },

  '/share/invite': {
    title: 'Invite A Friend',
    summary:
      'Inviting a friend sends them a link to FieldBrik that credits the new account to you when they sign up.',
    planned: [
      'A personal link per member',
      'A note on the new account saying who invited them',
      'The invitation counted on the inviter’s profile',
    ],
    note: 'No invitation is recorded yet, so no link exists to send. Sign-ups are open to anybody without one.',
  },

  '/share/referrals': {
    title: 'Referral Leaderboards',
    summary:
      'A referral leaderboard ranks members by how many other members they brought to the site.',
    planned: [
      'A table of members ordered by invitations that turned into accounts',
      'A period filter, so a month can be looked at on its own',
      'A place on the profile for the figure',
    ],
    note: 'This waits on invitations being counted at all: there is nothing to rank yet.',
  },
};

const router = Router();

Object.keys(PAGES).forEach((path) => {
  router.get(path, (req, res) => {
    const meta = PAGES[path];

    return res.render(
      'pages/in-development',
      pageContext(req, {
        pageTitle: `${meta.title} - ${site.name}`,
        meta,
      })
    );
  });
});

module.exports = router;
