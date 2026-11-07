/**
 * Draws the site banner under the strip.
 *
 * The banner text is set by staff in the panel, so it is inserted as text, never
 * as markup. The strip is fetched after the page so no page has to wait on a
 * second query, and it stays hidden when there is nothing to show.
 */
(function () {
  var host = document.getElementById('fb-site-banner');
  if (!host) return;

  function paint(banner) {
    host.textContent = '';
    host.style.background = banner.bg || '#efefef';
    host.style.color = banner.fg || '#1e1e1e';

    if (banner.link) {
      var link = document.createElement('a');
      link.href = banner.link;
      link.style.color = banner.fg || '#1e1e1e';
      link.style.textDecoration = 'underline';
      link.textContent = banner.text;
      host.appendChild(link);
    } else {
      host.appendChild(document.createTextNode(banner.text));
    }

    host.hidden = false;
  }

  fetch('/banners/current', { credentials: 'same-origin' })
    .then(function (response) {
      return response.ok ? response.json() : null;
    })
    .then(function (payload) {
      if (payload && payload.banner && payload.banner.text) paint(payload.banner);
    })
    .catch(function () {
      // No banner is a normal state; a failed fetch is the same as none.
    });
})();
