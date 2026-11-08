# Interface

The era's interface art. The cursors are read now: `ArrowCursor.png`,
`DragCursor.png` and `ResizeCursor.png` are the mouse cursor, compiled into the exe
by CMake and decoded by `Source/Window/Cursors.cpp`.

The movement keys, the chat button, the camera buttons and the report button are
the HUD: they are read by `Source/Hud/Hud.cpp`. `CameraTiltUp.png` is not in the
drop, so the tilt button wears `CameraTiltUp_ovr.png`; its pressed art is unused
until there is a reason for it.

`GunCursor.png`, `GunWaitCursor.png` and `SpawnCursor.png` are kept for the tool
system: a gun cursor belongs to a tool being held, and nothing holds one yet. The
remaining buttons and cards are for later interface work.
