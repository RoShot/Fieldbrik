/**
 * News: the public archive, the article pages, and the panel screens that write
 * them.
 *
 * Mounted before the page router because routes/pages.js still answers /news
 * from the phase 1 fixture file, and that file is far too large to upload as one
 * piece. Everything this router does not answer falls through to it.
 *
 * The panel gate is the same five checks the rest of the panel applies. It is
 * repeated here rather than imported because routes/admin.js and
 * routes/adminContent.js each keep their own copy for the same reason: the gate
 * is small, and the policy it reads - services/permissions - is shared, so the
 * three cannot disagree about who is staff.
 */

const { Router } = require('../lib/router');

const site = require('../config/site');
const pageContext = require('../services/pageContext');
const permissions = require('../services/permissions');
const adminService = require('../services/admin');
const news = require('../services/news');

const router = Router();

const DONE = {
  created: 'Article created.',
  saved: 'Article saved.',
  published: 'Article published. It is in the news list and on the home page.',
  unpublished: 'Article unpublished. It is a draft again, and its page is gone from the site.',
};

const FAILED = {
  title: `A title needs to be between ${news.TITLE_MIN} and ${news.TITLE_MAX} characters.`,
  category: 'Pick one of the article categories.',
  summary: `A summary can be up to ${news.SUMMARY_MAX} characters.`,
  body: `An article needs at least ${news.BODY_MIN} characters of body text.`,
  nobody: 'No article has that ID.',
  refused: 'The article was not saved.',
};

function noticeFor(query) {
  const done = DONE[String((query || {}).done || '')];
  if (done) return done;

  const failed = String((query || {}).failed || '');
  if (!failed) return null;

  return FAILED[failed] || FAILED.refused;
}

function notAllowed(req, res, code, message) {
  return res.status(code).render(
    'pages/error',
    pageContext(req, { pageTitle: 'Not allowed', statusCode: code, message })
  );
}

/** The panel gate, identical to the one in routes/adminContent.js. */
function staff(capability, handler) {
  return function guarded(req, res, next) {
    return (async () => {
      if (!req.viewer) return res.redirect('/login');

      if (!req.db) {
        return notAllowed(
          req,
          res,
          503,
          'The administration panel needs the database, which is not attached in this runtime.'
        );
      }

      const role = await permissions.roleOf(req.db, req.viewer.id);

      if (!role || role.rank < permissions.MIN_STAFF) {
        return notAllowed(
          req,
          res,
          403,
          'This area is for FieldBrik staff. If you believe you should have access, contact a member of the team.'
        );
      }

      if (capability && !permissions.can(role, capability)) {
        return notAllowed(req, res, 403, 'Your role cannot open this page.');
      }

      req.admin = { role };
      return handler(req, res);
    })().catch(next);
  };
}

/** Locals every panel page needs. Passed explicitly - a missing local throws. */
function panelView(req, extra) {
  return Object.assign(
    {
      site,
      viewer: req.viewer,
      admin: req.admin.role,
      currentPath: req.path,
      adminNav: adminService.nav(req.admin.role, req.path, req.query),
      pageTitle: 'Administration - FieldBrik',
    },
    extra || {}
  );
}

function emptyArticle() {
  return {
    id: null,
    slug: '',
    title: '',
    category: news.CATEGORIES[0],
    summary: '',
    body: '',
    published: false,
    date: '',
  };
}

// ---------- Public ----------

router.get('/news', (req, res, next) => {
  return (async () => {
    const category = String(req.query.category || '').trim();

    const [articles, counts] = req.db
      ? await Promise.all([news.list(req.db, { category }), news.counts(req.db)])
      : [[], []];

    const total = counts.reduce((sum, entry) => sum + entry.count, 0);

    const categoryFacets = [
      { label: 'All news', active: category === '', href: '/news' },
    ].concat(
      counts.map((entry) => ({
        label: `${entry.category} (${entry.count})`,
        active: category === entry.category,
        href: `/news?category=${encodeURIComponent(entry.category)}`,
      }))
    );

    return res.render(
      'pages/news',
      pageContext(req, {
        pageTitle: `News - ${site.name}`,
        articles,
        categoryFacets,
        total,
        category,
      })
    );
  })().catch(next);
});

router.get('/news/:slug', (req, res, next) => {
  return (async () => {
    const article = req.db ? await news.findPublished(req.db, req.params.slug) : null;

    if (!article) {
      return res.status(404).render(
        'pages/error',
        pageContext(req, {
          pageTitle: `Article not found - ${site.name}`,
          statusCode: 404,
          message: 'That news article does not exist.',
        })
      );
    }

    return res.render(
      'pages/news-article',
      pageContext(req, {
        pageTitle: `${article.title} - ${site.name}`,
        article,
      })
    );
  })().catch(next);
});

// ---------- Panel: the article list ----------

router.get(
  '/admin/news',
  staff('content.review', (req, res) => {
    return (async () => {
      const [overview, articles] = await Promise.all([
        adminService.overview(req.db),
        news.all(req.db),
      ]);

      return res.render(
        'admin/news',
        panelView(req, {
          adminStatus: overview.status,
          articles,
          drafts: articles.filter((article) => !article.published).length,
          notice: noticeFor(req.query),
        })
      );
    })();
  })
);

// ---------- Panel: writing ----------

router.get(
  '/admin/news/new',
  staff('content.review', (req, res) => {
    return (async () => {
      const overview = await adminService.overview(req.db);

      return res.render(
        'admin/news-edit',
        panelView(req, {
          adminStatus: overview.status,
          article: emptyArticle(),
          isNew: true,
          categories: news.CATEGORIES,
          notice: null,
          failure: null,
          titleMax: news.TITLE_MAX,
          summaryMax: news.SUMMARY_MAX,
          bodyMax: news.BODY_MAX,
        })
      );
    })();
  })
);

router.post(
  '/admin/news',
  staff('content.review', (req, res) => {
    return (async () => {
      const body = req.body || {};

      const result = await news.create(
        req.db,
        { ...body, published: String(body.published || '') === '1' },
        req.viewer.id
      );

      if (!result.ok) {
        const overview = await adminService.overview(req.db);

        return res.status(400).render(
          'admin/news-edit',
          panelView(req, {
            adminStatus: overview.status,
            article: { ...emptyArticle(), ...body, id: null, published: body.published === '1' },
            isNew: true,
            categories: news.CATEGORIES,
            notice: null,
            failure: FAILED[result.code] || FAILED.refused,
            titleMax: news.TITLE_MAX,
            summaryMax: news.SUMMARY_MAX,
            bodyMax: news.BODY_MAX,
          })
        );
      }

      return res.redirect(`/admin/news/${result.id}?done=created`);
    })();
  })
);

router.get(
  '/admin/news/:id',
  staff('content.review', (req, res) => {
    return (async () => {
      const article = await news.findById(req.db, req.params.id);

      if (!article) {
        return res.status(404).render(
          'pages/error',
          pageContext(req, {
            pageTitle: 'Not allowed',
            statusCode: 404,
            message: FAILED.nobody,
          })
        );
      }

      const overview = await adminService.overview(req.db);

      return res.render(
        'admin/news-edit',
        panelView(req, {
          adminStatus: overview.status,
          article,
          isNew: false,
          categories: news.CATEGORIES,
          notice: noticeFor(req.query),
          failure: null,
          titleMax: news.TITLE_MAX,
          summaryMax: news.SUMMARY_MAX,
          bodyMax: news.BODY_MAX,
        })
      );
    })();
  })
);

router.post(
  '/admin/news/:id',
  staff('content.review', (req, res) => {
    return (async () => {
      const id = Number(req.params.id) || 0;
      const result = await news.update(req.db, id, req.body || {}, req.viewer.id);

      if (!result.ok) return res.redirect(`/admin/news/${id}?failed=${encodeURIComponent(result.code)}`);

      return res.redirect(`/admin/news/${id}?done=saved`);
    })();
  })
);

router.post(
  '/admin/news/:id/status',
  staff('content.review', (req, res) => {
    return (async () => {
      const id = Number(req.params.id) || 0;
      const published = String((req.body || {}).published || '') === '1';

      const result = await news.setPublished(req.db, id, published, req.viewer.id);

      if (!result.ok) return res.redirect(`/admin/news?failed=${encodeURIComponent(result.code)}`);

      return res.redirect(`/admin/news/${id}?done=${encodeURIComponent(result.code)}`);
    })();
  })
);

module.exports = router;
