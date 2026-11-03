# public/avatar/assets/

Assets for the avatar renderer, served at `/avatar/assets/`. They live under
`public/` because a Worker publishes exactly one assets directory, so both
Express and the Worker serve these files at the same URLs.

All nine files were supplied by the operator from
`github.com/RoShot/heads-faces`. If the folder is empty, the renderer falls back
to the flat CSS figure: pages still work, avatars are just 2D until the files
are added.

```
head.obj        178 KB   972 vertices, 324 triangles, UVs and normals
face.png       2.3 KB   128x128 RGBA  classic-smile
chuckle.png    0.7 KB   128x128 RGBA
silly.png      3.2 KB   128x128 RGBA
durr.png       3.6 KB   128x128 RGBA
oo.png         3.4 KB   128x128 RGBA
glee.png       3.3 KB   128x128 RGBA
notamused.png  4.0 KB   128x128 RGBA
meh.png        3.6 KB   128x128 RGBA
```

Optional shirt sheets would follow the classic 585 x 559 layout sampled by
`SHIRT_UV` in `../avatar.js`. None supplied yet.

## What was measured

**Transparency is correct.** Every face is RGBA with alpha 0 at the corners and
between 94% and 97% of the image fully transparent. The material's
`alphaTest: 0.01` will discard the background properly, so there is no white
card and no need for multiply blending.

**All eight are 128 x 128**, so nothing is stretched. Feature positions line up
across the set: every face's art is centred on roughly x = 64, and the set
shares the same eye and mouth placement. `notamused` is the tallest (features
span y 14 to 102) and `meh` the shortest (y 34 to 92).

**The head is symmetric about x = 0**, bounding box -0.5906 to +0.5906 in x and
z, -0.5524 to +0.5524 in y, centred exactly on the origin. That is why
`FACE_OFFSET_X` is 0: the original 0.06 would have shifted the face 4.4% of the
head's width to the right.

**The front is domed, not flat.** The deepest point is a single vertex at
x = 0, y = -0.287, not a flat face. The plane sits at maximum depth, so it can
never sink into the head; at eye level it floats a little in front because the
surface curves back. That is invisible head-on and only shows at steep angles.

**Scale.** The renderer normalises height to `1.8 x 0.71 = 1.278`, which from
the native 1.1047 height means a scale of 1.1569, giving a head 1.366 wide,
1.278 tall and 1.366 deep.

A square face plane at `FACE_SCALE = 0.82` is 1.048 units. Because the art
occupies 61% of its own canvas, the visible features then span exactly 50% of
the head's height and 29% of its width. That value was raised from 0.68 after
the first render read as too small. `1.0` is the ceiling - that maps the canvas
across the head's whole front face - but the art already carries its own
margins, so the features would still only fill 61% at that setting.

## Rules if the art is replaced

- **Transparent background.** The material discards fully transparent pixels;
  opaque white will render as a white card on the head.
- **All eight identical dimensions and feature positions**, or faces shift when
  switched.
- Keep art inside roughly the middle 70% of the canvas; the plane covers 68% of
  the head, so art that fills the square gets cropped by the head's edges.
- If `head.obj` is replaced, re-check `FACE_OFFSET_X`, `FACE_SCALE` and the
  plane depth. A centred model wants an offset of 0; an off-centre one does not.
- `ALLOW_BOX_HEAD_FALLBACK` is `true`, so the renderer still runs without
  `head.obj`, but the real model is now present and that fallback is unused.
