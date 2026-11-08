# Sky

One wide image, `panorama.png`, wrapped right round the horizon: longitude across,
latitude up, so the top of the picture is straight overhead and the middle band is
the horizon.

`panorama.png` or `panorama.jpg`. 1024x512 or 2048x1024 is the shape the era used;
anything wider than it is tall will do.

With no panorama here the client draws no sky at all and the window's clear colour
shows, on purpose: the old gradient is gone rather than kept as a fallback, so a
missing sky looks missing.
