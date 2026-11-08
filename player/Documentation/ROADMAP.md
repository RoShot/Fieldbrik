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

## 0.4 — Milestone 4: physics

Gravity, jumping, ground and wall collision, friction, and the promise that the
player cannot fall through the baseplate or get permanently stuck.

## 0.5 — Milestone 5: first playable build

All of the above in one exe: walk around a world with bricks, from a downloadable
release.

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
