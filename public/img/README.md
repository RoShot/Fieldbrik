# Image assets

`public/` is the directory the Worker publishes (the ASSETS binding), so
everything here is served from the site root: `public/img/banner2.png` is
`/img/banner2.png`. Nothing outside `public/` is reachable from a browser.

## Rules

- **png or jpg only.** Not `.jfif`: the asset server answers an unknown
  extension with a generic binary type and browsers will not reliably render it.
  Re-saving a `.jfif` as `.png` is the whole fix.
- Lowercase, hyphens or underscores, no spaces.
- Badge art is drawn at 34x34 CSS pixels, so supply 68x68 or 96x96 for a crisp
  screen. Square is best.
- The banner replaces the maroon band, so it should be wide: around 1200x200.
- A file listed here that has not been uploaded yet is simply not referenced;
  the coloured placeholder stays until the art lands.

## Top banner

| File | Served at | Used on |
|---|---|---|
| `banner2.png` | `/img/banner2.png` | every public page; never the admin panel |

## Currency

| File | Served at | Replaces |
|---|---|---|
| `currency/bucks.png` | `/img/currency/bucks.png` | the green Bucks pip |
| `currency/tickets.png` | `/img/currency/tickets.png` | the orange Tickets pip |

## Badges

Key is the `badges.key` value in the database; the file name matches the key.

| File | Key | Awarded for |
|---|---|---|
| `badges/brikker.png` | `brikker` | 150 knockouts |
| `badges/combat_initiation.png` | `combat_initiation` | 10 knockouts |
| `badges/warrior.png` | `warrior` | 1,500 knockouts |
| `badges/briksmith.png` | `briksmith` | 100 visits on your place |
| `badges/homestead.png` | `homestead` | 500 visits on your place |
| `badges/friends_20.png` | `friends_20` | 20 friends |
| `badges/inviter.png` | `inviter` | invited a member who joined |
| `badges/super_admin.png` | `super_admin` | Super Administrator and above |
| `badges/administrator.png` | `administrator` | Administrator and above |
| `badges/image_moderator.png` | `image_moderator` | holds Image Moderator |
| `badges/forum_moderator.png` | `forum_moderator` | holds Forum Moderator |
| `badges/carpenters_club.png` | `carpenters_club` | Carpenters Club, kept after it ends |
| `badges/carpenters_club_senior.png` | `carpenters_club_senior` | Carpenters Club Senior, kept after it ends |
| `badges/outrageous_carpenters_club.png` | `outrageous_carpenters_club` | Outrageous Carpenters Club, kept after it ends |
| `badges/official_model_maker.png` | `official_model_maker` | awarded by staff, Senior Moderator and above |
| `badges/ambassador.png` | `ambassador` | account linked to three or more platforms |
| `badges/one_year.png` | `one_year` | account at least a year old |

Knockouts have no subsystem behind them yet (there is no client and no game
server), and account linking does not exist, so those badges can only be awarded
by hand until the systems that would earn them are built. Saying so here keeps
the list honest.
