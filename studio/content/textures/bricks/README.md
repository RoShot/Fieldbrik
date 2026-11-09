# Brick textures

Drop brick PNGs here to use them in Studio without rebuilding. On startup Studio
adds every `.png` in this folder to the texture table under its file name in
lower case, which is exactly how a place's `TextureID` is looked up:

```
content/textures/bricks/Marble.png   ->   TextureID "marble"
```

The player's own `content/textures/bricks` folder is compiled into the
executable, and those images win over anything here with the same name, so the
editor and the game never disagree about a brick.

The names the era's places use are `brick`, `grass`, `sand`, `wood`, `rock`,
`marble`, `concrete`, `slate`, `ice`, `metal`, `plastic` and the numbered
`studs` colours. The exact art is still the one thing these builds do not ship.
