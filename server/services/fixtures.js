/**
 * PHASE 1 DISPLAY DATA - NOT THE FINAL DATA SOURCE.
 *
 * The front end is built before the database exists, so pages read their data
 * from the service layer. Every page goes through `server/services/*` rather
 * than importing this file. In phase 2 each service swaps these reads for
 * D1 queries; the templates do not change at all.
 *
 * Nothing here is intended to ship as pretend production data.
 */

const users = [
  {
    id: 1,
    username: 'BrikFounder',
    role: 'super_administrator',
    joined: '2006-03-14',
    lastOnline: '2026-11-02T11:42:00Z',
    online: true,
    description:
      'Founder of FieldBrik. I build the place engine, break it, and build it again. Thanks for stopping by.',
    avatar: { head: '#f2c14e', torso: '#2f6fb5', leftArm: '#f2c14e', rightArm: '#f2c14e', leftLeg: '#234d7f', rightLeg: '#234d7f', face: 'classic-smile' },
    currency: { bucks: 1250, tickets: 4820 },
    stats: { friends: 148, badges: 7, games: 12, items: 34 },
  },
  {
    id: 2,
    username: 'CarpenterJo',
    role: 'administrator',
    joined: '2006-05-02',
    lastOnline: '2026-11-02T10:15:00Z',
    online: true,
    description: 'Brick by brick. Mostly castles, sometimes rollercoasters.',
    avatar: { head: '#e8b06a', torso: '#b5443a', leftArm: '#e8b06a', rightArm: '#e8b06a', leftLeg: '#4a4f57', rightLeg: '#4a4f57', face: 'classic-smile' },
    currency: { bucks: 340, tickets: 2140 },
    stats: { friends: 96, badges: 6, games: 8, items: 51 },
  },
  {
    id: 3,
    username: 'studmaster',
    role: 'user',
    joined: '2006-08-21',
    lastOnline: '2026-11-01T21:08:00Z',
    online: false,
    description: 'Obby builder. If it can be jumped on, I have probably fallen off it.',
    avatar: { head: '#d9a06a', torso: '#3f8f5c', leftArm: '#d9a06a', rightArm: '#d9a06a', leftLeg: '#2f3b46', rightLeg: '#2f3b46', face: 'meh' },
    currency: { bucks: 75, tickets: 930 },
    stats: { friends: 54, badges: 3, games: 5, items: 22 },
  },
  {
    id: 4,
    username: 'bluebrikfan1',
    role: 'moderator',
    joined: '2006-11-09',
    lastOnline: '2026-11-02T09:30:00Z',
    online: true,
    description: 'Moderator. Be kind, report bugs, do not spam the forum.',
    avatar: { head: '#f0c9a0', torso: '#35507a', leftArm: '#f0c9a0', rightArm: '#f0c9a0', leftLeg: '#1f2c3d', rightLeg: '#1f2c3d', face: 'classic-smile' },
    currency: { bucks: 210, tickets: 1580 },
    stats: { friends: 71, badges: 4, games: 2, items: 19 },
  },
  {
    id: 5,
    username: 'TicketTycoon',
    role: 'user',
    joined: '2006-12-30',
    lastOnline: '2026-10-30T17:44:00Z',
    online: false,
    description: 'Saving up for the outrageous hat. Currently: still saving.',
    avatar: { head: '#c98f5e', torso: '#8a6fb5', leftArm: '#c98f5e', rightArm: '#c98f5e', leftLeg: '#3a3550', rightLeg: '#3a3550', face: 'classic-smile' },
    currency: { bucks: 40, tickets: 6120 },
    stats: { friends: 33, badges: 2, games: 1, items: 14 },
  },
  {
    id: 6,
    username: 'NullPointer',
    role: 'support_staff',
    joined: '2007-01-18',
    lastOnline: '2026-11-02T08:02:00Z',
    online: true,
    description: 'Support staff. If your account is stuck, tell me what happened and what you expected.',
    avatar: { head: '#e6b98f', torso: '#5c7a3f', leftArm: '#e6b98f', rightArm: '#e6b98f', leftLeg: '#333d2a', rightLeg: '#333d2a', face: 'meh' },
    currency: { bucks: 160, tickets: 2410 },
    stats: { friends: 62, badges: 3, games: 0, items: 12 },
  },
  {
    id: 7,
    username: 'RampBuilder',
    role: 'user',
    joined: '2007-03-05',
    lastOnline: '2026-11-01T14:20:00Z',
    online: false,
    description: 'Ramps. Nothing but ramps.',
    avatar: { head: '#d8a474', torso: '#c26a2f', leftArm: '#d8a474', rightArm: '#d8a474', leftLeg: '#4a3524', rightLeg: '#4a3524', face: 'classic-smile' },
    currency: { bucks: 20, tickets: 480 },
    stats: { friends: 18, badges: 1, games: 3, items: 9 },
  },
  {
    id: 8,
    username: 'PixelPainter',
    role: 'user',
    joined: '2007-06-22',
    lastOnline: '2026-11-02T07:55:00Z',
    online: true,
    description: 'I make shirts nobody asked for.',
    avatar: { head: '#efc7a2', torso: '#b53a6f', leftArm: '#efc7a2', rightArm: '#efc7a2', leftLeg: '#2b2b3a', rightLeg: '#2b2b3a', face: 'classic-smile' },
    currency: { bucks: 90, tickets: 1320 },
    stats: { friends: 44, badges: 2, games: 2, items: 27 },
  },
];

const viewer = users[0];

const games = [
  {
    id: 1,
    name: 'Castle Builders',
    creator: 'CarpenterJo',
    description: 'Cooperative castle construction with a full brick palette and no time limit.',
    created: '2006-06-02',
    updated: '2026-10-28',
    players: 84,
    visits: 412000,
    featured: true,
    thumb: '#6b8db5',
  },
  {
    id: 2,
    name: 'Obby of Doom',
    creator: 'studmaster',
    description: 'Forty-two stages of jumps, spikes and questionable design decisions.',
    created: '2006-09-14',
    updated: '2026-10-30',
    players: 132,
    visits: 903000,
    featured: true,
    thumb: '#8a5a3f',
  },
  {
    id: 3,
    name: 'Ramp City',
    creator: 'RampBuilder',
    description: 'A city made entirely of ramps. Bring a vehicle, or just slide.',
    created: '2007-04-01',
    updated: '2026-10-12',
    players: 41,
    visits: 128000,
    featured: true,
    thumb: '#4a6f4a',
  },
  {
    id: 4,
    name: 'Stud Plaza',
    creator: 'BrikFounder',
    description: 'The original social hangout. Sit on a brick, talk about bricks.',
    created: '2006-03-20',
    updated: '2026-09-30',
    players: 58,
    visits: 640000,
    featured: true,
    thumb: '#3f5f8a',
  },
  {
    id: 5,
    name: 'Tower Defence Bricks',
    creator: 'NullPointer',
    description: 'Place towers, survive the waves, argue about the best tower.',
    created: '2007-02-11',
    updated: '2026-10-22',
    players: 23,
    visits: 76000,
    featured: false,
    thumb: '#5a4a7a',
  },
  {
    id: 6,
    name: 'Shirt Store Tycoon',
    creator: 'PixelPainter',
    description: 'Design shirts, stock shelves, undercut the competition.',
    created: '2007-07-19',
    updated: '2026-11-01',
    players: 17,
    visits: 49000,
    featured: false,
    thumb: '#7a3f5f',
  },
];

// Platform announcements. `body` is the stored article, one entry per
// paragraph, so the article page renders real stored text rather than
// regenerating it from the summary. These are the platform's own posts about
// FieldBrik; member content never appears here.
const news = [
  {
    id: 1,
    slug: 'fieldbrik-0-3-development-has-begun',
    title: 'FieldBrik 0.3 development has begun',
    author: 'BrikFounder',
    date: '2026-11-01',
    summary:
      'A ground-up rebuild of the platform: new account system, central moderation, and a catalog that actually works.',
    category: 'Development',
    body: [
      'FieldBrik 0.3 is a rebuild rather than a refresh. Accounts, moderation, the catalog and the economy are being written from scratch, so that every part of the site shares one set of rules instead of each page enforcing its own.',
      'The visible change is that every page now sits on one shared header and one design system. A change to the navigation lands everywhere at once, and a badge or a price is defined in one place rather than copied into twenty templates.',
      'The order of work is deliberate: the whole website first, page by page, so that every link resolves and nothing is a dead end. Accounts and the database come next, then the catalog economy, then the forum. The client application comes last, because it needs a place editor to load places from.',
      'Progress notes will be posted here as each stage lands.',
    ],
  },
  {
    id: 2,
    slug: 'carpenters-club-tiers-and-prices',
    title: 'Carpenters Club: the three tiers',
    author: 'CarpenterJo',
    date: '2026-10-26',
    summary:
      'Standard, Senior and Outrageous, each available monthly, quarterly, yearly or permanently. The free service stays free.',
    category: 'Community',
    body: [
      'Carpenters Club is the optional membership. It adds recognition and supporting benefits; it does not gate building, publishing or playing, and it never will. Everything you need to use FieldBrik stays free.',
      'There are three tiers - Carpenters Club, Carpenters Club Senior, and Outrageous Carpenters Club - and each can be bought monthly, quarterly, yearly, or permanently as a single payment that never renews. The full table of prices is on the Carpenters Club page.',
      'Membership shows on your profile as a badge. That badge is granted from the account record on the server, so it cannot be added by editing anything in your browser.',
      'Payment is not open yet. Nothing on the site can take money today, and this post will be updated when checkout exists.',
    ],
  },
  {
    id: 3,
    slug: 'tickets-economy-what-changes',
    title: 'Tickets economy: what changes',
    author: 'BrikFounder',
    date: '2026-10-18',
    summary: 'Item pricing moves to Tickets. Bucks remains the premium currency for future features.',
    category: 'Development',
    body: [
      'Tickets are the earned currency and now carry the catalog economy. Bucks remain the premium currency, and the two are linked at a rate of one Buck to ten Tickets, so an item priced at thirty Bucks also reads as three hundred Tickets.',
      'Creators set their own prices. An item can be sold for Tickets, for Bucks, or for both, and the choice is made when the item is listed rather than being decided for you by the platform.',
      'Balances are held in a ledger. Every change is a recorded transaction with the resulting balance attached, so a balance can always be explained by the entries behind it rather than being a number somebody typed.',
    ],
  },
  {
    id: 4,
    slug: 'moderation-team-expanded',
    title: 'Moderation team expanded',
    author: 'bluebrikfan1',
    date: '2026-10-09',
    summary: 'Two new moderators have joined. Reports are now reviewed within a day.',
    category: 'Platform',
    body: [
      'Two new moderators have joined the team, which means reports are now reviewed within a day rather than when somebody happens to be awake.',
      'Moderation in 0.3 is central rather than per-page. A warning or a restriction is recorded against the account and evaluated on every request, so a restricted account cannot get around it by finding a page that forgot to check. Temporary restrictions expire on their own, and expired ones stay in the account history.',
      'Every administrative action writes an entry to an append-only log with the staff member, the target and the reason. That log is how a decision can be explained later, and it is not editable from the admin panel.',
    ],
  },
];

// Prices: `tickets` is the earned-currency price, `bucks` the premium price.
// A creator may set either or both. When both are set the rate is 1 Buck = 10
// Tickets, so a 30 Buck shirt reads 300 Tickets. Null means not sold in that
// currency. See docs/DECISIONS.md D11.
const catalogItems = [
  { id: 1, name: 'Carpenter Hat', category: 'Hats', creator: 'BrikFounder', tickets: 120, bucks: null, thumb: '#c9a227', owned: true, equipped: true },
  { id: 2, name: 'Blue Builder Cap', category: 'Hats', creator: 'CarpenterJo', tickets: 85, bucks: null, thumb: '#3f5f8a', owned: true, equipped: false },
  { id: 3, name: 'Plain Red Shirt', category: 'Shirts', creator: 'PixelPainter', tickets: 25, bucks: null, thumb: '#b5443a', owned: true, equipped: true },
  { id: 4, name: 'FieldBrik Staff Shirt', category: 'Shirts', creator: 'BrikFounder', tickets: 300, bucks: 30, thumb: '#2f6fb5', owned: true, equipped: false },
  { id: 5, name: 'Denim Pants', category: 'Pants', creator: 'PixelPainter', tickets: 40, bucks: null, thumb: '#35507a', owned: true, equipped: false },
  { id: 6, name: 'Lucky Brik Tee', category: 'T-shirts', creator: 'studmaster', tickets: 15, bucks: null, thumb: '#3f8f5c', owned: true, equipped: false },
  { id: 7, name: 'Outrageous Top Hat', category: 'Hats', creator: 'CarpenterJo', tickets: 900, bucks: 90, thumb: '#2b2b3a', owned: false, equipped: false },
  { id: 8, name: 'Builder Goggles', category: 'Accessories', creator: 'BrikFounder', tickets: 150, bucks: 15, thumb: '#7a5c3a', owned: false, equipped: false },
  { id: 9, name: 'Construction Helmet', category: 'Hats', creator: 'studmaster', tickets: 110, bucks: null, thumb: '#d7a12a', owned: false, equipped: false },
  { id: 10, name: 'Skate Sneakers', category: 'Accessories', creator: 'PixelPainter', tickets: 65, bucks: null, thumb: '#5f8a7a', owned: false, equipped: false },
];

// Forum sections are site structure, not posted content. Threads and posts are
// counted from the database in phase 2; until then every section is empty, so
// the page does not pretend to hold conversations that do not exist.
const forumSections = [
  {
    slug: 'announcements',
    name: 'Announcements',
    description: 'Platform news, maintenance windows and development updates from the team.',
    threads: 0,
    posts: 0,
    lastPost: null,
  },
  {
    slug: 'help',
    name: 'Help and Support',
    description: 'Account problems, bug reports and questions about how FieldBrik works.',
    threads: 0,
    posts: 0,
    lastPost: null,
  },
  {
    slug: 'building',
    name: 'Building',
    description: 'Construction techniques, brick palettes, and showing off what you have made.',
    threads: 0,
    posts: 0,
    lastPost: null,
  },
  {
    slug: 'scripting',
    name: 'Scripting and Logic',
    description: 'Making things move. Switches, doors, traps and the logic that drives them.',
    threads: 0,
    posts: 0,
    lastPost: null,
  },
  {
    slug: 'general',
    name: 'Off Topic',
    description: 'Everything that does not belong in the sections above.',
    threads: 0,
    posts: 0,
    lastPost: null,
  },
];

const badges = [
  { key: 'super_administrator', name: 'Super Administrator', description: 'Runs the platform.', color: '#8a2f2f' },
  { key: 'administrator', name: 'Administrator', description: 'Administers the platform.', color: '#a8471f' },
  { key: 'moderator', name: 'Moderator', description: 'Keeps the community safe.', color: '#2f6fb5' },
  { key: 'support_staff', name: 'Support Staff', description: 'Helps members with account issues.', color: '#3f8f5c' },
  { key: 'carpenters_club', name: 'Carpenters Club', description: 'Recognised for outstanding builds.', color: '#a9822f' },
];

// Badges held by the current viewer, used by the My Page preview.
const viewerBadges = ['super_administrator', 'administrator', 'moderator', 'carpenters_club'];

const platformStats = {
  members: 12480,
  online: 342,
  games: 1893,
  itemsListed: 5120,
};

// Avatar colours offered by the character editor. Every colour the viewer is
// currently wearing is present here, so the editor can mark the real selection
// instead of showing an empty state.
const avatarPalette = [
  { name: 'Bright yellow', hex: '#f2c14e' },
  { name: 'Bright orange', hex: '#e07a2f' },
  { name: 'Bright red', hex: '#b5443a' },
  { name: 'Bright violet', hex: '#8a6fb5' },
  { name: 'Bright blue', hex: '#2f6fb5' },
  { name: 'Dark blue', hex: '#234d7f' },
  { name: 'Dark green', hex: '#3f8f5c' },
  { name: 'Cool grey', hex: '#4a4f57' },
  { name: 'White', hex: '#e9e9e9' },
  { name: 'Black', hex: '#2b2118' },
];

// Only faces the site can actually draw. More arrive with the client rather
// than being listed here as options that render nothing.
// The eight canonical face IDs, matching FACE_TEXTURES in the renderer. `file`
// is the PNG the Character page previews; the stored value is always `key`.
const avatarFaces = [
  { key: 'classic-smile', label: 'Smile', file: 'face.png' },
  { key: 'chuckle', label: 'Chuckle', file: 'chuckle.png' },
  { key: 'silly', label: 'Silly', file: 'silly.png' },
  { key: 'durr', label: 'Durr', file: 'durr.png' },
  { key: 'oo', label: 'Oo', file: 'oo.png' },
  { key: 'glee', label: 'Glee', file: 'glee.png' },
  { key: 'notamused', label: 'Not amused', file: 'notamused.png' },
  { key: 'meh', label: 'Meh', file: 'meh.png' },
];

// Phase 1 inbox display data between existing fixture members. Real messages
// are written by the messaging service in phase 4.
const messages = [
  {
    id: 1,
    from: 'CarpenterJo',
    to: 'BrikFounder',
    subject: 'Re: Castle Builders',
    date: '2026-11-02 09:14',
    read: false,
    body: [
      'The new drawbridge hinges work. I rebuilt the keep so the gate lines up with the path, and the whole thing loads in one pass now.',
      'Have a walk around it when you get a chance and tell me if the courtyard feels too empty.',
    ],
  },
  {
    id: 2,
    from: 'NullPointer',
    to: 'BrikFounder',
    subject: 'Support queue is clear',
    date: '2026-11-01 17:40',
    read: true,
    body: [
      'Everything from last week is answered. Three of them were the same thing: people trying to sign in with their display name instead of their username.',
      'If we change the login label to say username explicitly, that should stop.',
    ],
  },
  {
    id: 3,
    from: 'PixelPainter',
    to: 'BrikFounder',
    subject: 'New shirt set',
    date: '2026-10-30 12:02',
    read: true,
    body: [
      'Six new shirts are ready to list. They are all the same cut with different panels, so they should price low - I would rather sell a lot of cheap shirts than a few expensive ones.',
    ],
  },
];

module.exports = {
  users,
  viewer,
  games,
  news,
  catalogItems,
  forumSections,
  badges,
  viewerBadges,
  platformStats,
  avatarPalette,
  avatarFaces,
  messages,
};
