# Textures

Where the client looks for the images it draws. Drop a file in the folder that
matches it and that is the whole installation: everything here is compiled into
the exe at build time, so the client stays one file to download.

Both folders are read by 0.9: `bricks/` by `TextureID`, and `sky/` for the
panorama.

## bricks/

One image per brick texture. The client finds one by the **last path segment of
`TextureID`**, case-insensitively:

| in the place file | the file it looks for |
| --- | --- |
| `rbxasset://textures/Brick.png` | `bricks/Brick.png` |
| `rbxasset://textures/rock.jpg` | `bricks/rock.jpg` |
| `http://www.roblox.com/asset/?id=1234` | `bricks/1234.png` |

- PNG or JPG. PNG if the image has transparency in it; JPG is smaller for
  photographs and greyscale noise.
- Any size, but powers of two (64, 128, 256) are what the era used and what stays
  sharp without mip levels.
- If you have the era's own files, keep their names exactly as they are, so an
  old place file needs no edits to find them.

## sky/

The era's sky was a texture, not a gradient. One wide image is what this reads:
`sky/panorama.png`, wrapped around the horizon, the top of the picture straight
overhead. Six faces are not read yet.

Until there is one, the client draws no sky and the window's clear colour shows.
That is deliberate: the gradient is gone rather than kept as a fallback.

## ui/

Reserved for the interface: icons, buttons, checkboxes, cursors. Nothing reads
this until the HUD era, after 1.1, but gathering them here now keeps all the art
in one place.

## Not here: faces

Faces are per-user data, so they arrive when the client reads an avatar from
FieldBrik itself, after the leaderboard and the buttons exist to carry them. One
default face stays compiled in until then.

## Notes

- **Size matters.** Everything here goes into the exe: a few megabytes is fine,
  tens of megabytes is not, because the point is a single file you double-click.
  Very large images can be scaled down before they go in.
- **A missing texture stops the client.** If a place asks for an image that is not
  here, the build still succeeds but the client lists the missing names and
  refuses to run, rather than drawing the brick in the wrong colour. A half-
  finished drop is fine as long as no place refers to what is missing.
