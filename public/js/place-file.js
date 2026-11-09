/**
 * Publishes a place file from the edit page.
 *
 * The input is read as text in the browser and sent as JSON, so the same route
 * works in Express and in the Worker without a multipart parser in either. The
 * server validates the extension, size and XML shape; this only gives an early
 * answer for a file the browser can see is too large.
 */
(function () {
  var form = document.getElementById('fb-place-file');
  if (!form) return;

  var input = document.getElementById('fb-place-file-input');
  var note = document.getElementById('fb-place-file-note');
  var status = document.getElementById('fb-place-file-status');
  var button = form.querySelector('button[type="submit"]');
  var action = form.getAttribute('action');
  var redirect = form.getAttribute('data-redirect');
  var maxBytes = Number(form.getAttribute('data-max-bytes')) || 1536 * 1024;

  function limitLabel() {
    if (maxBytes >= 1024 * 1024) return (maxBytes / (1024 * 1024)).toFixed(1) + ' MB';
    return Math.round(maxBytes / 1024) + ' KB';
  }

  function say(message, bad) {
    if (!status) return;
    status.textContent = message;
    status.className = bad ? 'fb-filebox__status is-bad' : 'fb-filebox__status';
  }

  function sizeLabel(bytes) {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  if (input) {
    input.addEventListener('change', function () {
      var file = input.files && input.files[0];
      if (!file) {
        say('', false);
        return;
      }

      if (file.size > maxBytes) {
        say('That file is ' + sizeLabel(file.size) + '. The limit is ' + limitLabel() + '.', true);
        return;
      }

      say(file.name + ' - ' + sizeLabel(file.size) + '. Ready to publish.', false);
    });
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    var file = input && input.files ? input.files[0] : null;
    if (!file) {
      say('Choose a .fbrx or XML .rbxl file first.', true);
      return;
    }

    if (file.size > maxBytes) {
      say('That file is ' + sizeLabel(file.size) + '. The limit is ' + limitLabel() + '.', true);
      return;
    }

    if (button) button.disabled = true;
    say('Uploading ' + file.name + '...', false);

    file
      .text()
      .then(function (content) {
        return fetch(action, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            content: content,
            note: note ? note.value : '',
          }),
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
              : 'The file was not published.';
          say(message, true);
          if (button) button.disabled = false;
          return;
        }

        say('Published version ' + result.payload.file.version + '.', false);
        if (redirect) window.location.assign(redirect);
      })
      .catch(function () {
        say('The upload did not reach the server. Try again.', true);
        if (button) button.disabled = false;
      });
  });
})();
