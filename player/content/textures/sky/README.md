# Sky

Six square pictures, one per face of a cube round the camera: the era's own
`null_plainsky512` set. They must agree on size and be square; half a set is not
a sky, and with no complete set here the client draws no sky at all, on purpose.

| file | face |
| --- | --- |
| `null_plainsky512_ft.jpg` | +X, right |
| `null_plainsky512_bk.jpg` | -X, left |
| `null_plainsky512_up.jpg` | +Y, up |
| `null_plainsky512_dn.jpg` | -Y, down |
| `null_plainsky512_rt.jpg` | +Z, front |
| `null_plainsky512_lf.jpg` | -Z, back |

The file names are the set's own, not the cube's axes. The pictures form a
continuous ring `rt -> ft -> lf -> bk`, and Direct3D joins +Z to +X along its
right edge, so the mount is rotated by one face. Mounting them in name order
instead puts non-adjacent pictures together and draws a hard seam at every join.

A place's own sky is a later pass. The sun, moon and flare are separate optional
images in the same folder.
