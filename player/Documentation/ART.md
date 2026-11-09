# The art

What every file in `player/content/textures` is, and what the client is meant to do
with it. This is the answer sheet from the 0.9 art questionnaire, written down so
the next milestone is not guessing.

Everything here is compiled into the exe at build time. Nothing is read from disk
at run time, because the client is one file to download.

## bricks/

`Surfaces.png` — 64 x 512, the long strip, four surface blocks of 64 x 128, top to
bottom:

| block | surface |
| --- | --- |
| 1 | studs, the ordinary top |
| 2 | inlets, the sockets |
| 3 | weld, the X |
| 4 | glue, the splat |

`SurfacesStrip.png` — 64 x 256, the same four surfaces in a shorter strip.

They are the same art at two lengths, and that is the whole point of having both:
a face picks the strip whose pattern does not stretch to cover it.

The rules:

- **One tile per stud.** A face grows the way a brick does: a 20-stud-wide face
  shows 20 studs across, not one stretched picture.
- **Each face gets the surface it would have had**: studs on top, inlets
  underneath, weld on the sides.
- **The strip is tinted by the brick's own colour**, so a red brick has red studs
  with the art's own shading over them.
- **A `TextureID` on the top wins.** A decal covers the surface; there are no studs
  drawn under it.
- **The avatar gets one flat stud centred on the top of each arm**, and nothing on
  its torso, legs or head.

The brick folder holds no per-brick images yet. When it does, the lookup stays what
0.9 shipped: the last segment of the `TextureID`, lowercased, drawn once across the
top face.

## sky/

The sky is six cube faces:

| file | face |
| --- | --- |
| `null_plainsky512_ft.jpg` | +X, right |
| `null_plainsky512_bk.jpg` | -X, left |
| `null_plainsky512_up.jpg` | +Y, up |
| `null_plainsky512_dn.jpg` | -Y, down |
| `null_plainsky512_rt.jpg` | +Z, front |
| `null_plainsky512_lf.jpg` | -Z, back |

The file names are the set's own; they are not the cube's axes. The pictures
are a continuous ring `rt -> ft -> lf -> bk`, and Direct3D joins +Z to +X along
its right edge, so the ring is mounted rotated by one face. Mounting them in
name order instead is what used to draw a hard seam at every join.

- All six or nothing: a partial set means no sky pass and the window's clear colour
  shows.
- Fixed to the world; it turns with the camera and never on its own.
- The joins between faces are left where the art puts them, not blended.
- `sun.jpg` and `moon.jpg` sit in the brightest part of the sky and directly
  opposite it, with `moon-alpha.jpg` cutting the moon out. `sun-rays.jpg` goes with
  the sun.
- `lensflare.jpg` is drawn only while the sun is on screen, fading out as it leaves.
- `skyspheremap.jpg` is a spare sphere map. Nothing reads it.

## ui/

The era's interface art. Cursors arrive first; the rest belongs to the HUD era.

- Cursors: `ArrowCursor` in the client, `DragCursor` while dragging the camera,
  `GunCursor` and `GunWaitCursor` for tools, `SpawnCursor`, `ResizeCursor`,
  `MissingCursor`.
- `W_Key`, `A_Key`, `S_Key`, `D_Key` and their `_dn` versions light up as the keys
  are pressed, in the HUD era.
- `CameraZoomIn`, `CameraZoomOut`, `CameraTiltUp`, each with `_ovr` hovered and
  `_dn` pressed, are a small camera panel in the HUD era.
- `ResetOrg_ds`, `ResetOrg_ovr`, `ReportAbuse_ds`, `ReportAbuse_ovr`, `Card_dn`,
  `Card_ovr` are in-game menu buttons. The Escape menu later covers leaving the
  game and settings such as audio volume.
- `Chat`, `Chat_ds`, `Chat_ovr` are for chat, which is not in 1.0.

## Faces

`public/avatar/assets` holds the era's faces: `face`, `silly`, `durr`, `glee`,
`oo`, `meh`, `notamused`, `chuckle`. One stays compiled in as the default; a
player's own face comes from the website when the account tie-in lands, after the
leaderboard and the buttons exist to carry it.

## Rules that apply to all of it

- **One file to ship.** Everything is a resource in the exe; the download stays a
  single `.exe`.
- **Missing art is loud.** A place that names an image the exe does not carry is
  refused at startup with the names listed, rather than drawn in the wrong colour.
- **Powers of two.** The era's sizes are 64, 128, 256; the sky is 256 per face.
