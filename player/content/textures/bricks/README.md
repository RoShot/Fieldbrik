# Brick textures

One image per texture, named after the last segment of the `TextureID` that uses
it: `rbxasset://textures/Brick.png` is `bricks/Brick.png` here.

PNG or JPG, any size, powers of two preferred. Keep the era's own names if you
have the era's own files.

The two surface strips are not both read. `Surfaces.png` is 64x512: four
128-pixel blocks of 4x4 tiles, studs, inlets, weld and glue. `SurfacesStrip.png`
is the same four at 64x64, 2x2 tiles. A face samples one 32-pixel tile per stud
either way, so `Surfaces.png` serves every size and the short strip is unused on
purpose.
