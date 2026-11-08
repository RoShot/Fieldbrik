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

Still to come: textures from `TextureID`; the HUD; tools.

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
