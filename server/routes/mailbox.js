/**
 * Messages: the inbox, the sent box and the forms that write to both.
 *
 * This router owns /messages rather than the page router, because every one of
 * these pages differs by who is signed in and what is in their rows. The page
 * router still answers GET /messages/:id (reading one incoming message); this
 * router answers the rest and is mounted before it, so /messages/sent and
 * /messages/compose are not mistaken for a message id.
 *
 * Mounted before the page router in both runtimes, so a refusal here is answered
 * here rather than falling through to a 404.
 */

const { Router } = require('../lib/router');

const site = require('../config/site');
const pageContext = require('../services/pageContext');
const mailbox = require('../services/mailbox');

const router = Router();

/** Fixed wording for success codes. Nothing typed into a URL is rendered. */
const DONE = {
  sent: 'Message sent.',
  deleted: 'Message deleted. The other person keeps their copy.',
};

/** Fixed wording for the conditions the mailbox refuses. */
const FAILED = {
  no_member: 'There is no member by that name.',
  self: 'You cannot send a message to yourself.',
  blocked: 'That member cannot exchange messages with you.',
  empty: 'A message needs some words in it.',
  long: `A message can be up to ${mailbox.BODY_MAX} characters.`,
  subject: `A subject can be up to ${mailbox.SUBJECT_MAX} characters.`,
  gone: 'That message is not in your mailbox.',
  refused: 'That message was not saved.',
};

function noticeFor(query) {
  const done = DONE[String((query || {}).done || '')];
  if (done) return done;

  const failed = String((query || {}).failed || '');
  if (!failed) return null;

  return FAILED[failed] || FAILED.refused;
}

/** Shared locals for every page here. */
function locals(req, extra) {
  return pageContext(
    req,
    Object.assign(
      {
        authState: 'member',
        viewerName: req.viewer ? req.viewer.username : '',
        notice: noticeFor(req.query),
      },
      extra || {}
    )
  );
}

/**
 * A signed-in member with a database, or an answer that explains why not.
 *
 * Returns true when the route should carry on. The redirect and the 503 both
 * answer the request, so a caller only has to look at the return value.
 */
function ready(req, res) {
  if (!req.viewer) {
    res.redirect('/login');
    return false;
  }

  if (!req.db) {
    res.status(503).render(
      'pages/error',
      locals(req, {
        pageTitle: `Messages unavailable - ${site.name}`,
        statusCode: 503,
        message: 'Messages need the database, and this server was started without one.',
      })
    );
    return false;
  }

  return true;
}

function backToInbox(req, res, code) {
  const key = String(code || '');
  const path = key === 'sent' ? '/messages/sent' : '/messages';
  return res.redirect(`${path}?done=${encodeURIComponent(key)}`);
}

router.get('/messages', (req, res, next) => {
  return (async () => {
    if (!ready(req, res)) return;

    const [messages, sentCount] = await Promise.all([
      mailbox.inbox(req.db, req.viewer.id),
      mailbox.sentCount(req.db, req.viewer.id),
    ]);

    return res.render(
      'pages/messages',
      locals(req, {
        pageTitle: `Messages - ${site.name}`,
        messages,
        sentCount,
        unread: messages.filter((message) => !message.read).length,
        live: true,
      })
    );
  })().catch(next);
});

router.get('/messages/sent', (req, res, next) => {
  return (async () => {
    if (!ready(req, res)) return;

    const messages = await mailbox.sent(req.db, req.viewer.id);

    return res.render(
      'pages/messages-sent',
      locals(req, {
        pageTitle: `Sent Messages - ${site.name}`,
        messages,
        unread: 0,
        live: true,
      })
    );
  })().catch(next);
});

/** A sent message, read back. Marking it read would be a lie about the recipient. */
router.get('/messages/sent/:id', (req, res, next) => {
  return (async () => {
    if (!ready(req, res)) return;

    const message = await mailbox.open(req.db, req.viewer.id, req.params.id);

    if (!message || message.direction !== 'out') {
      return res.status(404).render(
        'pages/error',
        locals(req, {
          pageTitle: `Message not found - ${site.name}`,
          statusCode: 404,
          message: 'That message is not in your sent box.',
        })
      );
    }

    return res.render(
      'pages/message',
      locals(req, {
        pageTitle: `${message.subject} - ${site.name}`,
        message,
        outgoing: true,
      })
    );
  })().catch(next);
});

/** The compose page, with a recipient carried over from a profile. */
router.get('/messages/compose', (req, res, next) => {
  return (async () => {
    if (!ready(req, res)) return;

    return res.render(
      'pages/messages-compose',
      locals(req, {
        pageTitle: `New Message - ${site.name}`,
        to: String(req.query.to || '').slice(0, 20),
        subject: String(req.query.subject || '').slice(0, mailbox.SUBJECT_MAX),
        failure: FAILED[String(req.query.failed || '')] || null,
      })
    );
  })().catch(next);
});

router.post('/messages', (req, res, next) => {
  return (async () => {
    if (!ready(req, res)) return;

    const body = req.body || {};

    const result = await mailbox.send(req.db, {
      fromId: req.viewer.id,
      to: body.to,
      subject: body.subject,
      body: body.body,
    });

    if (!result.ok) {
      const params = new URLSearchParams();
      const to = String(body.to || '').trim();
      if (to) params.set('to', to);
      params.set('failed', result.code);
      return res.redirect(`/messages/compose?${params.toString()}`);
    }

    return backToInbox(req, res, 'sent');
  })().catch(next);
});

/**
 * Reply to a message in either box.
 *
 * The recipient is read from the stored row, not from the form, so a reply can
 * only go back to the person the conversation is with.
 */
router.post('/messages/:id/reply', (req, res, next) => {
  return (async () => {
    if (!ready(req, res)) return;

    const original = await mailbox.open(req.db, req.viewer.id, req.params.id);

    if (!original) return res.redirect('/messages?failed=gone');

    const to = original.direction === 'out' ? original.to : original.from;
    const trimmed = original.rawSubject.replace(/^re:\s*/i, '');

    const result = await mailbox.send(req.db, {
      fromId: req.viewer.id,
      to,
      subject: `Re: ${trimmed}`.slice(0, mailbox.SUBJECT_MAX),
      body: (req.body || {}).body,
    });

    if (!result.ok) return res.redirect(`/messages?failed=${encodeURIComponent(result.code)}`);

    return backToInbox(req, res, 'sent');
  })().catch(next);
});

router.post('/messages/:id/delete', (req, res, next) => {
  return (async () => {
    if (!ready(req, res)) return;

    const side = await mailbox.remove(req.db, req.viewer.id, req.params.id);

    if (!side) return res.redirect('/messages?failed=gone');
    if (side === 'out') return res.redirect('/messages/sent?done=deleted');

    return backToInbox(req, res, 'deleted');
  })().catch(next);
});

module.exports = router;
