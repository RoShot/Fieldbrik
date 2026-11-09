# client/

Staged client code. Nothing in this folder is served by the website, imported
by the server, or referenced by any EJS template. It exists so the avatar
renderer has a home before the client is built, instead of sitting in a chat
message.

## Required assets

The renderer needs these at `/avatar/assets/` **on the client's origin**, not
the website's. None of them exist yet.

### Required

| File | Purpose | Notes |
| --- | --- | --- |
| `head.obj` | The head mesh | Hard dependency. Everything else is generated boxes. Any scale is fine - the renderer normalises height to `1.8 × 0.71`. If the model changes, retune `FACE_OFFSET_X` and `FACE_SCALE` in `avatar.js`. |

### Required for faces

Eight PNGs, all identical in size, with the features in the same place,
because the face plane is sized from the head and samples the image whole:

`face.png` (classic smile), `chuckle.png`, `silly.png`, `durr.png`, `oo.png`,
`glee.png`, `notamused.png`, `meh.png`.

`face.png` is the default. `classic-smile` is the stored ID for it.

### Optional

Shirt sheets in the classic 585 × 559 layout that `SHIRT_UV` samples
(torso front/back/sides/top/bottom). Without one, the torso renders as its
stored colour.

## Running the bench

Two ways in. While the site runs in development it mounts this folder at
`/avatar` (see `server/app.js`), so the bench is at:

```
http://localhost:3000/avatar/preview.html
```

That mount is development-only and excluded when `NODE_ENV=production`. It is
the quickest way to look at the renderer, and it is temporary - delete the
mount once the client serves its own assets.

Or serve the folder directly, which is what the built client will do:

```
npx serve client
```

then open `/avatar/preview.html`. A `file://` page cannot import ES modules, so
serving it is not optional.

## What the website needs to match

The site stores 2D avatars today and will store the same record for both
renderers. When the D1 schema is written:

- **Six colours, not four.** The renderer reads `leftArmColor` and
  `rightArmColor` separately, and the same for legs. The website currently
  draws one arm colour and one leg colour because its fixture model has
  `arms` and `legs`. The schema must carry `head_color`, `torso_color`,
  `left_arm_color`, `right_arm_color`, `left_leg_color`, `right_leg_color` so
  the client is not limited by the flat preview.
- **Face is an ID.** `classic-smile`, `chuckle`, `silly`, `durr`, `oo`, `glee`,
  `notamused`, `meh`. Never a path, never a texture URL.
- **Shirts are an item reference,** not a texture path. The avatar row points
  at the equipped catalog item; the host resolves that to a texture URL.
- **Colour format is `#rrggbb` text.** The renderer accepts integers too, so
  older data keeps working, but nothing new should store `0xffcc00`.
- **Defaults match `DEFAULT_AVATAR`:** `#ffcc00` head, `#f57c00` torso,
  `#111111` limbs. A new account must look like the starter character.

## Before shipping

- Bundle `three` locally. The CDN import in `avatar.js` is for the bench only.
- Catch a failed `initializeAvatar` and fall back to the site's CSS avatar
  (`.fieldbrik-avatar-fallback`) on machines without WebGL.
