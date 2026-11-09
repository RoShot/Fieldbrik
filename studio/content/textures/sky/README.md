# Sky textures

Reserved for a Studio-specific sky. Right now the viewport uses the player's
compiled-in sky, the era's `null_plainsky512` set, mounted in Direct3D's order:

`null_plainsky512_ft` (+X), `_bk` (-X), `_up` (+Y), `_dn` (-Y), `_rt` (+Z),
`_lf` (-Z).

The names are the set's own, not the axes. The pictures form a continuous ring
`rt -> ft -> lf -> bk`, so the mount is rotated to keep neighbours together.

Nothing reads this folder yet; a full six-face set here is what a Studio-specific
sky will use once the editor loads its own textures rather than sharing the
player's.
