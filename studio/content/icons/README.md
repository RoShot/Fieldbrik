# Studio icons

The toolbar reads these files at startup. They are ordinary 24x24 PNGs with a
transparent background, named after the button they draw:

`new.png`, `open.png`, `save.png`, `undo.png`, `redo.png`, `select.png`,
`move.png`, `scale.png`, `rotate.png`, `part.png`, `sphere.png`,
`cylinder.png`, `wedge.png`, `play.png`

Drop a replacement in with the same name and restart Studio; no rebuild is
needed. Missing files are skipped, so a half-filled folder still opens.

The icons shipped here were drawn by `Tools/make-icons.ps1`. Edit that script and
run it again to regenerate all of them:

```
powershell -ExecutionPolicy Bypass -File studio\Tools\make-icons.ps1
```
