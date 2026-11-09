/**
 * Avatar stage - mounts the 3D avatar renderer into every avatar box on a page.
 *
 * The server renders each avatar as a container with data-* colours plus a flat
 * CSS figure inside it. This script upgrades those containers to a real canvas.
 * If WebGL is unavailable, or the head model will not load, the container keeps
 * the CSS figure and nothing breaks.
 *
 * The renderer itself lives at /avatar/avatar.js (staged client code, served by
 * server/app.js). It imports three.js from a CDN, so the first paint of a page
 * with avatars depends on that fetch succeeding; a failure leaves the flat
 * figure in place rather than an empty box.
 */

import { initializeAvatar } from '/avatar/avatar.js';

// Browsers cap the number of live WebGL contexts per page (Chrome 16, Safari
// fewer). Every avatar on a page needs its own canvas, so this stops well
// short of the cap: anything past it keeps its CSS figure instead of the page
// losing contexts already in use.
const MAX_STAGE_AVATARS = 10;

function readAvatar(el) {
  return {
    headColor: el.dataset.head,
    torsoColor: el.dataset.torso,
    leftArmColor: el.dataset.leftArm,
    rightArmColor: el.dataset.rightArm,
    leftLegColor: el.dataset.leftLeg,
    rightLegColor: el.dataset.rightLeg,
    face: el.dataset.face
  };
}

// The canvas is transparent around the figure, so a fallback left underneath
// shows through the gaps. Hiding it with an inline style as well as the class
// means this works even when a stale stylesheet is still cached.
function hideFallback(el) {
  el.classList.add('is-3d');

  const fallback = el.querySelector('.fb-avatar__fallback');

  if (fallback) {
    fallback.style.display = 'none';
  }
}

function mount(el) {
  return initializeAvatar(el, readAvatar(el), { antialias: false })
    .then((view) => {
      hideFallback(el);
      return view;
    })
    .catch((error) => {
      // Leave the flat figure in place - it is the only thing to show.
      console.warn('FieldBrik: avatar fell back to 2D.', error.message);
      return null;
    });
}

const containers = Array.from(
  document.querySelectorAll('[data-avatar]:not([data-avatar-live])')
);

let staged = 0;

for (const el of containers) {
  if (staged >= MAX_STAGE_AVATARS) {
    break;
  }

  staged += 1;
  mount(el);
}
