/**
 * Saves a place thumbnail from the edit page.
 *
 * The picture is cropped and shrunk here, in a canvas, before it is sent: the
 * tiles want 320x200, and a 4 MB phone photo would be neither a thumbnail nor
 * kind to the member's data. The server still checks the bytes - a canvas can
 * only produce a JPEG or a PNG, but the route is public and a script can post
 * whatever it likes.
 *
 * The upload is JSON, one base64 string, for the same reason the place file
 * upload is: the same route works in Express and in the Worker without a
 * multipart parser in either.
 */
(function () {
  var form = document.getElementById('fb-place-thumbnail');
  if (!form) return;

  var input = document.getElementById('fb-place-thumbnail-input');
  var status = document.getElementById('fb-place-thumbnail-status');
  var preview = document.getElementById('fb-place-thumb-preview');
  var button = form.querySelector('button[type="submit"]');
  var action = form.getAttribute('action');
  var redirect = form.getAttribute('data-redirect');
  var maxBytes = Number(form.getAttribute('data-max-bytes')) || 262144;

  var WIDTH = 320;
  var HEIGHT = 200;

  function say(message, bad) {
    if (!status) return;
    status.textContent = message;
    status.className = bad ? 'fb-filebox__status is-bad' : 'fb-filebox__status';
  }

  /** The middle of the picture, scaled to fill 320x200. */
  function cropToThumbnail(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var image = new Image();

      image.onload = function () {
        var canvas = document.createElement('canvas');
        canvas.width = WIDTH;
        canvas.height = HEIGHT;

        var context = canvas.getContext('2d');
        var scale = Math.max(WIDTH / image.naturalWidth, HEIGHT / image.naturalHeight);
        var width = image.naturalWidth * scale;
        var height = image.naturalHeight * scale;

        context.drawImage(image, (WIDTH - width) / 2, (HEIGHT - height) / 2, width, height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };

      image.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error('not an image'));
      };

      image.src = url;
    });
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    var file = input && input.files ? input.files[0] : null;
    if (!file) {
      say('Choose a PNG or JPEG first.', true);
      return;
    }

    if (button) button.disabled = true;
    say('Preparing the picture...', false);

    cropToThumbnail(file)
      .then(function (dataUrl) {
        say('Uploading the thumbnail...', false);
        return fetch(action, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: dataUrl }),
        });
      })
      .then(function (response) {
        return response.json().then(function (payload) {
          return { ok: response.ok, payload: payload };
        });
      })
      .then(function (result) {
        if (!result.ok || !result.payload || !result.payload.ok) {
          var message =
            result.payload && result.payload.error
              ? result.payload.error
              : 'The thumbnail was not saved.';
          say(message, true);
          if (button) button.disabled = false;
          return;
        }

        say('Thumbnail saved.', false);
        if (redirect) window.location.assign(redirect);
      })
      .catch(function () {
        say('The upload did not reach the server. Try again.', true);
        if (button) button.disabled = false;
      });
  });
})();
