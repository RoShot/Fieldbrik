/**
 * Site-wide configuration.
 *
 * Anything that appears in more than one place in the UI belongs here, so a
 * change lands everywhere at once. Never duplicate these strings in views.
 */

const site = {
  name: 'FieldBrik',
  version: '0.3',
  tagline: ['Think.', 'Create.'],
  domain: 'fieldbrik.com',
  supportEmailPlaceholder: 'support@fieldbrik.com', // PRE-LAUNCH PLACEHOLDER - not a live inbox.
  forumUrl: null, // External forum link goes here when one exists. Null = in-site notice.

  currency: {
    premium: 'Bucks',
    earned: 'Tickets',
  },

  // Primary navigation, rendered by partials/header.ejs from this list only.
  nav: [
    { key: 'my-page', label: 'My FieldBrik', href: '/my-page' },
    { key: 'games', label: 'Games', href: '/games' },
    { key: 'catalog', label: 'Catalog', href: '/catalog' },
    { key: 'people', label: 'People', href: '/people' },
    { key: 'carpenters-club', label: 'Carpenters Club', href: '/carpenters-club' },
    { key: 'forum', label: 'Forum', href: '/forum' },
    { key: 'news', label: 'News', href: '/news' },
    { key: 'parents', label: 'Parents', href: '/parents' },
    { key: 'help', label: 'Help', href: '/help' },
  ],

  // Signed-in shortcuts, used by the profile sidebar and quick-link lists.
  userNav: [
    { key: 'my-page', label: 'My Page', href: '/my-page' },
    { key: 'friends', label: 'Friends', href: '/friends' },
    { key: 'messages', label: 'Messages', href: '/messages' },
    { key: 'inventory', label: 'Inventory', href: '/inventory' },
    { key: 'character', label: 'Character', href: '/character' },
  ],

  footer: {
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Contact Us', href: '/support' },
      { label: 'About Us', href: '/about' },
      { label: 'Help', href: '/help' },
    ],
    lines: [
      'FieldBrik, "Online Building Toy", characters, logos, names and related media are trademarks of FieldBrik. Copyright 2006-2026. Patents pending.',
      'FieldBrik Corp. is not affiliated with Lego, MegaBloks, Bionicle, Pokemon, Nintendo, Lincoln Logs, Yu-Gi-Oh, K\'nex, Tinkertoys, Erector Set, or the Pirates of the Caribbean.',
      'Use of this site signifies your acceptance of the Terms and Conditions.',
    ],
  },

  // Carpenters Club tiers, billing terms and prices.
  // Prices were supplied by the operator on 2026-11-02 and are the only source
  // of these figures. Payment itself is not live: no checkout exists yet.
  carpentersClub: {
    currency: 'AUD',
    currencySymbol: '$',
    currencyNote: 'All prices are in Australian dollars (AUD).',
    tiers: [
      {
        key: 'carpenters_club',
        name: 'Carpenters Club',
        shortName: 'CC',
        description: 'The standard membership tier.',
        prices: { monthly: 7.99, quarterly: 43.99, yearly: 129.99, permanent: 369.99 },
      },
      {
        key: 'carpenters_club_senior',
        name: 'Carpenters Club Senior',
        shortName: 'CCS',
        description: 'The senior membership tier.',
        prices: { monthly: 14.99, quarterly: 73.99, yearly: 189.99, permanent: 384.99 },
      },
      {
        key: 'outrageous_carpenters_club',
        name: 'Outrageous Carpenters Club',
        shortName: 'OCC',
        description: 'The top membership tier.',
        prices: { monthly: 23.99, quarterly: 99.99, yearly: 299.99, permanent: 399.99 },
      },
    ],
    terms: [
      { key: 'monthly', name: 'Monthly', note: 'Billed every month' },
      { key: 'quarterly', name: 'Quarterly', note: '6 months' },
      { key: 'yearly', name: 'Yearly', note: 'Billed once a year' },
      { key: 'permanent', name: 'Permanent', note: 'One payment, never renews' },
    ],
  },

  copyright: 'FieldBrik. All rights reserved.',
  disclaimer:
    'FieldBrik is an independent building and gaming community. It is not affiliated with, endorsed by, or connected to any other platform.',
};

module.exports = site;
