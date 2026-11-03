/**
 * Page routes.
 *
 * Built pages render real EJS views. Designed-but-unbuilt pages render the
 * shared in-development view with their agreed scope, so navigation is complete
 * and nothing silently 404s mid-build.
 *
 * Phase 2 replaces the fixture viewer with a session viewer and wraps this
 * router in the central moderation gate.
 */

const { Router } = require('../lib/router');

const site = require('../config/site');
const buildNavigation = require('../services/navigation');
const pageContext = require('../services/pageContext');
const fixtures = require('../services/fixtures');
const notices = require('../services/notices');

/*
 * Identity comes from the session; content still comes from fixtures.
 *
 * A signed-in account must never be shown someone else's name or stats, so the
 * viewer is replaced wholesale. Lists that would be attributed to that account -
 * friends, favourite games, badges held - come back empty rather than borrowed,
 * because a new account genuinely has none of them yet.
 */
function viewerFor(req) {
  return req.viewer || fixtures.viewer;
}

function ownedList(req, list) {
  return req.viewer ? [] : list;
}

function heldBadgeKeys(req) {
  return req.viewer ? [] : fixtures.viewerBadges;
}

const router = Router();

/** Links shown in the profile sidebar, in reference order. */
const profileLinks = [
  { label: 'Friends', href: '/friends' },
  { label: 'Change Character', href: '/character' },
  { label: 'Account Settings', href: '/settings' },
  { label: 'Messages', href: '/messages' },
  { label: 'Inventory', href: '/inventory' },
  { label: 'View Public Profile', href: '/people/BrikFounder' },
  { label: 'Log Out', href: '/logout' },
];

/** Cards on the Parents page. Order matches the reference layout. */
const parentCards = [
  {
    title: 'FieldBrik Guide',
    href: '/parents/guide',
    text: 'Background information on the world of FieldBrik, especially for parents. What an account is, how signing up and logging in work, what the badges and currencies mean, and what each part of the site does.',
  },
  {
    title: 'Carpenters Club',
    href: '/carpenters-club',
    text: 'Play for free, or enhance your experience with Carpenters Club.',
  },
  {
    title: 'Keeping Kids Safe',
    href: '/parents/safety',
    text: 'Information on how to keep your child safe while online.',
  },
  {
    title: 'FieldBrik and Learning',
    href: '/parents/learning',
    text: 'Members learn engineering, design, science and programming while they play.',
  },
  {
    title: 'FAQs',
    href: '/parents/faq',
    text: 'Questions and answers just for parents.',
  },
  {
    title: 'What Parents are Saying',
    href: '/parents/guestbook',
    text: 'Hear what other parents are saying about FieldBrik.',
  },
];

/**
 * Pages scheduled for later front-end passes. Each entry documents what the
 * page will contain, so the placeholder is honest rather than decorative.
 */
const PENDING = {
  logout: {
    title: 'Log Out',
    summary: 'End your session on this device.',
    planned: [
      'End the current session server-side, not just in the browser',
      'Clear the session cookie',
      'Return to the signed-out home page',
    ],
    note: 'Signing out needs a session to end, and sessions arrive with accounts in phase 2. Until then nobody is signed in, so there is nothing to sign out of.',
  },
};

/**
 * Pages that only make sense for a signed-in member.
 *
 * Without a session they redirect to the one form instead of drawing somebody
 * else's account, which is what the fixtures did while accounts were missing.
 */
const GUARDED = [
  /^\/my-page$/,
  /^\/character(\/.*)?$/,
  /^\/inventory$/,
  /^\/friends(\/.*)?$/,
  /^\/messages(\/.*)?$/,
  /^\/settings(\/.*)?$/,
];

// Shared locals for every page. One place, not once per page.
router.use((req, res, next) => {
  if (!req.viewer && GUARDED.some((pattern) => pattern.test(req.path))) {
    if (req.method === 'GET') return res.redirect('/login');
    return res.status(401).json({ ok: false, error: 'Sign in first.' });
  }

  Object.assign(res.locals, pageContext(req));
  next();
});

/** Marks a response as the signed-in variant of the header. */
function signedIn(res) {
  res.locals.authState = 'member';
}

router.get('/', (req, res) => {
  res.render('pages/home', {
    pageTitle: `${site.name} - ${site.tagline.join(' ')}`,
    featured: fixtures.games.filter((game) => game.featured),
    news: fixtures.news.slice(0, 4),
    stats: fixtures.platformStats,
    online: fixtures.users.filter((user) => user.online),
  });
});

router.get('/my-page', async (req, res) => {
  signedIn(res);

  const friends = fixtures.users.filter((user) => user.id !== viewerFor(req).id).slice(0, 6);
  const favouriteGames = fixtures.games.slice(0, 3);

  // Granted badges are rows now, so they are read rather than borrowed from the
  // fixture list - which would show somebody a badge nobody had given them.
  const heldBadges =
    req.db && req.viewer
      ? await peopleDirectory.badgesFor(req.db, req.viewer.id)
      : fixtures.badges.filter((badge) => heldBadgeKeys(req).includes(badge.key));

  // Warnings are display only: nothing in the request gate reads them. This is
  // the one place the member sees one, until they dismiss it.
  const warnings =
    req.db && req.viewer ? await notices.warnings(req.db, req.viewer.id) : [];

  res.render('pages/my-page', {
    pageTitle: `My Page - ${site.name}`,
    viewer: viewerFor(req),
    friends: ownedList(req, friends),
    friendTotal: viewerFor(req).stats.friends,
    favouriteGames: ownedList(req, favouriteGames),
    heldBadges,
    warnings,
    profileLinks,
  });
});

router.get('/parents', (req, res) => {
  res.render('pages/parents', {
    pageTitle: `Parents - ${site.name}`,
    cards: parentCards,
  });
});

router.get('/carpenters-club', (req, res) => {
  res.render('pages/carpenters-club', {
    pageTitle: `Carpenters Club - ${site.name}`,
    club: site.carpentersClub,
    heldBadges: heldBadgeKeys(req),
  });
});

router.get('/help', (req, res) => {
  res.render('pages/help', { pageTitle: `Help - ${site.name}` });
});

router.get('/about', (req, res) => {
  res.render('pages/about', { pageTitle: `About Us - ${site.name}` });
});

router.get('/support', (req, res) => {
  res.render('pages/support', { pageTitle: `Support - ${site.name}` });
});

/**
 * Builds a facet link, keeping the current selection and applying a change.
 * Empty values are dropped so facet links stay clean.
 */
function facetHref(basePath, current, changes) {
  const params = new URLSearchParams();

  Object.entries({ ...current, ...changes }).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, value);
    }
  });

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

const GAME_SORTS = {
  popular: (a, b) => b.players - a.players,
  visits: (a, b) => b.visits - a.visits,
  newest: (a, b) => String(b.updated).localeCompare(String(a.updated)),
};

router.get('/games', (req, res) => {
  const query = String(req.query.q || '').trim();
  const creator = String(req.query.creator || '').trim();
  const sort = String(req.query.sort || '');
  const onlyFeatured = req.query.featured === '1';

  let games = fixtures.games.slice();

  if (onlyFeatured) {
    games = games.filter((game) => game.featured);
  }
  if (creator) {
    games = games.filter((game) => game.creator === creator);
  }
  if (query) {
    const needle = query.toLowerCase();
    games = games.filter(
      (game) =>
        game.name.toLowerCase().includes(needle) ||
        game.creator.toLowerCase().includes(needle)
    );
  }
  if (GAME_SORTS[sort]) {
    games = games.sort(GAME_SORTS[sort]);
  }

  const current = { q: query, creator, sort, featured: onlyFeatured ? '1' : '' };

  const browseFacets = [
    { label: 'All Games', changes: {}, active: !query && !creator && !sort && !onlyFeatured },
    { label: 'Featured', changes: { sort: '', featured: '1' }, active: onlyFeatured && !sort },
    { label: 'Most Popular', changes: { featured: '', sort: 'popular' }, active: sort === 'popular' },
    { label: 'Most Visited', changes: { sort: 'visits' }, active: sort === 'visits' },
    { label: 'Newest', changes: { sort: 'newest' }, active: sort === 'newest' },
  ].map((facet) => ({
    label: facet.label,
    active: facet.active,
    href: facetHref('/games', current, facet.changes),
  }));

  const creatorNames = [...new Set(fixtures.games.map((game) => game.creator))].sort();
  const creatorFacets = creatorNames.map((name) => ({
    label: name,
    active: creator === name,
    href: facetHref('/games', current, { creator: creator === name ? '' : name }),
  }));

  res.render('pages/games', {
    pageTitle: `Games - ${site.name}`,
    games,
    query,
    browseFacets,
    creatorFacets,
    totalPlayers: games.reduce((sum, game) => sum + game.players, 0),
  });
});

const CATALOG_CATEGORIES = ['Hats', 'Shirts', 'T-shirts', 'Pants', 'Accessories'];

// Bands are expressed in Tickets. An item sold only for Bucks has no Tickets
// price, so it does not match a Tickets band - only "Any price" and the other
// facet groups still apply to it.
const PRICE_BANDS = [
  { key: '', label: 'Any price', test: () => true },
  { key: 'under50', label: 'Under 50 Tx', test: (item) => item.tickets !== null && item.tickets < 50 },
  { key: '50to200', label: '50 to 200 Tx', test: (item) => item.tickets !== null && item.tickets >= 50 && item.tickets <= 200 },
  { key: 'over200', label: 'Over 200 Tx', test: (item) => item.tickets !== null && item.tickets > 200 },
];

router.get('/catalog', (req, res) => {
  const query = String(req.query.q || '').trim();
  const category = String(req.query.category || '').trim();
  const creator = String(req.query.creator || '').trim();
  const priceKey = String(req.query.price || '').trim();
  const band = PRICE_BANDS.find((entry) => entry.key === priceKey) || PRICE_BANDS[0];

  let items = fixtures.catalogItems.slice();

  if (category) {
    items = items.filter((item) => item.category === category);
  }
  if (creator) {
    items = items.filter((item) => item.creator === creator);
  }
  items = items.filter((item) => band.test(item));
  if (query) {
    const needle = query.toLowerCase();
    items = items.filter(
      (item) =>
        item.name.toLowerCase().includes(needle) ||
        item.creator.toLowerCase().includes(needle)
    );
  }

  const current = { q: query, category, creator, price: priceKey };

  const categoryFacets = [
    { label: 'All Categories', value: '' },
    ...CATALOG_CATEGORIES.map((name) => ({ label: name, value: name })),
  ].map((facet) => ({
    label: facet.label,
    active: category === facet.value,
    href: facetHref('/catalog', current, { category: facet.value }),
  }));

  const priceFacets = PRICE_BANDS.map((entry) => ({
    label: entry.label,
    active: priceKey === entry.key || (!priceKey && entry.key === ''),
    href: facetHref('/catalog', current, { price: entry.key }),
  }));

  const creatorNames = [...new Set(fixtures.catalogItems.map((item) => item.creator))].sort();
  const creatorFacets = creatorNames.map((name) => ({
    label: name,
    active: creator === name,
    href: facetHref('/catalog', current, { creator: creator === name ? '' : name }),
  }));

  res.render('pages/catalog', {
    pageTitle: `Catalog - ${site.name}`,
    items,
    query,
    categoryFacets,
    priceFacets,
    creatorFacets,
  });
});

const PEOPLE_SORTS = {
  name: (a, b) => a.username.localeCompare(b.username),
  newest: (a, b) => String(b.joined).localeCompare(String(a.joined)),
  friends: (a, b) => b.stats.friends - a.stats.friends,
};

router.get('/people', async (req, res) => {
  const query = String(req.query.q || '').trim();
  const sort = String(req.query.sort || '');

  const current = { q: query, sort };

  const sortFacets = [
    { label: 'Default order', value: '' },
    { label: 'Username A to Z', value: 'name' },
    { label: 'Friend count', value: 'friends' },
    { label: 'Newest members', value: 'newest' },
  ].map((facet) => ({
    label: facet.label,
    active: sort === facet.value || (!sort && facet.value === ''),
    href: facetHref('/people', current, { sort: facet.value }),
  }));

  // No database means the Express development server: fixtures, as before.
  let people;

  if (req.db) {
    people = await peopleDirectory.list(req.db, { query, sort });
  } else {
    people = fixtures.users.slice();

    if (query) {
      const needle = query.toLowerCase();
      people = people.filter((user) => user.username.toLowerCase().includes(needle));
    }
    if (PEOPLE_SORTS[sort]) {
      people = people.sort(PEOPLE_SORTS[sort]);
    }
  }

  res.render('pages/people', {
    pageTitle: `People - ${site.name}`,
    people,
    query,
    sortFacets,
  });
});

router.get('/forum', async (req, res) => {
  const query = String(req.query.q || '').trim();
  const needle = query.toLowerCase();

  // Sections are site structure and live in the database; the fixture list is
  // only for the Express development server, which runs without one.
  const sections = req.db
    ? await forumDirectory.list(req.db, { query })
    : fixtures.forumSections.filter(
        (section) =>
          !needle ||
          section.name.toLowerCase().includes(needle) ||
          section.description.toLowerCase().includes(needle)
      );

  res.render('pages/forum', {
    pageTitle: `Forum - ${site.name}`,
    sections,
    query,
    totalThreads: sections.reduce((sum, section) => sum + section.threads, 0),
  });
});

/**
 * Detail pages.
 *
 * Lookups accept either a numeric id or a slugified name, so links can be
 * readable and old numeric links keep working. Phase 2 replaces these fixture
 * lookups with queries; the routes and views stay as they are.
 */
function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-'
    )
    .replace(/^-+|-+$/g, '');
}

router.get('/people/:username', async (req, res) => {
  const wanted = req.params.username;

  // Profiles are browsed from inside a signed-in session, so they keep the
  // member header.
  signedIn(res);

  const notFound = () =>
    res.status(404).render('pages/error', {
      pageTitle: `Member not found - ${site.name}`,
      statusCode: 404,
      message: `There is no member called ${wanted}.`,
    });

  if (!req.db) {
    const person = fixtures.users.find(
      (user) => user.username.toLowerCase() === wanted.toLowerCase()
    );

    if (!person) return notFound();

    const roleBadge = fixtures.badges.find((badge) => badge.key === person.role);

    return res.render('pages/profile', {
      pageTitle: `${person.username} - ${site.name}`,
      person,
      heldBadges: roleBadge ? [roleBadge] : [],
      friends: fixtures.users.filter((user) => user.id !== person.id).slice(0, 6),
      created: fixtures.games.filter((game) => game.creator === person.username),
      // No database means no friendship rows, so no button is drawn.
      friendAction: 'signed-out',
      notice: noticeFromQuery(req),
    });
  }

  const person = await peopleDirectory.findOne(req.db, wanted);
  if (!person) return notFound();

  const [heldBadges, friends, created] = await Promise.all([
    peopleDirectory.badgesFor(req.db, person.id),
    peopleDirectory.friendsOf(req.db, person.id),
    peopleDirectory.gamesFor(req.db, person.id),
  ]);

  // What this viewer is to that member decides which one button the page draws.
  const relationship = req.viewer
    ? await friendships.relationship(req.db, req.viewer.id, person.id)
    : { state: 'signed-out' };

  res.render('pages/profile', {
    pageTitle: `${person.username} - ${site.name}`,
    person,
    heldBadges,
    friends: friends.slice(0, 6),
    created,
    friendAction: relationship.state,
    notice: noticeFromQuery(req),
  });
});

router.get('/games/:slug', (req, res) => {
  const param = req.params.slug;
  const game = fixtures.games.find(
    (entry) => String(entry.id) === param || slugify(entry.name) === param
  );

  if (!game) {
    return res.status(404).render('pages/error', {
      pageTitle: `Game not found - ${site.name}`,
      statusCode: 404,
      message: 'That game is not listed on FieldBrik.',
    });
  }

  res.render('pages/game', {
    pageTitle: `${game.name} - ${site.name}`,
    game,
    creator: fixtures.users.find((user) => user.username === game.creator) || null,
  });
});

router.get('/catalog/:slug', (req, res) => {
  const param = req.params.slug;
  const item = fixtures.catalogItems.find(
    (entry) => String(entry.id) === param || slugify(entry.name) === param
  );

  if (!item) {
    return res.status(404).render('pages/error', {
      pageTitle: `Item not found - ${site.name}`,
      statusCode: 404,
      message: 'That item is not listed in the catalog.',
    });
  }

  res.render('pages/item', {
    pageTitle: `${item.name} - ${site.name}`,
    item,
    moreByCreator: fixtures.catalogItems
      .filter((entry) => entry.creator === item.creator && entry.id !== item.id)
      .slice(0, 5),
  });
});

const NEWS_CATEGORIES = [...new Set(fixtures.news.map((article) => article.category))].sort();

router.get('/news', (req, res) => {
  const category = String(req.query.category || '').trim();
  const articles = category
    ? fixtures.news.filter((article) => article.category === category)
    : fixtures.news.slice();

  const categoryFacets = [
    { label: 'All news', value: '' },
    ...NEWS_CATEGORIES.map((name) => ({ label: name, value: name })),
  ].map((facet) => ({
    label: facet.label,
    active: category === facet.value,
    href: facet.value ? `/news?category=${encodeURIComponent(facet.value)}` : '/news',
  }));

  res.render('pages/news', {
    pageTitle: `News - ${site.name}`,
    articles,
    category,
    categoryFacets,
  });
});

router.get('/news/:slug', (req, res) => {
  const param = req.params.slug;
  const article = fixtures.news.find(
    (entry) => entry.slug === param || String(entry.id) === param
  );

  if (!article) {
    return res.status(404).render('pages/error', {
      pageTitle: `Article not found - ${site.name}`,
      statusCode: 404,
      message: 'That news article does not exist.',
    });
  }

  res.render('pages/news-article', {
    pageTitle: `${article.title} - ${site.name}`,
    article,
  });
});

router.get('/forum/:section', async (req, res) => {
  const wanted = req.params.section.toLowerCase();
  const section = req.db
    ? await forumDirectory.findOne(req.db, wanted)
    : fixtures.forumSections.find((entry) => entry.slug === wanted);

  if (!section) {
    return res.status(404).render('pages/error', {
      pageTitle: `Section not found - ${site.name}`,
      statusCode: 404,
      message: 'That forum section does not exist.',
    });
  }

  res.render('pages/forum-section', {
    pageTitle: `${section.name} - ${site.name}`,
    section,
  });
});

// Written pages that need no stored data.
router.get('/terms', (req, res) => {
  res.render('pages/terms', { pageTitle: `Terms of Service - ${site.name}` });
});

router.get('/privacy', (req, res) => {
  res.render('pages/privacy', { pageTitle: `Privacy Policy - ${site.name}` });
});

// error and values are passed even when empty: the template reads them, and EJS
// throws on a name that is missing from the locals object entirely.
router.get('/login', (req, res) => {
  // Already signed in? There is nothing to do on this page.
  if (req.viewer) return res.redirect('/my-page');

  res.render('pages/login', {
    pageTitle: `Log In - ${site.name}`,
    error: null,
    values: null,
  });
});

// One form does both jobs, so the old separate page is just a way in.
router.get('/register', (req, res) => {
  res.redirect('/login');
});

// ---------- Account and social pages ----------
// Markup complete, behaviour deliberately disabled until the services exist.

const avatarRepository = require('../services/avatarRepository');
const accounts = require('../services/accounts');
const forumDirectory = require('../services/forum');
const friendships = require('../services/friendships');
const peopleDirectory = require('../services/people');

const SESSION_COOKIE = accounts.SESSION_COOKIE;

// Six independent colours, matching both the renderer and the schema (D19).
const AVATAR_PARTS = [
  { label: 'Head', source: 'head' },
  { label: 'Torso', source: 'torso' },
  { label: 'Left Arm', source: 'leftArm' },
  { label: 'Right Arm', source: 'rightArm' },
  { label: 'Left Leg', source: 'leftLeg' },
  { label: 'Right Leg', source: 'rightLeg' },
];

router.get('/character', (req, res) => {
  signedIn(res);

  res.render('pages/character', {
    pageTitle: `Character - ${site.name}`,
    avatar: viewerFor(req).avatar,
    viewerName: viewerFor(req).username,
    palette: fixtures.avatarPalette,
    faces: fixtures.avatarFaces,
    parts: AVATAR_PARTS.map((part) => ({
      label: part.label,
      source: part.source,
      current: viewerFor(req).avatar[part.source],
    })),
  });
});

// Appearance save. Returns JSON rather than redirecting: the Character page
// updates the live preview in place and only needs to know whether the write
// was accepted.
router.post('/character/avatar', async (req, res, next) => {
  if (!req.db) {
    res.status(503).json({ ok: false, error: 'Saving an appearance needs the database.' });
    return;
  }

  try {
    const saved = await avatarRepository.save(req.db, req.viewer.id, req.body);

    res.json({ ok: true, avatar: saved });
  } catch (error) {
    if (error instanceof avatarRepository.AvatarError) {
      res.status(400).json({ ok: false, error: error.message });
      return;
    }

    next(error);
  }
});

router.get('/inventory', (req, res) => {
  signedIn(res);

  const owned = fixtures.catalogItems.filter((item) => item.owned);

  res.render('pages/inventory', {
    pageTitle: `Inventory - ${site.name}`,
    owned,
    wearing: owned.filter((item) => item.equipped),
    viewerName: viewerFor(req).username,
  });
});

router.get('/friends', (req, res, next) => renderFriends(req, res, 200, null).catch(next));

router.get('/messages', (req, res, next) => {
  return (async () => {
    signedIn(res);

    // A signed-in member reads their own rows. The fixture list is what the
    // Express server shows, which runs without a database.
    const messages =
      req.db && req.viewer ? await notices.inbox(req.db, req.viewer.id) : fixtures.messages;

    res.render('pages/messages', {
      pageTitle: `Messages - ${site.name}`,
      messages,
      unread: messages.filter((message) => !message.read).length,
      viewerName: viewerFor(req).username,
      // Sending between members is still phase 4; the notice says which inbox
      // this is rather than pretending the form works.
      live: Boolean(req.db && req.viewer),
    });
  })().catch(next);
});

router.get('/messages/:id', (req, res, next) => {
  return (async () => {
    signedIn(res);

    let message;

    if (req.db && req.viewer) {
      // Only this member's rows: a number in the URL must not open somebody
      // else's message.
      message = /^\d+$/.test(req.params.id)
        ? await notices.openMessage(req.db, req.viewer.id, Number(req.params.id))
        : null;
    } else {
      message = fixtures.messages.find((entry) => String(entry.id) === req.params.id) || null;
    }

    if (!message) {
      return res.status(404).render('pages/error', {
        pageTitle: `Message not found - ${site.name}`,
        statusCode: 404,
        message: 'That message is not in your inbox.',
      });
    }

    res.render('pages/message', {
      pageTitle: `${message.subject} - ${site.name}`,
      message,
    });
  })().catch(next);
});

/**
 * Dismissing a warning marks it read for this member.
 *
 * It is not the warning being lifted: the row stays on the account's record,
 * where staff still see it.
 */
router.post('/warnings/:id/dismiss', (req, res, next) => {
  return (async () => {
    if (!req.viewer) return res.redirect('/login');
    if (!req.db) return res.status(503).send('The database is not attached.');
    if (!/^\d+$/.test(req.params.id)) return res.redirect('/my-page');

    await notices.acknowledgeWarning(req.db, req.viewer.id, Number(req.params.id));
    return res.redirect('/my-page');
  })().catch(next);
});

// Parents sub-tabs. Each tab is a real page with its own content.
const PARENT_TABS = [
  { key: 'guide', label: 'FieldBrik Guide' },
  { key: 'safety', label: 'Keeping Kids Safe' },
  { key: 'learning', label: 'Learning' },
  { key: 'faq', label: 'FAQs' },
  { key: 'guestbook', label: 'What Parents Say' },
];

router.get('/parents/:tab', (req, res) => {
  const tab = PARENT_TABS.find((entry) => entry.key === req.params.tab);

  if (!tab) {
    return res.status(404).render('pages/error', {
      pageTitle: `Page not found - ${site.name}`,
      statusCode: 404,
      message: 'That parents page does not exist.',
    });
  }

  res.render(`pages/parents-${tab.key}`, {
    pageTitle: `${tab.label} - ${site.name}`,
    tabs: PARENT_TABS,
    activeTab: tab.key,
    club: site.carpentersClub,
  });
});

// Designed-but-pending pages.
Object.entries(PENDING).forEach(([slug, meta]) => {
  router.get(`/${slug}`, (req, res) => {
    res.render('pages/in-development', {
      pageTitle: `${meta.title} - ${site.name}`,
      meta,
    });
  });
});

// ---------- Friend actions ----------
//
// Each route changes one row and redirects, so a refresh cannot repeat it.
// Failures come back as a code rather than a message: the page looks the
// wording up, so nothing typed into a URL is ever rendered.

/** Fixed wording for the ?done= codes these routes redirect with. */
const DONE_MESSAGES = {
  requested: 'Friend request sent.',
  accepted: 'Friend request accepted.',
  declined: 'Friend request declined.',
  cancelled: 'Friend request withdrawn.',
  removed: 'That member is no longer on your friends list.',
  blocked: 'That member is blocked.',
  password: 'Your password has been changed. Every other device was signed out.',
  sessions: 'Every other device has been signed out.',
};

/** Fixed wording for the conditions the friendship service refuses. */
const FAILED_MESSAGES = {
  no_member: 'There is no member by that name.',
  self: 'You cannot add yourself.',
  already: 'You are already friends with that member.',
  duplicate: 'That request has already been sent.',
  answer_theirs: 'That member has already asked you. Answer it on the Friends page.',
  not_friends: 'You are not friends with that member.',
  wrong_way: 'There is no request from that member to answer.',
  not_yours: 'That request is not yours to cancel.',
  blocked: 'That action is not available for that member.',
  refused: 'That did not work.',
};

function noticeFromQuery(req) {
  const done = DONE_MESSAGES[String(req.query.done || '')];
  if (done) return done;

  const failed = String(req.query.failed || '');
  if (!failed) return null;

  return FAILED_MESSAGES[failed] || FAILED_MESSAGES.refused;
}

/**
 * The friends page, drawn from the session's own rows.
 *
 * The POST routes render through here too when something is refused, so the
 * page and its error arrive together instead of an error and a redirect.
 */
async function renderFriends(req, res, status, error) {
  signedIn(res);

  const base = {
    pageTitle: `Friends - ${site.name}`,
    notice: error || noticeFromQuery(req),
    viewerName: viewerFor(req).username,
    // Without a database there are no rows to change, so no button is drawn.
    canAct: Boolean(req.db),
  };

  if (!req.db) {
    return res.status(status).render('pages/friends', {
      ...base,
      friends: fixtures.users.filter((user) => user.id !== viewerFor(req).id),
      total: viewerFor(req).stats.friends,
      incoming: [],
      outgoing: [],
    });
  }

  const [friends, incoming, outgoing] = await Promise.all([
    peopleDirectory.friendsOf(req.db, req.viewer.id),
    peopleDirectory.pending(req.db, req.viewer.id, 'incoming'),
    peopleDirectory.pending(req.db, req.viewer.id, 'outgoing'),
  ]);

  return res.status(status).render('pages/friends', {
    ...base,
    friends,
    total: friends.length,
    incoming,
    outgoing,
  });
}

/** Where a friendship action sends the browser afterwards. */
const backToFriends = () => '/friends';
const backToProfile = (req) => `/people/${encodeURIComponent(req.params.username)}`;

function friendRoute(done, run, back) {
  return (req, res, next) => {
    // Returned, not just called: the Worker parks a returned promise and waits
    // for it. A block body that dropped it answered 404 before the row changed.
    return (async () => {
      if (!req.db) return res.redirect(`${back(req)}?failed=no_member`);

      try {
        await run(req.db, req.viewer.id, req.params.username);
        return res.redirect(`${back(req)}?done=${done}`);
      } catch (error) {
        if (error instanceof friendships.FriendError) {
          return res.redirect(`${back(req)}?failed=${error.code}`);
        }
        throw error;
      }
    })().catch(next);
  };
}

router.post('/friends/request/:username', friendRoute('requested', friendships.request, backToProfile));
router.post('/friends/accept/:username', friendRoute('accepted', friendships.accept, backToFriends));
router.post('/friends/decline/:username', friendRoute('declined', friendships.decline, backToFriends));
router.post('/friends/cancel/:username', friendRoute('cancelled', friendships.cancel, backToFriends));
router.post('/friends/remove/:username', friendRoute('removed', friendships.remove, backToProfile));
router.post('/friends/block/:username', friendRoute('blocked', friendships.block, backToFriends));

// ---------- Account settings ----------

function sessionToken(req) {
  return req.cookies ? req.cookies[SESSION_COOKIE] : null;
}

async function renderSettings(req, res, status, error) {
  signedIn(res);

  const sessions = req.db ? await accounts.activeSessionCount(req.db, req.viewer.id) : 0;

  return res.status(status).render('pages/settings', {
    pageTitle: `Account Settings - ${site.name}`,
    viewerName: viewerFor(req).username,
    // This request is itself one session, so the page is about the others.
    otherSessions: Math.max(0, sessions - 1),
    error: error || null,
    notice: error ? null : noticeFromQuery(req),
  });
}

router.get('/settings', (req, res, next) => renderSettings(req, res, 200, null).catch(next));

router.post('/settings/password', (req, res, next) => {
  return (async () => {
    if (!req.db) return res.status(503).send('Accounts need the database.');

    try {
      await accounts.changePassword(req.db, req.viewer.id, req.body, sessionToken(req));
      return res.redirect('/settings?done=password');
    } catch (error) {
      if (error instanceof accounts.AccountError) {
        return renderSettings(req, res, 400, error.message);
      }
      throw error;
    }
  })().catch(next);
});

router.post('/settings/sessions', (req, res, next) => {
  return (async () => {
    if (!req.db) return res.status(503).send('Accounts need the database.');

    await accounts.signOutOtherSessions(req.db, req.viewer.id, sessionToken(req));
    return res.redirect('/settings?done=sessions');
  })().catch(next);
});

router.post('/settings/close', (req, res, next) => {
  return (async () => {
    if (!req.db) return res.status(503).send('Accounts need the database.');

    try {
      await accounts.closeAccount(req.db, req.viewer.id, req.body);
      res.clearCookie(SESSION_COOKIE, { path: '/' });
      return res.redirect('/');
    } catch (error) {
      if (error instanceof accounts.AccountError) {
        return renderSettings(req, res, 400, error.message);
      }
      throw error;
    }
  })().catch(next);
});

module.exports = router;
