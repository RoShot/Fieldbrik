# Roadmap

The client is built as a series of eras, not as one jump to a finished look. Each
era is a working client before the next one starts, because the later eras depend
on things the earlier ones prove: you cannot do 2009's animations and game
buttons on a client that has never moved a box across a screen.

The order below is the intended one. It is not a promise about dates.

## 0.1 — Milestone 1: application foundation

Win32 window, Direct3D 11 device, resize, clean close, a frame loop and an fps
readout in the title bar. The screen is cleared to the sky colour and nothing
else.

## 0.2 — Milestone 2: the world — done

A baseplate, a handful of rectangular bricks, a sky colour, a spawn point, and a
`Part` type carrying position, rotation, size, colour and whether it collides.
The world is built from individual parts, because that is what the building
system and Studio will eventually edit.

Shipped with an orbit camera (drag, arrow keys, Q/E zoom) and a depth buffer, so
position, size, rotation and colour can all be checked from any angle.

One thing this milestone taught, worth writing down: a flip-model swap chain
rotates its buffers on `Present`, so a render target view cached at startup
draws into a texture that is never shown. The symptom is an empty frame with the
clear colour still visible — geometry drawn, nothing on screen.

## 0.3 — Milestone 3: the avatar — done

Head, torso, two arms, two legs, rigid, in flat colours with no animation. WASD
movement, sliding rather than walking, and a third-person camera that follows and
orbits.

Shipped as the 2005 default avatar: yellow head and arms, blue torso, green legs,
five studs tall, with a two-dot-and-a-smile face made of small boxes. Movement is
camera-relative and the body turns towards its direction of travel. Dragging the
mouse looks around, and dragging right turns the view right.

## 0.4 — Milestone 4: physics — done

Gravity, jumping, ground and wall collision, friction, and the promise that the
player cannot fall through the baseplate or get permanently stuck.

Shipped with the player collided as a 1.8-by-5 box against every collidable part,
resolved in each part's own space so rotated bricks work, and moved in slices of a
fifth of a stud so a fast fall cannot pass through a thin brick. A jump peaks at
about 4.6 studs, which clears the one-stud bricks and the steps but not the yellow
pillar. Falling below the world puts the player back at spawn.

Still missing from the era: stepping up small ledges, sliding on slopes, and any
collision on the camera, which can still be zoomed inside a brick.

## 0.5 — Milestone 5: place files — done

All of the above in one exe, with the world read from a place file instead of
being compiled in: a pre-2013 XML `.rbxl` (and `.rbxlx`, `.xml`), one `Item` per
brick carrying its name, size, CFrame, colour, whether it collides and its texture
gid, plus spawn locations. `.fbrx` is recognised and refused with a clear message
until Studio can write it.

Also closed off with this milestone: ledges of up to 1.15 studs are stepped up,
the camera collides so it cannot be pushed inside a brick, and input is read only
while the client is the foreground window.

## 0.6 — Milestone 6: the 2006 pass — done

The client the era actually had: an avatar that moves like a body rather than a
box sliding around, a camera you can zoom, and the engine's own movement numbers.

Done:

- The old `Animate` script, ported: joints chase a desired angle at a capped rate
  (Standing 0.1 rad at 1 rad/s, Running 1 rad at 9 rad/s, jump arms to pi), which
  is what makes the arms lag behind the legs.
- Roblox's gravity (196.2), walk speed (16) and jump (50, peaking about 6 studs),
  with acceleration and friction tuned so the walk carries momentum.
- Sliding along walls instead of sticking to them, and a step up that is eased
  instead of snapping a whole stud.
- Mouse wheel zoom, alongside Q and E.

## 0.7 — Milestone 7: studs, sky and a proper head — done

The look of the era, on top of its movement.

Done:

- Studs on every brick's top face, a stud apart, and on the avatar's body parts.
  They are generated geometry in two batches: the world's built once at load
  (158,880 triangles with the default place) and the avatar's rebuilt per frame.
- The sky, as a gradient worked out per pixel from the view direction, so it
  turns with the camera rather than sitting on the screen.
- The head drawn as the era's rounded block instead of as a cube.
- Strafing fixed. The right vector was mirrored, which only showed once the
  camera was turned sideways: W stayed correct while A and D swapped over. Now
  verified at two camera yaws against the direction the view expects.
- The legs swing 43 degrees each way while running, down from the full radian the
  sine asks for, which was reading as a stride rather than a walk.

## 0.8 — Milestone 8: the head and its face — done

The avatar's head is the era's own model, and its face is the era's own image,
rather than geometry generated in code.

- `head.obj` and `face.png` are the files the website's avatar renderer already
  uses, and they stay in `public/avatar/assets` so the repository holds one copy
  of each. CMake compiles them into the exe as Windows resources and the client
  reads them back by id at startup, so the build is still one file to download.
- A small OBJ reader of the client's own: positions, texture coordinates, normals,
  triangles and quads, split per face corner because the shader wants one index
  per vertex.
- PNG decoding through the Windows Imaging Component, which ships with the
  operating system: no image library and no third-party code. The face is alpha
  tested rather than blended, so the head stays solid behind the artwork.
- The five face boxes are gone from the avatar; the head wears no studs, because
  the era's head never did.
- If either asset cannot be read, the client says so and draws the generated
  rounded block instead of a faceless head.
- A jump with a hang in it. The arms go to 180 degrees as the script asks, stay
  there for the whole flight, and are still up for half a second after the feet
  touch down; the idle then lowers them at the script's own 0.15 a tick, which is
  two seconds of slow descent rather than a drop. Nothing is blended, so a
  landing looks like the era's: abrupt, briefly frozen, then lazy.

Still to come: the HUD; tools.

## 0.9 — Milestone 9: brick textures, surfaces and the sky — done

The era's own images, drawn where the era drew them.

- A brick's `TextureID` now puts an image on its **top face**, stretched once
  across the square, the way a decal sat on one face. The sides keep their flat
  colour and the avatar stays flat, because that is what the old client did.
- The image is matched by the **last segment of the `TextureID`**, lowercased, so
  `rbxasset://textures/Brick.png` is `content/textures/bricks/Brick.png` and a
  place written for the old client needs no edits.
- Textures are compiled into the exe like the head and the face, from a table CMake
  generates out of the folder, so adding a file is the whole job and the download
  is still one file.
- A place that asks for an image the exe does not carry is **refused at startup**,
  with the missing names listed. A brick in the wrong colour is a bug that hides.
- The sky is the era's own six-faced skybox instead of a gradient: one picture per
  face of a cube round the camera, sampled by direction, with no fallback — no
  complete set of faces means no sky pass and the clear colour shows. The joins
  are left as the artist drew them rather than stitched.
- The sky's ray is built from the camera's own axes. Inverting the view-projection
  looked right and was not: at these near and far planes the inverse is nearly
  singular, so every pixel came out looking along almost the same direction, and
  the 0.8 "gradient" was in fact one flat colour. The sky now agrees with the
  bricks it is drawn behind.
- The version in the title bar is generated from the one in `CMakeLists.txt`, so it
  can no longer disagree with the release it was built for.

- Brick faces wear the era's surface strip instead of modelled studs: studs on
  top, inlets underneath, weld on the sides, one tile per stud so a face grows the
  way the old client's did. The strip is tinted by the brick's own colour, and a
  `TextureID` still wins, covering the studs under a decal.
- The avatar keeps a single flat stud on each arm's top, and nothing else.
- The sun and the moon, drawn additively in the brightest part of the sky and
  directly opposite it, with the lens flare trailing the sun across the screen.
- The stud geometry is gone: the meshes, the dynamic buffer and the two serverside
  batches that built them were deleted rather than left behind.

## 0.11 — Milestone 11: the HUD where it was — done

- The era's interface is laid out the way 2008 laid it out: Fullscreen, Help...
  and Exit across the top left; the player list in the top right with the camera
  buttons under it and Report under those; W A S D in the lower right corner,
  showing their pressed art while held; the chat button raised off the lower left.
- The key, camera, chat and report art is the era's own, compiled in like every
  other texture. The top three buttons and every label are drawn with GDI in
  Arial at startup, because the drop had no art for them.
- Fullscreen fills the monitor and comes back; Help opens a screen describing
  movement, jumping, looking, zooming and reporting; Exit closes the client. The
  Esc key closes Help before it leaves the game.
- A new screen-space pass draws the interface: four vertices generated from the
  vertex id, source alpha over the world, no depth. It costs one draw call per
  piece and leaves the brick pipeline untouched.
- The face moved 0.4 mm of a stud closer to the head, so it sits on the model
  rather than in front of it.

Still open: the chat and Report buttons have no destination yet, and the tilt
button wears the hover art because no unpressed tilt image exists.

## 0.10 — Milestone 10: the cursors and a pose that should not happen — done

- The era's cursors are the mouse cursor: the arrow, the hand while the camera is
  dragged, and the resize arrow over the frame. They are decoded from the exe's
  own resources by `Source/Window/Cursors.cpp`; anything that cannot be read falls
  back to the system cursor of the same shape.
- Being placed in the world is no longer a landing. `Spawn` settles onto the
  ground and starts grounded, so the first frame cannot read as a fall that has
  just ended, swing the arms up and bring them down over the next two seconds.
- The window reports when it comes back to the foreground, and the frame clock
  restarts there rather than counting the time spent in the background; a landing
  pose held from before is dropped at the same moment.
- `SurfacesStrip.png` is settled rather than read: it is the same four tiles at
  half the block size, so one tile per stud samples the same pixels and the long
  strip serves every face.

## The eras

After the first playable build, the look is moved forward era by era:

1. DynaBlocks (2004–2005) — flat colours, no lighting, everything a box.
2. 2006 — the first Roblox-shaped client: brick colours, studs, simple GUI.
3. 2007 — the toolbars and the first building tools.
4. 2008 — the era of the reference pages the website already copies.
5. 2009 — animations, game buttons, the full HUD.
6. 2010 — the client as it looked after the big UI pass.
7. 2011 — the last era for this client. After that, the eras stop.

Studio and Player are one client in the early eras, the way `RobloxApp` shipped
them. The web launch (a `join.aspx`-shaped handoff from the site to the client)
comes after the client can survive being told which place to load, which is why
the exe already takes its world from data rather than having one compiled in.

## Deliberately not in 0.1

Multiplayer, Lua, asset downloading, Studio, Android, consoles. The architecture
leaves room for them; none of them is being built now.
