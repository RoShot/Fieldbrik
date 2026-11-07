/**
 * The member strip's pages: the four that are designed but not built, plus the
 * Share FieldBrik invitation form.
 *
 * Groups, Advertising, Ambassadors and the referral leaderboard each open a page
 * that says what they will do and what is missing, rather than a 404 or a button
 * that pretends to work. The copy is the scope agreed for this build; none of it
 * is stored yet.
 *
 * Share FieldBrik is a real form: the address and the message are checked on the
 * server and the page reports what happened. What it cannot do is deliver the
 * email, because no mail service is connected to this build; the page says that
 * plainly and hands over the link instead of claiming an invitation was sent.
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

// ---------------------------------------------------------------------------
// Share FieldBrik
// ---------------------------------------------------------------------------

const DEFAULT_MESSAGE = `Check out ${site.name}, this awesome free game I found on the internets!`;
const MESSAGE_MAX = 1000;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function invitedValues(req) {
  const body = req.body || {};
  const name = String(body.name || '').trim();
  const message = String(body.message || '').trim();

  return {
    name: name || (req.viewer ? req.viewer.username : ''),
    email: String(body.email || '').trim(),
    message: message || DEFAULT_MESSAGE,
  };
}

function renderShare(req, res, values, result) {
  return res.render(
    'pages/share',
    pageContext(req, {
      pageTitle: `Share ${site.name} with a Friend - ${site.name}`,
      extraCss: '/css/share2009.css',
      bodyClass: 'fb-share-page',
      values,
      result,
      inviteLink: `https://${site.domain}/`,
    })
  );
}

const router = Router();

router.get('/share', (req, res) => {
  return renderShare(req, res, invitedValues(req), null);
});

// The strip's Share menu still points at the old invitation page. It is the same
// form, so send the link to it rather than keeping a second placeholder alive.
router.get('/share/invite', (req, res) => res.redirect('/share'));

// The button checks the form and reports the truth: this build cannot send mail,
// so an accepted form hands back the link rather than claiming a delivery.
router.post('/share', (req, res) => {
  const values = invitedValues(req);

  if (!values.email) {
    return renderShare(req, res, values, {
      ok: false,
      text: 'Add the email address of the friend you want to invite.',
    });
  }

  if (!EMAIL.test(values.email)) {
    return renderShare(req, res, values, {
      ok: false,
      text: `That does not look like an email address. Check the address and try again.`,
    });
  }

  if (values.message.length > MESSAGE_MAX) {
    return renderShare(req, res, values, {
      ok: false,
      text: `Keep the message under ${MESSAGE_MAX} characters; this one is ${values.message.length}.`,
    });
  }

  return renderShare(req, res, values, {
    ok: true,
    text:
      'The address and the message are fine, but nothing was sent: no mail service is connected to ' +
      'this build, so invitations cannot be emailed yet. Copy the link below and send it yourself. ' +
      'The address is not stored anywhere.',
  });
});

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
