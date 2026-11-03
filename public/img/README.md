# Image assets

`public/` is the directory the Worker publishes (the ASSETS binding), so
everything here is served from the site root: `public/img/banner2.png` is
`/img/banner2.png`. Nothing outside `public/` is reachable from a browser.

Files are **flat** in this folder. There are no `badges/` or `currency/`
subfolders; the names below are exactly what is on disk.

## Rules

- **png or jpg only.** Not `.jfif`. The asset server answers an unknown
  extension with a generic binary type and browsers will not reliably render it.
- Badge art is drawn at 34x34 CSS pixels. Square art looks best; anything else is
  fitted inside the square rather than stretched.
- The banner sits in a 68px-tall band and is drawn with `background-size: cover`,
  so it is cropped at the sides rather than squashed. Around 1200x100 is ideal.
- A badge with no drawing keeps its coloured square. Nothing here is referenced
  speculatively, so a missing file is never a broken image.

## Top banner

| File | Served at | Used on |
|---|---|---|
| `banner2.png` | `/img/banner2.png` | every page with the site header; never the admin panel |

## Currency

| File | Served at | Replaces |
|---|---|---|
| `bucks.png` | `/img/bucks.png` | the green Bucks pip |
| `tickets.png` | `/img/tickets.png` | the orange Tickets pip |

## Badges

The left column is the file, the right column is the `badges.key` the database
stores. The two are wired together in `server/services/badges.js`, which is the
single place to change if a file is renamed.

| File | Key | Awarded for |
|---|---|---|
| `brikker.png` | `brikker` | 150 knockouts |
| `briksmith.png` | `briksmith` | 100 visits on your place |
| `20friends.png` | `friends_20` | 20 friends |
| `inviter.png` | `referral` | invited a member who joined |
| `superadmin.png` | `super_administrator` | Super Administrator |
| `administrator.png` | `administrator` | Administrator and above |
| `imagemod.png` | `image_moderator` | holds Image Moderator |
| `formmod.png` | `forum_moderator` | holds Forum Moderator |
| `ccb.png` | `carpenters_club` | Carpenters Club, kept after it ends |
| `ccs.png` | `carpenters_club_senior` | Carpenters Club Senior, kept after it ends |
| `occ.png` | `outrageous_carpenters_club` | Outrageous Carpenters Club, kept after it ends |
| `officialmodelmaker.png` | `official_model_maker` | awarded by staff, Senior Moderator and above |
| `ambassador.png` | `ambassador` | account linked to three or more platforms |
| `1year.png` | `one_year` | account at least a year old |

Still without a drawing, and drawn as their coloured square until one arrives:
`combat_initiation.png`, `warrior.png`, `homestead.png`.

## Two known snags

- `ambassador.png`, `briksmith.png`, `ccs.png` and `superadmin.png` are WebP image
data saved under a `.png` name. Browsers read the bytes rather than the label, so
they draw, but the file name is a lie. Re-save them as real PNG if one ever shows
as a blank box.
- `1year.png` is 600x600 and about 400 KB to fill a 34px square. Downscaling it to
  96x96 would cut most of that.
