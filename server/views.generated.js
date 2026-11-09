/**
 * GENERATED FILE - do not edit.
 *
 * Built from the .ejs files in views/ by scripts/build-views.js. The Worker
 * cannot compile EJS at runtime, so the templates are compiled here instead.
 *
 * Rebuild with: npm run build:views
 */

const VIEWS = {
  "admin/badge-catalogue": function anonymous(locals, escapeFn, include, rethrow
) {
var admin = locals.admin, adminNav = locals.adminNav, adminStatus = locals.adminStatus, art = locals.art, badges = locals.badges, color = locals.color, css = locals.css, description = locals.description, entry = locals.entry, extraCss = locals.extraCss, forEach = locals.forEach, head = locals.head, holders = locals.holders, key = locals.key, name = locals.name, pageTitle = locals.pageTitle, partials = locals.partials, rank = locals.rank, sidebar = locals.sidebar, status = locals.status, username = locals.username, v = locals.v, viewer = locals.viewer;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append( include('../partials/head', { pageTitle: pageTitle, extraCss: '/css/admin.css?v=1' }) )
    ; __append("\r\n<link rel=\"stylesheet\" href=\"/css/admin-mod.css\">\r\n\r\n<div class=\"fb-admin\">\r\n  <div class=\"fb-admin__bar\">\r\n    <div class=\"fb-admin__brand\">\r\n      <a class=\"fb-admin__logo\" href=\"/admin\">FieldBrik</a>\r\n      <span class=\"fb-admin__logo-tag\">Administration</span>\r\n    </div>\r\n    <div class=\"fb-admin__who\">\r\n      <strong>")
    ; __append(escapeFn( viewer.username ))
    ; __append("</strong> &middot; ")
    ; __append(escapeFn( admin.name ))
    ; __append(" (rank ")
    ; __append(escapeFn( admin.rank ))
    ; __append(") &middot;\r\n      <a href=\"/\">Back to the site</a>\r\n    </div>\r\n    ")
    ; __append( include('status', { adminStatus: adminStatus }) )
    ; __append("\r\n  </div>\r\n\r\n  <div class=\"fb-admin__body\">\r\n    ")
    ; __append( include('sidebar', { adminNav: adminNav }) )
    ; __append("\r\n\r\n    <main class=\"fb-admin__main\">\r\n      <div class=\"fb-panel\">\r\n        <h1 class=\"fb-panel__title fb-panel__title--blue\">Badge Catalogue</h1>\r\n        <div class=\"fb-panel__body fb-panel__body--flush\">\r\n          <table class=\"fb-table fb-table--admin\">\r\n            <thead>\r\n              <tr>\r\n                <th scope=\"col\">Art</th>\r\n                <th scope=\"col\">Badge</th>\r\n                <th scope=\"col\">Key</th>\r\n                <th scope=\"col\">Awarded for</th>\r\n                <th scope=\"col\">Held by</th>\r\n              </tr>\r\n            </thead>\r\n            <tbody>\r\n              ")
    ;  badges.forEach(function (entry) { 
    ; __append("\r\n                <tr>\r\n                  <td>\r\n                    ")
    ;  if (entry.art) { 
    ; __append("\r\n                      <img class=\"fb-badge__art\" src=\"")
    ; __append(escapeFn( entry.art ))
    ; __append("\" alt=\"\" width=\"34\" height=\"34\">\r\n                    ")
    ;  } else { 
    ; __append("\r\n                      <span class=\"fb-badge__pip\" style=\"--badge: ")
    ; __append(escapeFn( entry.color ))
    ; __append(";\" aria-hidden=\"true\"></span>\r\n                    ")
    ;  } 
    ; __append("\r\n                  </td>\r\n                  <td><strong>")
    ; __append(escapeFn( entry.name ))
    ; __append("</strong></td>\r\n                  <td><code>")
    ; __append(escapeFn( entry.key ))
    ; __append("</code></td>\r\n                  <td class=\"fb-table__note\">")
    ; __append(escapeFn( entry.description ))
    ; __append("</td>\r\n                  <td>")
    ; __append(escapeFn( entry.holders ))
    ; __append("</td>\r\n                </tr>\r\n              ")
    ;  }); 
    ; __append("\r\n            </tbody>\r\n          </table>\r\n        </div>\r\n      </div>\r\n\r\n      <p class=\"fb-admin__note\">\r\n        Artwork is wired by badge key in server/services/badges.js. A badge with no drawing shows its\r\n        coloured square rather than a broken image, so a missing file reads as art still to come.\r\n        Granting happens on an account's Badges page.\r\n      </p>\r\n    </main>\r\n  </div>\r\n</div>\r\n\r\n</body>\r\n</html>\r\n")
  return __output;

},
  "admin/badges": function anonymous(locals, escapeFn, include, rethrow
) {
var account = locals.account, admin = locals.admin, adminNav = locals.adminNav, adminStatus = locals.adminStatus, art = locals.art, available = locals.available, by = locals.by, canGrant = locals.canGrant, color = locals.color, css = locals.css, description = locals.description, entry = locals.entry, extraCss = locals.extraCss, forEach = locals.forEach, head = locals.head, held = locals.held, id = locals.id, key = locals.key, length = locals.length, name = locals.name, notice = locals.notice, pageTitle = locals.pageTitle, partials = locals.partials, rank = locals.rank, roleName = locals.roleName, roleRank = locals.roleRank, sidebar = locals.sidebar, status = locals.status, username = locals.username, v = locals.v, viewer = locals.viewer, when = locals.when;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append( include('../partials/head', { pageTitle: pageTitle, extraCss: '/css/admin.css?v=1' }) )
    ; __append("\r\n<link rel=\"stylesheet\" href=\"/css/admin-mod.css\">\r\n\r\n<div class=\"fb-admin\">\r\n  <div class=\"fb-admin__bar\">\r\n    <div class=\"fb-admin__brand\">\r\n      <a class=\"fb-admin__logo\" href=\"/admin\">FieldBrik</a>\r\n      <span class=\"fb-admin__logo-tag\">Administration</span>\r\n    </div>\r\n    <div class=\"fb-admin__who\">\r\n      <strong>")
    ; __append(escapeFn( viewer.username ))
    ; __append("</strong> &middot; ")
    ; __append(escapeFn( admin.name ))
    ; __append(" (rank ")
    ; __append(escapeFn( admin.rank ))
    ; __append(") &middot;\r\n      <a href=\"/\">Back to the site</a>\r\n    </div>\r\n    ")
    ; __append( include('status', { adminStatus: adminStatus }) )
    ; __append("\r\n  </div>\r\n\r\n  <div class=\"fb-admin__body\">\r\n    ")
    ; __append( include('sidebar', { adminNav: adminNav }) )
    ; __append("\r\n\r\n    <main class=\"fb-admin__main\">\r\n      ")
    ;  if (notice) { 
    ; __append("\r\n        <div class=\"fb-notice fb-notice--admin\"><p><strong>")
    ; __append(escapeFn( notice ))
    ; __append("</strong></p></div>\r\n      ")
    ;  } 
    ; __append("\r\n\r\n      <div class=\"fb-panel\">\r\n        <h1 class=\"fb-panel__title fb-panel__title--blue\">Badges: ")
    ; __append(escapeFn( account.username ))
    ; __append("</h1>\r\n        <div class=\"fb-panel__body\">\r\n          <p class=\"fb-admin__muted\">\r\n            Account <strong>")
    ; __append(escapeFn( account.id ))
    ; __append("</strong> &middot; ")
    ; __append(escapeFn( account.roleName ))
    ; __append(" (rank ")
    ; __append(escapeFn( account.roleRank ))
    ; __append(")\r\n            &middot; ")
    ; __append(escapeFn( account.status ))
    ; __append("\r\n          </p>\r\n\r\n          ")
    ;  if (canGrant) { 
    ; __append("\r\n            <form method=\"post\" action=\"/admin/users/")
    ; __append(escapeFn( account.id ))
    ; __append("/badges\">\r\n              <h2 class=\"fb-admin__heading\">Grant a badge</h2>\r\n              <p class=\"fb-admin__muted\">\r\n                A badge is cosmetic: it appears on the member's profile and My Page and does nothing else.\r\n                Role badges are granted automatically when a role changes, so the list here is for awards\r\n                and event badges.\r\n              </p>\r\n\r\n              ")
    ;  if (available.length === 0) { 
    ; __append("\r\n                <p class=\"fb-admin__muted\">This account already holds every badge in the catalogue.</p>\r\n              ")
    ;  } else { 
    ; __append("\r\n                <div class=\"fb-mod__field\">\r\n                  <label for=\"fb-badge-key\">Badge</label>\r\n                  <select id=\"fb-badge-key\" name=\"key\">\r\n                    ")
    ;  available.forEach(function (entry) { 
    ; __append("\r\n                      <option value=\"")
    ; __append(escapeFn( entry.key ))
    ; __append("\">")
    ; __append(escapeFn( entry.name ))
    ; __append(" - ")
    ; __append(escapeFn( entry.description ))
    ; __append("</option>\r\n                    ")
    ;  }); 
    ; __append("\r\n                  </select>\r\n                </div>\r\n\r\n                <div class=\"fb-mod__field\">\r\n                  <label for=\"fb-badge-note\">Note (staff only, never shown to the member)</label>\r\n                  <input id=\"fb-badge-note\" type=\"text\" name=\"note\" maxlength=\"300\" autocomplete=\"off\">\r\n                </div>\r\n\r\n                <button class=\"fb-btn fb-btn--primary\" type=\"submit\" name=\"action\" value=\"grant\">Grant badge</button>\r\n              ")
    ;  } 
    ; __append("\r\n            </form>\r\n          ")
    ;  } else { 
    ; __append("\r\n            <p>\r\n              <strong>Your role cannot grant badges.</strong>\r\n              Senior Moderator and above can. This account's badges are still listed below.\r\n            </p>\r\n          ")
    ;  } 
    ; __append("\r\n        </div>\r\n      </div>\r\n\r\n      <div class=\"fb-panel\">\r\n        <h2 class=\"fb-panel__title\">Badges held</h2>\r\n        <div class=\"fb-panel__body fb-panel__body--flush\">\r\n          <table class=\"fb-table fb-table--admin\">\r\n            <thead>\r\n              <tr>\r\n                <th scope=\"col\">Badge</th>\r\n                <th scope=\"col\">Key</th>\r\n                <th scope=\"col\">Granted</th>\r\n                <th scope=\"col\">Granted by</th>\r\n                <th scope=\"col\"></th>\r\n              </tr>\r\n            </thead>\r\n            <tbody>\r\n              ")
    ;  if (held.length === 0) { 
    ; __append("\r\n                <tr><td colspan=\"5\" class=\"fb-table__last\">This account holds no badges.</td></tr>\r\n              ")
    ;  } 
    ; __append("\r\n              ")
    ;  held.forEach(function (entry) { 
    ; __append("\r\n                <tr>\r\n                  <td>\r\n                    ")
    ;  if (entry.art) { 
    ; __append("\r\n                      <img class=\"fb-badge__art\" src=\"")
    ; __append(escapeFn( entry.art ))
    ; __append("\" alt=\"\" width=\"34\" height=\"34\">\r\n                    ")
    ;  } else { 
    ; __append("\r\n                      <span class=\"fb-badge__pip\" style=\"--badge: ")
    ; __append(escapeFn( entry.color ))
    ; __append(";\" aria-hidden=\"true\"></span>\r\n                    ")
    ;  } 
    ; __append("\r\n                    ")
    ; __append(escapeFn( entry.name ))
    ; __append("\r\n                  </td>\r\n                  <td><code>")
    ; __append(escapeFn( entry.key ))
    ; __append("</code></td>\r\n                  <td>")
    ; __append(escapeFn( entry.when ))
    ; __append("</td>\r\n                  <td>")
    ; __append(escapeFn( entry.by ))
    ; __append("</td>\r\n                  <td>\r\n                    ")
    ;  if (canGrant) { 
    ; __append("\r\n                      <form method=\"post\" action=\"/admin/users/")
    ; __append(escapeFn( account.id ))
    ; __append("/badges\">\r\n                        <input type=\"hidden\" name=\"action\" value=\"remove\">\r\n                        <input type=\"hidden\" name=\"key\" value=\"")
    ; __append(escapeFn( entry.key ))
    ; __append("\">\r\n                        <button class=\"fb-btn\" type=\"submit\">Remove</button>\r\n                      </form>\r\n                    ")
    ;  } else { 
    ; __append("\r\n                      -\r\n                    ")
    ;  } 
    ; __append("\r\n                  </td>\r\n                </tr>\r\n              ")
    ;  }); 
    ; __append("\r\n            </tbody>\r\n          </table>\r\n        </div>\r\n      </div>\r\n\r\n      <p class=\"fb-admin__note\">\r\n        Removing a badge deletes the grant, so it disappears from the profile; the audit log keeps the\r\n        fact that it was granted and removed, and by whom. Role badges are kept in step with the role -\r\n        a promotion adds one, a demotion takes it back - while earned badges such as a Carpenters Club\r\n        tier stay where they are.\r\n      </p>\r\n    </main>\r\n  </div>\r\n</div>\r\n\r\n</body>\r\n</html>\r\n")
  return __output;

},
  "admin/banners": function anonymous(locals, escapeFn, include, rethrow
) {
var Switch = locals.Switch, admin = locals.admin, adminNav = locals.adminNav, adminStatus = locals.adminStatus, banner = locals.banner, banners = locals.banners, bg = locals.bg, checked = locals.checked, createdAt = locals.createdAt, css = locals.css, enabled = locals.enabled, extraCss = locals.extraCss, fg = locals.fg, forEach = locals.forEach, form = locals.form, head = locals.head, id = locals.id, length = locals.length, link = locals.link, name = locals.name, notice = locals.notice, nowhere = locals.nowhere, off = locals.off, on = locals.on, pageTitle = locals.pageTitle, partials = locals.partials, rank = locals.rank, shownId = locals.shownId, sidebar = locals.sidebar, status = locals.status, text = locals.text, username = locals.username, v = locals.v, viewer = locals.viewer;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append("\n")
    ; __append( include('../partials/head', { pageTitle: pageTitle, extraCss: '/css/admin.css?v=1' }) )
    ; __append("\n<link rel=\"stylesheet\" href=\"/css/admin-mod.css\">\n\n<div class=\"fb-admin\">\n  <div class=\"fb-admin__bar\">\n    <div class=\"fb-admin__brand\">\n      <a class=\"fb-admin__logo\" href=\"/admin\">FieldBrik</a>\n      <span class=\"fb-admin__logo-tag\">Administration</span>\n    </div>\n    <div class=\"fb-admin__who\">\n      <strong>")
    ; __append(escapeFn( viewer.username ))
    ; __append("</strong> &middot; ")
    ; __append(escapeFn( admin.name ))
    ; __append(" (rank ")
    ; __append(escapeFn( admin.rank ))
    ; __append(") &middot;\n      <a href=\"/\">Back to the site</a>\n    </div>\n    ")
    ; __append( include('status', { adminStatus: adminStatus }) )
    ; __append("\n  </div>\n\n  <div class=\"fb-admin__body\">\n    ")
    ; __append( include('sidebar', { adminNav: adminNav }) )
    ; __append("\n\n    <main class=\"fb-admin__main\">\n      ")
    ;  if (notice) { 
    ; __append("\n        <div class=\"fb-notice fb-notice--admin\"><p><strong>")
    ; __append(escapeFn( notice ))
    ; __append("</strong></p></div>\n      ")
    ;  } 
    ; __append("\n\n      <div class=\"fb-panel\">\n        <h1 class=\"fb-panel__title fb-panel__title--blue\">Site banner</h1>\n        <div class=\"fb-panel__body\">\n          <p>The banner runs under the member strip, on every page that carries it. The newest banner\n            that is switched on is the one that shows.</p>\n\n          <p class=\"fb-admin__muted\">Preview:</p>\n          <div class=\"fb-banner-preview\" id=\"fb-banner-preview\"\n            style=\"background: ")
    ; __append(escapeFn( form.bg ))
    ; __append("; color: ")
    ; __append(escapeFn( form.fg ))
    ; __append(";\">Preview text</div>\n\n          <form method=\"post\" action=\"/admin/banners\" class=\"fb-admin__form\">\n            <div class=\"fb-mod__field\">\n              <label for=\"fb-banner-text\">Text</label>\n              <input id=\"fb-banner-text\" name=\"text\" type=\"text\" maxlength=\"200\" required\n                value=\"")
    ; __append(escapeFn( form.text ))
    ; __append("\" placeholder=\"FieldBrik is currently experiencing technical difficulties.\">\n              <p class=\"fb-admin__muted\">Between 2 and 200 characters. Shown as text, never as markup.</p>\n            </div>\n\n            <div class=\"fb-mod__field\">\n              <label for=\"fb-banner-bg\">Background colour</label>\n              <div class=\"fb-colour\">\n                <input id=\"fb-banner-bg\" name=\"bg\" type=\"color\" value=\"")
    ; __append(escapeFn( form.bg ))
    ; __append("\">\n                <input id=\"fb-banner-bg-hex\" name=\"bg_hex\" type=\"text\" maxlength=\"7\" value=\"")
    ; __append(escapeFn( form.bg ))
    ; __append("\"\n                  placeholder=\"#efefef\" pattern=\"#[0-9a-fA-F]{6}\">\n              </div>\n              <p class=\"fb-admin__muted\">Pick a colour, or type a hex value. The two follow each other.</p>\n            </div>\n\n            <div class=\"fb-mod__field\">\n              <label for=\"fb-banner-fg\">Text colour</label>\n              <div class=\"fb-colour\">\n                <input id=\"fb-banner-fg\" name=\"fg\" type=\"color\" value=\"")
    ; __append(escapeFn( form.fg ))
    ; __append("\">\n                <input id=\"fb-banner-fg-hex\" name=\"fg_hex\" type=\"text\" maxlength=\"7\" value=\"")
    ; __append(escapeFn( form.fg ))
    ; __append("\"\n                  placeholder=\"#1e1e1e\" pattern=\"#[0-9a-fA-F]{6}\">\n              </div>\n              <p class=\"fb-admin__muted\">Red, yellow, green, anything. Pale backgrounds need dark text.</p>\n            </div>\n\n            <div class=\"fb-mod__field\">\n              <label for=\"fb-banner-link\">Link (optional)</label>\n              <input id=\"fb-banner-link\" name=\"link\" type=\"text\" maxlength=\"200\" value=\"")
    ; __append(escapeFn( form.link ))
    ; __append("\"\n                placeholder=\"/news or https://example.com\">\n              <p class=\"fb-admin__muted\">A path on this site, or a full https address. Left empty, the\n                banner is plain text.</p>\n            </div>\n\n            <div class=\"fb-mod__field\">\n              <label class=\"fb-check\">\n                <input type=\"checkbox\" name=\"enabled\" value=\"1\" ")
    ; __append(escapeFn( form.enabled ? 'checked' : '' ))
    ; __append(">\n                Show it on the site as soon as it is saved\n              </label>\n            </div>\n\n            <button class=\"fb-btn fb-btn--primary\" type=\"submit\">Save banner</button>\n          </form>\n        </div>\n      </div>\n\n      <div class=\"fb-panel\">\n        <h2 class=\"fb-panel__title\">Saved banners</h2>\n        <div class=\"fb-panel__body fb-panel__body--flush\">\n          <table class=\"fb-table fb-table--admin\">\n            <thead>\n              <tr>\n                <th scope=\"col\">Banner</th>\n                <th scope=\"col\">Where it points</th>\n                <th scope=\"col\">Saved</th>\n                <th scope=\"col\">Status</th>\n                <th scope=\"col\"></th>\n              </tr>\n            </thead>\n            <tbody>\n              ")
    ;  if (banners.length === 0) { 
    ; __append("\n                <tr><td colspan=\"5\" class=\"fb-table__last\">No banner has been saved yet.</td></tr>\n              ")
    ;  } 
    ; __append("\n              ")
    ;  banners.forEach(function (banner) { 
    ; __append("\n                <tr>\n                  <td>\n                    <span class=\"fb-banner-preview\" style=\"background: ")
    ; __append(escapeFn( banner.bg ))
    ; __append("; color: ")
    ; __append(escapeFn( banner.fg ))
    ; __append(";\">")
    ; __append(escapeFn( banner.text ))
    ; __append("</span>\n                  </td>\n                  <td>")
    ; __append(escapeFn( banner.link || 'nowhere' ))
    ; __append("</td>\n                  <td>")
    ; __append(escapeFn( banner.createdAt ))
    ; __append("</td>\n                  <td>\n                    ")
    ;  if (banner.enabled && banner.id === shownId) { 
    ; __append("showing\n                    ")
    ;  } else if (banner.enabled) { 
    ; __append("on, not the newest\n                    ")
    ;  } else { 
    ; __append("off")
    ;  } 
    ; __append("\n                  </td>\n                  <td>\n                    <form class=\"fb-inline\" method=\"post\" action=\"/admin/banners/")
    ; __append(escapeFn( banner.id ))
    ; __append("/status\">\n                      <input type=\"hidden\" name=\"enabled\" value=\"")
    ; __append(escapeFn( banner.enabled ? '0' : '1' ))
    ; __append("\">\n                      <button class=\"fb-btn\" type=\"submit\">")
    ; __append(escapeFn( banner.enabled ? 'Switch off' : 'Switch on' ))
    ; __append("</button>\n                    </form>\n                    <form class=\"fb-inline\" method=\"post\" action=\"/admin/banners/")
    ; __append(escapeFn( banner.id ))
    ; __append("/delete\">\n                      <button class=\"fb-btn\" type=\"submit\">Delete</button>\n                    </form>\n                  </td>\n                </tr>\n              ")
    ;  }); 
    ; __append("\n            </tbody>\n          </table>\n        </div>\n      </div>\n\n      <p class=\"fb-admin__note\">\n        Only the newest switched-on banner is drawn, so switching on an older one does nothing until the\n        newer ones are off. Every banner is kept until it is deleted: the list is the record of what the\n        site has said.\n      </p>\n    </main>\n  </div>\n</div>\n\n<script>\n  // The picker and the hex box are two views of one value.\n  (function () {\n    var preview = document.getElementById('fb-banner-preview');\n    var bg = document.getElementById('fb-banner-bg');\n    var bgHex = document.getElementById('fb-banner-bg-hex');\n    var fg = document.getElementById('fb-banner-fg');\n    var fgHex = document.getElementById('fb-banner-fg-hex');\n    var text = document.getElementById('fb-banner-text');\n\n    function sync() {\n      preview.style.background = bgHex.value || bg.value;\n      preview.style.color = fgHex.value || fg.value;\n      preview.textContent = text.value || 'Preview text';\n    }\n\n    function pair(picker, hex) {\n      picker.addEventListener('input', function () {\n        hex.value = picker.value;\n        sync();\n      });\n      hex.addEventListener('input', function () {\n        if (/^#[0-9a-fA-F]{6}$/.test(hex.value)) {\n          picker.value = hex.value;\n          sync();\n        }\n      });\n    }\n\n    pair(bg, bgHex);\n    pair(fg, fgHex);\n    text.addEventListener('input', sync);\n    sync();\n  })();\n</script>\n\n</body>\n</html>\n")
  return __output;

},
  "admin/blacklist": function anonymous(locals, escapeFn, include, rethrow
) {
var admin = locals.admin, adminNav = locals.adminNav, adminStatus = locals.adminStatus, by = locals.by, css = locals.css, email = locals.email, entries = locals.entries, entry = locals.entry, extraCss = locals.extraCss, forEach = locals.forEach, head = locals.head, length = locals.length, name = locals.name, notice = locals.notice, pageTitle = locals.pageTitle, partials = locals.partials, rank = locals.rank, reason = locals.reason, sidebar = locals.sidebar, status = locals.status, username = locals.username, v = locals.v, viewer = locals.viewer, when = locals.when;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append( include('../partials/head', { pageTitle: pageTitle, extraCss: '/css/admin.css?v=1' }) )
    ; __append("\r\n<link rel=\"stylesheet\" href=\"/css/admin-mod.css\">\r\n\r\n<div class=\"fb-admin\">\r\n  <div class=\"fb-admin__bar\">\r\n    <div class=\"fb-admin__brand\">\r\n      <a class=\"fb-admin__logo\" href=\"/admin\">FieldBrik</a>\r\n      <span class=\"fb-admin__logo-tag\">Administration</span>\r\n    </div>\r\n    <div class=\"fb-admin__who\">\r\n      <strong>")
    ; __append(escapeFn( viewer.username ))
    ; __append("</strong> &middot; ")
    ; __append(escapeFn( admin.name ))
    ; __append(" (rank ")
    ; __append(escapeFn( admin.rank ))
    ; __append(") &middot;\r\n      <a href=\"/\">Back to the site</a>\r\n    </div>\r\n    ")
    ; __append( include('status', { adminStatus: adminStatus }) )
    ; __append("\r\n  </div>\r\n\r\n  <div class=\"fb-admin__body\">\r\n    ")
    ; __append( include('sidebar', { adminNav: adminNav }) )
    ; __append("\r\n\r\n    <main class=\"fb-admin__main\">\r\n      ")
    ;  if (notice) { 
    ; __append("\r\n        <div class=\"fb-notice fb-notice--admin\"><p><strong>")
    ; __append(escapeFn( notice ))
    ; __append("</strong></p></div>\r\n      ")
    ;  } 
    ; __append("\r\n\r\n      <div class=\"fb-panel\">\r\n        <h1 class=\"fb-panel__title fb-panel__title--blue\">Blacklist Email</h1>\r\n        <div class=\"fb-panel__body\">\r\n          <p class=\"fb-admin__muted\">\r\n            A blacklisted address cannot be used to create an account. Poison bans add their\r\n            account's address here automatically; this page is for the rest.\r\n          </p>\r\n\r\n          <form method=\"post\" action=\"/admin/blacklist\">\r\n            <div class=\"fb-mod__field\">\r\n              <label for=\"fb-email\">Email address</label>\r\n              <input id=\"fb-email\" type=\"text\" name=\"email\" maxlength=\"254\" autocomplete=\"off\">\r\n            </div>\r\n            <div class=\"fb-mod__field\">\r\n              <label for=\"fb-email-reason\">Reason</label>\r\n              <input id=\"fb-email-reason\" type=\"text\" name=\"reason\" maxlength=\"300\" autocomplete=\"off\">\r\n            </div>\r\n            <button class=\"fb-btn fb-btn--primary\" type=\"submit\">Blacklist address</button>\r\n          </form>\r\n        </div>\r\n      </div>\r\n\r\n      <div class=\"fb-panel\">\r\n        <h2 class=\"fb-panel__title\">Blacklisted addresses</h2>\r\n        <div class=\"fb-panel__body fb-panel__body--flush\">\r\n          <table class=\"fb-table fb-table--admin\">\r\n            <thead>\r\n              <tr>\r\n                <th scope=\"col\">Address</th>\r\n                <th scope=\"col\">Reason</th>\r\n                <th scope=\"col\">Added by</th>\r\n                <th scope=\"col\">Added</th>\r\n                <th scope=\"col\"></th>\r\n              </tr>\r\n            </thead>\r\n            <tbody>\r\n              ")
    ;  if (entries.length === 0) { 
    ; __append("\r\n                <tr><td colspan=\"5\" class=\"fb-table__last\">No address is blacklisted.</td></tr>\r\n              ")
    ;  } 
    ; __append("\r\n              ")
    ;  entries.forEach(function (entry) { 
    ; __append("\r\n                <tr>\r\n                  <td>")
    ; __append(escapeFn( entry.email ))
    ; __append("</td>\r\n                  <td class=\"fb-table__note\">")
    ; __append(escapeFn( entry.reason ))
    ; __append("</td>\r\n                  <td>")
    ; __append(escapeFn( entry.by ))
    ; __append("</td>\r\n                  <td>")
    ; __append(escapeFn( entry.when ))
    ; __append("</td>\r\n                  <td>\r\n                    <form method=\"post\" action=\"/admin/blacklist\">\r\n                      <input type=\"hidden\" name=\"action\" value=\"remove\">\r\n                      <input type=\"hidden\" name=\"email\" value=\"")
    ; __append(escapeFn( entry.email ))
    ; __append("\">\r\n                      <button class=\"fb-btn\" type=\"submit\">Remove</button>\r\n                    </form>\r\n                  </td>\r\n                </tr>\r\n              ")
    ;  }); 
    ; __append("\r\n            </tbody>\r\n          </table>\r\n        </div>\r\n      </div>\r\n\r\n      <p class=\"fb-admin__note\">\r\n        Removing an address does not lift anything that ban did: the account itself is still\r\n        banned, and its name is still scrubbed. This only frees the address for a new account.\r\n      </p>\r\n    </main>\r\n  </div>\r\n</div>\r\n\r\n</body>\r\n</html>\r\n")
  return __output;

},
  "admin/catalog": function anonymous(locals, escapeFn, include, rethrow
) {
var Put = locals.Put, Take = locals.Take, admin = locals.admin, adminNav = locals.adminNav, adminStatus = locals.adminStatus, bucks = locals.bucks, canEdit = locals.canEdit, categories = locals.categories, category = locals.category, creator = locals.creator, css = locals.css, extraCss = locals.extraCss, forEach = locals.forEach, head = locals.head, id = locals.id, image = locals.image, item = locals.item, items = locals.items, length = locals.length, name = locals.name, notice = locals.notice, off = locals.off, on = locals.on, onSale = locals.onSale, owners = locals.owners, pageTitle = locals.pageTitle, partials = locals.partials, rank = locals.rank, sale = locals.sale, sidebar = locals.sidebar, status = locals.status, thumb = locals.thumb, tickets = locals.tickets, username = locals.username, v = locals.v, viewer = locals.viewer;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append( include('../partials/head', { pageTitle: pageTitle, extraCss: '/css/admin.css?v=1' }) )
    ; __append("\r\n<link rel=\"stylesheet\" href=\"/css/admin-mod.css\">\r\n\r\n<div class=\"fb-admin\">\r\n  <div class=\"fb-admin__bar\">\r\n    <div class=\"fb-admin__brand\">\r\n      <a class=\"fb-admin__logo\" href=\"/admin\">FieldBrik</a>\r\n      <span class=\"fb-admin__logo-tag\">Administration</span>\r\n    </div>\r\n    <div class=\"fb-admin__who\">\r\n      <strong>")
    ; __append(escapeFn( viewer.username ))
    ; __append("</strong> &middot; ")
    ; __append(escapeFn( admin.name ))
    ; __append(" (rank ")
    ; __append(escapeFn( admin.rank ))
    ; __append(") &middot;\r\n      <a href=\"/\">Back to the site</a>\r\n    </div>\r\n    ")
    ; __append( include('status', { adminStatus: adminStatus }) )
    ; __append("\r\n  </div>\r\n\r\n  <div class=\"fb-admin__body\">\r\n    ")
    ; __append( include('sidebar', { adminNav: adminNav }) )
    ; __append("\r\n\r\n    <main class=\"fb-admin__main\">\r\n      ")
    ;  if (notice) { 
    ; __append("\r\n        <div class=\"fb-notice fb-notice--admin\"><p><strong>")
    ; __append(escapeFn( notice ))
    ; __append("</strong></p></div>\r\n      ")
    ;  } 
    ; __append("\r\n\r\n      <div class=\"fb-panel\">\r\n        <h1 class=\"fb-panel__title fb-panel__title--blue\">Catalog Items</h1>\r\n        <div class=\"fb-panel__body fb-panel__body--flush\">\r\n          <table class=\"fb-table fb-table--admin\">\r\n            <thead>\r\n              <tr>\r\n                <th scope=\"col\">Item</th>\r\n                <th scope=\"col\">Category</th>\r\n                <th scope=\"col\">Prices</th>\r\n                <th scope=\"col\">Owners</th>\r\n                <th scope=\"col\">Sale</th>\r\n                <th scope=\"col\"></th>\r\n              </tr>\r\n            </thead>\r\n            <tbody>\r\n              ")
    ;  if (items.length === 0) { 
    ; __append("\r\n                <tr><td colspan=\"6\" class=\"fb-table__last\">No items in the catalog yet. Create one below.</td></tr>\r\n              ")
    ;  } 
    ; __append("\r\n              ")
    ;  items.forEach(function (item) { 
    ; __append("\r\n                <tr>\r\n                  <td>\r\n                    <div class=\"fb-catalog-row\">\r\n                      <span class=\"fb-card-item__thumb\" style=\"--thumb: ")
    ; __append(escapeFn( item.thumb ))
    ; __append(";\" aria-hidden=\"true\">\r\n                        ")
    ;  if (item.image) { 
    ; __append("<img src=\"")
    ; __append(escapeFn( item.image ))
    ; __append("\" alt=\"\">")
    ;  } 
    ; __append("\r\n                      </span>\r\n                      <span>\r\n                        <strong>")
    ; __append(escapeFn( item.name ))
    ; __append("</strong><br>\r\n                        <span class=\"fb-muted\">by ")
    ; __append(escapeFn( item.creator ))
    ; __append("</span>\r\n                      </span>\r\n                    </div>\r\n                  </td>\r\n                  <td>")
    ; __append(escapeFn( item.category ))
    ; __append("</td>\r\n                  <td>\r\n                    ")
    ;  if (item.tickets === null) { 
    ; __append("-")
    ;  } else { 
    ; __append(escapeFn( item.tickets ))
    ; __append(" Tx")
    ;  } 
    ; __append("\r\n                    ")
    ;  if (item.bucks !== null) { 
    ; __append("<br>")
    ; __append(escapeFn( item.bucks ))
    ; __append(" R$")
    ;  } 
    ; __append("\r\n                  </td>\r\n                  <td>")
    ; __append(escapeFn( item.owners ))
    ; __append("</td>\r\n                  <td>")
    ; __append(escapeFn( item.onSale ? 'on sale' : 'off sale' ))
    ; __append("</td>\r\n                  <td>\r\n                    <a class=\"fb-btn\" href=\"/admin/catalog/")
    ; __append(escapeFn( item.id ))
    ; __append("\">Edit</a>\r\n                    <form class=\"fb-inline\" method=\"post\" action=\"/admin/catalog/")
    ; __append(escapeFn( item.id ))
    ; __append("/sale\">\r\n                      <input type=\"hidden\" name=\"on_sale\" value=\"")
    ; __append(escapeFn( item.onSale ? '0' : '1' ))
    ; __append("\">\r\n                      <button class=\"fb-btn\" type=\"submit\">")
    ; __append(escapeFn( item.onSale ? 'Take off sale' : 'Put on sale' ))
    ; __append("</button>\r\n                    </form>\r\n                  </td>\r\n                </tr>\r\n              ")
    ;  }); 
    ; __append("\r\n            </tbody>\r\n          </table>\r\n        </div>\r\n      </div>\r\n\r\n      ")
    ;  if (canEdit) { 
    ; __append("\r\n        <div class=\"fb-panel\">\r\n          <h2 class=\"fb-panel__title\">New item</h2>\r\n          <div class=\"fb-panel__body\">\r\n            <form method=\"post\" action=\"/admin/catalog\">\r\n              <div class=\"fb-mod__field\">\r\n                <label for=\"fb-new-name\">Name</label>\r\n                <input id=\"fb-new-name\" type=\"text\" name=\"name\" maxlength=\"60\" required autocomplete=\"off\">\r\n              </div>\r\n\r\n              <div class=\"fb-mod__field\">\r\n                <label for=\"fb-new-category\">Category</label>\r\n                <select id=\"fb-new-category\" name=\"category\">\r\n                  ")
    ;  categories.forEach(function (name) { 
    ; __append("\r\n                    <option value=\"")
    ; __append(escapeFn( name ))
    ; __append("\">")
    ; __append(escapeFn( name ))
    ; __append("</option>\r\n                  ")
    ;  }); 
    ; __append("\r\n                </select>\r\n              </div>\r\n\r\n              <div class=\"fb-mod__field\">\r\n                <label for=\"fb-new-tickets\">Price in Tickets (leave empty if it is not sold for Tickets)</label>\r\n                <input id=\"fb-new-tickets\" type=\"number\" name=\"tickets\" min=\"0\" max=\"1000000\" step=\"1\">\r\n              </div>\r\n\r\n              <div class=\"fb-mod__field\">\r\n                <label for=\"fb-new-bucks\">Price in Bucks (leave empty if it is not sold for Bucks)</label>\r\n                <input id=\"fb-new-bucks\" type=\"number\" name=\"bucks\" min=\"0\" max=\"1000000\" step=\"1\">\r\n              </div>\r\n\r\n              <div class=\"fb-mod__field\">\r\n                <label for=\"fb-new-description\">Description (shown on the item page)</label>\r\n                <textarea id=\"fb-new-description\" name=\"description\" rows=\"3\" maxlength=\"1000\"></textarea>\r\n              </div>\r\n\r\n              <div class=\"fb-mod__field\">\r\n                <label for=\"fb-new-image\">Picture path (for example /img/Helmet.jpg, or empty for the colour swatch)</label>\r\n                <input id=\"fb-new-image\" type=\"text\" name=\"image\" maxlength=\"200\" autocomplete=\"off\">\r\n              </div>\r\n\r\n              <div class=\"fb-mod__field\">\r\n                <label for=\"fb-new-sale\">On sale</label>\r\n                <select id=\"fb-new-sale\" name=\"on_sale\">\r\n                  <option value=\"1\">On sale</option>\r\n                  <option value=\"0\">Off sale</option>\r\n                </select>\r\n              </div>\r\n\r\n              <button class=\"fb-btn fb-btn--primary\" type=\"submit\">Create item</button>\r\n            </form>\r\n          </div>\r\n        </div>\r\n      ")
    ;  } else { 
    ; __append("\r\n        <p><strong>Your role cannot change the catalog.</strong> Image Moderator and above can; the list above is readable.</p>\r\n      ")
    ;  } 
    ; __append("\r\n\r\n      <p class=\"fb-admin__note\">\r\n        Items are never deleted here, because members who bought one hold a row that points at it.\r\n        Taking an item off sale is the reversible equivalent: it leaves the catalog but stays in the\r\n        inventory of everybody who owns it. Pictures are paths under public/img, so a file goes in the\r\n        repository and the path is typed here; there is no upload yet.\r\n      </p>\r\n    </main>\r\n  </div>\r\n</div>\r\n\r\n</body>\r\n</html>\r\n")
  return __output;

},
  "admin/catalog-item": function anonymous(locals, escapeFn, include, rethrow
) {
var admin = locals.admin, adminNav = locals.adminNav, adminStatus = locals.adminStatus, bucks = locals.bucks, canEdit = locals.canEdit, categories = locals.categories, category = locals.category, creator = locals.creator, css = locals.css, description = locals.description, extraCss = locals.extraCss, forEach = locals.forEach, head = locals.head, id = locals.id, image = locals.image, item = locals.item, name = locals.name, no = locals.no, notice = locals.notice, onSale = locals.onSale, owners = locals.owners, pageTitle = locals.pageTitle, partials = locals.partials, rank = locals.rank, selected = locals.selected, sidebar = locals.sidebar, status = locals.status, tickets = locals.tickets, username = locals.username, v = locals.v, viewer = locals.viewer, yes = locals.yes;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append( include('../partials/head', { pageTitle: pageTitle, extraCss: '/css/admin.css?v=1' }) )
    ; __append("\r\n<link rel=\"stylesheet\" href=\"/css/admin-mod.css\">\r\n\r\n<div class=\"fb-admin\">\r\n  <div class=\"fb-admin__bar\">\r\n    <div class=\"fb-admin__brand\">\r\n      <a class=\"fb-admin__logo\" href=\"/admin\">FieldBrik</a>\r\n      <span class=\"fb-admin__logo-tag\">Administration</span>\r\n    </div>\r\n    <div class=\"fb-admin__who\">\r\n      <strong>")
    ; __append(escapeFn( viewer.username ))
    ; __append("</strong> &middot; ")
    ; __append(escapeFn( admin.name ))
    ; __append(" (rank ")
    ; __append(escapeFn( admin.rank ))
    ; __append(") &middot;\r\n      <a href=\"/\">Back to the site</a>\r\n    </div>\r\n    ")
    ; __append( include('status', { adminStatus: adminStatus }) )
    ; __append("\r\n  </div>\r\n\r\n  <div class=\"fb-admin__body\">\r\n    ")
    ; __append( include('sidebar', { adminNav: adminNav }) )
    ; __append("\r\n\r\n    <main class=\"fb-admin__main\">\r\n      ")
    ;  if (notice) { 
    ; __append("\r\n        <div class=\"fb-notice fb-notice--admin\"><p><strong>")
    ; __append(escapeFn( notice ))
    ; __append("</strong></p></div>\r\n      ")
    ;  } 
    ; __append("\r\n\r\n      <div class=\"fb-panel\">\r\n        <h1 class=\"fb-panel__title fb-panel__title--blue\">Edit: ")
    ; __append(escapeFn( item.name ))
    ; __append("</h1>\r\n        <div class=\"fb-panel__body\">\r\n          <table class=\"fb-table fb-table--kv\">\r\n            <tbody>\r\n              <tr><th scope=\"row\">Item ID</th><td>")
    ; __append(escapeFn( item.id ))
    ; __append("</td></tr>\r\n              <tr><th scope=\"row\">Created by</th><td>")
    ; __append(escapeFn( item.creator ))
    ; __append("</td></tr>\r\n              <tr><th scope=\"row\">On sale</th><td>")
    ; __append(escapeFn( item.onSale ? 'yes' : 'no' ))
    ; __append("</td></tr>\r\n              <tr><th scope=\"row\">Owners</th><td>")
    ; __append(escapeFn( item.owners ))
    ; __append("</td></tr>\r\n            </tbody>\r\n          </table>\r\n\r\n          ")
    ;  if (canEdit) { 
    ; __append("\r\n            <form method=\"post\" action=\"/admin/catalog/")
    ; __append(escapeFn( item.id ))
    ; __append("\">\r\n              <h2 class=\"fb-admin__heading\">Change the item</h2>\r\n\r\n              <div class=\"fb-mod__field\">\r\n                <label for=\"fb-name\">Name</label>\r\n                <input id=\"fb-name\" type=\"text\" name=\"name\" maxlength=\"60\" required value=\"")
    ; __append(escapeFn( item.name ))
    ; __append("\">\r\n              </div>\r\n\r\n              <div class=\"fb-mod__field\">\r\n                <label for=\"fb-category\">Category</label>\r\n                <select id=\"fb-category\" name=\"category\">\r\n                  ")
    ;  categories.forEach(function (name) { 
    ; __append("\r\n                    <option value=\"")
    ; __append(escapeFn( name ))
    ; __append("\"")
    ; __append(escapeFn( item.category === name ? ' selected' : '' ))
    ; __append(">")
    ; __append(escapeFn( name ))
    ; __append("</option>\r\n                  ")
    ;  }); 
    ; __append("\r\n                </select>\r\n              </div>\r\n\r\n              <div class=\"fb-mod__field\">\r\n                <label for=\"fb-tickets\">Price in Tickets (empty = not sold for Tickets)</label>\r\n                <input id=\"fb-tickets\" type=\"number\" name=\"tickets\" min=\"0\" max=\"1000000\" step=\"1\" value=\"")
    ; __append(escapeFn( item.tickets === null ? '' : item.tickets ))
    ; __append("\">\r\n              </div>\r\n\r\n              <div class=\"fb-mod__field\">\r\n                <label for=\"fb-bucks\">Price in Bucks (empty = not sold for Bucks)</label>\r\n                <input id=\"fb-bucks\" type=\"number\" name=\"bucks\" min=\"0\" max=\"1000000\" step=\"1\" value=\"")
    ; __append(escapeFn( item.bucks === null ? '' : item.bucks ))
    ; __append("\">\r\n              </div>\r\n\r\n              <div class=\"fb-mod__field\">\r\n                <label for=\"fb-description\">Description</label>\r\n                <textarea id=\"fb-description\" name=\"description\" rows=\"3\" maxlength=\"1000\">")
    ; __append(escapeFn( item.description ))
    ; __append("</textarea>\r\n              </div>\r\n\r\n              <div class=\"fb-mod__field\">\r\n                <label for=\"fb-image\">Picture path (for example /img/Helmet.jpg, or empty for the colour swatch)</label>\r\n                <input id=\"fb-image\" type=\"text\" name=\"image\" maxlength=\"200\" value=\"")
    ; __append(escapeFn( item.image ))
    ; __append("\">\r\n              </div>\r\n\r\n              <div class=\"fb-mod__field\">\r\n                <label for=\"fb-sale\">On sale</label>\r\n                <select id=\"fb-sale\" name=\"on_sale\">\r\n                  <option value=\"1\"")
    ; __append(escapeFn( item.onSale ? ' selected' : '' ))
    ; __append(">On sale</option>\r\n                  <option value=\"0\"")
    ; __append(escapeFn( item.onSale ? '' : ' selected' ))
    ; __append(">Off sale</option>\r\n                </select>\r\n              </div>\r\n\r\n              <button class=\"fb-btn fb-btn--primary\" type=\"submit\">Save changes</button>\r\n            </form>\r\n          ")
    ;  } else { 
    ; __append("\r\n            <p><strong>Your role cannot change the catalog.</strong> Image Moderator and above can.</p>\r\n          ")
    ;  } 
    ; __append("\r\n        </div>\r\n      </div>\r\n\r\n      <p class=\"fb-panel__more\">\r\n        <a href=\"/admin/catalog\">Back to the catalog list</a> &middot;\r\n        <a href=\"/catalog/")
    ; __append(escapeFn( item.id ))
    ; __append("\">See the item on the site</a>\r\n      </p>\r\n    </main>\r\n  </div>\r\n</div>\r\n\r\n</body>\r\n</html>\r\n")
  return __output;

},
  "admin/club": function anonymous(locals, escapeFn, include, rethrow
) {
var account = locals.account, active = locals.active, admin = locals.admin, adminNav = locals.adminNav, adminStatus = locals.adminStatus, canGrant = locals.canGrant, cancelled = locals.cancelled, css = locals.css, ended = locals.ended, entry = locals.entry, expires = locals.expires, extraCss = locals.extraCss, forEach = locals.forEach, grantedBy = locals.grantedBy, head = locals.head, id = locals.id, key = locals.key, length = locals.length, memberships = locals.memberships, name = locals.name, note = locals.note, notice = locals.notice, pageTitle = locals.pageTitle, partials = locals.partials, rank = locals.rank, roleName = locals.roleName, roleRank = locals.roleRank, shortName = locals.shortName, sidebar = locals.sidebar, started = locals.started, status = locals.status, term = locals.term, termName = locals.termName, terms = locals.terms, tier = locals.tier, tierName = locals.tierName, tiers = locals.tiers, username = locals.username, v = locals.v, viewer = locals.viewer;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append( include('../partials/head', { pageTitle: pageTitle, extraCss: '/css/admin.css?v=1' }) )
    ; __append("\r\n<link rel=\"stylesheet\" href=\"/css/admin-mod.css\">\r\n\r\n<div class=\"fb-admin\">\r\n  <div class=\"fb-admin__bar\">\r\n    <div class=\"fb-admin__brand\">\r\n      <a class=\"fb-admin__logo\" href=\"/admin\">FieldBrik</a>\r\n      <span class=\"fb-admin__logo-tag\">Administration</span>\r\n    </div>\r\n    <div class=\"fb-admin__who\">\r\n      <strong>")
    ; __append(escapeFn( viewer.username ))
    ; __append("</strong> &middot; ")
    ; __append(escapeFn( admin.name ))
    ; __append(" (rank ")
    ; __append(escapeFn( admin.rank ))
    ; __append(") &middot;\r\n      <a href=\"/\">Back to the site</a>\r\n    </div>\r\n    ")
    ; __append( include('status', { adminStatus: adminStatus }) )
    ; __append("\r\n  </div>\r\n\r\n  <div class=\"fb-admin__body\">\r\n    ")
    ; __append( include('sidebar', { adminNav: adminNav }) )
    ; __append("\r\n\r\n    <main class=\"fb-admin__main\">\r\n      ")
    ;  if (notice) { 
    ; __append("\r\n        <div class=\"fb-notice fb-notice--admin\"><p><strong>")
    ; __append(escapeFn( notice ))
    ; __append("</strong></p></div>\r\n      ")
    ;  } 
    ; __append("\r\n\r\n      <div class=\"fb-panel\">\r\n        <h1 class=\"fb-panel__title fb-panel__title--blue\">Carpenters Club: ")
    ; __append(escapeFn( account.username ))
    ; __append("</h1>\r\n        <div class=\"fb-panel__body\">\r\n          <p class=\"fb-admin__muted\">\r\n            Account <strong>")
    ; __append(escapeFn( account.id ))
    ; __append("</strong> &middot; ")
    ; __append(escapeFn( account.roleName ))
    ; __append(" (rank ")
    ; __append(escapeFn( account.roleRank ))
    ; __append(")\r\n            &middot; ")
    ; __append(escapeFn( account.status ))
    ; __append("\r\n          </p>\r\n\r\n          ")
    ;  if (canGrant) { 
    ; __append("\r\n            <form method=\"post\" action=\"/admin/users/")
    ; __append(escapeFn( account.id ))
    ; __append("/club\">\r\n              <h2 class=\"fb-admin__heading\">Grant a membership</h2>\r\n              <p class=\"fb-admin__muted\">\r\n                Payment is not live, so this records a grant, not a purchase: the amount is 0 and\r\n                your name and note are kept against it.\r\n              </p>\r\n\r\n              <div class=\"fb-mod__field\">\r\n                <label for=\"fb-tier\">Tier</label>\r\n                <select id=\"fb-tier\" name=\"tier\">\r\n                  ")
    ;  tiers.forEach(function (tier) { 
    ; __append("\r\n                    <option value=\"")
    ; __append(escapeFn( tier.key ))
    ; __append("\">")
    ; __append(escapeFn( tier.name ))
    ; __append(" (")
    ; __append(escapeFn( tier.shortName ))
    ; __append(")</option>\r\n                  ")
    ;  }); 
    ; __append("\r\n                </select>\r\n              </div>\r\n\r\n              <div class=\"fb-mod__field\">\r\n                <label for=\"fb-term\">Term</label>\r\n                <select id=\"fb-term\" name=\"term\">\r\n                  ")
    ;  terms.forEach(function (term) { 
    ; __append("\r\n                    <option value=\"")
    ; __append(escapeFn( term.key ))
    ; __append("\">")
    ; __append(escapeFn( term.name ))
    ; __append(" - ")
    ; __append(escapeFn( term.note ))
    ; __append("</option>\r\n                  ")
    ;  }); 
    ; __append("\r\n                </select>\r\n              </div>\r\n\r\n              <div class=\"fb-mod__field\">\r\n                <label for=\"fb-club-note\">Note (staff only, never shown to the member)</label>\r\n                <input id=\"fb-club-note\" type=\"text\" name=\"note\" maxlength=\"300\" autocomplete=\"off\">\r\n              </div>\r\n\r\n              <button class=\"fb-btn fb-btn--primary\" type=\"submit\">Grant membership</button>\r\n            </form>\r\n          ")
    ;  } else { 
    ; __append("\r\n            <p>\r\n              <strong>Your role cannot grant a membership.</strong>\r\n              Junior Administrator and above can; this account's memberships are still listed below.\r\n            </p>\r\n          ")
    ;  } 
    ; __append("\r\n        </div>\r\n      </div>\r\n\r\n      <div class=\"fb-panel\">\r\n        <h2 class=\"fb-panel__title\">Memberships</h2>\r\n        <div class=\"fb-panel__body fb-panel__body--flush\">\r\n          <table class=\"fb-table fb-table--admin\">\r\n            <thead>\r\n              <tr>\r\n                <th scope=\"col\">Tier</th>\r\n                <th scope=\"col\">Term</th>\r\n                <th scope=\"col\">Started</th>\r\n                <th scope=\"col\">Ends</th>\r\n                <th scope=\"col\">Granted by</th>\r\n                <th scope=\"col\">Note</th>\r\n                <th scope=\"col\"></th>\r\n              </tr>\r\n            </thead>\r\n            <tbody>\r\n              ")
    ;  if (memberships.length === 0) { 
    ; __append("\r\n                <tr><td colspan=\"7\" class=\"fb-table__last\">No membership has been granted on this account.</td></tr>\r\n              ")
    ;  } 
    ; __append("\r\n              ")
    ;  memberships.forEach(function (entry) { 
    ; __append("\r\n                <tr>\r\n                  <td>")
    ; __append(escapeFn( entry.tierName ))
    ; __append("</td>\r\n                  <td>")
    ; __append(escapeFn( entry.termName ))
    ; __append("</td>\r\n                  <td>")
    ; __append(escapeFn( entry.started ))
    ; __append("</td>\r\n                  <td>")
    ; __append(escapeFn( entry.cancelled ? 'ended ' + entry.cancelled : entry.expires ))
    ; __append("</td>\r\n                  <td>")
    ; __append(escapeFn( entry.grantedBy ))
    ; __append("</td>\r\n                  <td class=\"fb-table__note\">")
    ; __append(escapeFn( entry.note ))
    ; __append("</td>\r\n                  <td>\r\n                    ")
    ;  if (entry.active && canGrant) { 
    ; __append("\r\n                      <form method=\"post\" action=\"/admin/users/")
    ; __append(escapeFn( account.id ))
    ; __append("/club\">\r\n                        <input type=\"hidden\" name=\"action\" value=\"end\">\r\n                        <input type=\"hidden\" name=\"membership\" value=\"")
    ; __append(escapeFn( entry.id ))
    ; __append("\">\r\n                        <button class=\"fb-btn\" type=\"submit\">End</button>\r\n                      </form>\r\n                    ")
    ;  } else if (entry.active) { 
    ; __append("\r\n                      active\r\n                    ")
    ;  } else { 
    ; __append("\r\n                      -\r\n                    ")
    ;  } 
    ; __append("\r\n                  </td>\r\n                </tr>\r\n              ")
    ;  }); 
    ; __append("\r\n            </tbody>\r\n          </table>\r\n        </div>\r\n      </div>\r\n\r\n      <p class=\"fb-admin__note\">\r\n        Ending a membership sets its end date now; the row stays, so the account's record still\r\n        shows what was held and when. Term lengths come from the Carpenters Club price list:\r\n        monthly 1 month, quarterly 6, yearly 12, permanent never expires.\r\n      </p>\r\n    </main>\r\n  </div>\r\n</div>\r\n\r\n</body>\r\n</html>\r\n")
  return __output;

},
  "admin/currency": function anonymous(locals, escapeFn, include, rethrow
) {
var Bucks = locals.Bucks, Tickets = locals.Tickets, account = locals.account, admin = locals.admin, adminNav = locals.adminNav, adminStatus = locals.adminStatus, balanceAfter = locals.balanceAfter, bucks = locals.bucks, canIssue = locals.canIssue, css = locals.css, currencies = locals.currencies, currency = locals.currency, delta = locals.delta, entry = locals.entry, extraCss = locals.extraCss, forEach = locals.forEach, head = locals.head, id = locals.id, ledger = locals.ledger, length = locals.length, maxAmount = locals.maxAmount, name = locals.name, notice = locals.notice, pageTitle = locals.pageTitle, partials = locals.partials, rank = locals.rank, reason = locals.reason, roleName = locals.roleName, roleRank = locals.roleRank, sidebar = locals.sidebar, status = locals.status, tickets = locals.tickets, username = locals.username, v = locals.v, viewer = locals.viewer, when = locals.when;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append( include('../partials/head', { pageTitle: pageTitle, extraCss: '/css/admin.css?v=1' }) )
    ; __append("\r\n<link rel=\"stylesheet\" href=\"/css/admin-mod.css\">\r\n\r\n<div class=\"fb-admin\">\r\n  <div class=\"fb-admin__bar\">\r\n    <div class=\"fb-admin__brand\">\r\n      <a class=\"fb-admin__logo\" href=\"/admin\">FieldBrik</a>\r\n      <span class=\"fb-admin__logo-tag\">Administration</span>\r\n    </div>\r\n    <div class=\"fb-admin__who\">\r\n      <strong>")
    ; __append(escapeFn( viewer.username ))
    ; __append("</strong> &middot; ")
    ; __append(escapeFn( admin.name ))
    ; __append(" (rank ")
    ; __append(escapeFn( admin.rank ))
    ; __append(") &middot;\r\n      <a href=\"/\">Back to the site</a>\r\n    </div>\r\n    ")
    ; __append( include('status', { adminStatus: adminStatus }) )
    ; __append("\r\n  </div>\r\n\r\n  <div class=\"fb-admin__body\">\r\n    ")
    ; __append( include('sidebar', { adminNav: adminNav }) )
    ; __append("\r\n\r\n    <main class=\"fb-admin__main\">\r\n      ")
    ;  if (notice) { 
    ; __append("\r\n        <div class=\"fb-notice fb-notice--admin\"><p><strong>")
    ; __append(escapeFn( notice ))
    ; __append("</strong></p></div>\r\n      ")
    ;  } 
    ; __append("\r\n\r\n      <div class=\"fb-panel\">\r\n        <h1 class=\"fb-panel__title fb-panel__title--blue\">Currency: ")
    ; __append(escapeFn( account.username ))
    ; __append("</h1>\r\n        <div class=\"fb-panel__body\">\r\n          <table class=\"fb-table fb-table--kv\">\r\n            <tbody>\r\n              <tr><th scope=\"row\">Account</th><td><strong>")
    ; __append(escapeFn( account.username ))
    ; __append("</strong> (ID ")
    ; __append(escapeFn( account.id ))
    ; __append(")</td></tr>\r\n              <tr><th scope=\"row\">Role</th><td>")
    ; __append(escapeFn( account.roleName ))
    ; __append(" (rank ")
    ; __append(escapeFn( account.roleRank ))
    ; __append(")</td></tr>\r\n              <tr><th scope=\"row\">Tickets</th><td>")
    ; __append(escapeFn( account.tickets ))
    ; __append("</td></tr>\r\n              <tr><th scope=\"row\">Bucks</th><td>")
    ; __append(escapeFn( account.bucks ))
    ; __append("</td></tr>\r\n            </tbody>\r\n          </table>\r\n\r\n          ")
    ;  if (canIssue) { 
    ; __append("\r\n            <form method=\"post\" action=\"/admin/users/")
    ; __append(escapeFn( account.id ))
    ; __append("/currency\">\r\n              <h2 class=\"fb-admin__heading\">Adjust this account</h2>\r\n              <p class=\"fb-admin__muted\">\r\n                Every change writes a ledger entry with the balance it left behind, and an\r\n                audit entry naming you. Removing more than an account holds is refused rather\r\n                than allowed to go negative.\r\n              </p>\r\n\r\n              <div class=\"fb-mod__field\">\r\n                <label for=\"fb-currency-direction\">Direction</label>\r\n                <select id=\"fb-currency-direction\" name=\"action\">\r\n                  <option value=\"add\">Add to the account</option>\r\n                  <option value=\"take\">Take from the account</option>\r\n                </select>\r\n              </div>\r\n\r\n              <div class=\"fb-mod__field\">\r\n                <label for=\"fb-currency-kind\">Currency</label>\r\n                <select id=\"fb-currency-kind\" name=\"currency\">\r\n                  ")
    ;  currencies.forEach(function (name) { 
    ; __append("\r\n                    <option value=\"")
    ; __append(escapeFn( name ))
    ; __append("\">")
    ; __append(escapeFn( name === 'bucks' ? 'Bucks' : 'Tickets' ))
    ; __append("</option>\r\n                  ")
    ;  }); 
    ; __append("\r\n                </select>\r\n              </div>\r\n\r\n              <div class=\"fb-mod__field\">\r\n                <label for=\"fb-currency-amount\">Amount (1 to ")
    ; __append(escapeFn( maxAmount ))
    ; __append(")</label>\r\n                <input id=\"fb-currency-amount\" type=\"number\" name=\"amount\" min=\"1\" max=\"")
    ; __append(escapeFn( maxAmount ))
    ; __append("\" step=\"1\" required>\r\n              </div>\r\n\r\n              <div class=\"fb-mod__field\">\r\n                <label for=\"fb-currency-reason\">Reason (kept on the ledger and the audit log)</label>\r\n                <input id=\"fb-currency-reason\" type=\"text\" name=\"reason\" maxlength=\"200\" required autocomplete=\"off\">\r\n              </div>\r\n\r\n              <button class=\"fb-btn fb-btn--primary\" type=\"submit\">Record the change</button>\r\n            </form>\r\n          ")
    ;  } else { 
    ; __append("\r\n            <p>\r\n              <strong>Your role cannot move currency on this account.</strong>\r\n              Junior Administrator and above can issue, and never on themselves or on an\r\n              account at or above their own rank. The balances and ledger below are readable.\r\n            </p>\r\n          ")
    ;  } 
    ; __append("\r\n        </div>\r\n      </div>\r\n\r\n      <div class=\"fb-panel\">\r\n        <h2 class=\"fb-panel__title\">Recent ledger entries</h2>\r\n        <div class=\"fb-panel__body fb-panel__body--flush\">\r\n          <table class=\"fb-table fb-table--admin\">\r\n            <thead>\r\n              <tr>\r\n                <th scope=\"col\">When</th>\r\n                <th scope=\"col\">Currency</th>\r\n                <th scope=\"col\">Change</th>\r\n                <th scope=\"col\">Balance after</th>\r\n                <th scope=\"col\">Reason</th>\r\n              </tr>\r\n            </thead>\r\n            <tbody>\r\n              ")
    ;  if (ledger.length === 0) { 
    ; __append("\r\n                <tr><td colspan=\"5\" class=\"fb-table__last\">No currency has moved on this account yet.</td></tr>\r\n              ")
    ;  } 
    ; __append("\r\n              ")
    ;  ledger.forEach(function (entry) { 
    ; __append("\r\n                <tr>\r\n                  <td>")
    ; __append(escapeFn( entry.when ))
    ; __append("</td>\r\n                  <td>")
    ; __append(escapeFn( entry.currency ))
    ; __append("</td>\r\n                  <td>")
    ; __append(escapeFn( entry.delta > 0 ? '+' + entry.delta : entry.delta ))
    ; __append("</td>\r\n                  <td>")
    ; __append(escapeFn( entry.balanceAfter ))
    ; __append("</td>\r\n                  <td class=\"fb-table__note\">")
    ; __append(escapeFn( entry.reason ))
    ; __append("</td>\r\n                </tr>\r\n              ")
    ;  }); 
    ; __append("\r\n            </tbody>\r\n          </table>\r\n        </div>\r\n      </div>\r\n\r\n      <p class=\"fb-panel__more\">\r\n        <a href=\"/admin/users/")
    ; __append(escapeFn( account.id ))
    ; __append("\">Back to ")
    ; __append(escapeFn( account.username ))
    ; __append("</a>\r\n      </p>\r\n    </main>\r\n  </div>\r\n</div>\r\n\r\n</body>\r\n</html>\r\n")
  return __output;

},
  "admin/earnings": function anonymous(locals, escapeFn, include, rethrow
) {
var admin = locals.admin, adminNav = locals.adminNav, adminStatus = locals.adminStatus, block = locals.block, bucks = locals.bucks, css = locals.css, extraCss = locals.extraCss, field = locals.field, fields = locals.fields, forEach = locals.forEach, head = locals.head, label = locals.label, ladder = locals.ladder, maxRate = locals.maxRate, name = locals.name, note = locals.note, notice = locals.notice, pageTitle = locals.pageTitle, partials = locals.partials, rank = locals.rank, row = locals.row, sidebar = locals.sidebar, status = locals.status, tickets = locals.tickets, username = locals.username, v = locals.v, value = locals.value, viewer = locals.viewer, visits = locals.visits;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append( include('../partials/head', { pageTitle: pageTitle, extraCss: '/css/admin.css?v=1' }) )
    ; __append("\r\n<link rel=\"stylesheet\" href=\"/css/admin-mod.css\">\r\n\r\n<div class=\"fb-admin\">\r\n  <div class=\"fb-admin__bar\">\r\n    <div class=\"fb-admin__brand\">\r\n      <a class=\"fb-admin__logo\" href=\"/admin\">FieldBrik</a>\r\n      <span class=\"fb-admin__logo-tag\">Administration</span>\r\n    </div>\r\n    <div class=\"fb-admin__who\">\r\n      <strong>")
    ; __append(escapeFn( viewer.username ))
    ; __append("</strong> &middot; ")
    ; __append(escapeFn( admin.name ))
    ; __append(" (rank ")
    ; __append(escapeFn( admin.rank ))
    ; __append(") &middot;\r\n      <a href=\"/\">Back to the site</a>\r\n    </div>\r\n    ")
    ; __append( include('status', { adminStatus: adminStatus }) )
    ; __append("\r\n  </div>\r\n\r\n  <div class=\"fb-admin__body\">\r\n    ")
    ; __append( include('sidebar', { adminNav: adminNav }) )
    ; __append("\r\n\r\n    <main class=\"fb-admin__main\">\r\n      ")
    ;  if (notice) { 
    ; __append("\r\n        <div class=\"fb-notice fb-notice--admin\"><p><strong>")
    ; __append(escapeFn( notice ))
    ; __append("</strong></p></div>\r\n      ")
    ;  } 
    ; __append("\r\n\r\n      <div class=\"fb-panel\">\r\n        <h1 class=\"fb-panel__title fb-panel__title--blue\">Ticket Rates</h1>\r\n        <div class=\"fb-panel__body\">\r\n          <p class=\"fb-admin__muted\">\r\n            What an account earns for using the site. These numbers are read on every award, so a change\r\n            here applies from the next daily award and the next visit milestone - nothing already paid is\r\n            recalculated.\r\n          </p>\r\n\r\n          <form method=\"post\" action=\"/admin/earnings\">\r\n            ")
    ;  fields.forEach(function (field) { 
    ; __append("\r\n              <div class=\"fb-mod__field\">\r\n                <label for=\"fb-rate-")
    ; __append(escapeFn( field.name ))
    ; __append("\">")
    ; __append(escapeFn( field.label ))
    ; __append("</label>\r\n                <input id=\"fb-rate-")
    ; __append(escapeFn( field.name ))
    ; __append("\" type=\"number\" name=\"")
    ; __append(escapeFn( field.name ))
    ; __append("\" min=\"0\" max=\"")
    ; __append(escapeFn( maxRate ))
    ; __append("\" step=\"1\" value=\"")
    ; __append(escapeFn( field.value ))
    ; __append("\" required>\r\n                <p class=\"fb-admin__muted\">")
    ; __append(escapeFn( field.note ))
    ; __append("</p>\r\n              </div>\r\n            ")
    ;  }); 
    ; __append("\r\n\r\n            <button class=\"fb-btn fb-btn--primary\" type=\"submit\">Save rates</button>\r\n          </form>\r\n        </div>\r\n      </div>\r\n\r\n      <div class=\"fb-panel\">\r\n        <h2 class=\"fb-panel__title\">What a day is worth now</h2>\r\n        <div class=\"fb-panel__body fb-panel__body--flush\">\r\n          <table class=\"fb-table fb-table--admin\">\r\n            <thead>\r\n              <tr>\r\n                <th scope=\"col\">Account</th>\r\n                <th scope=\"col\">Tickets per day</th>\r\n                <th scope=\"col\">Bucks per day</th>\r\n              </tr>\r\n            </thead>\r\n            <tbody>\r\n              ")
    ;  ladder.forEach(function (row) { 
    ; __append("\r\n                <tr>\r\n                  <td>")
    ; __append(escapeFn( row.label ))
    ; __append("</td>\r\n                  <td>")
    ; __append(escapeFn( row.tickets ))
    ; __append("</td>\r\n                  <td>")
    ; __append(escapeFn( row.bucks > 0 ? row.bucks : '-' ))
    ; __append("</td>\r\n                </tr>\r\n              ")
    ;  }); 
    ; __append("\r\n            </tbody>\r\n          </table>\r\n        </div>\r\n        <p class=\"fb-panel__strip\">\r\n          Visits: every ")
    ; __append(escapeFn( visits.block ))
    ; __append(" visits on a place pays its owner ")
    ; __append(escapeFn( visits.tickets ))
    ; __append(" Tickets, once per milestone.\r\n        </p>\r\n      </div>\r\n\r\n      <p class=\"fb-admin__note\">\r\n        A daily award lands on the first page a member opens after midnight UTC, and is recorded once per\r\n        day in the ledger, so reloading cannot pay twice. Visit milestones are recorded per place and per\r\n        milestone for the same reason. Nothing in this pass increments a visit, because visiting a place\r\n        is not built yet.\r\n      </p>\r\n    </main>\r\n  </div>\r\n</div>\r\n\r\n</body>\r\n</html>\r\n")
  return __output;

},
  "admin/home": function anonymous(locals, escapeFn, include, rethrow
) {
var accounts = locals.accounts, admin = locals.admin, adminNav = locals.adminNav, adminStatus = locals.adminStatus, bans = locals.bans, counts = locals.counts, css = locals.css, extraCss = locals.extraCss, head = locals.head, live = locals.live, name = locals.name, pageTitle = locals.pageTitle, partials = locals.partials, places = locals.places, posts = locals.posts, rank = locals.rank, sidebar = locals.sidebar, staff = locals.staff, status = locals.status, threads = locals.threads, username = locals.username, v = locals.v, viewer = locals.viewer;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append( include('../partials/head', { pageTitle: pageTitle, extraCss: '/css/admin.css?v=1' }) )
    ; __append("\r\n\r\n<div class=\"fb-admin\">\r\n  <div class=\"fb-admin__bar\">\r\n    <div class=\"fb-admin__brand\">\r\n      <a class=\"fb-admin__logo\" href=\"/admin\">FieldBrik</a>\r\n      <span class=\"fb-admin__logo-tag\">Administration</span>\r\n    </div>\r\n    <div class=\"fb-admin__who\">\r\n      <strong>")
    ; __append(escapeFn( viewer.username ))
    ; __append("</strong> &middot; ")
    ; __append(escapeFn( admin.name ))
    ; __append(" (rank ")
    ; __append(escapeFn( admin.rank ))
    ; __append(") &middot;\r\n      <a href=\"/\">Back to the site</a>\r\n    </div>\r\n    ")
    ; __append( include('status', { adminStatus: adminStatus }) )
    ; __append("\r\n  </div>\r\n\r\n  <div class=\"fb-admin__body\">\r\n    ")
    ; __append( include('sidebar', { adminNav: adminNav }) )
    ; __append("\r\n\r\n    <main class=\"fb-admin__main\">\r\n      <div class=\"fb-panel\">\r\n        <h1 class=\"fb-panel__title fb-panel__title--blue\">Administration Home</h1>\r\n        <div class=\"fb-panel__body\">\r\n          <h2 class=\"fb-admin__heading\">FieldBrik Administration Panel</h2>\r\n\r\n          <p>Welcome to the FieldBrik Administration Panel.</p>\r\n          <p>Use the menu on the left to manage users, content, moderation and system settings.</p>\r\n          <p>This area is restricted to authorized administrators only.</p>\r\n\r\n          <table class=\"fb-table fb-table--admin\">\r\n            <thead>\r\n              <tr>\r\n                <th scope=\"col\">What</th>\r\n                <th scope=\"col\">Count</th>\r\n                <th scope=\"col\">Note</th>\r\n              </tr>\r\n            </thead>\r\n            <tbody>\r\n              <tr>\r\n                <td>Accounts</td>\r\n                <td>")
    ; __append(escapeFn( counts.accounts ))
    ; __append("</td>\r\n                <td class=\"fb-table__note\">Open accounts only.</td>\r\n              </tr>\r\n              <tr>\r\n                <td>Staff accounts</td>\r\n                <td>")
    ; __append(escapeFn( counts.staff ))
    ; __append("</td>\r\n                <td class=\"fb-table__note\">Rank 50 and above.</td>\r\n              </tr>\r\n              <tr>\r\n                <td>Places</td>\r\n                <td>")
    ; __append(escapeFn( counts.places ))
    ; __append("</td>\r\n                <td class=\"fb-table__note\">")
    ; __append(escapeFn( counts.live ))
    ; __append(" published.</td>\r\n              </tr>\r\n              <tr>\r\n                <td>Forum threads</td>\r\n                <td>")
    ; __append(escapeFn( counts.threads ))
    ; __append("</td>\r\n                <td class=\"fb-table__note\">")
    ; __append(escapeFn( counts.posts ))
    ; __append(" posts.</td>\r\n              </tr>\r\n              <tr>\r\n                <td>Active bans</td>\r\n                <td>")
    ; __append(escapeFn( counts.bans ))
    ; __append("</td>\r\n                <td class=\"fb-table__note\">Bans that have not expired or been lifted.</td>\r\n              </tr>\r\n            </tbody>\r\n          </table>\r\n\r\n          <p class=\"fb-admin__note\">\r\n            This panel is being built in passes. Overview and the audit log exist now.\r\n            Searching accounts, moderation, memberships, billing and settings are wired\r\n            in the passes that follow, and until then the menu does not offer them:\r\n            a link that leads to nothing is worse than a missing one.\r\n          </p>\r\n        </div>\r\n      </div>\r\n    </main>\r\n  </div>\r\n</div>\r\n\r\n</body>\r\n</html>\r\n")
  return __output;

},
  "admin/logs": function anonymous(locals, escapeFn, include, rethrow
) {
var action = locals.action, actor = locals.actor, admin = locals.admin, adminNav = locals.adminNav, adminStatus = locals.adminStatus, css = locals.css, detail = locals.detail, entries = locals.entries, entry = locals.entry, extraCss = locals.extraCss, forEach = locals.forEach, head = locals.head, length = locals.length, name = locals.name, pageTitle = locals.pageTitle, partials = locals.partials, rank = locals.rank, sidebar = locals.sidebar, status = locals.status, target = locals.target, username = locals.username, v = locals.v, viewer = locals.viewer, when = locals.when;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append( include('../partials/head', { pageTitle: pageTitle, extraCss: '/css/admin.css?v=1' }) )
    ; __append("\r\n\r\n<div class=\"fb-admin\">\r\n  <div class=\"fb-admin__bar\">\r\n    <div class=\"fb-admin__brand\">\r\n      <a class=\"fb-admin__logo\" href=\"/admin\">FieldBrik</a>\r\n      <span class=\"fb-admin__logo-tag\">Administration</span>\r\n    </div>\r\n    <div class=\"fb-admin__who\">\r\n      <strong>")
    ; __append(escapeFn( viewer.username ))
    ; __append("</strong> &middot; ")
    ; __append(escapeFn( admin.name ))
    ; __append(" (rank ")
    ; __append(escapeFn( admin.rank ))
    ; __append(") &middot;\r\n      <a href=\"/\">Back to the site</a>\r\n    </div>\r\n    ")
    ; __append( include('status', { adminStatus: adminStatus }) )
    ; __append("\r\n  </div>\r\n\r\n  <div class=\"fb-admin__body\">\r\n    ")
    ; __append( include('sidebar', { adminNav: adminNav }) )
    ; __append("\r\n\r\n    <main class=\"fb-admin__main\">\r\n      <div class=\"fb-panel\">\r\n        <h1 class=\"fb-panel__title fb-panel__title--blue\">Audit Log</h1>\r\n        <div class=\"fb-panel__body fb-panel__body--flush\">\r\n          <table class=\"fb-table fb-table--admin\">\r\n            <thead>\r\n              <tr>\r\n                <th scope=\"col\">When</th>\r\n                <th scope=\"col\">Actor</th>\r\n                <th scope=\"col\">Account</th>\r\n                <th scope=\"col\">Action</th>\r\n                <th scope=\"col\">Detail</th>\r\n              </tr>\r\n            </thead>\r\n            <tbody>\r\n              ")
    ;  if (entries.length === 0) { 
    ; __append("\r\n                <tr>\r\n                  <td colspan=\"5\" class=\"fb-table__last\">Nothing has been logged yet.</td>\r\n                </tr>\r\n              ")
    ;  } 
    ; __append("\r\n              ")
    ;  entries.forEach(function (entry) { 
    ; __append("\r\n                <tr>\r\n                  <td class=\"fb-table__last\">")
    ; __append(escapeFn( entry.when ))
    ; __append("</td>\r\n                  <td>")
    ; __append(escapeFn( entry.actor ))
    ; __append("</td>\r\n                  <td>")
    ; __append(escapeFn( entry.target ))
    ; __append("</td>\r\n                  <td>")
    ; __append(escapeFn( entry.action ))
    ; __append("</td>\r\n                  <td class=\"fb-table__note\">")
    ; __append(escapeFn( entry.detail ))
    ; __append("</td>\r\n                </tr>\r\n              ")
    ;  }); 
    ; __append("\r\n            </tbody>\r\n          </table>\r\n        </div>\r\n      </div>\r\n\r\n      <p class=\"fb-admin__note\">\r\n        Newest first, last 100 entries. The log is append-only: there is no edit or\r\n        delete path anywhere in the panel, which is the only reason it can be used to\r\n        explain a decision later.\r\n      </p>\r\n    </main>\r\n  </div>\r\n</div>\r\n\r\n</body>\r\n</html>\r\n")
  return __output;

},
  "admin/moderate": function anonymous(locals, escapeFn, include, rethrow
) {
var account = locals.account, action = locals.action, actions = locals.actions, actor = locals.actor, admin = locals.admin, adminNav = locals.adminNav, adminStatus = locals.adminStatus, author = locals.author, body = locals.body, canAct = locals.canAct, checked = locals.checked, css = locals.css, entry = locals.entry, expires = locals.expires, extraCss = locals.extraCss, forEach = locals.forEach, head = locals.head, id = locals.id, index = locals.index, issued = locals.issued, joined = locals.joined, key = locals.key, kind = locals.kind, label = locals.label, length = locals.length, lifted = locals.lifted, name = locals.name, notes = locals.notes, notice = locals.notice, pageTitle = locals.pageTitle, partials = locals.partials, preset = locals.preset, presets = locals.presets, rank = locals.rank, reason = locals.reason, restrictions = locals.restrictions, roleName = locals.roleName, roleRank = locals.roleRank, scrubbedFrom = locals.scrubbedFrom, sidebar = locals.sidebar, status = locals.status, username = locals.username, v = locals.v, viewer = locals.viewer, when = locals.when;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append( include('../partials/head', { pageTitle: pageTitle, extraCss: '/css/admin.css?v=1' }) )
    ; __append("\r\n<link rel=\"stylesheet\" href=\"/css/admin-mod.css\">\r\n\r\n<div class=\"fb-admin\">\r\n  <div class=\"fb-admin__bar\">\r\n    <div class=\"fb-admin__brand\">\r\n      <a class=\"fb-admin__logo\" href=\"/admin\">FieldBrik</a>\r\n      <span class=\"fb-admin__logo-tag\">Administration</span>\r\n    </div>\r\n    <div class=\"fb-admin__who\">\r\n      <strong>")
    ; __append(escapeFn( viewer.username ))
    ; __append("</strong> &middot; ")
    ; __append(escapeFn( admin.name ))
    ; __append(" (rank ")
    ; __append(escapeFn( admin.rank ))
    ; __append(") &middot;\r\n      <a href=\"/\">Back to the site</a>\r\n    </div>\r\n    ")
    ; __append( include('status', { adminStatus: adminStatus }) )
    ; __append("\r\n  </div>\r\n\r\n  <div class=\"fb-admin__body\">\r\n    ")
    ; __append( include('sidebar', { adminNav: adminNav }) )
    ; __append("\r\n\r\n    <main class=\"fb-admin__main\">\r\n      ")
    ;  if (notice) { 
    ; __append("\r\n        <div class=\"fb-notice fb-notice--admin\"><p><strong>")
    ; __append(escapeFn( notice ))
    ; __append("</strong></p></div>\r\n      ")
    ;  } 
    ; __append("\r\n\r\n      <div class=\"fb-panel\">\r\n        <h1 class=\"fb-panel__title fb-panel__title--blue\">Moderate: ")
    ; __append(escapeFn( account.username ))
    ; __append("</h1>\r\n        <div class=\"fb-panel__body\">\r\n          <p class=\"fb-admin__muted\">\r\n            Account <strong>")
    ; __append(escapeFn( account.id ))
    ; __append("</strong> &middot; ")
    ; __append(escapeFn( account.roleName ))
    ; __append(" (rank ")
    ; __append(escapeFn( account.roleRank ))
    ; __append(")\r\n            &middot; ")
    ; __append(escapeFn( account.status ))
    ; __append(" &middot; joined ")
    ; __append(escapeFn( account.joined ))
    ; __append("\r\n          </p>\r\n\r\n          ")
    ;  if (scrubbedFrom) { 
    ; __append("\r\n            <p class=\"fb-admin__muted\">\r\n              Original username: <strong>")
    ; __append(escapeFn( scrubbedFrom ))
    ; __append("</strong> (scrubbed; staff only)\r\n            </p>\r\n          ")
    ;  } 
    ; __append("\r\n\r\n          ")
    ;  if (!canAct) { 
    ; __append("\r\n            <p><strong>This account cannot be actioned from here.</strong>\r\n              It is either your own account or at or above your rank.</p>\r\n          ")
    ;  } else { 
    ; __append("\r\n            <form method=\"post\" action=\"/admin/users/")
    ; __append(escapeFn( account.id ))
    ; __append("/action\" enctype=\"multipart/form-data\">\r\n              <fieldset class=\"fb-mod__actions\">\r\n                <legend class=\"fb-admin__subheading\">Action</legend>\r\n                ")
    ;  actions.forEach(function (action, index) { 
    ; __append("\r\n                  <label class=\"fb-mod__choice\">\r\n                    <input type=\"radio\" name=\"action\" value=\"")
    ; __append(escapeFn( action.key ))
    ; __append("\"")
    ; __append(escapeFn( index === 0 ? ' checked' : '' ))
    ; __append(">\r\n                    ")
    ; __append(escapeFn( action.label ))
    ; __append("\r\n                  </label>\r\n                ")
    ;  }); 
    ; __append("\r\n              </fieldset>\r\n\r\n              <div class=\"fb-mod__presets\">\r\n                <span class=\"fb-admin__muted\">Fill the reason:</span>\r\n                ")
    ;  presets.forEach(function (preset) { 
    ; __append("\r\n                  <button class=\"fb-btn fb-btn--preset\" type=\"button\" data-reason=\"")
    ; __append(escapeFn( preset ))
    ; __append("\">")
    ; __append(escapeFn( preset ))
    ; __append("</button>\r\n                ")
    ;  }); 
    ; __append("\r\n              </div>\r\n\r\n              <div class=\"fb-mod__field\">\r\n                <label for=\"fb-reason\">Reason (shown to the member on the ban page)</label>\r\n                <input id=\"fb-reason\" type=\"text\" name=\"reason\" maxlength=\"500\" autocomplete=\"off\">\r\n              </div>\r\n\r\n              <div class=\"fb-mod__field\">\r\n                <label for=\"fb-note\">Internal note (staff only, never shown to the member)</label>\r\n                <textarea id=\"fb-note\" name=\"note\" rows=\"3\" maxlength=\"500\"></textarea>\r\n              </div>\r\n\r\n              <div class=\"fb-mod__field\">\r\n                <label for=\"fb-evidence\">Evidence image (optional, 128 KB max, png/jpeg/webp)</label>\r\n                <input id=\"fb-evidence\" type=\"file\" name=\"evidence\" accept=\"image/png,image/jpeg,image/webp\">\r\n              </div>\r\n\r\n              <label class=\"fb-mod__check\">\r\n                <input type=\"checkbox\" name=\"scrub\" value=\"1\">\r\n                Also scrub the username to CONTENT_DELETED_&lt;id&gt; (locks the account out)\r\n              </label>\r\n\r\n              <button class=\"fb-btn fb-btn--primary\" type=\"submit\">Apply</button>\r\n            </form>\r\n          ")
    ;  } 
    ; __append("\r\n        </div>\r\n      </div>\r\n\r\n      <div class=\"fb-panel\">\r\n        <h2 class=\"fb-panel__title\">Restrictions and warnings</h2>\r\n        <div class=\"fb-panel__body fb-panel__body--flush\">\r\n          <table class=\"fb-table fb-table--admin\">\r\n            <thead>\r\n              <tr>\r\n                <th scope=\"col\">Kind</th>\r\n                <th scope=\"col\">Reason</th>\r\n                <th scope=\"col\">By</th>\r\n                <th scope=\"col\">Issued</th>\r\n                <th scope=\"col\">Ends</th>\r\n                <th scope=\"col\">Lifted</th>\r\n              </tr>\r\n            </thead>\r\n            <tbody>\r\n              ")
    ;  if (restrictions.length === 0) { 
    ; __append("\r\n                <tr><td colspan=\"6\" class=\"fb-table__last\">Nothing on record.</td></tr>\r\n              ")
    ;  } 
    ; __append("\r\n              ")
    ;  restrictions.forEach(function (entry) { 
    ; __append("\r\n                <tr>\r\n                  <td>")
    ; __append(escapeFn( entry.kind ))
    ; __append("</td>\r\n                  <td class=\"fb-table__note\">")
    ; __append(escapeFn( entry.reason ))
    ; __append("</td>\r\n                  <td>")
    ; __append(escapeFn( entry.actor ))
    ; __append("</td>\r\n                  <td>")
    ; __append(escapeFn( entry.issued ))
    ; __append("</td>\r\n                  <td>")
    ; __append(escapeFn( entry.expires ))
    ; __append("</td>\r\n                  <td>")
    ; __append(escapeFn( entry.lifted ? entry.lifted : '-' ))
    ; __append("</td>\r\n                </tr>\r\n              ")
    ;  }); 
    ; __append("\r\n            </tbody>\r\n          </table>\r\n        </div>\r\n      </div>\r\n\r\n      <div class=\"fb-panel\">\r\n        <h2 class=\"fb-panel__title\">Internal notes</h2>\r\n        <div class=\"fb-panel__body fb-panel__body--flush\">\r\n          <table class=\"fb-table fb-table--admin\">\r\n            <thead>\r\n              <tr>\r\n                <th scope=\"col\">When</th>\r\n                <th scope=\"col\">By</th>\r\n                <th scope=\"col\">Note</th>\r\n              </tr>\r\n            </thead>\r\n            <tbody>\r\n              ")
    ;  if (notes.length === 0) { 
    ; __append("\r\n                <tr><td colspan=\"3\" class=\"fb-table__last\">No notes yet.</td></tr>\r\n              ")
    ;  } 
    ; __append("\r\n              ")
    ;  notes.forEach(function (entry) { 
    ; __append("\r\n                <tr>\r\n                  <td>")
    ; __append(escapeFn( entry.when ))
    ; __append("</td>\r\n                  <td>")
    ; __append(escapeFn( entry.author ))
    ; __append("</td>\r\n                  <td class=\"fb-table__note\">")
    ; __append(escapeFn( entry.body ))
    ; __append("</td>\r\n                </tr>\r\n              ")
    ;  }); 
    ; __append("\r\n            </tbody>\r\n          </table>\r\n        </div>\r\n      </div>\r\n\r\n      <p class=\"fb-admin__note\">\r\n        Warnings and bans are enforced on every request, not just at sign-in, so an\r\n        action applies immediately. A ban keeps the account's session alive on purpose:\r\n        the ban page needs to know who is asking in order to tell them why.\r\n      </p>\r\n    </main>\r\n  </div>\r\n</div>\r\n\r\n<script>\r\n  document.querySelectorAll('[data-reason]').forEach(function (button) {\r\n    button.addEventListener('click', function () {\r\n      var field = document.getElementById('fb-reason');\r\n      if (field) field.value = button.getAttribute('data-reason');\r\n    });\r\n  });\r\n</script>\r\n</body>\r\n</html>\r\n")
  return __output;

},
  "admin/news": function anonymous(locals, escapeFn, include, rethrow
) {
var Publish = locals.Publish, Unpublish = locals.Unpublish, admin = locals.admin, adminNav = locals.adminNav, adminStatus = locals.adminStatus, article = locals.article, articles = locals.articles, author = locals.author, category = locals.category, css = locals.css, date = locals.date, draft = locals.draft, drafts = locals.drafts, extraCss = locals.extraCss, forEach = locals.forEach, head = locals.head, id = locals.id, length = locals.length, name = locals.name, news = locals.news, not = locals.not, notice = locals.notice, on = locals.on, pageTitle = locals.pageTitle, partials = locals.partials, published = locals.published, rank = locals.rank, s = locals.s, sidebar = locals.sidebar, site = locals.site, slug = locals.slug, status = locals.status, the = locals.the, title = locals.title, username = locals.username, v = locals.v, viewer = locals.viewer;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append( include('../partials/head', { pageTitle: pageTitle, extraCss: '/css/admin.css?v=1' }) )
    ; __append("\n<link rel=\"stylesheet\" href=\"/css/admin-mod.css\">\n\n<div class=\"fb-admin\">\n  <div class=\"fb-admin__bar\">\n    <div class=\"fb-admin__brand\">\n      <a class=\"fb-admin__logo\" href=\"/admin\">FieldBrik</a>\n      <span class=\"fb-admin__logo-tag\">Administration</span>\n    </div>\n    <div class=\"fb-admin__who\">\n      <strong>")
    ; __append(escapeFn( viewer.username ))
    ; __append("</strong> &middot; ")
    ; __append(escapeFn( admin.name ))
    ; __append(" (rank ")
    ; __append(escapeFn( admin.rank ))
    ; __append(") &middot;\n      <a href=\"/\">Back to the site</a>\n    </div>\n    ")
    ; __append( include('status', { adminStatus: adminStatus }) )
    ; __append("\n  </div>\n\n  <div class=\"fb-admin__body\">\n    ")
    ; __append( include('sidebar', { adminNav: adminNav }) )
    ; __append("\n\n    <main class=\"fb-admin__main\">\n      ")
    ;  if (notice) { 
    ; __append("\n        <div class=\"fb-notice fb-notice--admin\"><p><strong>")
    ; __append(escapeFn( notice ))
    ; __append("</strong></p></div>\n      ")
    ;  } 
    ; __append("\n\n      <div class=\"fb-panel\">\n        <h1 class=\"fb-panel__title fb-panel__title--blue\">News</h1>\n        <div class=\"fb-panel__body fb-panel__body--flush\">\n          <table class=\"fb-table fb-table--admin\">\n            <thead>\n              <tr>\n                <th scope=\"col\">Article</th>\n                <th scope=\"col\">Category</th>\n                <th scope=\"col\">Author</th>\n                <th scope=\"col\">Date</th>\n                <th scope=\"col\">Status</th>\n                <th scope=\"col\"></th>\n              </tr>\n            </thead>\n            <tbody>\n              ")
    ;  if (articles.length === 0) { 
    ; __append("\n                <tr><td colspan=\"6\" class=\"fb-table__last\">No articles yet. Write the first one below.</td></tr>\n              ")
    ;  } 
    ; __append("\n              ")
    ;  articles.forEach(function (article) { 
    ; __append("\n                <tr>\n                  <td>\n                    <strong>")
    ; __append(escapeFn( article.title ))
    ; __append("</strong><br>\n                    <span class=\"fb-muted\">")
    ; __append(escapeFn( article.published ? '/news/' + article.slug : 'not on the site' ))
    ; __append("</span>\n                  </td>\n                  <td>")
    ; __append(escapeFn( article.category ))
    ; __append("</td>\n                  <td>")
    ; __append(escapeFn( article.author ))
    ; __append("</td>\n                  <td>")
    ; __append(escapeFn( article.published ? article.date : '-' ))
    ; __append("</td>\n                  <td>")
    ; __append(escapeFn( article.published ? 'published' : 'draft' ))
    ; __append("</td>\n                  <td>\n                    <a class=\"fb-btn\" href=\"/admin/news/")
    ; __append(escapeFn( article.id ))
    ; __append("\">Edit</a>\n                    <form class=\"fb-inline\" method=\"post\" action=\"/admin/news/")
    ; __append(escapeFn( article.id ))
    ; __append("/status\">\n                      <input type=\"hidden\" name=\"published\" value=\"")
    ; __append(escapeFn( article.published ? '0' : '1' ))
    ; __append("\">\n                      <button class=\"fb-btn\" type=\"submit\">")
    ; __append(escapeFn( article.published ? 'Unpublish' : 'Publish' ))
    ; __append("</button>\n                    </form>\n                  </td>\n                </tr>\n              ")
    ;  }); 
    ; __append("\n            </tbody>\n          </table>\n        </div>\n      </div>\n\n      <p><a class=\"fb-btn fb-btn--primary\" href=\"/admin/news/new\">Write an article</a></p>\n\n      <p class=\"fb-admin__note\">\n        Publishing puts an article in the news list, in the category facets and in the home page's\n        Latest News panel. Unpublishing it makes it a draft again: the article stays here, its URL\n        stops resolving, and publishing it again puts it back. ")
    ; __append(escapeFn( drafts ))
    ; __append(" draft")
    ; __append(escapeFn( drafts === 1 ? '' : 's' ))
    ; __append(" at the moment.\n        Articles are never deleted, because a published URL may already be linked elsewhere.\n      </p>\n    </main>\n  </div>\n</div>\n\n</body>\n</html>\n")
  return __output;

},
  "admin/news-edit": function anonymous(locals, escapeFn, include, rethrow
) {
var Change = locals.Change, Create = locals.Create, Edit = locals.Edit, New = locals.New, Publish = locals.Publish, Save = locals.Save, Unpublish = locals.Unpublish, Write = locals.Write, admin = locals.admin, adminNav = locals.adminNav, adminStatus = locals.adminStatus, article = locals.article, author = locals.author, body = locals.body, bodyMax = locals.bodyMax, categories = locals.categories, category = locals.category, changes = locals.changes, css = locals.css, draft = locals.draft, extraCss = locals.extraCss, failure = locals.failure, forEach = locals.forEach, head = locals.head, id = locals.id, isNew = locals.isNew, it = locals.it, name = locals.name, news = locals.news, notice = locals.notice, pageTitle = locals.pageTitle, partials = locals.partials, published = locals.published, rank = locals.rank, selected = locals.selected, sidebar = locals.sidebar, slug = locals.slug, status = locals.status, summary = locals.summary, summaryMax = locals.summaryMax, title = locals.title, titleMax = locals.titleMax, username = locals.username, v = locals.v, viewer = locals.viewer;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append( include('../partials/head', { pageTitle: pageTitle, extraCss: '/css/admin.css?v=1' }) )
    ; __append("\n<link rel=\"stylesheet\" href=\"/css/admin-mod.css\">\n\n<div class=\"fb-admin\">\n  <div class=\"fb-admin__bar\">\n    <div class=\"fb-admin__brand\">\n      <a class=\"fb-admin__logo\" href=\"/admin\">FieldBrik</a>\n      <span class=\"fb-admin__logo-tag\">Administration</span>\n    </div>\n    <div class=\"fb-admin__who\">\n      <strong>")
    ; __append(escapeFn( viewer.username ))
    ; __append("</strong> &middot; ")
    ; __append(escapeFn( admin.name ))
    ; __append(" (rank ")
    ; __append(escapeFn( admin.rank ))
    ; __append(") &middot;\n      <a href=\"/\">Back to the site</a>\n    </div>\n    ")
    ; __append( include('status', { adminStatus: adminStatus }) )
    ; __append("\n  </div>\n\n  <div class=\"fb-admin__body\">\n    ")
    ; __append( include('sidebar', { adminNav: adminNav }) )
    ; __append("\n\n    <main class=\"fb-admin__main\">\n      ")
    ;  if (notice) { 
    ; __append("\n        <div class=\"fb-notice fb-notice--admin\"><p><strong>")
    ; __append(escapeFn( notice ))
    ; __append("</strong></p></div>\n      ")
    ;  } 
    ; __append("\n      ")
    ;  if (failure) { 
    ; __append("\n        <div class=\"fb-notice fb-notice--admin\"><p><strong>")
    ; __append(escapeFn( failure ))
    ; __append("</strong></p></div>\n      ")
    ;  } 
    ; __append("\n\n      <div class=\"fb-panel\">\n        <h1 class=\"fb-panel__title fb-panel__title--blue\">")
    ; __append(escapeFn( isNew ? 'New article' : 'Edit article' ))
    ; __append("</h1>\n        <div class=\"fb-panel__body\">\n          ")
    ;  if (!isNew) { 
    ; __append("\n            <table class=\"fb-table fb-table--kv\">\n              <tbody>\n                <tr><th scope=\"row\">Article ID</th><td>")
    ; __append(escapeFn( article.id ))
    ; __append("</td></tr>\n                <tr><th scope=\"row\">Author</th><td>")
    ; __append(escapeFn( article.author ))
    ; __append("</td></tr>\n                <tr>\n                  <th scope=\"row\">Status</th>\n                  <td>\n                    ")
    ; __append(escapeFn( article.published ? 'published' : 'draft' ))
    ; __append("\n                    ")
    ;  if (article.published) { 
    ; __append("\n                      &middot; <a href=\"/news/")
    ; __append(escapeFn( article.slug ))
    ; __append("\">read it on the site</a>\n                    ")
    ;  } 
    ; __append("\n                  </td>\n                </tr>\n                <tr><th scope=\"row\">Address</th><td>/news/")
    ; __append(escapeFn( article.slug ))
    ; __append("</td></tr>\n              </tbody>\n            </table>\n          ")
    ;  } 
    ; __append("\n\n          <form method=\"post\" action=\"")
    ; __append(escapeFn( isNew ? '/admin/news' : '/admin/news/' + article.id ))
    ; __append("\">\n            <h2 class=\"fb-admin__heading\">")
    ; __append(escapeFn( isNew ? 'Write it' : 'Change it' ))
    ; __append("</h2>\n\n            <div class=\"fb-mod__field\">\n              <label for=\"fb-news-title\">Title</label>\n              <input id=\"fb-news-title\" type=\"text\" name=\"title\" maxlength=\"")
    ; __append(escapeFn( titleMax ))
    ; __append("\" required value=\"")
    ; __append(escapeFn( article.title ))
    ; __append("\">\n            </div>\n\n            <div class=\"fb-mod__field\">\n              <label for=\"fb-news-category\">Category</label>\n              <select id=\"fb-news-category\" name=\"category\">\n                ")
    ;  categories.forEach(function (name) { 
    ; __append("\n                  <option value=\"")
    ; __append(escapeFn( name ))
    ; __append("\"")
    ; __append(escapeFn( article.category === name ? ' selected' : '' ))
    ; __append(">")
    ; __append(escapeFn( name ))
    ; __append("</option>\n                ")
    ;  }); 
    ; __append("\n              </select>\n            </div>\n\n            <div class=\"fb-mod__field\">\n              <label for=\"fb-news-summary\">Summary (shown in the list, up to ")
    ; __append(escapeFn( summaryMax ))
    ; __append(" characters)</label>\n              <textarea id=\"fb-news-summary\" name=\"summary\" rows=\"3\" maxlength=\"")
    ; __append(escapeFn( summaryMax ))
    ; __append("\">")
    ; __append(escapeFn( article.summary ))
    ; __append("</textarea>\n            </div>\n\n            <div class=\"fb-mod__field\">\n              <label for=\"fb-news-body\">Article (leave a blank line between paragraphs)</label>\n              <textarea id=\"fb-news-body\" name=\"body\" rows=\"16\" maxlength=\"")
    ; __append(escapeFn( bodyMax ))
    ; __append("\" required>")
    ; __append(escapeFn( article.body ))
    ; __append("</textarea>\n            </div>\n\n            ")
    ;  if (isNew) { 
    ; __append("\n              <div class=\"fb-mod__field\">\n                <label for=\"fb-news-published\">When it is saved</label>\n                <select id=\"fb-news-published\" name=\"published\">\n                  <option value=\"0\">Save as a draft</option>\n                  <option value=\"1\">Publish it</option>\n                </select>\n              </div>\n            ")
    ;  } 
    ; __append("\n\n            <button class=\"fb-btn fb-btn--primary\" type=\"submit\">")
    ; __append(escapeFn( isNew ? 'Create article' : 'Save changes' ))
    ; __append("</button>\n          </form>\n\n          ")
    ;  if (!isNew) { 
    ; __append("\n            <form class=\"fb-inline\" method=\"post\" action=\"/admin/news/")
    ; __append(escapeFn( article.id ))
    ; __append("/status\">\n              <input type=\"hidden\" name=\"published\" value=\"")
    ; __append(escapeFn( article.published ? '0' : '1' ))
    ; __append("\">\n              <button class=\"fb-btn\" type=\"submit\">")
    ; __append(escapeFn( article.published ? 'Unpublish this article' : 'Publish this article' ))
    ; __append("</button>\n            </form>\n          ")
    ;  } 
    ; __append("\n        </div>\n      </div>\n\n      <p class=\"fb-panel__more\"><a href=\"/admin/news\">Back to the news list</a></p>\n    </main>\n  </div>\n</div>\n\n</body>\n</html>\n")
  return __output;

},
  "admin/referral": function anonymous(locals, escapeFn, include, rethrow
) {
var account = locals.account, admin = locals.admin, adminNav = locals.adminNav, adminStatus = locals.adminStatus, by = locals.by, canGrant = locals.canGrant, cap = locals.cap, css = locals.css, entry = locals.entry, extraCss = locals.extraCss, forEach = locals.forEach, head = locals.head, id = locals.id, length = locals.length, name = locals.name, notice = locals.notice, pageTitle = locals.pageTitle, partials = locals.partials, rank = locals.rank, referrals = locals.referrals, referred = locals.referred, reward = locals.reward, sidebar = locals.sidebar, status = locals.status, used = locals.used, username = locals.username, v = locals.v, viewer = locals.viewer, when = locals.when;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append( include('../partials/head', { pageTitle: pageTitle, extraCss: '/css/admin.css?v=1' }) )
    ; __append("\r\n<link rel=\"stylesheet\" href=\"/css/admin-mod.css\">\r\n\r\n<div class=\"fb-admin\">\r\n  <div class=\"fb-admin__bar\">\r\n    <div class=\"fb-admin__brand\">\r\n      <a class=\"fb-admin__logo\" href=\"/admin\">FieldBrik</a>\r\n      <span class=\"fb-admin__logo-tag\">Administration</span>\r\n    </div>\r\n    <div class=\"fb-admin__who\">\r\n      <strong>")
    ; __append(escapeFn( viewer.username ))
    ; __append("</strong> &middot; ")
    ; __append(escapeFn( admin.name ))
    ; __append(" (rank ")
    ; __append(escapeFn( admin.rank ))
    ; __append(") &middot;\r\n      <a href=\"/\">Back to the site</a>\r\n    </div>\r\n    ")
    ; __append( include('status', { adminStatus: adminStatus }) )
    ; __append("\r\n  </div>\r\n\r\n  <div class=\"fb-admin__body\">\r\n    ")
    ; __append( include('sidebar', { adminNav: adminNav }) )
    ; __append("\r\n\r\n    <main class=\"fb-admin__main\">\r\n      ")
    ;  if (notice) { 
    ; __append("\r\n        <div class=\"fb-notice fb-notice--admin\"><p><strong>")
    ; __append(escapeFn( notice ))
    ; __append("</strong></p></div>\r\n      ")
    ;  } 
    ; __append("\r\n\r\n      <div class=\"fb-panel\">\r\n        <h1 class=\"fb-panel__title fb-panel__title--blue\">Referral Program: ")
    ; __append(escapeFn( account.username ))
    ; __append("</h1>\r\n        <div class=\"fb-panel__body\">\r\n          <p class=\"fb-admin__muted\">\r\n            Account <strong>")
    ; __append(escapeFn( account.id ))
    ; __append("</strong> &middot; ")
    ; __append(escapeFn( used ))
    ; __append(" of ")
    ; __append(escapeFn( cap ))
    ; __append(" referrals used\r\n            &middot; each one pays ")
    ; __append(escapeFn( reward ))
    ; __append(" Bucks through the ledger\r\n          </p>\r\n\r\n          ")
    ;  if (canGrant) { 
    ; __append("\r\n            <form method=\"post\" action=\"/admin/users/")
    ; __append(escapeFn( account.id ))
    ; __append("/referral\">\r\n              <h2 class=\"fb-admin__heading\">Grant a referral</h2>\r\n              <p class=\"fb-admin__muted\">\r\n                The account that was referred, by ID or username. An account can only be somebody's\r\n                referral once, and this account stops at ")
    ; __append(escapeFn( cap ))
    ; __append(".\r\n              </p>\r\n              <div class=\"fb-mod__field\">\r\n                <label for=\"fb-referred\">Referred account</label>\r\n                <input id=\"fb-referred\" type=\"text\" name=\"referred\" maxlength=\"60\" autocomplete=\"off\">\r\n              </div>\r\n              <button class=\"fb-btn fb-btn--primary\" type=\"submit\">Grant referral</button>\r\n            </form>\r\n          ")
    ;  } else { 
    ; __append("\r\n            <p>\r\n              <strong>Your role cannot grant a referral.</strong>\r\n              Junior Administrator and above can; this account's referrals are still listed below.\r\n            </p>\r\n          ")
    ;  } 
    ; __append("\r\n        </div>\r\n      </div>\r\n\r\n      <div class=\"fb-panel\">\r\n        <h2 class=\"fb-panel__title\">Referrals</h2>\r\n        <div class=\"fb-panel__body fb-panel__body--flush\">\r\n          <table class=\"fb-table fb-table--admin\">\r\n            <thead>\r\n              <tr>\r\n                <th scope=\"col\">Referred account</th>\r\n                <th scope=\"col\">Reward</th>\r\n                <th scope=\"col\">Granted by</th>\r\n                <th scope=\"col\">When</th>\r\n              </tr>\r\n            </thead>\r\n            <tbody>\r\n              ")
    ;  if (referrals.length === 0) { 
    ; __append("\r\n                <tr><td colspan=\"4\" class=\"fb-table__last\">No referral has been granted on this account.</td></tr>\r\n              ")
    ;  } 
    ; __append("\r\n              ")
    ;  referrals.forEach(function (entry) { 
    ; __append("\r\n                <tr>\r\n                  <td><a href=\"/admin/users?q=")
    ; __append(escapeFn( encodeURIComponent(entry.referred) ))
    ; __append("\">")
    ; __append(escapeFn( entry.referred ))
    ; __append("</a></td>\r\n                  <td>")
    ; __append(escapeFn( entry.reward ))
    ; __append(" Bucks</td>\r\n                  <td>")
    ; __append(escapeFn( entry.by ))
    ; __append("</td>\r\n                  <td>")
    ; __append(escapeFn( entry.when ))
    ; __append("</td>\r\n                </tr>\r\n              ")
    ;  }); 
    ; __append("\r\n            </tbody>\r\n          </table>\r\n        </div>\r\n      </div>\r\n\r\n      <p class=\"fb-admin__note\">\r\n        The reward is a ledger entry, never a bare balance change, so the account's balance can\r\n        always be explained by the entries that produced it. The badge is granted with it and\r\n        nothing here is removed if the grant is regretted later: the record is the record.\r\n      </p>\r\n    </main>\r\n  </div>\r\n</div>\r\n\r\n</body>\r\n</html>\r\n")
  return __output;

},
  "admin/reports": function anonymous(locals, escapeFn, include, rethrow
) {
var Dismissed = locals.Dismissed, Handled = locals.Handled, admin = locals.admin, adminNav = locals.adminNav, adminStatus = locals.adminStatus, closed = locals.closed, css = locals.css, detail = locals.detail, extraCss = locals.extraCss, forEach = locals.forEach, handled = locals.handled, handler = locals.handler, head = locals.head, id = locals.id, kindLabel = locals.kindLabel, length = locals.length, messageId = locals.messageId, messageSubject = locals.messageSubject, name = locals.name, no = locals.no, note = locals.note, notice = locals.notice, pageTitle = locals.pageTitle, partials = locals.partials, queue = locals.queue, rank = locals.rank, reasonLabel = locals.reasonLabel, report = locals.report, reporter = locals.reporter, reporterId = locals.reporterId, sidebar = locals.sidebar, status = locals.status, subject = locals.subject, target = locals.target, targetId = locals.targetId, unknown = locals.unknown, username = locals.username, v = locals.v, viewer = locals.viewer, when = locals.when;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append( include('../partials/head', { pageTitle: pageTitle, extraCss: '/css/admin.css?v=1' }) )
    ; __append("\r\n<link rel=\"stylesheet\" href=\"/css/admin-mod.css\">\r\n\r\n<div class=\"fb-admin\">\r\n  <div class=\"fb-admin__bar\">\r\n    <div class=\"fb-admin__brand\">\r\n      <a class=\"fb-admin__logo\" href=\"/admin\">FieldBrik</a>\r\n      <span class=\"fb-admin__logo-tag\">Administration</span>\r\n    </div>\r\n    <div class=\"fb-admin__who\">\r\n      <strong>")
    ; __append(escapeFn( viewer.username ))
    ; __append("</strong> &middot; ")
    ; __append(escapeFn( admin.name ))
    ; __append(" (rank ")
    ; __append(escapeFn( admin.rank ))
    ; __append(") &middot;\r\n      <a href=\"/\">Back to the site</a>\r\n    </div>\r\n    ")
    ; __append( include('status', { adminStatus: adminStatus }) )
    ; __append("\r\n  </div>\r\n\r\n  <div class=\"fb-admin__body\">\r\n    ")
    ; __append( include('sidebar', { adminNav: adminNav }) )
    ; __append("\r\n\r\n    <main class=\"fb-admin__main\">\r\n      ")
    ;  if (notice) { 
    ; __append("\r\n        <div class=\"fb-notice fb-notice--admin\"><p><strong>")
    ; __append(escapeFn( notice ))
    ; __append("</strong></p></div>\r\n      ")
    ;  } 
    ; __append("\r\n\r\n      <div class=\"fb-panel\">\r\n        <h1 class=\"fb-panel__title fb-panel__title--blue\">Abuse Reports</h1>\r\n        <div class=\"fb-panel__body fb-panel__body--flush\">\r\n          <table class=\"fb-table fb-table--admin\">\r\n            <thead>\r\n              <tr>\r\n                <th scope=\"col\">#</th>\r\n                <th scope=\"col\">Reported</th>\r\n                <th scope=\"col\">About</th>\r\n                <th scope=\"col\">Reported by</th>\r\n                <th scope=\"col\">What they said</th>\r\n                <th scope=\"col\">Received</th>\r\n                <th scope=\"col\">Close it</th>\r\n              </tr>\r\n            </thead>\r\n            <tbody>\r\n              ")
    ;  if (queue.length === 0) { 
    ; __append("\r\n                <tr><td colspan=\"7\" class=\"fb-table__last\">Nothing in the queue. That is a real zero: every report filed has been closed.</td></tr>\r\n              ")
    ;  } 
    ; __append("\r\n              ")
    ;  queue.forEach(function (report) { 
    ; __append("\r\n                <tr>\r\n                  <td>")
    ; __append(escapeFn( report.id ))
    ; __append("</td>\r\n                  <td>\r\n                    <a href=\"/admin/users/")
    ; __append(escapeFn( report.targetId ))
    ; __append("\">")
    ; __append(escapeFn( report.target ))
    ; __append("</a>\r\n                    <br><a class=\"fb-muted\" href=\"/people/")
    ; __append(escapeFn( encodeURIComponent(report.target) ))
    ; __append("\">profile</a>\r\n                  </td>\r\n                  <td>\r\n                    ")
    ; __append(escapeFn( report.kindLabel ))
    ; __append("\r\n                    ")
    ;  if (report.messageId) { 
    ; __append("\r\n                      <br><span class=\"fb-muted\">&ldquo;")
    ; __append(escapeFn( report.messageSubject || '(no subject)' ))
    ; __append("&rdquo;</span>\r\n                    ")
    ;  } 
    ; __append("\r\n                  </td>\r\n                  <td><a href=\"/admin/users/")
    ; __append(escapeFn( report.reporterId ))
    ; __append("\">")
    ; __append(escapeFn( report.reporter ))
    ; __append("</a></td>\r\n                  <td class=\"fb-table__note\">\r\n                    <strong>")
    ; __append(escapeFn( report.reasonLabel ))
    ; __append("</strong>\r\n                    ")
    ;  if (report.detail) { 
    ; __append("<br>")
    ; __append(escapeFn( report.detail ))
    ;  } else { 
    ; __append("<br><span class=\"fb-muted\">no explanation given</span>")
    ;  } 
    ; __append("\r\n                  </td>\r\n                  <td>")
    ; __append(escapeFn( report.when ))
    ; __append("</td>\r\n                  <td>\r\n                    <form method=\"post\" action=\"/admin/reports/")
    ; __append(escapeFn( report.id ))
    ; __append("/close\">\r\n                      <input type=\"text\" name=\"note\" maxlength=\"2000\" placeholder=\"Note (optional)\">\r\n                      <div class=\"fb-inline\">\r\n                        <button class=\"fb-btn fb-btn--primary\" type=\"submit\" name=\"action\" value=\"handled\">Handled</button>\r\n                        <button class=\"fb-btn\" type=\"submit\" name=\"action\" value=\"dismissed\">Dismiss</button>\r\n                      </div>\r\n                    </form>\r\n                    <a class=\"fb-btn\" href=\"/admin/users/")
    ; __append(escapeFn( report.targetId ))
    ; __append("/moderate\">Moderate</a>\r\n                  </td>\r\n                </tr>\r\n              ")
    ;  }); 
    ; __append("\r\n            </tbody>\r\n          </table>\r\n        </div>\r\n        <p class=\"fb-panel__strip\">\r\n          ")
    ; __append(escapeFn( queue.length ))
    ; __append(" open. Closing a report does not act on the account: use Moderate for a\r\n          warning, restriction or ban, and the report note records what you decided.\r\n        </p>\r\n      </div>\r\n\r\n      <div class=\"fb-panel\">\r\n        <h2 class=\"fb-panel__title\">Already closed</h2>\r\n        <div class=\"fb-panel__body fb-panel__body--flush\">\r\n          <table class=\"fb-table fb-table--admin\">\r\n            <thead>\r\n              <tr>\r\n                <th scope=\"col\">#</th>\r\n                <th scope=\"col\">Reported</th>\r\n                <th scope=\"col\">Reason</th>\r\n                <th scope=\"col\">Outcome</th>\r\n                <th scope=\"col\">By</th>\r\n                <th scope=\"col\">When</th>\r\n                <th scope=\"col\">Note</th>\r\n              </tr>\r\n            </thead>\r\n            <tbody>\r\n              ")
    ;  if (closed.length === 0) { 
    ; __append("\r\n                <tr><td colspan=\"7\" class=\"fb-table__last\">No report has been closed yet.</td></tr>\r\n              ")
    ;  } 
    ; __append("\r\n              ")
    ;  closed.forEach(function (report) { 
    ; __append("\r\n                <tr>\r\n                  <td>")
    ; __append(escapeFn( report.id ))
    ; __append("</td>\r\n                  <td><a href=\"/admin/users/")
    ; __append(escapeFn( report.targetId ))
    ; __append("\">")
    ; __append(escapeFn( report.target ))
    ; __append("</a></td>\r\n                  <td>")
    ; __append(escapeFn( report.reasonLabel ))
    ; __append("</td>\r\n                  <td>")
    ; __append(escapeFn( report.status === 'handled' ? 'Handled' : 'Dismissed' ))
    ; __append("</td>\r\n                  <td>")
    ; __append(escapeFn( report.handler || 'unknown' ))
    ; __append("</td>\r\n                  <td>")
    ; __append(escapeFn( report.handled ))
    ; __append("</td>\r\n                  <td class=\"fb-table__note\">")
    ; __append(escapeFn( report.note || '-' ))
    ; __append("</td>\r\n                </tr>\r\n              ")
    ;  }); 
    ; __append("\r\n            </tbody>\r\n          </table>\r\n        </div>\r\n      </div>\r\n\r\n      <p class=\"fb-admin__note\">\r\n        Every report filed by a member lands here and nowhere else: there is one queue rather than an\r\n        inbox per team. Closing one writes a line to the audit log with your name on it, so who\r\n        decided what, and when, can be read back later.\r\n      </p>\r\n    </main>\r\n  </div>\r\n</div>\r\n\r\n</body>\r\n</html>\r\n")
  return __output;

},
  "admin/sidebar": function anonymous(locals, escapeFn, include, rethrow
) {
var active = locals.active, admin = locals.admin, adminNav = locals.adminNav, aria = locals.aria, banners = locals.banners, current = locals.current, currentPath = locals.currentPath, forEach = locals.forEach, group = locals.group, href = locals.href, is = locals.is, item = locals.item, items = locals.items, label = locals.label, page = locals.page, rank = locals.rank;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append("\r\n<aside class=\"fb-admin__side\">\r\n  ")
    ;  adminNav.forEach(function (group) { 
    ; __append("\r\n    <div class=\"fb-sidenav\">\r\n      <div class=\"fb-sidenav__title\">")
    ; __append(escapeFn( group.label ))
    ; __append("</div>\r\n      ")
    ;  group.items.forEach(function (item) { 
    ; __append("\r\n        <a class=\"fb-sidenav__link")
    ; __append(escapeFn( item.active ? ' is-active' : '' ))
    ; __append("\" href=\"")
    ; __append(escapeFn( item.href ))
    ; __append("\"")
    ; __append(escapeFn( item.active ? ' aria-current="page"' : '' ))
    ; __append(">")
    ; __append(escapeFn( item.label ))
    ; __append("</a>\r\n      ")
    ;  }); 
    ; __append("\r\n    </div>\r\n  ")
    ;  }); 
    ; __append("\r\n\r\n  ")
    ;  if (typeof admin !== 'undefined' && admin && admin.rank >= 240) { 
    ; __append("\r\n    <div class=\"fb-sidenav\">\r\n      <div class=\"fb-sidenav__title\">Site</div>\r\n      <a class=\"fb-sidenav__link")
    ; __append(escapeFn( (typeof currentPath !== 'undefined' && currentPath === '/admin/banners') ? ' is-active' : '' ))
    ; __append("\" href=\"/admin/banners\"")
    ; __append(escapeFn( (typeof currentPath !== 'undefined' && currentPath === '/admin/banners') ? ' aria-current="page"' : '' ))
    ; __append(">Banners</a>\r\n    </div>\r\n  ")
    ;  } 
    ; __append("\r\n</aside>\r\n")
  return __output;

},
  "admin/status": function anonymous(locals, escapeFn, include, rethrow
) {
var adminStatus = locals.adminStatus, forEach = locals.forEach, line = locals.line;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append("\r\n<div class=\"fb-admin__status\">\r\n  ")
    ;  adminStatus.forEach(function (line) { 
    ; __append("\r\n    <span class=\"fb-admin__status-line\">")
    ; __append(escapeFn( line ))
    ; __append("</span>\r\n  ")
    ;  }); 
    ; __append("\r\n</div>\r\n")
  return __output;

},
  "admin/user": function anonymous(locals, escapeFn, include, rethrow
) {
var account = locals.account, action = locals.action, admin = locals.admin, adminNav = locals.adminNav, adminStatus = locals.adminStatus, art = locals.art, avatar = locals.avatar, badge = locals.badge, badges = locals.badges, balanceAfter = locals.balanceAfter, bucks = locals.bucks, canBadge = locals.canBadge, canChangeRole = locals.canChangeRole, canClub = locals.canClub, canIssue = locals.canIssue, canModerate = locals.canModerate, canReferral = locals.canReferral, color = locals.color, count = locals.count, css = locals.css, currency = locals.currency, delta = locals.delta, description = locals.description, detail = locals.detail, email = locals.email, empty = locals.empty, entry = locals.entry, expires = locals.expires, extraCss = locals.extraCss, forEach = locals.forEach, head = locals.head, id = locals.id, issued = locals.issued, joined = locals.joined, key = locals.key, kind = locals.kind, lastSeen = locals.lastSeen, lastUsed = locals.lastUsed, ledger = locals.ledger, length = locals.length, lifted = locals.lifted, log = locals.log, md = locals.md, member = locals.member, name = locals.name, not = locals.not, notice = locals.notice, pageTitle = locals.pageTitle, partials = locals.partials, rank = locals.rank, reason = locals.reason, record = locals.record, restrictions = locals.restrictions, role = locals.role, roleKey = locals.roleKey, roleName = locals.roleName, roleOptions = locals.roleOptions, roleRank = locals.roleRank, roleReason = locals.roleReason, selected = locals.selected, sessions = locals.sessions, sidebar = locals.sidebar, size = locals.size, status = locals.status, tickets = locals.tickets, username = locals.username, v = locals.v, viewer = locals.viewer, when = locals.when;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append( include('../partials/head', { pageTitle: pageTitle, extraCss: '/css/admin.css?v=1' }) )
    ; __append("\r\n\r\n<div class=\"fb-admin\">\r\n  <div class=\"fb-admin__bar\">\r\n    <div class=\"fb-admin__brand\">\r\n      <a class=\"fb-admin__logo\" href=\"/admin\">FieldBrik</a>\r\n      <span class=\"fb-admin__logo-tag\">Administration</span>\r\n    </div>\r\n    <div class=\"fb-admin__who\">\r\n      <strong>")
    ; __append(escapeFn( viewer.username ))
    ; __append("</strong> &middot; ")
    ; __append(escapeFn( admin.name ))
    ; __append(" (rank ")
    ; __append(escapeFn( admin.rank ))
    ; __append(") &middot;\r\n      <a href=\"/\">Back to the site</a>\r\n    </div>\r\n    ")
    ; __append( include('status', { adminStatus: adminStatus }) )
    ; __append("\r\n  </div>\r\n\r\n  <div class=\"fb-admin__body\">\r\n    ")
    ; __append( include('sidebar', { adminNav: adminNav }) )
    ; __append("\r\n\r\n    <main class=\"fb-admin__main\">\r\n      ")
    ;  if (notice) { 
    ; __append("\r\n        <div class=\"fb-notice fb-notice--admin\"><p><strong>")
    ; __append(escapeFn( notice ))
    ; __append("</strong></p></div>\r\n      ")
    ;  } 
    ; __append("\r\n\r\n      <div class=\"fb-panel\">\r\n        <h1 class=\"fb-panel__title fb-panel__title--blue\">Account: ")
    ; __append(escapeFn( account.username ))
    ; __append("</h1>\r\n        <div class=\"fb-panel__body\">\r\n          <div class=\"fb-account\">\r\n            <div class=\"fb-account__avatar\">\r\n              ")
    ; __append( include('../partials/avatar', { avatar: account.avatar, size: 'md' }) )
    ; __append("\r\n            </div>\r\n            <table class=\"fb-table fb-table--kv fb-account__facts\">\r\n              <tbody>\r\n                <tr><th scope=\"row\">Username</th><td><strong>")
    ; __append(escapeFn( account.username ))
    ; __append("</strong></td></tr>\r\n                <tr><th scope=\"row\">Account ID</th><td>")
    ; __append(escapeFn( account.id ))
    ; __append("</td></tr>\r\n                <tr><th scope=\"row\">Current role</th><td>")
    ; __append(escapeFn( account.roleName ))
    ; __append(" (rank ")
    ; __append(escapeFn( account.roleRank ))
    ; __append(")</td></tr>\r\n                <tr><th scope=\"row\">Status</th><td class=\"fb-status--")
    ; __append(escapeFn( account.status ))
    ; __append("\">")
    ; __append(escapeFn( account.status ))
    ; __append("</td></tr>\r\n                <tr><th scope=\"row\">Join date</th><td>")
    ; __append(escapeFn( account.joined ))
    ; __append("</td></tr>\r\n                <tr><th scope=\"row\">Last seen</th><td>")
    ; __append(escapeFn( account.lastSeen ))
    ; __append("</td></tr>\r\n                <tr><th scope=\"row\">Balances</th><td>")
    ; __append(escapeFn( account.tickets ))
    ; __append(" Tickets &middot; ")
    ; __append(escapeFn( account.bucks ))
    ; __append(" Bucks</td></tr>\r\n                <tr><th scope=\"row\">Email</th><td>")
    ; __append(escapeFn( account.email ? account.email : 'not set' ))
    ; __append("</td></tr>\r\n              </tbody>\r\n            </table>\r\n          </div>\r\n\r\n          <div class=\"fb-admin__actions\">\r\n            <a class=\"fb-btn\" href=\"/people/")
    ; __append(escapeFn( account.username ))
    ; __append("\">Visit Profile</a>\r\n            ")
    ;  if (canModerate) { 
    ; __append("\r\n              <a class=\"fb-btn\" href=\"/admin/users/")
    ; __append(escapeFn( account.id ))
    ; __append("/moderate\">Moderate User</a>\r\n            ")
    ;  } 
    ; __append("\r\n            ")
    ;  if (canClub) { 
    ; __append("\r\n              <a class=\"fb-btn\" href=\"/admin/users/")
    ; __append(escapeFn( account.id ))
    ; __append("/club\">Carpenters Club</a>\r\n            ")
    ;  } 
    ; __append("\r\n            ")
    ;  if (canReferral) { 
    ; __append("\r\n              <a class=\"fb-btn\" href=\"/admin/users/")
    ; __append(escapeFn( account.id ))
    ; __append("/referral\">Referral Program</a>\r\n            ")
    ;  } 
    ; __append("\r\n            ")
    ;  if (canIssue) { 
    ; __append("\r\n              <a class=\"fb-btn\" href=\"/admin/users/")
    ; __append(escapeFn( account.id ))
    ; __append("/currency\">Currency</a>\r\n            ")
    ;  } 
    ; __append("\r\n            <a class=\"fb-btn\" href=\"/admin/users/")
    ; __append(escapeFn( account.id ))
    ; __append("/badges\">Badges")
    ;  if (canBadge) { 
    ; __append(" and Awards")
    ;  } 
    ; __append("</a>\r\n            <a class=\"fb-btn\" href=\"/admin/users\">Back to search</a>\r\n          </div>\r\n\r\n          ")
    ;  if (canChangeRole) { 
    ; __append("\r\n            <form class=\"fb-roleform\" method=\"post\" action=\"/admin/users/")
    ; __append(escapeFn( account.id ))
    ; __append("/role\">\r\n              <h2 class=\"fb-admin__heading\">Change account role</h2>\r\n              <p class=\"fb-admin__muted\">\r\n                Only roles below your own rank are offered, and only Root may grant Root.\r\n                The same rules are checked again on the server.\r\n              </p>\r\n              <div class=\"fb-roleform__row\">\r\n                <label for=\"fb-role\">Role</label>\r\n                <select id=\"fb-role\" name=\"role\">\r\n                  <option value=\"member\"")
    ; __append(escapeFn( account.roleKey === 'member' ? ' selected' : '' ))
    ; __append(">Member (no staff role)</option>\r\n                  ")
    ;  roleOptions.forEach(function (role) { 
    ; __append("\r\n                    <option value=\"")
    ; __append(escapeFn( role.key ))
    ; __append("\"")
    ; __append(escapeFn( account.roleKey === role.key ? ' selected' : '' ))
    ; __append(">")
    ; __append(escapeFn( role.name ))
    ; __append(" (rank ")
    ; __append(escapeFn( role.rank ))
    ; __append(")</option>\r\n                  ")
    ;  }); 
    ; __append("\r\n                </select>\r\n                <button class=\"fb-btn fb-btn--primary\" type=\"submit\">Change Role</button>\r\n              </div>\r\n            </form>\r\n          ")
    ;  } else { 
    ; __append("\r\n            <p class=\"fb-roleform\">\r\n              <strong>Role cannot be changed here.</strong>\r\n              ")
    ; __append(escapeFn( roleReason ))
    ; __append("\r\n            </p>\r\n          ")
    ;  } 
    ; __append("\r\n        </div>\r\n      </div>\r\n\r\n      <div class=\"fb-panel\">\r\n        <h2 class=\"fb-panel__title\">Admin Record</h2>\r\n        <div class=\"fb-panel__body\">\r\n          <table class=\"fb-table fb-table--kv\">\r\n            <tbody>\r\n              <tr><th scope=\"row\">Active sessions</th><td>")
    ; __append(escapeFn( record.sessions.count ))
    ; __append(" (last used ")
    ; __append(escapeFn( record.sessions.lastUsed ))
    ; __append(")</td></tr>\r\n              <tr>\r\n                <th scope=\"row\">Badges</th>\r\n                <td>\r\n                  ")
    ;  if (record.badges.length === 0) { 
    ; __append("\r\n                    none\r\n                  ")
    ;  } else { 
    ; __append("\r\n                    <ul class=\"fb-grid--badges\">\r\n                      ")
    ;  record.badges.forEach(function (badge) { 
    ; __append("\r\n                        <li class=\"fb-badge\" title=\"")
    ; __append(escapeFn( badge.name ))
    ; __append(" - granted ")
    ; __append(escapeFn( badge.when ))
    ; __append("\">\r\n                          ")
    ;  if (badge.art) { 
    ; __append("\r\n                            <img class=\"fb-badge__art\" src=\"")
    ; __append(escapeFn( badge.art ))
    ; __append("\" alt=\"\" width=\"34\" height=\"34\">\r\n                          ")
    ;  } else { 
    ; __append("\r\n                            <span class=\"fb-badge__pip\" style=\"--badge: ")
    ; __append(escapeFn( badge.color ))
    ; __append(";\" aria-hidden=\"true\"></span>\r\n                          ")
    ;  } 
    ; __append("\r\n                          ")
    ; __append(escapeFn( badge.name ))
    ; __append("\r\n                        </li>\r\n                      ")
    ;  }); 
    ; __append("\r\n                    </ul>\r\n                  ")
    ;  } 
    ; __append("\r\n                </td>\r\n              </tr>\r\n              <tr><th scope=\"row\">Description</th><td>")
    ; __append(escapeFn( account.description ? account.description : 'empty' ))
    ; __append("</td></tr>\r\n            </tbody>\r\n          </table>\r\n\r\n          <h3 class=\"fb-admin__subheading\">Restrictions and warnings</h3>\r\n          <table class=\"fb-table fb-table--admin\">\r\n            <thead>\r\n              <tr>\r\n                <th scope=\"col\">Kind</th>\r\n                <th scope=\"col\">Reason</th>\r\n                <th scope=\"col\">Issued</th>\r\n                <th scope=\"col\">Expires</th>\r\n                <th scope=\"col\">Lifted</th>\r\n              </tr>\r\n            </thead>\r\n            <tbody>\r\n              ")
    ;  if (record.restrictions.length === 0) { 
    ; __append("\r\n                <tr><td colspan=\"5\" class=\"fb-table__last\">None on record.</td></tr>\r\n              ")
    ;  } 
    ; __append("\r\n              ")
    ;  record.restrictions.forEach(function (entry) { 
    ; __append("\r\n                <tr>\r\n                  <td>")
    ; __append(escapeFn( entry.kind ))
    ; __append("</td>\r\n                  <td class=\"fb-table__note\">")
    ; __append(escapeFn( entry.reason ))
    ; __append("</td>\r\n                  <td>")
    ; __append(escapeFn( entry.issued ))
    ; __append("</td>\r\n                  <td>")
    ; __append(escapeFn( entry.expires ))
    ; __append("</td>\r\n                  <td>")
    ; __append(escapeFn( entry.lifted ? entry.lifted : '-' ))
    ; __append("</td>\r\n                </tr>\r\n              ")
    ;  }); 
    ; __append("\r\n            </tbody>\r\n          </table>\r\n\r\n          <h3 class=\"fb-admin__subheading\">Recent ledger entries</h3>\r\n          <table class=\"fb-table fb-table--admin\">\r\n            <thead>\r\n              <tr>\r\n                <th scope=\"col\">When</th>\r\n                <th scope=\"col\">Currency</th>\r\n                <th scope=\"col\">Change</th>\r\n                <th scope=\"col\">Balance after</th>\r\n                <th scope=\"col\">Reason</th>\r\n              </tr>\r\n            </thead>\r\n            <tbody>\r\n              ")
    ;  if (record.ledger.length === 0) { 
    ; __append("\r\n                <tr><td colspan=\"5\" class=\"fb-table__last\">No currency has moved on this account yet.</td></tr>\r\n              ")
    ;  } 
    ; __append("\r\n              ")
    ;  record.ledger.forEach(function (entry) { 
    ; __append("\r\n                <tr>\r\n                  <td>")
    ; __append(escapeFn( entry.when ))
    ; __append("</td>\r\n                  <td>")
    ; __append(escapeFn( entry.currency ))
    ; __append("</td>\r\n                  <td>")
    ; __append(escapeFn( entry.delta > 0 ? '+' + entry.delta : entry.delta ))
    ; __append("</td>\r\n                  <td>")
    ; __append(escapeFn( entry.balanceAfter ))
    ; __append("</td>\r\n                  <td class=\"fb-table__note\">")
    ; __append(escapeFn( entry.reason ))
    ; __append("</td>\r\n                </tr>\r\n              ")
    ;  }); 
    ; __append("\r\n            </tbody>\r\n          </table>\r\n\r\n          <h3 class=\"fb-admin__subheading\">Administrative history</h3>\r\n          <table class=\"fb-table fb-table--admin\">\r\n            <thead>\r\n              <tr>\r\n                <th scope=\"col\">When</th>\r\n                <th scope=\"col\">Action</th>\r\n                <th scope=\"col\">Detail</th>\r\n              </tr>\r\n            </thead>\r\n            <tbody>\r\n              ")
    ;  if (record.log.length === 0) { 
    ; __append("\r\n                <tr><td colspan=\"3\" class=\"fb-table__last\">Nothing has been logged against this account.</td></tr>\r\n              ")
    ;  } 
    ; __append("\r\n              ")
    ;  record.log.forEach(function (entry) { 
    ; __append("\r\n                <tr>\r\n                  <td>")
    ; __append(escapeFn( entry.when ))
    ; __append("</td>\r\n                  <td>")
    ; __append(escapeFn( entry.action ))
    ; __append("</td>\r\n                  <td class=\"fb-table__note\">")
    ; __append(escapeFn( entry.detail ))
    ; __append("</td>\r\n                </tr>\r\n              ")
    ;  }); 
    ; __append("\r\n            </tbody>\r\n          </table>\r\n\r\n          <p class=\"fb-admin__note\">\r\n            Warnings, restrictions, bans, notices and scrubs are issued on the Moderate User\r\n            page, linked above when your role reaches it. Role changes, badges and currency\r\n            have their own pages in the same row. A button your role would be refused is not\r\n            drawn here at all, and every action is written to the audit log.\r\n          </p>\r\n        </div>\r\n      </div>\r\n    </main>\r\n  </div>\r\n</div>\r\n\r\n")
    ; __append("\r\n<script type=\"module\" src=\"/js/avatar-stage.js\"></script>\r\n</body>\r\n</html>\r\n")
  return __output;

},
  "admin/users": function anonymous(locals, escapeFn, include, rethrow
) {
var Account = locals.Account, Admins = locals.Admins, ID = locals.ID, No = locals.No, Search = locals.Search, There = locals.There, User = locals.User, Users = locals.Users, account = locals.account, accounts = locals.accounts, admin = locals.admin, adminNav = locals.adminNav, adminStatus = locals.adminStatus, are = locals.are, css = locals.css, extraCss = locals.extraCss, forEach = locals.forEach, head = locals.head, id = locals.id, joined = locals.joined, length = locals.length, matches = locals.matches, name = locals.name, no = locals.no, notice = locals.notice, or = locals.or, pageTitle = locals.pageTitle, partials = locals.partials, query = locals.query, rank = locals.rank, roleName = locals.roleName, sidebar = locals.sidebar, staff = locals.staff, staffOnly = locals.staffOnly, status = locals.status, that = locals.that, username = locals.username, v = locals.v, viewer = locals.viewer, yet = locals.yet;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append( include('../partials/head', { pageTitle: pageTitle, extraCss: '/css/admin.css?v=1' }) )
    ; __append("\r\n\r\n<div class=\"fb-admin\">\r\n  <div class=\"fb-admin__bar\">\r\n    <div class=\"fb-admin__brand\">\r\n      <a class=\"fb-admin__logo\" href=\"/admin\">FieldBrik</a>\r\n      <span class=\"fb-admin__logo-tag\">Administration</span>\r\n    </div>\r\n    <div class=\"fb-admin__who\">\r\n      <strong>")
    ; __append(escapeFn( viewer.username ))
    ; __append("</strong> &middot; ")
    ; __append(escapeFn( admin.name ))
    ; __append(" (rank ")
    ; __append(escapeFn( admin.rank ))
    ; __append(") &middot;\r\n      <a href=\"/\">Back to the site</a>\r\n    </div>\r\n    ")
    ; __append( include('status', { adminStatus: adminStatus }) )
    ; __append("\r\n  </div>\r\n\r\n  <div class=\"fb-admin__body\">\r\n    ")
    ; __append( include('sidebar', { adminNav: adminNav }) )
    ; __append("\r\n\r\n    <main class=\"fb-admin__main\">\r\n      ")
    ;  if (notice) { 
    ; __append("\r\n        <div class=\"fb-notice fb-notice--admin\"><p><strong>")
    ; __append(escapeFn( notice ))
    ; __append("</strong></p></div>\r\n      ")
    ;  } 
    ; __append("\r\n\r\n      <div class=\"fb-panel\">\r\n        <h1 class=\"fb-panel__title fb-panel__title--blue\">")
    ; __append(escapeFn( staffOnly ? 'User Admins' : 'Search Users' ))
    ; __append("</h1>\r\n\r\n        <form class=\"fb-admin__search\" method=\"get\" action=\"/admin/users\">\r\n          <label for=\"fb-user-q\">")
    ; __append(escapeFn( staffOnly ? 'Search staff' : 'Account ID or username' ))
    ; __append("</label>\r\n          <input id=\"fb-user-q\" type=\"text\" name=\"q\" value=\"")
    ; __append(escapeFn( query ))
    ; __append("\" autocomplete=\"off\">\r\n          ")
    ;  if (staffOnly) { 
    ; __append("<input type=\"hidden\" name=\"staff\" value=\"1\">")
    ;  } 
    ; __append("\r\n          <button class=\"fb-btn fb-btn--primary\" type=\"submit\">Search</button>\r\n          ")
    ;  if (query || staffOnly) { 
    ; __append("<a href=\"/admin/users\">Clear</a>")
    ;  } 
    ; __append("\r\n        </form>\r\n\r\n        <div class=\"fb-panel__body fb-panel__body--flush\">\r\n          <table class=\"fb-table fb-table--admin\">\r\n            <thead>\r\n              <tr>\r\n                <th scope=\"col\">Account ID</th>\r\n                <th scope=\"col\">Username</th>\r\n                <th scope=\"col\">Role</th>\r\n                <th scope=\"col\">Join Date</th>\r\n                <th scope=\"col\">Status</th>\r\n              </tr>\r\n            </thead>\r\n            <tbody>\r\n              ")
    ;  if (accounts.length === 0) { 
    ; __append("\r\n                <tr>\r\n                  <td colspan=\"5\" class=\"fb-table__last\">\r\n                    ")
    ; __append(escapeFn( query ? 'No account matches that.' : 'There are no accounts yet.' ))
    ; __append("\r\n                  </td>\r\n                </tr>\r\n              ")
    ;  } 
    ; __append("\r\n              ")
    ;  accounts.forEach(function (account) { 
    ; __append("\r\n                <tr>\r\n                  <td><a href=\"/admin/users/")
    ; __append(escapeFn( account.id ))
    ; __append("\">")
    ; __append(escapeFn( account.id ))
    ; __append("</a></td>\r\n                  <td><a class=\"fb-table__name\" href=\"/admin/users/")
    ; __append(escapeFn( account.id ))
    ; __append("\">")
    ; __append(escapeFn( account.username ))
    ; __append("</a></td>\r\n                  <td>")
    ; __append(escapeFn( account.roleName ))
    ; __append("</td>\r\n                  <td>")
    ; __append(escapeFn( account.joined ))
    ; __append("</td>\r\n                  <td class=\"fb-status--")
    ; __append(escapeFn( account.status ))
    ; __append("\">")
    ; __append(escapeFn( account.status ))
    ; __append("</td>\r\n                </tr>\r\n              ")
    ;  }); 
    ; __append("\r\n            </tbody>\r\n          </table>\r\n        </div>\r\n      </div>\r\n\r\n      <p class=\"fb-admin__note\">\r\n        ")
    ;  if (staffOnly) { 
    ; __append("\r\n          Every account that holds a staff role, highest rank first. This list is only\r\n          offered to roles that can change roles.\r\n        ")
    ;  } else if (query) { 
    ; __append("\r\n          A number is read as an account ID; anything else matches part of a username.\r\n          Closed accounts are included, because finding out where an account went is\r\n          part of the job.\r\n        ")
    ;  } else { 
    ; __append("\r\n          Type a username or an account ID. With nothing typed, the newest accounts are\r\n          listed.\r\n        ")
    ;  } 
    ; __append("\r\n      </p>\r\n    </main>\r\n  </div>\r\n</div>\r\n\r\n</body>\r\n</html>\r\n")
  return __output;

},
  "pages/about": function anonymous(locals, escapeFn, include, rethrow
) {
var footer = locals.footer, head = locals.head, header = locals.header, pageTitle = locals.pageTitle, partials = locals.partials;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append( include('../partials/head', { pageTitle: pageTitle }) )
    ; __append("\r\n")
    ; __append( include('../partials/header') )
    ; __append("\r\n\r\n<main class=\"fb-container fb-main\">\r\n  <h1 class=\"fb-title fb-title--small\">About Us</h1>\r\n\r\n  <div class=\"fb-prose\">\r\n    <p>FieldBrik is an independent community and software project. We are a small team of builders with a stubborn attachment to the building games of 2006 to 2008, and to the idea that a platform should be a place people make things rather than a place things are sold to them.</p>\r\n\r\n    <p>FieldBrik is free to use and built for members of all ages. The platform is under active development and is currently in public alpha testing. We value community feedback deeply, and we continue to make FieldBrik into a place that rewards curiosity in the young and the young at heart.</p>\r\n\r\n    <p>FieldBrik 0.3 is a ground-up rebuild. The previous version had grown into something difficult to maintain: rules were implemented in several places, and a single change meant editing many files. This version puts every rule in one place, so moderation, permissions and accounts behave the same way everywhere.</p>\r\n\r\n    <p>For more information about FieldBrik, visit the <a href=\"/news\">News</a> and <a href=\"/help\">Help</a> sections.</p>\r\n\r\n    <p>FieldBrik is currently built by volunteers. If you would like to help with building, moderation or documentation, see the <a href=\"/support\">Contact</a> page.</p>\r\n\r\n    <p>Please contact us via email at <a href=\"/support\">our support page</a>.</p>\r\n  </div>\r\n</main>\r\n\r\n")
    ; __append( include('../partials/footer') )
    ; __append("\r\n</body>\r\n</html>\r\n")
  return __output;

},
  "pages/banned": function anonymous(locals, escapeFn, include, rethrow
) {
var Banned = locals.Banned, No = locals.No, Restricted = locals.Restricted, This = locals.This, account = locals.account, ban = locals.ban, banned = locals.banned, date = locals.date, end = locals.end, ends = locals.ends, evidenceToken = locals.evidenceToken, footer = locals.footer, head = locals.head, header = locals.header, is = locals.is, issued = locals.issued, kind = locals.kind, lifted = locals.lifted, pageTitle = locals.pageTitle, partials = locals.partials, permanent = locals.permanent, reason = locals.reason, restricted = locals.restricted, restriction = locals.restriction, scrubbedFrom = locals.scrubbedFrom, until = locals.until, username = locals.username;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append( include('../partials/head', { pageTitle: pageTitle }) )
    ; __append("\r\n<link rel=\"stylesheet\" href=\"/css/admin-mod.css\">\r\n")
    ; __append( include('../partials/header') )
    ; __append("\r\n\r\n<main class=\"fb-container fb-main\">\r\n  <div class=\"fb-content\">\r\n    <h1 class=\"fb-title\">")
    ; __append(escapeFn( banned.kind === 'ban' ? 'This account is banned' : 'This account is restricted' ))
    ; __append("</h1>\r\n\r\n    <table class=\"fb-table fb-table--kv fb-ban__facts\">\r\n      <tbody>\r\n        <tr><th scope=\"row\">Account</th><td>")
    ; __append(escapeFn( banned.username ))
    ; __append("</td></tr>\r\n        <tr><th scope=\"row\">Reason</th><td>")
    ; __append(escapeFn( banned.reason ))
    ; __append("</td></tr>\r\n        <tr><th scope=\"row\">")
    ; __append(escapeFn( banned.kind === 'ban' ? 'Banned until' : 'Restricted until' ))
    ; __append("</th><td>")
    ; __append(escapeFn( banned.permanent ? 'No end date' : banned.until ))
    ; __append("</td></tr>\r\n        <tr><th scope=\"row\">Issued</th><td>")
    ; __append(escapeFn( banned.issued ))
    ; __append("</td></tr>\r\n      </tbody>\r\n    </table>\r\n\r\n    ")
    ;  if (banned.evidenceToken) { 
    ; __append("\r\n      <h2 class=\"fb-subtitle\">The content this was for</h2>\r\n      <p class=\"fb-ban__evidence\">\r\n        <img src=\"/evidence/")
    ; __append(escapeFn( banned.evidenceToken ))
    ; __append("\" alt=\"The content the action was taken for\">\r\n      </p>\r\n    ")
    ;  } 
    ; __append("\r\n\r\n    <div class=\"fb-prose\">\r\n      <p>\r\n        Every page on FieldBrik shows this notice until the ")
    ; __append(escapeFn( banned.kind === 'ban' ? 'ban is lifted' : 'restriction ends' ))
    ; __append(",\r\n        so there is nothing to try by refreshing or signing in on another device.\r\n      </p>\r\n      ")
    ;  if (banned.scrubbedFrom) { 
    ; __append("\r\n        <p>\r\n          This account's name has been changed, and the original is kept only for staff.\r\n        </p>\r\n      ")
    ;  } 
    ; __append("\r\n      <p>\r\n        If you think this is wrong, reply to the message in your inbox, or contact support\r\n        from another account and quote account <strong>")
    ; __append(escapeFn( banned.username ))
    ; __append("</strong>.\r\n      </p>\r\n    </div>\r\n  </div>\r\n</main>\r\n\r\n")
    ; __append( include('../partials/footer') )
    ; __append("\r\n</body>\r\n</html>\r\n")
  return __output;

},
  "pages/carpenters-club": function anonymous(locals, escapeFn, include, rethrow
) {
var Carpenters = locals.Carpenters, Club = locals.Club, Outrageous = locals.Outrageous, Senior = locals.Senior, ccb = locals.ccb, ccs = locals.ccs, club = locals.club, currencyNote = locals.currencyNote, currencySymbol = locals.currencySymbol, description = locals.description, entry = locals.entry, footer = locals.footer, forEach = locals.forEach, head = locals.head, header = locals.header, img = locals.img, key = locals.key, name = locals.name, note = locals.note, occ = locals.occ, pageTitle = locals.pageTitle, partials = locals.partials, png = locals.png, prices = locals.prices, shortName = locals.shortName, term = locals.term, terms = locals.terms, tier = locals.tier, tiers = locals.tiers, toFixed = locals.toFixed;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append( include('../partials/head', { pageTitle: pageTitle }) )
    ; __append("\r\n")
    ; __append( include('../partials/header') )
    ; __append("\r\n\r\n<main class=\"fb-container fb-main\">\r\n  <div class=\"fb-content\">\r\n    <h1 class=\"fb-title\">Carpenters Club</h1>\r\n\r\n    <div class=\"fb-prose\">\r\n      <p>Carpenters Club is FieldBrik's optional membership. The free service stays free: everything you need to build, publish and play is available without a membership. Carpenters Club adds recognition and supporting benefits on top of it.</p>\r\n      <p>There are three tiers. Each tier can be bought for a fixed term, or permanently as a single payment that never renews.</p>\r\n    </div>\r\n\r\n    <h2 class=\"fb-subtitle\">Membership tiers</h2>\r\n    <ul class=\"fb-list\">\r\n      ")
    ;  club.tiers.forEach(function (tier) { 
    ; __append("\r\n        <li><strong>")
    ; __append(escapeFn( tier.name ))
    ; __append("</strong> (")
    ; __append(escapeFn( tier.shortName ))
    ; __append(") - ")
    ; __append(escapeFn( tier.description ))
    ; __append("</li>\r\n      ")
    ;  }); 
    ; __append("\r\n    </ul>\r\n\r\n    <h2 class=\"fb-subtitle\">Terms and pricing</h2>\r\n    <p class=\"fb-muted\">")
    ; __append(escapeFn( club.currencyNote ))
    ; __append("</p>\r\n    <table class=\"fb-price-table\">\r\n      <thead>\r\n        <tr>\r\n          <th scope=\"col\">Membership</th>\r\n          ")
    ;  club.terms.forEach(function (term) { 
    ; __append("\r\n            <th scope=\"col\">")
    ; __append(escapeFn( term.name ))
    ; __append("<br><span class=\"fb-muted\">")
    ; __append(escapeFn( term.note ))
    ; __append("</span></th>\r\n          ")
    ;  }); 
    ; __append("\r\n        </tr>\r\n      </thead>\r\n      <tbody>\r\n        ")
    ;  club.tiers.forEach(function (tier) { 
    ; __append("\r\n          <tr>\r\n            <td>")
    ; __append(escapeFn( tier.name ))
    ; __append("<br><span class=\"fb-muted\">")
    ; __append(escapeFn( tier.shortName ))
    ; __append("</span></td>\r\n            ")
    ;  club.terms.forEach(function (term) { 
    ; __append("\r\n              <td>")
    ; __append(escapeFn( club.currencySymbol ))
    ; __append(escapeFn( tier.prices[term.key].toFixed(2) ))
    ; __append("</td>\r\n            ")
    ;  }); 
    ; __append("\r\n          </tr>\r\n        ")
    ;  }); 
    ; __append("\r\n      </tbody>\r\n    </table>\r\n\r\n    <div class=\"fb-notice\">\r\n      <p><strong>Prices are set. Payment is not live.</strong></p>\r\n      <p>These are the membership prices. No checkout exists yet, so nothing on this page can take money, and no account can hold a membership until the accounts and economy services are built in phase 2.</p>\r\n    </div>\r\n\r\n    <h2 class=\"fb-subtitle\">The badges</h2>\r\n    <p class=\"fb-prose\">Membership is shown on your profile by a badge:</p>\r\n    <ul class=\"fb-grid--badges\">\r\n      ")
    ;  [
        ['Carpenters Club', '/img/ccb.png'],
        ['Carpenters Club Senior', '/img/ccs.png'],
        ['Outrageous Carpenters Club', '/img/occ.png']
      ].forEach(function (entry) { 
    ; __append("\r\n        <li class=\"fb-badge\">\r\n          <img class=\"fb-badge__art\" src=\"")
    ; __append(escapeFn( entry[1] ))
    ; __append("\" alt=\"\" width=\"34\" height=\"34\">\r\n          ")
    ; __append(escapeFn( entry[0] ))
    ; __append("\r\n        </li>\r\n      ")
    ;  }); 
    ; __append("\r\n    </ul>\r\n\r\n    <p class=\"fb-muted\">Carpenters Club badges are awarded server-side from the account's membership record. A badge cannot be granted by editing anything in the browser.</p>\r\n  </div>\r\n</main>\r\n\r\n")
    ; __append( include('../partials/footer') )
    ; __append("\r\n</body>\r\n</html>\r\n")
  return __output;

},
  "pages/catalog": function anonymous(locals, escapeFn, include, rethrow
) {
var Owned = locals.Owned, Wearing = locals.Wearing, active = locals.active, bucks = locals.bucks, categoryFacets = locals.categoryFacets, creator = locals.creator, creatorFacets = locals.creatorFacets, equipped = locals.equipped, facet = locals.facet, footer = locals.footer, forEach = locals.forEach, head = locals.head, header = locals.header, href = locals.href, id = locals.id, image = locals.image, is = locals.is, item = locals.item, items = locals.items, label = locals.label, length = locals.length, name = locals.name, notice = locals.notice, owned = locals.owned, pageTitle = locals.pageTitle, partials = locals.partials, priceFacets = locals.priceFacets, query = locals.query, thumb = locals.thumb, tickets = locals.tickets;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append( include('../partials/head', { pageTitle: pageTitle }) )
    ; __append("\r\n")
    ; __append( include('../partials/header') )
    ; __append("\r\n\r\n<main class=\"fb-container fb-main\">\r\n  <div class=\"fb-title-row\">\r\n    <h1 class=\"fb-title\">Catalog</h1>\r\n    <span class=\"fb-pagecount\">")
    ; __append(escapeFn( items.length ))
    ; __append(" ")
    ; __append(escapeFn( items.length === 1 ? 'item' : 'items' ))
    ; __append("</span>\r\n  </div>\r\n\r\n  ")
    ;  if (notice) { 
    ; __append("\r\n    <div class=\"fb-notice\"><p><strong>")
    ; __append(escapeFn( notice ))
    ; __append("</strong></p></div>\r\n  ")
    ;  } 
    ; __append("\r\n\r\n  <div class=\"fb-cols\">\r\n    <aside class=\"fb-col-side\">\r\n      <h2 class=\"fb-facets__heading\">Category</h2>\r\n      <ul class=\"fb-facets__list\">\r\n        ")
    ;  categoryFacets.forEach(function (facet) { 
    ; __append("\r\n          <li class=\"")
    ; __append(escapeFn( facet.active ? 'is-active' : '' ))
    ; __append("\"><a href=\"")
    ; __append(escapeFn( facet.href ))
    ; __append("\">")
    ; __append(escapeFn( facet.label ))
    ; __append("</a></li>\r\n        ")
    ;  }); 
    ; __append("\r\n      </ul>\r\n\r\n      <h2 class=\"fb-facets__heading\">Price</h2>\r\n      <ul class=\"fb-facets__list\">\r\n        ")
    ;  priceFacets.forEach(function (facet) { 
    ; __append("\r\n          <li class=\"")
    ; __append(escapeFn( facet.active ? 'is-active' : '' ))
    ; __append("\"><a href=\"")
    ; __append(escapeFn( facet.href ))
    ; __append("\">")
    ; __append(escapeFn( facet.label ))
    ; __append("</a></li>\r\n        ")
    ;  }); 
    ; __append("\r\n      </ul>\r\n\r\n      ")
    ;  if (creatorFacets.length > 0) { 
    ; __append("\r\n        <h2 class=\"fb-facets__heading\">Creator</h2>\r\n        <ul class=\"fb-facets__list\">\r\n          ")
    ;  creatorFacets.forEach(function (facet) { 
    ; __append("\r\n            <li class=\"")
    ; __append(escapeFn( facet.active ? 'is-active' : '' ))
    ; __append("\"><a href=\"")
    ; __append(escapeFn( facet.href ))
    ; __append("\">")
    ; __append(escapeFn( facet.label ))
    ; __append("</a></li>\r\n          ")
    ;  }); 
    ; __append("\r\n        </ul>\r\n      ")
    ;  } 
    ; __append("\r\n    </aside>\r\n\r\n    <div class=\"fb-col-main\">\r\n      <form class=\"fb-toolbar\" method=\"get\" action=\"/catalog\">\r\n        <input type=\"search\" name=\"q\" value=\"")
    ; __append(escapeFn( query ))
    ; __append("\" placeholder=\"Search the catalog\">\r\n        <button class=\"fb-btn\" type=\"submit\">Search</button>\r\n        ")
    ;  if (query) { 
    ; __append("<a class=\"fb-muted\" href=\"/catalog\">Clear</a>")
    ;  } 
    ; __append("\r\n      </form>\r\n\r\n      ")
    ;  if (items.length === 0) { 
    ; __append("\r\n        <div class=\"fb-notice\">\r\n          <p><strong>Nothing is on sale here yet.</strong></p>\r\n          <p>Items come from creators' catalog rows. If a filter is on, <a href=\"/catalog\">show every item</a> to start again.</p>\r\n        </div>\r\n      ")
    ;  } else { 
    ; __append("\r\n        <ul class=\"fb-grid--items\">\r\n          ")
    ;  items.forEach(function (item) { 
    ; __append("\r\n            <li class=\"fb-card-item\">\r\n              <span class=\"fb-card-item__thumb\" style=\"--thumb: ")
    ; __append(escapeFn( item.thumb ))
    ; __append(";\" aria-hidden=\"true\">\r\n                ")
    ;  if (item.image) { 
    ; __append("<img src=\"")
    ; __append(escapeFn( item.image ))
    ; __append("\" alt=\"\">")
    ;  } 
    ; __append("\r\n              </span>\r\n              <a class=\"fb-card-item__name\" href=\"/catalog/")
    ; __append(escapeFn( item.id ))
    ; __append("\">")
    ; __append(escapeFn( item.name ))
    ; __append("</a>\r\n              <p class=\"fb-card-item__meta\">\r\n                ")
    ;  if (item.tickets !== null) { 
    ; __append("\r\n                  <span class=\"fb-price--tickets\">Tx: ")
    ; __append(escapeFn( item.tickets ))
    ; __append("</span>\r\n                ")
    ;  } 
    ; __append("\r\n                ")
    ;  if (item.tickets !== null && item.bucks !== null) { 
    ; __append("<br>")
    ;  } 
    ; __append("\r\n                ")
    ;  if (item.bucks !== null) { 
    ; __append("\r\n                  <span class=\"fb-price--bucks\">R$: ")
    ; __append(escapeFn( item.bucks ))
    ; __append("</span>\r\n                ")
    ;  } 
    ; __append("\r\n                ")
    ;  if (item.tickets === null && item.bucks === null) { 
    ; __append("\r\n                  <span class=\"fb-muted\">Free</span>\r\n                ")
    ;  } 
    ; __append("\r\n                <br>\r\n                By ")
    ; __append(escapeFn( item.creator ))
    ; __append("\r\n                ")
    ;  if (item.owned) { 
    ; __append("<br><span class=\"fb-muted\">")
    ; __append(escapeFn( item.equipped ? 'Wearing' : 'Owned' ))
    ; __append("</span>")
    ;  } 
    ; __append("\r\n              </p>\r\n            </li>\r\n          ")
    ;  }); 
    ; __append("\r\n        </ul>\r\n        <p class=\"fb-pagination\">Page 1 of 1</p>\r\n      ")
    ;  } 
    ; __append("\r\n\r\n      <div class=\"fb-notice\">\r\n        <p><strong>Prices are real. Buying spends real balances.</strong></p>\r\n        <p>An item with both prices can be bought with either: the creator set a Tickets price and a Bucks price, and the rate between them is theirs to choose. Buying writes a ledger entry and adds the item to your inventory, and the balance on your account goes down by exactly the price shown here.</p>\r\n      </div>\r\n    </div>\r\n  </div>\r\n</main>\r\n\r\n")
    ; __append( include('../partials/footer') )
    ; __append("\r\n</body>\r\n</html>\r\n")
  return __output;

},
  "pages/character": function anonymous(locals, escapeFn, include, rethrow
) {
var avatar = locals.avatar, colour = locals.colour, current = locals.current, face = locals.face, faces = locals.faces, file = locals.file, footer = locals.footer, forEach = locals.forEach, head = locals.head, header = locals.header, hex = locals.hex, is = locals.is, key = locals.key, label = locals.label, lg = locals.lg, live = locals.live, name = locals.name, pageTitle = locals.pageTitle, palette = locals.palette, part = locals.part, partials = locals.partials, parts = locals.parts, size = locals.size, source = locals.source, toLowerCase = locals.toLowerCase, viewerName = locals.viewerName;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append( include('../partials/head', { pageTitle: pageTitle }) )
    ; __append("\r\n")
    ; __append( include('../partials/header') )
    ; __append("\r\n\r\n<main class=\"fb-container fb-main\">\r\n  <div class=\"fb-title-row\">\r\n    <h1 class=\"fb-title\">Character</h1>\r\n    <span class=\"fb-pagecount\">")
    ; __append(escapeFn( viewerName ))
    ; __append("</span>\r\n  </div>\r\n\r\n  <div class=\"fb-char\">\r\n    <div class=\"fb-char__preview\">\r\n      ")
    ; __append( include('../partials/avatar', { avatar: avatar, size: 'lg', live: true }) )
    ; __append("\r\n      <p class=\"fb-char__name\">")
    ; __append(escapeFn( viewerName ))
    ; __append("</p>\r\n      <p class=\"fb-char__status\" id=\"charStatus\" role=\"status\" aria-live=\"polite\">Click a colour or a face.</p>\r\n    </div>\r\n\r\n    <div class=\"fb-char__body\">\r\n      <section class=\"fb-panel\">\r\n        <h2 class=\"fb-panel__title\">Body colours</h2>\r\n        <div class=\"fb-panel__body\">\r\n          ")
    ;  parts.forEach(function (part) { 
    ; __append("\r\n            <div class=\"fb-part\">\r\n              <span class=\"fb-part__label\">")
    ; __append(escapeFn( part.label ))
    ; __append("</span>\r\n              <span class=\"fb-swatches\" data-part=\"")
    ; __append(escapeFn( part.source ))
    ; __append("\">\r\n                ")
    ;  palette.forEach(function (colour) { 
    ; __append("\r\n                  <button\r\n                    type=\"button\"\r\n                    class=\"fb-swatch")
    ; __append(escapeFn( colour.hex.toLowerCase() === part.current.toLowerCase() ? ' is-current' : '' ))
    ; __append("\"\r\n                    style=\"--swatch: ")
    ; __append(escapeFn( colour.hex ))
    ; __append(";\"\r\n                    title=\"")
    ; __append(escapeFn( colour.name ))
    ; __append("\"\r\n                    aria-label=\"")
    ; __append(escapeFn( colour.name ))
    ; __append(escapeFn( colour.hex.toLowerCase() === part.current.toLowerCase() ? ' (current)' : '' ))
    ; __append("\"\r\n                    data-hex=\"")
    ; __append(escapeFn( colour.hex ))
    ; __append("\"\r\n                    data-part=\"")
    ; __append(escapeFn( part.source ))
    ; __append("\"></button>\r\n                ")
    ;  }); 
    ; __append("\r\n              </span>\r\n            </div>\r\n          ")
    ;  }); 
    ; __append("\r\n        </div>\r\n      </section>\r\n\r\n      <section class=\"fb-panel\">\r\n        <h2 class=\"fb-panel__title\">Face</h2>\r\n        <div class=\"fb-panel__body\">\r\n          <ul class=\"fb-faces\">\r\n            ")
    ;  faces.forEach(function (face) { 
    ; __append("\r\n              <li class=\"fb-face")
    ; __append(escapeFn( face.key === avatar.face ? ' is-current' : '' ))
    ; __append("\" data-face-item=\"")
    ; __append(escapeFn( face.key ))
    ; __append("\">\r\n                <button type=\"button\" class=\"fb-face__pick\" data-face=\"")
    ; __append(escapeFn( face.key ))
    ; __append("\" aria-label=\"")
    ; __append(escapeFn( face.label ))
    ; __append("\">\r\n                  <span class=\"fb-face__head\">\r\n                    <img src=\"/avatar/assets/")
    ; __append(escapeFn( face.file ))
    ; __append("\" alt=\"\" width=\"128\" height=\"128\">\r\n                  </span>\r\n                  <span class=\"fb-face__label\">")
    ; __append(escapeFn( face.label ))
    ; __append("</span>\r\n                </button>\r\n              </li>\r\n            ")
    ;  }); 
    ; __append("\r\n          </ul>\r\n        </div>\r\n      </section>\r\n\r\n      <div class=\"fb-notice\">\r\n        <p><strong>Changes save to your account.</strong></p>\r\n        <p>Your colours and face are written to your account in the database, and they follow you across every page — the header, My Page, your profile and the member list all read the same record. Sign in somewhere else and you look the same there.</p>\r\n      </div>\r\n    </div>\r\n  </div>\r\n</main>\r\n\r\n<script type=\"module\">\r\n  import { initializeAvatar } from '/avatar/avatar.js';\r\n\r\n  const stage = document.querySelector('[data-avatar-live]');\r\n  const status = document.getElementById('charStatus');\r\n\r\n  const state = {\r\n    headColor: stage.dataset.head,\r\n    torsoColor: stage.dataset.torso,\r\n    leftArmColor: stage.dataset.leftArm,\r\n    rightArmColor: stage.dataset.rightArm,\r\n    leftLegColor: stage.dataset.leftLeg,\r\n    rightLegColor: stage.dataset.rightLeg,\r\n    face: stage.dataset.face\r\n  };\r\n\r\n  // Field name in the data attributes <-> key the renderer wants.\r\n  const FIELD = {\r\n    head: 'headColor',\r\n    torso: 'torsoColor',\r\n    leftArm: 'leftArmColor',\r\n    rightArm: 'rightArmColor',\r\n    leftLeg: 'leftLegColor',\r\n    rightLeg: 'rightLegColor'\r\n  };\r\n\r\n  let view = null;\r\n\r\n  try {\r\n    view = await initializeAvatar(stage, state, { antialias: false });\r\n    stage.classList.add('is-3d');\r\n\r\n    // Inline as well as the class: the canvas is transparent around the figure,\r\n    // so anything left underneath shows through it.\r\n    const fallback = stage.querySelector('.fb-avatar__fallback');\r\n\r\n    if (fallback) {\r\n      fallback.style.display = 'none';\r\n    }\r\n  } catch (error) {\r\n    status.textContent = 'Live preview unavailable - showing the flat avatar.';\r\n  }\r\n\r\n  function markPart(part, hex) {\r\n    document\r\n      .querySelectorAll(`.fb-swatch[data-part=\"${part}\"]`)\r\n      .forEach((swatch) => {\r\n        const on = swatch.dataset.hex.toLowerCase() === hex.toLowerCase();\r\n        swatch.classList.toggle('is-current', on);\r\n        swatch.setAttribute(\r\n          'aria-label',\r\n          (swatch.title || 'Colour') + (on ? ' (current)' : '')\r\n        );\r\n      });\r\n  }\r\n\r\n  function markFace(face) {\r\n    document.querySelectorAll('[data-face-item]').forEach((item) => {\r\n      item.classList.toggle('is-current', item.dataset.faceItem === face);\r\n    });\r\n  }\r\n\r\n  // Keep the flat figure correct too, in case the renderer is unavailable.\r\n  function syncFallback() {\r\n    stage.style.setProperty('--av-head', state.headColor);\r\n    stage.style.setProperty('--av-torso', state.torsoColor);\r\n    stage.style.setProperty('--av-arms', state.leftArmColor);\r\n    stage.style.setProperty('--av-legs', state.leftLegColor);\r\n  }\r\n\r\n  async function save(patch) {\r\n    status.textContent = 'Saving...';\r\n\r\n    try {\r\n      const response = await fetch('/character/avatar', {\r\n        method: 'POST',\r\n        headers: { 'Content-Type': 'application/json' },\r\n        body: JSON.stringify(patch)\r\n      });\r\n\r\n      const result = await response.json();\r\n\r\n      if (!response.ok) {\r\n        status.textContent = result.error || 'Could not save that.';\r\n        return false;\r\n      }\r\n\r\n      status.textContent = 'Saved.';\r\n      return true;\r\n    } catch (error) {\r\n      status.textContent = 'Could not reach the server - not saved.';\r\n      return false;\r\n    }\r\n  }\r\n\r\n  document.querySelectorAll('.fb-swatch[data-part]').forEach((swatch) => {\r\n    swatch.addEventListener('click', async () => {\r\n      const part = swatch.dataset.part;\r\n      const hex = swatch.dataset.hex;\r\n      const field = FIELD[part];\r\n\r\n      const previous = state[field];\r\n      state[field] = hex;\r\n\r\n      markPart(part, hex);\r\n      syncFallback();\r\n\r\n      if (view) {\r\n        await view.update(state);\r\n      }\r\n\r\n      const ok = await save({ [part]: hex });\r\n\r\n      if (!ok) {\r\n        // Put the avatar back the way the server still has it.\r\n        state[field] = previous;\r\n        markPart(part, previous);\r\n        syncFallback();\r\n\r\n        if (view) {\r\n          await view.update(state);\r\n        }\r\n      }\r\n    });\r\n  });\r\n\r\n  document.querySelectorAll('[data-face]').forEach((button) => {\r\n    button.addEventListener('click', async () => {\r\n      const face = button.dataset.face;\r\n      const previous = state.face;\r\n\r\n      state.face = face;\r\n      markFace(face);\r\n\r\n      if (view) {\r\n        await view.update(state);\r\n      }\r\n\r\n      const ok = await save({ face });\r\n\r\n      if (!ok) {\r\n        state.face = previous;\r\n        markFace(previous);\r\n\r\n        if (view) {\r\n          await view.update(state);\r\n        }\r\n      }\r\n    });\r\n  });\r\n</script>\r\n\r\n")
    ; __append( include('../partials/footer') )
    ; __append("\r\n</body>\r\n</html>\r\n")
  return __output;

},
  "pages/earnings": function anonymous(locals, escapeFn, include, rethrow
) {
var a = locals.a, account = locals.account, awarded = locals.awarded, bucks = locals.bucks, claimedAmount = locals.claimedAmount, claimedToday = locals.claimedToday, currency = locals.currency, dailyBucks = locals.dailyBucks, dailyTickets = locals.dailyTickets, day = locals.day, earned = locals.earned, footer = locals.footer, forEach = locals.forEach, free = locals.free, head = locals.head, header = locals.header, label = locals.label, ladder = locals.ladder, length = locals.length, milestones = locals.milestones, name = locals.name, nextAt = locals.nextAt, notice = locals.notice, pageTitle = locals.pageTitle, partials = locals.partials, place = locals.place, places = locals.places, row = locals.row, site = locals.site, state = locals.state, tickets = locals.tickets, tierName = locals.tierName, visitBlock = locals.visitBlock, visitReward = locals.visitReward, visits = locals.visits;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append( include('../partials/head', { pageTitle: pageTitle }) )
    ; __append("\r\n")
    ; __append( include('../partials/header') )
    ; __append("\r\n\r\n<main class=\"fb-container fb-main\">\r\n  <div class=\"fb-title-row\">\r\n    <h1 class=\"fb-title\">Tickets</h1>\r\n    <span class=\"fb-pagecount\">")
    ; __append(escapeFn( site.currency.earned ))
    ; __append(", earned by using the site</span>\r\n  </div>\r\n\r\n  ")
    ;  if (notice) { 
    ; __append("\r\n    <div class=\"fb-notice\"><p><strong>")
    ; __append(escapeFn( notice ))
    ; __append("</strong></p></div>\r\n  ")
    ;  } 
    ; __append("\r\n\r\n  ")
    ;  if (!state) { 
    ; __append("\r\n    <div class=\"fb-notice\">\r\n      <p><strong><a href=\"/login\">Sign in</a> to see your Tickets.</strong></p>\r\n      <p>Tickets are earned by an account, so the amounts below are what a signed-in member gets. The rates are the same for everybody.</p>\r\n    </div>\r\n\r\n    <section class=\"fb-panel\">\r\n      <h2 class=\"fb-panel__title\">What a day is worth</h2>\r\n      <div class=\"fb-panel__body fb-panel__body--flush\">\r\n        <table class=\"fb-table fb-table--admin\">\r\n          <thead>\r\n            <tr>\r\n              <th scope=\"col\">Account</th>\r\n              <th scope=\"col\">Tickets per day</th>\r\n              <th scope=\"col\">Bucks per day</th>\r\n            </tr>\r\n          </thead>\r\n          <tbody>\r\n            <tr><td>Free account</td><td>100</td><td>-</td></tr>\r\n            <tr><td>Carpenters Club</td><td>150</td><td>-</td></tr>\r\n            <tr><td>Carpenters Club Senior</td><td>300</td><td>-</td></tr>\r\n            <tr><td>Outrageous Carpenters Club</td><td>500</td><td>25</td></tr>\r\n          </tbody>\r\n        </table>\r\n      </div>\r\n      <p class=\"fb-panel__strip\">A place you own also pays 500 Tickets for every 10 visits.</p>\r\n    </section>\r\n  ")
    ;  } else { 
    ; __append("\r\n\r\n    <div class=\"fb-cols\">\r\n      <div class=\"fb-col-main\">\r\n        <section class=\"fb-panel\">\r\n          <h2 class=\"fb-panel__title\">\r\n            <span class=\"fb-panel__title-row\">\r\n              <span>Today's Tickets</span>\r\n              <span class=\"fb-pagecount\">")
    ; __append(escapeFn( state.day ))
    ; __append("</span>\r\n            </span>\r\n          </h2>\r\n          <div class=\"fb-panel__body\">\r\n            ")
    ;  if (state.claimedToday) { 
    ; __append("\r\n              <p>\r\n                <strong>Collected: ")
    ; __append(escapeFn( state.claimedAmount ))
    ; __append(" Tickets today.</strong>\r\n                ")
    ;  if (state.dailyBucks > 0) { 
    ; __append("Plus ")
    ; __append(escapeFn( state.dailyBucks ))
    ; __append(" Bucks.")
    ;  } 
    ; __append("\r\n              </p>\r\n              <p class=\"fb-muted\">The next daily Tickets arrive after midnight UTC. You are on ")
    ; __append(escapeFn( state.tierName ? state.tierName : 'a free account' ))
    ; __append(", which pays ")
    ; __append(escapeFn( state.dailyTickets ))
    ; __append(" a day.</p>\r\n            ")
    ;  } else { 
    ; __append("\r\n              <p>\r\n                <strong>")
    ; __append(escapeFn( state.dailyTickets ))
    ; __append(" Tickets are waiting.</strong>\r\n                ")
    ;  if (state.dailyBucks > 0) { 
    ; __append("Plus ")
    ; __append(escapeFn( state.dailyBucks ))
    ; __append(" Bucks.")
    ;  } 
    ; __append("\r\n              </p>\r\n              <form method=\"post\" action=\"/earnings/claim\">\r\n                <button class=\"fb-btn fb-btn--primary\" type=\"submit\">Collect today's Tickets</button>\r\n              </form>\r\n            ")
    ;  } 
    ; __append("\r\n            ")
    ;  if (state.tierName) { 
    ; __append("\r\n              <p class=\"fb-muted\">Your ")
    ; __append(escapeFn( state.tierName ))
    ; __append(" membership is active, so the daily award is the membership rate rather than the free one.</p>\r\n            ")
    ;  } 
    ; __append("\r\n          </div>\r\n        </section>\r\n\r\n        <section class=\"fb-panel\">\r\n          <h2 class=\"fb-panel__title\">Visits on your places</h2>\r\n          <div class=\"fb-panel__body fb-panel__body--flush\">\r\n            <table class=\"fb-table fb-table--admin\">\r\n              <thead>\r\n                <tr>\r\n                  <th scope=\"col\">Place</th>\r\n                  <th scope=\"col\">Visits</th>\r\n                  <th scope=\"col\">Milestones paid</th>\r\n                  <th scope=\"col\">Next at</th>\r\n                </tr>\r\n              </thead>\r\n              <tbody>\r\n                ")
    ;  if (state.places.length === 0) { 
    ; __append("\r\n                  <tr>\r\n                    <td colspan=\"4\" class=\"fb-table__last\">\r\n                      No places yet. This table fills in when members publish places; visits start\r\n                      counting when the client can join a place.\r\n                    </td>\r\n                  </tr>\r\n                ")
    ;  } 
    ; __append("\r\n                ")
    ;  state.places.forEach(function (place) { 
    ; __append("\r\n                  <tr>\r\n                    <td>")
    ; __append(escapeFn( place.name ))
    ;  if (place.visits === 0) { 
    ; __append(" <span class=\"fb-muted\">(unvisited)</span>")
    ;  } 
    ; __append("</td>\r\n                    <td>")
    ; __append(escapeFn( place.visits ))
    ; __append("</td>\r\n                    <td>")
    ; __append(escapeFn( place.awarded ))
    ; __append(" of ")
    ; __append(escapeFn( place.milestones ))
    ; __append("</td>\r\n                    <td>")
    ; __append(escapeFn( place.nextAt ))
    ; __append("</td>\r\n                  </tr>\r\n                ")
    ;  }); 
    ; __append("\r\n              </tbody>\r\n            </table>\r\n          </div>\r\n          <p class=\"fb-panel__strip\">\r\n            Every ")
    ; __append(escapeFn( state.visitBlock ))
    ; __append(" visits pays ")
    ; __append(escapeFn( state.visitReward ))
    ; __append(" Tickets, once per milestone.\r\n          </p>\r\n        </section>\r\n      </div>\r\n\r\n      <aside class=\"fb-col-side\">\r\n        <section class=\"fb-panel\">\r\n          <h2 class=\"fb-panel__title\">What a day is worth</h2>\r\n          <div class=\"fb-panel__body\">\r\n            <table class=\"fb-table fb-table--kv\">\r\n              <tbody>\r\n                ")
    ;  state.ladder.forEach(function (row) { 
    ; __append("\r\n                  <tr>\r\n                    <th scope=\"row\">")
    ; __append(escapeFn( row.label ))
    ; __append("</th>\r\n                    <td>")
    ; __append(escapeFn( row.tickets ))
    ; __append(" Tx")
    ;  if (row.bucks > 0) { 
    ; __append(" + ")
    ; __append(escapeFn( row.bucks ))
    ; __append(" R$")
    ;  } 
    ; __append("</td>\r\n                  </tr>\r\n                ")
    ;  }); 
    ; __append("\r\n              </tbody>\r\n            </table>\r\n            <p class=\"fb-muted\">\r\n              The membership rate replaces the free rate; it is not added to it. A daily award lands once\r\n              per day, on the first page you open while signed in.\r\n            </p>\r\n          </div>\r\n        </section>\r\n\r\n        <section class=\"fb-panel\">\r\n          <h2 class=\"fb-panel__title\">Spending them</h2>\r\n          <div class=\"fb-panel__body\">\r\n            <p>Tickets buy catalog items. <a href=\"/catalog\">Browse the catalog</a>.</p>\r\n            <p class=\"fb-muted\">Everything you earn is a ledger entry on your account, so the amounts here are the same numbers the panel sees.</p>\r\n          </div>\r\n        </section>\r\n      </aside>\r\n    </div>\r\n  ")
    ;  } 
    ; __append("\r\n</main>\r\n\r\n")
    ; __append( include('../partials/footer') )
    ; __append("\r\n</body>\r\n</html>\r\n")
  return __output;

},
  "pages/error": function anonymous(locals, escapeFn, include, rethrow
) {
var footer = locals.footer, head = locals.head, header = locals.header, message = locals.message, pageTitle = locals.pageTitle, partials = locals.partials, statusCode = locals.statusCode;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append( include('../partials/head', { pageTitle: pageTitle }) )
    ; __append("\r\n")
    ; __append( include('../partials/header') )
    ; __append("\r\n\r\n<main class=\"fb-container fb-main\">\r\n  <div class=\"fb-content\">\r\n    <h1 class=\"fb-title\">")
    ; __append(escapeFn( statusCode ))
    ; __append("</h1>\r\n    <p class=\"fb-muted\">")
    ; __append(escapeFn( message ))
    ; __append("</p>\r\n\r\n    <div class=\"fb-prose\">\r\n      <p>Head back to the <a href=\"/\">home page</a>, or try one of these:</p>\r\n      <ul class=\"fb-list\">\r\n        <li><a href=\"/games\">Games</a></li>\r\n        <li><a href=\"/catalog\">Catalog</a></li>\r\n        <li><a href=\"/people\">People</a></li>\r\n        <li><a href=\"/help\">Help</a></li>\r\n      </ul>\r\n    </div>\r\n  </div>\r\n</main>\r\n\r\n")
    ; __append( include('../partials/footer') )
    ; __append("\r\n</body>\r\n</html>\r\n")
  return __output;

},
  "pages/forum": function anonymous(locals, escapeFn, include, rethrow
) {
var No = locals.No, description = locals.description, footer = locals.footer, forEach = locals.forEach, head = locals.head, header = locals.header, lastPost = locals.lastPost, length = locals.length, name = locals.name, pageTitle = locals.pageTitle, partials = locals.partials, posts = locals.posts, query = locals.query, section = locals.section, sections = locals.sections, slug = locals.slug, threads = locals.threads, totalThreads = locals.totalThreads, yet = locals.yet;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append( include('../partials/head', { pageTitle: pageTitle }) )
    ; __append("\r\n")
    ; __append( include('../partials/header') )
    ; __append("\r\n\r\n<main class=\"fb-container fb-main\">\r\n  <div class=\"fb-title-row\">\r\n    <h1 class=\"fb-title\">Forum</h1>\r\n    <span class=\"fb-pagecount\">")
    ; __append(escapeFn( totalThreads ))
    ; __append(" threads</span>\r\n  </div>\r\n\r\n  <section class=\"fb-panel\">\r\n    <h2 class=\"fb-panel__title fb-panel__title--blue\">Search the Forums</h2>\r\n    <div class=\"fb-panel__body\">\r\n      <form class=\"fb-toolbar fb-forum__search\" method=\"get\" action=\"/forum\">\r\n        <input type=\"search\" name=\"q\" value=\"")
    ; __append(escapeFn( query ))
    ; __append("\" placeholder=\"Search forum sections\">\r\n        <button class=\"fb-btn\" type=\"submit\">Search</button>\r\n        ")
    ;  if (query) { 
    ; __append("<a class=\"fb-muted\" href=\"/forum\">Clear</a>")
    ;  } 
    ; __append("\r\n      </form>\r\n    </div>\r\n  </section>\r\n\r\n  <table class=\"fb-table\">\r\n    <thead>\r\n      <tr>\r\n        <th scope=\"col\">Forum</th>\r\n        <th scope=\"col\">Threads</th>\r\n        <th scope=\"col\">Posts</th>\r\n        <th scope=\"col\">Last Post</th>\r\n      </tr>\r\n    </thead>\r\n    <tbody>\r\n      ")
    ;  sections.forEach(function (section) { 
    ; __append("\r\n        <tr>\r\n          <td>\r\n            <a class=\"fb-table__name\" href=\"/forum/")
    ; __append(escapeFn( encodeURIComponent(section.slug) ))
    ; __append("\">")
    ; __append(escapeFn( section.name ))
    ; __append("</a>\r\n            <span class=\"fb-table__desc\">")
    ; __append(escapeFn( section.description ))
    ; __append("</span>\r\n          </td>\r\n          <td>")
    ; __append(escapeFn( section.threads ))
    ; __append("</td>\r\n          <td>")
    ; __append(escapeFn( section.posts ))
    ; __append("</td>\r\n          <td class=\"fb-table__last\">")
    ; __append(escapeFn( section.lastPost || 'No posts yet' ))
    ; __append("</td>\r\n        </tr>\r\n      ")
    ;  }); 
    ; __append("\r\n    </tbody>\r\n  </table>\r\n\r\n  ")
    ;  if (sections.length === 0) { 
    ; __append("\r\n    <div class=\"fb-notice\">\r\n      <p><strong>No section matches that search.</strong></p>\r\n      <p><a href=\"/forum\">Show every section</a>.</p>\r\n    </div>\r\n  ")
    ;  } 
    ; __append("\r\n\r\n  <p class=\"fb-pagination\">Page 1 of 1</p>\r\n\r\n  <div class=\"fb-notice\">\r\n    <p><strong>Every section and thread here is real.</strong></p>\r\n    <p>These sections, the threads in them and the replies are rows in the forum tables, and the\r\n       counts above are counted from those rows rather than stored. Posting is open: sign in, open\r\n       a section, then start a thread or reply to one that is not locked. A forum moderator can\r\n       lock, pin or delete a thread, and each of those goes into the audit log.</p>\r\n  </div>\r\n</main>\r\n\r\n")
    ; __append( include('../partials/footer') )
    ; __append("\r\n</body>\r\n</html>\r\n")
  return __output;

},
  "pages/forum-section": function anonymous(locals, escapeFn, include, rethrow
) {
var author = locals.author, canPost = locals.canPost, description = locals.description, entry = locals.entry, footer = locals.footer, forEach = locals.forEach, head = locals.head, header = locals.header, id = locals.id, lastPost = locals.lastPost, length = locals.length, locked = locals.locked, name = locals.name, notice = locals.notice, pageTitle = locals.pageTitle, partials = locals.partials, pinned = locals.pinned, replies = locals.replies, section = locals.section, signedIn = locals.signedIn, slug = locals.slug, staffOnly = locals.staffOnly, thread = locals.thread, threads = locals.threads, title = locals.title;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append( include('../partials/head', { pageTitle: pageTitle }) )
    ; __append("\r\n")
    ; __append( include('../partials/header') )
    ; __append("\r\n\r\n<main class=\"fb-container fb-main\">\r\n  <p class=\"fb-crumbs\"><a href=\"/forum\">Forum</a> &raquo; ")
    ; __append(escapeFn( section.name ))
    ; __append("</p>\r\n\r\n  ")
    ;  if (notice) { 
    ; __append("\r\n    <div class=\"fb-notice\"><p><strong>")
    ; __append(escapeFn( notice ))
    ; __append("</strong></p></div>\r\n  ")
    ;  } 
    ; __append("\r\n\r\n  <div class=\"fb-title-row\">\r\n    <h1 class=\"fb-title\">")
    ; __append(escapeFn( section.name ))
    ; __append("</h1>\r\n    <span class=\"fb-pagecount\">")
    ; __append(escapeFn( section.threads ))
    ; __append(" ")
    ; __append(escapeFn( section.threads === 1 ? 'thread' : 'threads' ))
    ; __append("</span>\r\n  </div>\r\n\r\n  <p class=\"fb-muted\">")
    ; __append(escapeFn( section.description ))
    ;  if (section.staffOnly) { 
    ; __append(" <strong>Staff only.</strong>")
    ;  } 
    ; __append("</p>\r\n\r\n  ")
    ;  if (canPost) { 
    ; __append("\r\n    <section class=\"fb-panel\">\r\n      <h2 class=\"fb-panel__title\">Start a thread</h2>\r\n      <div class=\"fb-panel__body\">\r\n        <form class=\"fb-form\" method=\"post\" action=\"/forum/")
    ; __append(escapeFn( section.slug ))
    ; __append("/threads\">\r\n          <label for=\"fb-thread-title\">Title</label>\r\n          <input id=\"fb-thread-title\" name=\"title\" type=\"text\" maxlength=\"120\" required>\r\n\r\n          <label for=\"fb-thread-body\">First post</label>\r\n          <textarea id=\"fb-thread-body\" name=\"body\" rows=\"6\" required></textarea>\r\n\r\n          <button class=\"fb-btn fb-btn--primary\" type=\"submit\">Post thread</button>\r\n        </form>\r\n      </div>\r\n    </section>\r\n  ")
    ;  } else if (!signedIn) { 
    ; __append("\r\n    <div class=\"fb-notice\">\r\n      <p><strong><a href=\"/login\">Sign in</a> to post.</strong></p>\r\n      <p>Reading is open to everyone; starting a thread needs an account.</p>\r\n    </div>\r\n  ")
    ;  } else if (section.staffOnly) { 
    ; __append("\r\n    <div class=\"fb-notice\">\r\n      <p><strong>Staff only.</strong></p>\r\n      <p>You can read this section, but only staff can start a thread in it.</p>\r\n    </div>\r\n  ")
    ;  } 
    ; __append("\r\n\r\n  <table class=\"fb-table\">\r\n    <thead>\r\n      <tr>\r\n        <th scope=\"col\">Thread</th>\r\n        <th scope=\"col\">Author</th>\r\n        <th scope=\"col\">Replies</th>\r\n        <th scope=\"col\">Last Post</th>\r\n      </tr>\r\n    </thead>\r\n    <tbody>\r\n      ")
    ;  if (threads.length === 0) { 
    ; __append("\r\n        <tr>\r\n          <td colspan=\"4\" class=\"fb-table__last\">No threads yet.</td>\r\n        </tr>\r\n      ")
    ;  } 
    ; __append("\r\n      ")
    ;  threads.forEach(function (entry) { 
    ; __append("\r\n        <tr>\r\n          <td>\r\n            ")
    ;  if (entry.pinned) { 
    ; __append("<span class=\"fb-muted\">[Pinned] </span>")
    ;  } 
    ; __append("\r\n            ")
    ;  if (entry.locked) { 
    ; __append("<span class=\"fb-muted\">[Locked] </span>")
    ;  } 
    ; __append("\r\n            <a class=\"fb-table__name\" href=\"/forum/")
    ; __append(escapeFn( section.slug ))
    ; __append("/")
    ; __append(escapeFn( entry.id ))
    ; __append("\">")
    ; __append(escapeFn( entry.title ))
    ; __append("</a>\r\n          </td>\r\n          <td><a href=\"/people/")
    ; __append(escapeFn( entry.author ))
    ; __append("\">")
    ; __append(escapeFn( entry.author ))
    ; __append("</a></td>\r\n          <td>")
    ; __append(escapeFn( entry.replies ))
    ; __append("</td>\r\n          <td class=\"fb-table__last\">")
    ; __append(escapeFn( entry.lastPost ))
    ; __append("</td>\r\n        </tr>\r\n      ")
    ;  }); 
    ; __append("\r\n    </tbody>\r\n  </table>\r\n\r\n  <p class=\"fb-panel__more\"><a href=\"/forum\">Back to the forum index</a></p>\r\n</main>\r\n\r\n")
    ; __append( include('../partials/footer') )
    ; __append("\r\n</body>\r\n</html>\r\n")
  return __output;

},
  "pages/forum-thread": function anonymous(locals, escapeFn, include, rethrow
) {
var Lock = locals.Lock, Pin = locals.Pin, Unlock = locals.Unlock, Unpin = locals.Unpin, author = locals.author, body = locals.body, canModerate = locals.canModerate, canPost = locals.canPost, created = locals.created, footer = locals.footer, forEach = locals.forEach, head = locals.head, header = locals.header, id = locals.id, length = locals.length, line = locals.line, lock = locals.lock, locked = locals.locked, n = locals.n, notice = locals.notice, number = locals.number, pageTitle = locals.pageTitle, partials = locals.partials, pin = locals.pin, pinned = locals.pinned, post = locals.post, posts = locals.posts, sectionName = locals.sectionName, sectionSlug = locals.sectionSlug, signedIn = locals.signedIn, split = locals.split, thread = locals.thread, title = locals.title, unlock = locals.unlock, unpin = locals.unpin, when = locals.when;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append( include('../partials/head', { pageTitle: pageTitle }) )
    ; __append("\r\n")
    ; __append( include('../partials/header') )
    ; __append("\r\n\r\n<main class=\"fb-container fb-main\">\r\n  <p class=\"fb-crumbs\">\r\n    <a href=\"/forum\">Forum</a> &raquo;\r\n    <a href=\"/forum/")
    ; __append(escapeFn( thread.sectionSlug ))
    ; __append("\">")
    ; __append(escapeFn( thread.sectionName ))
    ; __append("</a> &raquo;\r\n    ")
    ; __append(escapeFn( thread.title ))
    ; __append("\r\n  </p>\r\n\r\n  ")
    ;  if (notice) { 
    ; __append("\r\n    <div class=\"fb-notice\"><p><strong>")
    ; __append(escapeFn( notice ))
    ; __append("</strong></p></div>\r\n  ")
    ;  } 
    ; __append("\r\n\r\n  <div class=\"fb-title-row\">\r\n    <h1 class=\"fb-title\">")
    ; __append(escapeFn( thread.title ))
    ; __append("</h1>\r\n    <span class=\"fb-pagecount\">\r\n      ")
    ;  if (thread.pinned) { 
    ; __append("Pinned")
    ;  } 
    ; __append("\r\n      ")
    ;  if (thread.pinned && thread.locked) { 
    ; __append(" &middot; ")
    ;  } 
    ; __append("\r\n      ")
    ;  if (thread.locked) { 
    ; __append("Locked")
    ;  } 
    ; __append("\r\n      ")
    ;  if (!thread.pinned && !thread.locked) { 
    ; __append(escapeFn( posts.length ))
    ; __append(" posts")
    ;  } 
    ; __append("\r\n    </span>\r\n  </div>\r\n\r\n  <p class=\"fb-muted\">Started by <a href=\"/people/")
    ; __append(escapeFn( thread.author ))
    ; __append("\">")
    ; __append(escapeFn( thread.author ))
    ; __append("</a> on ")
    ; __append(escapeFn( thread.created ))
    ; __append("</p>\r\n\r\n  <section class=\"fb-panel\">\r\n    <h2 class=\"fb-panel__title\">Posts</h2>\r\n    <div class=\"fb-panel__body\">\r\n      ")
    ;  posts.forEach(function (post) { 
    ; __append("\r\n        <article class=\"fb-post\">\r\n          <p class=\"fb-post__meta\">\r\n            <strong><a href=\"/people/")
    ; __append(escapeFn( post.author ))
    ; __append("\">")
    ; __append(escapeFn( post.author ))
    ; __append("</a></strong>\r\n            &middot; #")
    ; __append(escapeFn( post.number ))
    ; __append(" &middot; ")
    ; __append(escapeFn( post.when ))
    ; __append("\r\n          </p>\r\n          <div class=\"fb-post__body\">\r\n            ")
    ;  post.body.split('\n').forEach(function (line) { 
    ; __append(escapeFn( line ))
    ; __append("<br>")
    ;  }); 
    ; __append("\r\n          </div>\r\n        </article>\r\n      ")
    ;  }); 
    ; __append("\r\n    </div>\r\n  </section>\r\n\r\n  ")
    ;  if (canPost) { 
    ; __append("\r\n    <section class=\"fb-panel\">\r\n      <h2 class=\"fb-panel__title\">Reply</h2>\r\n      <div class=\"fb-panel__body\">\r\n        <form class=\"fb-form\" method=\"post\" action=\"/forum/")
    ; __append(escapeFn( thread.sectionSlug ))
    ; __append("/")
    ; __append(escapeFn( thread.id ))
    ; __append("/reply\">\r\n          <label for=\"fb-reply\">Your reply</label>\r\n          <textarea id=\"fb-reply\" name=\"body\" rows=\"6\" required></textarea>\r\n          <button class=\"fb-btn fb-btn--primary\" type=\"submit\">Post reply</button>\r\n        </form>\r\n      </div>\r\n    </section>\r\n  ")
    ;  } else if (thread.locked) { 
    ; __append("\r\n    <div class=\"fb-notice\">\r\n      <p><strong>This thread is locked.</strong></p>\r\n      <p>Nobody can reply while it is locked. Staff can unlock it.</p>\r\n    </div>\r\n  ")
    ;  } else if (!signedIn) { 
    ; __append("\r\n    <div class=\"fb-notice\">\r\n      <p><strong><a href=\"/login\">Sign in</a> to reply.</strong></p>\r\n    </div>\r\n  ")
    ;  } 
    ; __append("\r\n\r\n  ")
    ;  if (canModerate) { 
    ; __append("\r\n    <section class=\"fb-panel\">\r\n      <h2 class=\"fb-panel__title\">Staff controls</h2>\r\n      <div class=\"fb-panel__body\">\r\n        <form class=\"fb-inline\" method=\"post\" action=\"/forum/")
    ; __append(escapeFn( thread.sectionSlug ))
    ; __append("/")
    ; __append(escapeFn( thread.id ))
    ; __append("/moderate\">\r\n          <input type=\"hidden\" name=\"action\" value=\"")
    ; __append(escapeFn( thread.locked ? 'unlock' : 'lock' ))
    ; __append("\">\r\n          <button class=\"fb-btn\" type=\"submit\">")
    ; __append(escapeFn( thread.locked ? 'Unlock thread' : 'Lock thread' ))
    ; __append("</button>\r\n        </form>\r\n        <form class=\"fb-inline\" method=\"post\" action=\"/forum/")
    ; __append(escapeFn( thread.sectionSlug ))
    ; __append("/")
    ; __append(escapeFn( thread.id ))
    ; __append("/moderate\">\r\n          <input type=\"hidden\" name=\"action\" value=\"")
    ; __append(escapeFn( thread.pinned ? 'unpin' : 'pin' ))
    ; __append("\">\r\n          <button class=\"fb-btn\" type=\"submit\">")
    ; __append(escapeFn( thread.pinned ? 'Unpin thread' : 'Pin thread' ))
    ; __append("</button>\r\n        </form>\r\n        <form class=\"fb-inline\" method=\"post\" action=\"/forum/")
    ; __append(escapeFn( thread.sectionSlug ))
    ; __append("/")
    ; __append(escapeFn( thread.id ))
    ; __append("/moderate\">\r\n          <input type=\"hidden\" name=\"action\" value=\"delete\">\r\n          <button class=\"fb-btn\" type=\"submit\">Delete thread</button>\r\n        </form>\r\n        <p class=\"fb-admin__note\">Locking stops replies. Deleting removes the thread and its posts; both are written to the audit log.</p>\r\n      </div>\r\n    </section>\r\n  ")
    ;  } 
    ; __append("\r\n\r\n  <p class=\"fb-panel__more\"><a href=\"/forum/")
    ; __append(escapeFn( thread.sectionSlug ))
    ; __append("\">Back to ")
    ; __append(escapeFn( thread.sectionName ))
    ; __append("</a></p>\r\n</main>\r\n\r\n")
    ; __append( include('../partials/footer') )
    ; __append("\r\n</body>\r\n</html>\r\n")
  return __output;

},
  "pages/friends": function anonymous(locals, escapeFn, include, rethrow
) {
var Offline = locals.Offline, Online = locals.Online, avatar = locals.avatar, canAct = locals.canAct, footer = locals.footer, forEach = locals.forEach, friend = locals.friend, friends = locals.friends, head = locals.head, header = locals.header, incoming = locals.incoming, joined = locals.joined, length = locals.length, notice = locals.notice, online = locals.online, outgoing = locals.outgoing, pageTitle = locals.pageTitle, partials = locals.partials, person = locals.person, size = locals.size, stats = locals.stats, total = locals.total, username = locals.username, xs = locals.xs;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append( include('../partials/head', { pageTitle: pageTitle }) )
    ; __append("\r\n")
    ; __append( include('../partials/header') )
    ; __append("\r\n\r\n<main class=\"fb-container fb-main\">\r\n  <div class=\"fb-title-row\">\r\n    <h1 class=\"fb-title\">Friends</h1>\r\n    <span class=\"fb-pagecount\">")
    ; __append(escapeFn( total ))
    ; __append(" friends</span>\r\n  </div>\r\n\r\n  ")
    ;  if (notice) { 
    ; __append("\r\n    <div class=\"fb-notice\">\r\n      <p><strong>")
    ; __append(escapeFn( notice ))
    ; __append("</strong></p>\r\n    </div>\r\n  ")
    ;  } 
    ; __append("\r\n\r\n  <section class=\"fb-panel\">\r\n    <h2 class=\"fb-panel__title\">Friend Requests</h2>\r\n    <div class=\"fb-panel__body fb-panel__body--flush\">\r\n      <table class=\"fb-table\">\r\n        <thead>\r\n          <tr>\r\n            <th scope=\"col\">Avatar</th>\r\n            <th scope=\"col\">Name</th>\r\n            <th scope=\"col\">Waiting for</th>\r\n            <th scope=\"col\">Action</th>\r\n          </tr>\r\n        </thead>\r\n        <tbody>\r\n          ")
    ;  if (incoming.length === 0 && outgoing.length === 0) { 
    ; __append("\r\n            <tr>\r\n              <td colspan=\"4\" class=\"fb-table__last\">No requests either way.</td>\r\n            </tr>\r\n          ")
    ;  } 
    ; __append("\r\n\r\n          ")
    ;  incoming.forEach(function (person) { 
    ; __append("\r\n            <tr>\r\n              <td class=\"fb-table__avatar\">\r\n                ")
    ; __append( include('../partials/avatar', { avatar: person.avatar, size: 'xs' }) )
    ; __append("\r\n              </td>\r\n              <td><a class=\"fb-table__name\" href=\"/people/")
    ; __append(escapeFn( person.username ))
    ; __append("\">")
    ; __append(escapeFn( person.username ))
    ; __append("</a></td>\r\n              <td>Your answer</td>\r\n              <td>\r\n                ")
    ;  if (canAct) { 
    ; __append("\r\n                  <form method=\"post\" action=\"/friends/accept/")
    ; __append(escapeFn( person.username ))
    ; __append("\">\r\n                    <button class=\"fb-btn fb-btn--primary\" type=\"submit\">Accept</button>\r\n                  </form>\r\n                  <form method=\"post\" action=\"/friends/decline/")
    ; __append(escapeFn( person.username ))
    ; __append("\">\r\n                    <button class=\"fb-btn\" type=\"submit\">Decline</button>\r\n                  </form>\r\n                ")
    ;  } else { 
    ; __append("\r\n                  <span class=\"fb-muted\">Read only</span>\r\n                ")
    ;  } 
    ; __append("\r\n              </td>\r\n            </tr>\r\n          ")
    ;  }); 
    ; __append("\r\n\r\n          ")
    ;  outgoing.forEach(function (person) { 
    ; __append("\r\n            <tr>\r\n              <td class=\"fb-table__avatar\">\r\n                ")
    ; __append( include('../partials/avatar', { avatar: person.avatar, size: 'xs' }) )
    ; __append("\r\n              </td>\r\n              <td><a class=\"fb-table__name\" href=\"/people/")
    ; __append(escapeFn( person.username ))
    ; __append("\">")
    ; __append(escapeFn( person.username ))
    ; __append("</a></td>\r\n              <td>Their answer</td>\r\n              <td>\r\n                ")
    ;  if (canAct) { 
    ; __append("\r\n                  <form method=\"post\" action=\"/friends/cancel/")
    ; __append(escapeFn( person.username ))
    ; __append("\">\r\n                    <button class=\"fb-btn\" type=\"submit\">Cancel Request</button>\r\n                  </form>\r\n                ")
    ;  } else { 
    ; __append("\r\n                  <span class=\"fb-muted\">Read only</span>\r\n                ")
    ;  } 
    ; __append("\r\n              </td>\r\n            </tr>\r\n          ")
    ;  }); 
    ; __append("\r\n        </tbody>\r\n      </table>\r\n    </div>\r\n  </section>\r\n\r\n  <table class=\"fb-table\">\r\n    <thead>\r\n      <tr>\r\n        <th scope=\"col\">Avatar</th>\r\n        <th scope=\"col\">Name</th>\r\n        <th scope=\"col\">Status</th>\r\n        <th scope=\"col\">Friends</th>\r\n        <th scope=\"col\">Joined</th>\r\n        <th scope=\"col\">Action</th>\r\n      </tr>\r\n    </thead>\r\n    <tbody>\r\n      ")
    ;  if (friends.length === 0) { 
    ; __append("\r\n        <tr>\r\n          <td colspan=\"6\" class=\"fb-table__last\">\r\n            No friends yet. <a href=\"/people\">Find someone to add</a>.\r\n          </td>\r\n        </tr>\r\n      ")
    ;  } 
    ; __append("\r\n\r\n      ")
    ;  friends.forEach(function (friend) { 
    ; __append("\r\n        <tr>\r\n          <td class=\"fb-table__avatar\">\r\n            ")
    ; __append( include('../partials/avatar', { avatar: friend.avatar, size: 'xs' }) )
    ; __append("\r\n          </td>\r\n          <td><a class=\"fb-table__name\" href=\"/people/")
    ; __append(escapeFn( friend.username ))
    ; __append("\">")
    ; __append(escapeFn( friend.username ))
    ; __append("</a></td>\r\n          <td>")
    ; __append(escapeFn( friend.online ? 'Online' : 'Offline' ))
    ; __append("</td>\r\n          <td>")
    ; __append(escapeFn( friend.stats.friends ))
    ; __append("</td>\r\n          <td class=\"fb-table__last\">")
    ; __append(escapeFn( friend.joined ))
    ; __append("</td>\r\n          <td>\r\n            ")
    ;  if (canAct) { 
    ; __append("\r\n              <form method=\"post\" action=\"/friends/remove/")
    ; __append(escapeFn( friend.username ))
    ; __append("\">\r\n                <button class=\"fb-btn\" type=\"submit\">Remove</button>\r\n              </form>\r\n              <form method=\"post\" action=\"/friends/block/")
    ; __append(escapeFn( friend.username ))
    ; __append("\">\r\n                <button class=\"fb-btn\" type=\"submit\">Block</button>\r\n              </form>\r\n            ")
    ;  } else { 
    ; __append("\r\n              <span class=\"fb-muted\">Read only</span>\r\n            ")
    ;  } 
    ; __append("\r\n          </td>\r\n        </tr>\r\n      ")
    ;  }); 
    ; __append("\r\n    </tbody>\r\n  </table>\r\n\r\n  <p class=\"fb-pagination\">Page 1 of 1</p>\r\n\r\n  <div class=\"fb-notice\">\r\n    <p><strong>Requests are real.</strong></p>\r\n    <p>Sending a request only creates a pending row: nothing becomes a friendship until the other member answers. You can withdraw a request you sent, and either side can remove a friendship. Blocking ends it outright and stops any further request between the two accounts, without telling the other person that they were blocked.</p>\r\n  </div>\r\n</main>\r\n\r\n")
    ; __append( include('../partials/footer') )
    ; __append("\r\n</body>\r\n</html>\r\n")
  return __output;

},
  "pages/game": function anonymous(locals, escapeFn, include, rethrow
) {
var Draft = locals.Draft, FieldBrik = locals.FieldBrik, Offline = locals.Offline, Online = locals.Online, Play = locals.Play, Press = locals.Press, Publish = locals.Publish, Published = locals.Published, This = locals.This, Unpublish = locals.Unpublish, a = locals.a, avatar = locals.avatar, btn = locals.btn, client = locals.client, created = locals.created, creator = locals.creator, description = locals.description, fb = locals.fb, file = locals.file, filename = locals.filename, footer = locals.footer, formatLabel = locals.formatLabel, head = locals.head, header = locals.header, id = locals.id, img = locals.img, is = locals.is, isOwner = locals.isOwner, joinUrl = locals.joinUrl, listing = locals.listing, md = locals.md, name = locals.name, notice = locals.notice, now = locals.now, online = locals.online, open = locals.open, pageTitle = locals.pageTitle, partials = locals.partials, place = locals.place, placeFile = locals.placeFile, primary = locals.primary, published = locals.published, ready = locals.ready, size = locals.size, slug = locals.slug, the = locals.the, thumb = locals.thumb, thumbUrl = locals.thumbUrl, thumbnailUrl = locals.thumbnailUrl, to = locals.to, toFixed = locals.toFixed, updated = locals.updated, username = locals.username, version = locals.version;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append( include('../partials/head', { pageTitle: pageTitle }) )
    ; __append("\r\n")
    ; __append( include('../partials/header') )
    ; __append("\r\n\r\n<main class=\"fb-container fb-main\">\r\n  <p class=\"fb-crumbs\"><a href=\"/home\">Home</a> &raquo; ")
    ; __append(escapeFn( place.name ))
    ; __append("</p>\r\n\r\n  ")
    ;  if (notice) { 
    ; __append("\r\n    <div class=\"fb-notice\"><p><strong>")
    ; __append(escapeFn( notice ))
    ; __append("</strong></p></div>\r\n  ")
    ;  } 
    ; __append("\r\n\r\n  ")
    ;  if (!place.published) { 
    ; __append("\r\n    <div class=\"fb-notice\">\r\n      <p><strong>This place is a draft.</strong></p>\r\n      <p>Only you can see this page. Publish it from <a href=\"/places/")
    ; __append(escapeFn( place.id ))
    ; __append("/edit\">Edit place</a>\r\n         when it is ready, and it appears on the Home page for everybody.</p>\r\n    </div>\r\n  ")
    ;  } 
    ; __append("\r\n\r\n  <div class=\"fb-title-row\">\r\n    <h1 class=\"fb-title\">")
    ; __append(escapeFn( place.name ))
    ; __append("</h1>\r\n    <span class=\"fb-pagecount\">")
    ; __append(escapeFn( place.published ? 'Published' : 'Draft' ))
    ; __append("</span>\r\n  </div>\r\n\r\n  <div class=\"fb-cols\">\r\n    <div class=\"fb-col-main\">\r\n      <span class=\"fb-hero\" style=\"--thumb: ")
    ; __append(escapeFn( place.thumb ))
    ; __append(";\" aria-hidden=\"true\">")
    ; __append( include('../partials/thumb-img', { thumbUrl: place.thumbnailUrl }) )
    ; __append("</span>\r\n      ")
    ;  if (isOwner) { 
    ; __append("\r\n        <p class=\"fb-panel__more\"><a class=\"fb-btn\" href=\"/places/")
    ; __append(escapeFn( place.id ))
    ; __append("/edit#fb-place-thumbnail-panel\">Change thumbnail</a></p>\r\n      ")
    ;  } 
    ; __append("\r\n\r\n      ")
    ;  if (placeFile) { 
    ; __append("\r\n        <div class=\"fb-filebox\">\r\n          <p><strong>Place file ready.</strong> Version ")
    ; __append(escapeFn( placeFile.version ))
    ; __append(", marked\r\n             <span class=\"fb-muted\">")
    ; __append(escapeFn( placeFile.filename ))
    ; __append("</span>.</p>\r\n          <p>\r\n            ")
    ;  if (typeof joinUrl !== 'undefined' && joinUrl) { 
    ; __append("\r\n              <a class=\"fb-btn fb-btn--primary\" href=\"")
    ; __append(escapeFn( joinUrl ))
    ; __append("\">Play</a>\r\n            ")
    ;  } else { 
    ; __append("\r\n              <a class=\"fb-btn fb-btn--primary\" href=\"/login\">Sign in to play</a>\r\n            ")
    ;  } 
    ; __append("\r\n            <a class=\"fb-btn\" href=\"/games/")
    ; __append(escapeFn( place.slug ))
    ; __append("/file\">Download place file</a>\r\n            <span class=\"fb-muted\">")
    ; __append(escapeFn( placeFile.formatLabel ))
    ; __append(", ")
    ; __append(escapeFn( (placeFile.size / 1024).toFixed(1) ))
    ; __append(" KB</span>\r\n          </p>\r\n        </div>\r\n      ")
    ;  } else { 
    ; __append("\r\n        <div class=\"fb-notice\">\r\n          <p><strong>No place file has been published yet.</strong></p>\r\n          <p>")
    ;  if (isOwner) { 
    ; __append("Open <a href=\"/places/")
    ; __append(escapeFn( place.id ))
    ; __append("/edit\">Edit place</a> to publish the .fbrx file from Studio.")
    ;  } else { 
    ; __append("The creator has not published a file for this place yet.")
    ;  } 
    ; __append("</p>\r\n        </div>\r\n      ")
    ;  } 
    ; __append("\r\n\r\n      <section class=\"fb-panel\">\r\n        <h2 class=\"fb-panel__title\">About this place</h2>\r\n        <div class=\"fb-panel__body fb-prose\">\r\n          ")
    ;  if (place.description) { 
    ; __append("\r\n            ")
    ; __append(escapeFn( place.description ))
    ; __append("\r\n          ")
    ;  } else { 
    ; __append("\r\n            <p class=\"fb-muted\">")
    ; __append(escapeFn( place.creator ))
    ; __append(" has not written a description yet.</p>\r\n          ")
    ;  } 
    ; __append("\r\n        </div>\r\n      </section>\r\n\r\n      <section class=\"fb-panel\">\r\n        <h2 class=\"fb-panel__title\">Details</h2>\r\n        <div class=\"fb-panel__body fb-panel__body--flush\">\r\n          <table class=\"fb-table fb-table--kv\">\r\n            <tbody>\r\n              <tr>\r\n                <th scope=\"row\">Creator</th>\r\n                <td><a href=\"/people/")
    ; __append(escapeFn( encodeURIComponent(place.creator) ))
    ; __append("\">")
    ; __append(escapeFn( place.creator ))
    ; __append("</a></td>\r\n              </tr>\r\n              <tr>\r\n                <th scope=\"row\">Built</th>\r\n                <td>")
    ; __append(escapeFn( place.created ))
    ; __append("</td>\r\n              </tr>\r\n              <tr>\r\n                <th scope=\"row\">Last updated</th>\r\n                <td>")
    ; __append(escapeFn( place.updated ))
    ; __append("</td>\r\n              </tr>\r\n              <tr>\r\n                <th scope=\"row\">Visits</th>\r\n                <td>Not counted yet</td>\r\n              </tr>\r\n            </tbody>\r\n          </table>\r\n        </div>\r\n      </section>\r\n\r\n      <div class=\"fb-notice\">\r\n        <p><strong>")
    ; __append(escapeFn( placeFile ? 'Press Play to open this place in the FieldBrik client.' : 'This listing is ready for a file.' ))
    ; __append("</strong></p>\r\n        <p>")
    ;  if (placeFile) { 
    ; __append("Play hands the place to the client along with your account name, user id and\r\n           avatar. If Windows asks what to open it with, choose FieldBrik Player: the client registers\r\n           the link the first time it runs. The exact XML Studio published can still be downloaded below.")
    ;  } else { 
    ; __append("Publishing a .fbrx from Studio, or uploading one here, stores it as version 1 and makes\r\n           it downloadable. Publishing again keeps the older version on the place's record rather\r\n           than overwriting it.")
    ;  } 
    ; __append("</p>\r\n      </div>\r\n    </div>\r\n\r\n    <aside class=\"fb-col-side\">\r\n      <div class=\"fb-creator\">\r\n        ")
    ;  if (creator) { 
    ; __append("\r\n          ")
    ; __append( include('../partials/avatar', { avatar: creator.avatar, size: 'md' }) )
    ; __append("\r\n          <a class=\"fb-creator__name\" href=\"/people/")
    ; __append(escapeFn( encodeURIComponent(creator.username) ))
    ; __append("\">")
    ; __append(escapeFn( creator.username ))
    ; __append("</a>\r\n          <p class=\"fb-creator__meta\">")
    ; __append(escapeFn( creator.online ? 'Online now' : 'Offline' ))
    ; __append("</p>\r\n        ")
    ;  } else { 
    ; __append("\r\n          <a class=\"fb-creator__name\" href=\"/people/")
    ; __append(escapeFn( encodeURIComponent(place.creator) ))
    ; __append("\">")
    ; __append(escapeFn( place.creator ))
    ; __append("</a>\r\n          <p class=\"fb-creator__meta\">Creator</p>\r\n        ")
    ;  } 
    ; __append("\r\n      </div>\r\n\r\n      ")
    ;  if (isOwner) { 
    ; __append("\r\n        <section class=\"fb-panel\">\r\n          <h2 class=\"fb-panel__title\">This is your place</h2>\r\n          <div class=\"fb-panel__body\">\r\n            <p><a class=\"fb-btn\" href=\"/places/")
    ; __append(escapeFn( place.id ))
    ; __append("/edit\">Edit place</a></p>\r\n            <p><a class=\"fb-btn\" href=\"/places/")
    ; __append(escapeFn( place.id ))
    ; __append("/edit#fb-place-file-panel\">Publish a place file</a></p>\r\n            <form method=\"post\" action=\"/places/")
    ; __append(escapeFn( place.id ))
    ; __append("/status\">\r\n              <input type=\"hidden\" name=\"published\" value=\"")
    ; __append(escapeFn( place.published ? '0' : '1' ))
    ; __append("\">\r\n              <button class=\"fb-btn")
    ; __append(escapeFn( place.published ? '' : ' fb-btn--primary' ))
    ; __append("\" type=\"submit\">\r\n                ")
    ; __append(escapeFn( place.published ? 'Unpublish' : 'Publish' ))
    ; __append("\r\n              </button>\r\n            </form>\r\n            <p class=\"fb-admin__note\">\r\n              Unpublishing takes it off the Home page and keeps the page, your draft and its\r\n              address. Nobody else can open an unpublished place.\r\n            </p>\r\n          </div>\r\n        </section>\r\n      ")
    ;  } 
    ; __append("\r\n\r\n      <section class=\"fb-panel\">\r\n        <h2 class=\"fb-panel__title\">More places</h2>\r\n        <div class=\"fb-panel__body\">\r\n          <p class=\"fb-muted\"><a href=\"/home\">Browse every place</a>, and filter by creator from the Home page.</p>\r\n        </div>\r\n      </section>\r\n    </aside>\r\n  </div>\r\n</main>\r\n\r\n")
    ; __append( include('../partials/footer') )
    ; __append("\r\n</body>\r\n</html>\r\n")
  return __output;

},
  "pages/games": function anonymous(locals, escapeFn, include, rethrow
) {
var US = locals.US, active = locals.active, browseFacets = locals.browseFacets, creator = locals.creator, en = locals.en, facet = locals.facet, footer = locals.footer, forEach = locals.forEach, head = locals.head, header = locals.header, heading = locals.heading, href = locals.href, img = locals.img, is = locals.is, label = locals.label, length = locals.length, name = locals.name, nextHref = locals.nextHref, on = locals.on, pageTitle = locals.pageTitle, partials = locals.partials, place = locals.place, prevHref = locals.prevHref, query = locals.query, slug = locals.slug, thumb = locals.thumb, thumbUrl = locals.thumbUrl, thumbnailUrl = locals.thumbnailUrl, tiles = locals.tiles, timeFacets = locals.timeFacets, toLocaleString = locals.toLocaleString, updatedLabel = locals.updatedLabel, visits = locals.visits;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append("\n")
    ; __append( include('../partials/head', { pageTitle: pageTitle }) )
    ; __append("\n")
    ; __append( include('../partials/header') )
    ; __append("\n\n<main class=\"fb-games2009\">\n  <div class=\"fb-container\">\n    <h1 class=\"fb-games2009__title\">Games</h1>\n\n    <div class=\"fb-games2009__body\">\n      <aside class=\"fb-browse2009\">\n        <h2 class=\"fb-browse2009__head\">Browse</h2>\n        <ul class=\"fb-browse2009__list\">\n          ")
    ;  browseFacets.forEach(function (facet) { 
    ; __append("\n            <li>\n              <a class=\"")
    ; __append(escapeFn( facet.active ? 'is-on' : '' ))
    ; __append("\" href=\"")
    ; __append(escapeFn( facet.href ))
    ; __append("\">\n                <span class=\"fb-browse2009__pip\" aria-hidden=\"true\"></span>")
    ; __append(escapeFn( facet.label ))
    ; __append("\n              </a>\n            </li>\n          ")
    ;  }); 
    ; __append("\n        </ul>\n\n        <h2 class=\"fb-browse2009__head\">Time</h2>\n        <ul class=\"fb-browse2009__list\">\n          ")
    ;  timeFacets.forEach(function (facet) { 
    ; __append("\n            <li>\n              <a class=\"")
    ; __append(escapeFn( facet.active ? 'is-on' : '' ))
    ; __append("\" href=\"")
    ; __append(escapeFn( facet.href ))
    ; __append("\">\n                <span class=\"fb-browse2009__pip\" aria-hidden=\"true\"></span>")
    ; __append(escapeFn( facet.label ))
    ; __append("\n              </a>\n            </li>\n          ")
    ;  }); 
    ; __append("\n        </ul>\n\n        <p class=\"fb-browse2009__note\">Visits are not counted yet, so places are ordered by when they were\n          last changed rather than by how many people have played them.</p>\n      </aside>\n\n      <section class=\"fb-games2009__main\">\n        <div class=\"fb-games2009__top\">\n          <h2 class=\"fb-games2009__heading\">")
    ; __append(escapeFn( heading ))
    ; __append("</h2>\n          <p class=\"fb-games2009__pages\">\n            Pages:\n            ")
    ;  if (prevHref) { 
    ; __append("<a href=\"")
    ; __append(escapeFn( prevHref ))
    ; __append("\">&lt;&lt; Back</a>")
    ;  } 
    ; __append("\n            ")
    ;  if (prevHref && nextHref) { 
    ; __append("&nbsp;")
    ;  } 
    ; __append("\n            ")
    ;  if (nextHref) { 
    ; __append("<a href=\"")
    ; __append(escapeFn( nextHref ))
    ; __append("\">Next &gt;&gt;</a>")
    ;  } 
    ; __append("\n            ")
    ;  if (!prevHref && !nextHref) { 
    ; __append("1 of 1")
    ;  } 
    ; __append("\n          </p>\n        </div>\n\n        ")
    ;  if (tiles.length === 0) { 
    ; __append("\n          <p class=\"fb-games2009__empty\">\n            ")
    ;  if (query) { 
    ; __append("\n              Nothing published matches &ldquo;")
    ; __append(escapeFn( query ))
    ; __append("&rdquo;. <a href=\"/games\">Show every place</a>.\n            ")
    ;  } else { 
    ; __append("\n              No place has been published in this time yet. <a href=\"/games?time=\">All-time</a> shows every place,\n              and <a href=\"/places/new\">building one</a> takes a name and a description.\n            ")
    ;  } 
    ; __append("\n          </p>\n        ")
    ;  } else { 
    ; __append("\n          <ul class=\"fb-games2009__grid\">\n            ")
    ;  tiles.forEach(function (place) { 
    ; __append("\n              <li>\n                <a class=\"fb-game2009__thumb\" href=\"/games/")
    ; __append(escapeFn( place.slug ))
    ; __append("\" style=\"--thumb: ")
    ; __append(escapeFn( place.thumb ))
    ; __append(";\" aria-hidden=\"true\" tabindex=\"-1\">")
    ; __append( include('../partials/thumb-img', { thumbUrl: place.thumbnailUrl }) )
    ; __append("</a>\n                <a class=\"fb-game2009__name\" href=\"/games/")
    ; __append(escapeFn( place.slug ))
    ; __append("\">")
    ; __append(escapeFn( place.name ))
    ; __append("</a>\n                <p class=\"fb-game2009__meta\">Updated: ")
    ; __append(escapeFn( place.updatedLabel ))
    ; __append("</p>\n                <p class=\"fb-game2009__meta\">Creator:\n                  <a href=\"/people/")
    ; __append(escapeFn( encodeURIComponent(place.creator) ))
    ; __append("\">")
    ; __append(escapeFn( place.creator ))
    ; __append("</a></p>\n                ")
    ;  if (place.visits > 0) { 
    ; __append("\n                  <p class=\"fb-game2009__meta\">Played: ")
    ; __append(escapeFn( place.visits.toLocaleString('en-US') ))
    ; __append(" times</p>\n                ")
    ;  } 
    ; __append("\n              </li>\n            ")
    ;  }); 
    ; __append("\n          </ul>\n        ")
    ;  } 
    ; __append("\n      </section>\n    </div>\n  </div>\n</main>\n\n")
    ; __append( include('../partials/footer') )
    ; __append("\n</body>\n</html>\n")
  return __output;

},
  "pages/help": function anonymous(locals, escapeFn, include, rethrow
) {
var currency = locals.currency, earned = locals.earned, footer = locals.footer, head = locals.head, header = locals.header, pageTitle = locals.pageTitle, partials = locals.partials, site = locals.site;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append( include('../partials/head', { pageTitle: pageTitle }) )
    ; __append("\r\n")
    ; __append( include('../partials/header') )
    ; __append("\r\n\r\n<main class=\"fb-container fb-main\">\r\n  <div class=\"fb-content\">\r\n    <h1 class=\"fb-title\">Help</h1>\r\n    <p class=\"fb-muted\">Answers to the questions members ask most.</p>\r\n\r\n    <dl class=\"fb-faq\">\r\n      <dt>What is FieldBrik?</dt>\r\n      <dd>FieldBrik is an independent online building and gaming platform. You construct places out of simple bricks, publish them, and play or build alongside other members. It is built in the spirit of the early, community-run building communities of 2006 to 2008.</dd>\r\n\r\n      <dt>How do I create an account?</dt>\r\n      <dd>Choose a username, an email address and a password on the <a href=\"/login\">sign-in page</a>: a name nobody has taken becomes your account, and a name that is already yours signs you back in. Usernames are unique and are how other members find you. You must be old enough to agree to the Terms of Service.</dd>\r\n\r\n      <dt>How do I log in?</dt>\r\n      <dd>Use the username and password you registered with. Your session is kept in a secure, server-side session, so you stay signed in across browser sessions until you log out.</dd>\r\n\r\n      <dt>How do I view somebody's profile?</dt>\r\n      <dd>Search for them on the People page and open their profile. A profile shows their avatar, description, join date, badges, statistics and online status.</dd>\r\n\r\n      <dt>How do I change my avatar?</dt>\r\n      <dd>Open the Character page to set the colour of your head, torso, arms and legs, and to pick a face. Saved changes apply everywhere your avatar appears.</dd>\r\n\r\n      <dt>How do I manage friends?</dt>\r\n      <dd>The Friends page lists your friends and any pending requests. You can accept, reject or remove friends there. Duplicate requests are prevented, so you will not receive the same request twice.</dd>\r\n\r\n      <dt>How do I send a message?</dt>\r\n      <dd>Open <a href=\"/messages\">Messages</a> and write to a member by username, or use Send Message on their profile. A message is only shown to the two accounts in it. Unread messages are marked until you open them, the sent box records whether the other person has opened one, and deleting a message removes your copy only.</dd>\r\n\r\n      <dt>How does the catalog work?</dt>\r\n      <dd>The catalog lists hats, shirts, t-shirts, pants and accessories created by members. Items are priced in ")
    ; __append(escapeFn( site.currency.earned ))
    ; __append(". Buying an item records ownership on your account and adds it to your inventory.</dd>\r\n\r\n      <dt>How do I report a user?</dt>\r\n      <dd>There is a Report Abuse link on every member's profile and on every private message you receive. A report goes into one moderation queue, is not shown to the member it is about, and is read by staff who can warn or restrict an account. <a href=\"/reports/mine\">My Reports</a> lists the reports you filed and whether they are still open.</dd>\r\n\r\n      <dt>How do I contact support?</dt>\r\n      <dd>See the <a href=\"/support\">Support</a> page for how to reach the team about account problems.</dd>\r\n    </dl>\r\n  </div>\r\n</main>\r\n\r\n")
    ; __append( include('../partials/footer') )
    ; __append("\r\n</body>\r\n</html>\r\n")
  return __output;

},
  "pages/home": function anonymous(locals, escapeFn, include, rethrow
) {
var Draft = locals.Draft, Published = locals.Published, a = locals.a, authState = locals.authState, avatar = locals.avatar, b = locals.b, created = locals.created, creator = locals.creator, currency = locals.currency, earned = locals.earned, featured = locals.featured, footer = locals.footer, forEach = locals.forEach, head = locals.head, href = locals.href, img = locals.img, index = locals.index, label = locals.label, length = locals.length, link = locals.link, member = locals.member, name = locals.name, nav2009 = locals.nav2009, pageTitle = locals.pageTitle, partials = locals.partials, place = locals.place, premium = locals.premium, published = locals.published, query = locals.query, recommended = locals.recommended, site = locals.site, size = locals.size, slice = locals.slice, slug = locals.slug, sm = locals.sm, sort = locals.sort, thumb = locals.thumb, thumbUrl = locals.thumbUrl, thumbnailUrl = locals.thumbnailUrl, updated = locals.updated, username = locals.username, version = locals.version, viewer = locals.viewer, visits = locals.visits;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append("\n")
    ; __append( include('../partials/head', { pageTitle: pageTitle }) )
    ; __append("\n\n<div class=\"fb-front\">\n  ")
    ; __append("\n  <div class=\"fb-front__banner\">\n    ")
    ;  if (authState === 'member' && typeof viewer !== 'undefined' && viewer && viewer.username) { 
    ; __append("\n      <a class=\"fb-front__banner-login\" href=\"/home\">")
    ; __append(escapeFn( viewer.username ))
    ; __append("</a>\n    ")
    ;  } else { 
    ; __append("\n      <a class=\"fb-front__banner-login\" href=\"/login\">Login</a>\n    ")
    ;  } 
    ; __append("\n\n    <a class=\"fb-front__wordmark\" href=\"/\">")
    ; __append(escapeFn( site.name ))
    ; __append("</a>\n\n    ")
    ;  if (recommended.length > 0) { 
    ; __append("\n      <a class=\"fb-front__playnow\" href=\"/games/")
    ; __append(escapeFn( recommended[0].slug ))
    ; __append("\" title=\"Opens the place page. The FieldBrik client is not built yet.\">PLAY NOW</a>\n    ")
    ;  } else { 
    ; __append("\n      <a class=\"fb-front__playnow\" href=\"/catalog\" title=\"Nothing is published yet, so this opens the Catalog.\">PLAY NOW</a>\n    ")
    ;  } 
    ; __append("\n  </div>\n\n  ")
    ; __append("\n  <nav class=\"fb-front__nav\" aria-label=\"Site\">\n    ")
    ;  site.nav2009.forEach(function (link, index) { 
    ; __append("\n      ")
    ;  if (index > 0) { 
    ; __append("<span aria-hidden=\"true\">|</span>")
    ;  } 
    ; __append("\n      <a href=\"")
    ; __append(escapeFn( link.href ))
    ; __append("\">")
    ; __append(escapeFn( link.label ))
    ; __append("</a>\n    ")
    ;  }); 
    ; __append("\n  </nav>\n\n  ")
    ;  if (query) { 
    ; __append("\n    <div class=\"fb-box\" style=\"margin-top:10px\">\n      <div class=\"fb-box__body\">\n        Places matching &ldquo;")
    ; __append(escapeFn( query ))
    ; __append("&rdquo;. <a href=\"/\">Clear the search</a>\n      </div>\n    </div>\n  ")
    ;  } 
    ; __append("\n\n  ")
    ; __append("\n  <div class=\"fb-front__row fb-front__row--1\">\n    ")
    ;  if (authState === 'member' && typeof viewer !== 'undefined' && viewer && viewer.username) { 
    ; __append("\n      <div class=\"fb-box\">\n        <h2 class=\"fb-box__title\">Welcome</h2>\n        <div class=\"fb-box__body\">\n          <a href=\"/my-page\" style=\"display:block;text-align:center\">\n            ")
    ; __append( include('../partials/avatar', { avatar: viewer.avatar, size: 'sm' }) )
    ; __append("\n          </a>\n          <p style=\"margin:4px 0 6px;text-align:center;font:bold 11px Arial\">\n            <a href=\"/my-page\">")
    ; __append(escapeFn( viewer.username ))
    ; __append("</a>\n          </p>\n          <a class=\"fb-btn2009\" href=\"/my-page\">My Page</a>\n          <a class=\"fb-btn2009\" href=\"/places/mine\">My Places</a>\n          <a class=\"fb-btn2009\" href=\"/messages\">Messages</a>\n          <a class=\"fb-btn2009\" href=\"/inventory\">Inventory</a>\n        </div>\n      </div>\n    ")
    ;  } else { 
    ; __append("\n      <div class=\"fb-box\">\n        <h2 class=\"fb-box__title\">Member Login</h2>\n        <div class=\"fb-box__body\">\n          <form class=\"fb-login2009\" method=\"post\" action=\"/login\">\n            <label for=\"front-name\">Character Name</label>\n            <input id=\"front-name\" name=\"username\" type=\"text\" autocomplete=\"username\" maxlength=\"20\" required>\n            <label for=\"front-pass\">Password</label>\n            <input id=\"front-pass\" name=\"password\" type=\"password\" autocomplete=\"current-password\" required>\n            <button class=\"fb-login2009__go\" type=\"submit\">Login</button>\n          </form>\n\n          <a class=\"fb-btn2009\" href=\"/register\">Register</a>\n\n          <a class=\"fb-btn2009\" href=\"/parents\" title=\"The parents pages: what this site is and how it is moderated.\">Parent Login</a>\n\n          <a class=\"fb-login2009__forgot\" href=\"/help\">Forgot your password?</a>\n        </div>\n      </div>\n    ")
    ;  } 
    ; __append("\n\n    <div class=\"fb-box\">\n      <h2 class=\"fb-box__title\">Cool Places\n        <a href=\"/catalog\">Catalog &raquo;</a>\n      </h2>\n      <div class=\"fb-box__body\">\n        ")
    ;  if (recommended.length === 0) { 
    ; __append("\n          <p class=\"fb-places2009__meta\">Nothing is published yet. Places appear here as members publish them.</p>\n        ")
    ;  } else { 
    ; __append("\n          <ul class=\"fb-places2009\">\n            ")
    ;  recommended.slice(0, 4).forEach(function (place) { 
    ; __append("\n              <li>\n                <a class=\"fb-places2009__thumb\" href=\"/games/")
    ; __append(escapeFn( place.slug ))
    ; __append("\" style=\"--thumb: ")
    ; __append(escapeFn( place.thumb ))
    ; __append(";\" aria-hidden=\"true\" tabindex=\"-1\">")
    ; __append( include('../partials/thumb-img', { thumbUrl: place.thumbnailUrl }) )
    ; __append("</a>\n                <a class=\"fb-places2009__name\" href=\"/games/")
    ; __append(escapeFn( place.slug ))
    ; __append("\">")
    ; __append(escapeFn( place.name ))
    ; __append("</a>\n                <p class=\"fb-places2009__meta\">By <a href=\"/people/")
    ; __append(escapeFn( encodeURIComponent(place.creator) ))
    ; __append("\">")
    ; __append(escapeFn( place.creator ))
    ; __append("</a></p>\n              </li>\n            ")
    ;  }); 
    ; __append("\n          </ul>\n        ")
    ;  } 
    ; __append("\n      </div>\n    </div>\n\n    <div class=\"fb-box\">\n      <h2 class=\"fb-box__title\">Places to Visit\n        <a href=\"/places/mine\">My Places &raquo;</a>\n      </h2>\n      <div class=\"fb-box__body\">\n        ")
    ;  if (recommended.length === 0) { 
    ; __append("\n          <p class=\"fb-places2009__meta\">No places to list yet.</p>\n        ")
    ;  } else { 
    ; __append("\n          <ul class=\"fb-places2009 fb-places2009--rows\">\n            ")
    ;  recommended.slice().sort(function (a, b) { return b.visits - a.visits; }).slice(0, 4).forEach(function (place) { 
    ; __append("\n              <li>\n                <a class=\"fb-places2009__thumb\" href=\"/games/")
    ; __append(escapeFn( place.slug ))
    ; __append("\" style=\"--thumb: ")
    ; __append(escapeFn( place.thumb ))
    ; __append(";\" aria-hidden=\"true\" tabindex=\"-1\">")
    ; __append( include('../partials/thumb-img', { thumbUrl: place.thumbnailUrl }) )
    ; __append("</a>\n                <span class=\"fb-places2009__text\">\n                  <a class=\"fb-places2009__name\" href=\"/games/")
    ; __append(escapeFn( place.slug ))
    ; __append("\">")
    ; __append(escapeFn( place.name ))
    ; __append("</a>\n                  <span class=\"fb-places2009__meta\">")
    ; __append(escapeFn( place.published ? 'Published' : 'Draft' ))
    ; __append(" &middot; ")
    ; __append(escapeFn( place.creator ))
    ; __append("</span>\n                </span>\n              </li>\n            ")
    ;  }); 
    ; __append("\n          </ul>\n        ")
    ;  } 
    ; __append("\n      </div>\n    </div>\n  </div>\n\n  ")
    ; __append("\n  <div class=\"fb-front__row fb-front__row--2\">\n    <div class=\"fb-promo\">\n      <div class=\"fb-promo__text\">\n        <span class=\"fb-promo__logo\">")
    ; __append(escapeFn( site.name ))
    ; __append("</span>\n        <p class=\"fb-promo__line\">The free online building game.</p>\n      </div>\n      ")
    ;  if (recommended.length > 0) { 
    ; __append("\n        <a class=\"fb-promo__cta\" href=\"/games/")
    ; __append(escapeFn( recommended[0].slug ))
    ; __append("\" title=\"Opens the place page. The FieldBrik client is not built yet.\">\n          <span class=\"fb-promo__disc\" aria-hidden=\"true\"><span class=\"fb-promo__tri\"></span></span>\n          Play Now\n        </a>\n      ")
    ;  } else { 
    ; __append("\n        <a class=\"fb-promo__cta\" href=\"/places/new\">\n          <span class=\"fb-promo__disc\" aria-hidden=\"true\"><span class=\"fb-promo__tri\"></span></span>\n          Build\n        </a>\n      ")
    ;  } 
    ; __append("\n    </div>\n\n    <div class=\"fb-box\">\n      <h2 class=\"fb-box__title fb-box__title--centre\">")
    ; __append(escapeFn( site.name ))
    ; __append(" Facts</h2>\n      <div class=\"fb-box__body\">\n        <ul class=\"fb-facts\">\n          <li>\n            <span class=\"fb-facts__ico\" aria-hidden=\"true\">\n              <svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.3\"><rect x=\"1.5\" y=\"5\" width=\"13\" height=\"6\" rx=\"1\"></rect><path d=\"M5 5v6M8 5v6M11 5v6\"></path></svg>\n            </span>\n            <span>Every place has a real owner and a real page. <a href=\"/places/new\">Make one</a>.</span>\n          </li>\n          <li>\n            <span class=\"fb-facts__ico\" aria-hidden=\"true\">\n              <svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.3\"><rect x=\"1.5\" y=\"3.5\" width=\"13\" height=\"9\" rx=\"1\"></rect><path d=\"M1.5 6.5h13\"></path></svg>\n            </span>\n            <span>")
    ; __append(escapeFn( site.currency.premium ))
    ; __append(" are bought. ")
    ; __append(escapeFn( site.currency.earned ))
    ; __append(" are earned from what other members buy.</span>\n          </li>\n          <li>\n            <span class=\"fb-facts__ico\" aria-hidden=\"true\">\n              <svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.3\"><circle cx=\"8\" cy=\"8\" r=\"6\"></circle><path d=\"M8 5v6M6 6.4h2.6a1.2 1.2 0 0 1 0 2.4H7a1.2 1.2 0 0 0 0 2.4h2.8\"></path></svg>\n            </span>\n            <span>Visits are not counted yet: the client that would play a place does not exist.</span>\n          </li>\n        </ul>\n      </div>\n    </div>\n  </div>\n\n  ")
    ; __append("\n  <div class=\"fb-front__row fb-front__row--3\">\n    <div class=\"fb-box\">\n      ")
    ;  if (recommended.length === 0) { 
    ; __append("\n        <h2 class=\"fb-box__title fb-box__title--centre\">Featured Place</h2>\n        <div class=\"fb-box__body\">\n          <p class=\"fb-places2009__meta\">No place is published yet, so there is nothing to feature. <a href=\"/places/new\">Build the first one</a>.</p>\n        </div>\n      ")
    ;  } else { 
    ; __append("\n        ")
    ;  var featured = recommended[0]; 
    ; __append("\n        <h2 class=\"fb-box__title fb-box__title--centre\">Featured Place: ")
    ; __append(escapeFn( featured.name ))
    ; __append("</h2>\n        <div class=\"fb-box__body\">\n          <div class=\"fb-feature\">\n            <a class=\"fb-feature__thumb\" href=\"/games/")
    ; __append(escapeFn( featured.slug ))
    ; __append("\" style=\"--thumb: ")
    ; __append(escapeFn( featured.thumb ))
    ; __append(";\" aria-hidden=\"true\" tabindex=\"-1\">")
    ; __append( include('../partials/thumb-img', { thumbUrl: featured.thumbnailUrl }) )
    ; __append("</a>\n            <div class=\"fb-feature__side\">\n              <a class=\"fb-feature__play\" href=\"/games/")
    ; __append(escapeFn( featured.slug ))
    ; __append("\">Play This</a>\n              <p class=\"fb-feature__meta\">Updated: ")
    ; __append(escapeFn( featured.updated ))
    ; __append("</p>\n              <p class=\"fb-feature__meta\">Created: ")
    ; __append(escapeFn( featured.created ))
    ; __append("</p>\n              <p class=\"fb-feature__meta\">")
    ; __append(escapeFn( featured.published ? 'Published' : 'Draft' ))
    ; __append("</p>\n              <p class=\"fb-feature__creator\">Creator:\n                <a href=\"/people/")
    ; __append(escapeFn( encodeURIComponent(featured.creator) ))
    ; __append("\">")
    ; __append(escapeFn( featured.creator ))
    ; __append("</a>\n              </p>\n            </div>\n          </div>\n        </div>\n      ")
    ;  } 
    ; __append("\n    </div>\n\n    <div class=\"fb-box\">\n      <h2 class=\"fb-box__title fb-box__title--centre\">\n        <span aria-hidden=\"true\" style=\"margin-right:4px\">\n          <svg width=\"14\" height=\"14\" viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"#1e1e1e\" stroke-width=\"1.3\" style=\"vertical-align:-2px\"><circle cx=\"8\" cy=\"5.5\" r=\"2.6\"></circle><path d=\"M2.9 13.6c0-2.5 2.3-4 5.1-4s5.1 1.5 5.1 4\"></path></svg>\n        </span>\n        Parents&rsquo; Corner\n      </h2>\n      <div class=\"fb-box__body fb-parents\">\n        <p>")
    ; __append(escapeFn( site.name ))
    ; __append(" is a kid-friendly place on the internet where your children can exercise their\n          creativity in a safe, moderated online environment.</p>\n        <div class=\"fb-parents__btns\">\n          <a class=\"fb-btn2009\" href=\"/parents/guide\">Learn More</a>\n          <a class=\"fb-btn2009\" href=\"/parents\">Access Parent Account</a>\n        </div>\n        <a class=\"fb-parents__privacy\" href=\"/privacy\">Privacy Policy</a>\n        <span class=\"fb-parents__seal\">Moderated community &middot; ")
    ; __append(escapeFn( site.version ))
    ; __append("</span>\n      </div>\n    </div>\n  </div>\n\n  ")
    ; __append("\n  <div class=\"fb-front__row fb-front__row--4\">\n    <div class=\"fb-box\">\n      <h2 class=\"fb-box__title\">More Places\n        <a href=\"/catalog\">Browse the Catalog &raquo;</a>\n      </h2>\n      <div class=\"fb-box__body\">\n        ")
    ;  if (recommended.length <= 4) { 
    ; __append("\n          <p class=\"fb-places2009__meta\">Everything published is already listed above.</p>\n        ")
    ;  } else { 
    ; __append("\n          <ul class=\"fb-places2009\">\n            ")
    ;  recommended.slice(4, 8).forEach(function (place) { 
    ; __append("\n              <li>\n                <a class=\"fb-places2009__thumb\" href=\"/games/")
    ; __append(escapeFn( place.slug ))
    ; __append("\" style=\"--thumb: ")
    ; __append(escapeFn( place.thumb ))
    ; __append(";\" aria-hidden=\"true\" tabindex=\"-1\">")
    ; __append( include('../partials/thumb-img', { thumbUrl: place.thumbnailUrl }) )
    ; __append("</a>\n                <a class=\"fb-places2009__name\" href=\"/games/")
    ; __append(escapeFn( place.slug ))
    ; __append("\">")
    ; __append(escapeFn( place.name ))
    ; __append("</a>\n                <p class=\"fb-places2009__meta\">By <a href=\"/people/")
    ; __append(escapeFn( encodeURIComponent(place.creator) ))
    ; __append("\">")
    ; __append(escapeFn( place.creator ))
    ; __append("</a></p>\n              </li>\n            ")
    ;  }); 
    ; __append("\n          </ul>\n        ")
    ;  } 
    ; __append("\n      </div>\n      <a class=\"fb-feedback2009\" href=\"/support\">[ feedback ]</a>\n    </div>\n\n    <div class=\"fb-box\">\n      <h2 class=\"fb-box__title fb-box__title--centre\">")
    ; __append(escapeFn( site.name ))
    ; __append(" News</h2>\n      <div class=\"fb-box__body fb-box__body--flush\">\n        <ul class=\"fb-news2009\">\n          <li>FieldBrik is in its ")
    ; __append(escapeFn( site.version ))
    ; __append(" build: places, catalog, forum and messages are live.</li>\n          <li>Sign-ups are open to everybody.</li>\n          <li>The client that plays a place is a separate project, still to come.</li>\n        </ul>\n        <a class=\"fb-news2009__all\" href=\"/news\">All news &raquo;</a>\n      </div>\n    </div>\n  </div>\n</div>\n\n")
    ; __append( include('../partials/footer') )
    ; __append("\n</body>\n</html>\n")
  return __output;

},
  "pages/in-development": function anonymous(locals, escapeFn, include, rethrow
) {
var footer = locals.footer, forEach = locals.forEach, head = locals.head, header = locals.header, line = locals.line, meta = locals.meta, note = locals.note, pageTitle = locals.pageTitle, partials = locals.partials, planned = locals.planned, summary = locals.summary, title = locals.title;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append( include('../partials/head', { pageTitle: pageTitle }) )
    ; __append("\r\n")
    ; __append( include('../partials/header') )
    ; __append("\r\n\r\n<main class=\"fb-container fb-main\">\r\n  <div class=\"fb-content\">\r\n    <h1 class=\"fb-title\">")
    ; __append(escapeFn( meta.title ))
    ; __append("</h1>\r\n    <p class=\"fb-muted\">")
    ; __append(escapeFn( meta.summary ))
    ; __append("</p>\r\n\r\n    <div class=\"fb-prose\">\r\n      <div class=\"fb-notice\">\r\n        <p><strong>This page is in development.</strong></p>\r\n        <p>It is scheduled for a later build pass. Nothing here is clickable yet, and no functionality is being faked in the meantime.</p>\r\n      </div>\r\n\r\n      <p>When it is built it will include:</p>\r\n      <ul class=\"fb-list\">\r\n        ")
    ;  meta.planned.forEach(function (line) { 
    ; __append("\r\n          <li>")
    ; __append(escapeFn( line ))
    ; __append("</li>\r\n        ")
    ;  }); 
    ; __append("\r\n      </ul>\r\n      ")
    ;  if (meta.note) { 
    ; __append("\r\n        <p class=\"fb-muted\">")
    ; __append(escapeFn( meta.note ))
    ; __append("</p>\r\n      ")
    ;  } 
    ; __append("\r\n    </div>\r\n  </div>\r\n</main>\r\n\r\n")
    ; __append( include('../partials/footer') )
    ; __append("\r\n</body>\r\n</html>\r\n")
  return __output;

},
  "pages/inventory": function anonymous(locals, escapeFn, include, rethrow
) {
var Take = locals.Take, Wear = locals.Wear, canManage = locals.canManage, category = locals.category, equipped = locals.equipped, footer = locals.footer, forEach = locals.forEach, head = locals.head, header = locals.header, id = locals.id, image = locals.image, item = locals.item, items = locals.items, length = locals.length, name = locals.name, notice = locals.notice, off = locals.off, owned = locals.owned, pageTitle = locals.pageTitle, partials = locals.partials, remove = locals.remove, thumb = locals.thumb, viewerName = locals.viewerName, wear = locals.wear, wearing = locals.wearing;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append( include('../partials/head', { pageTitle: pageTitle }) )
    ; __append("\r\n")
    ; __append( include('../partials/header') )
    ; __append("\r\n\r\n<main class=\"fb-container fb-main\">\r\n  ")
    ;  if (notice) { 
    ; __append("\r\n    <div class=\"fb-notice\"><p><strong>")
    ; __append(escapeFn( notice ))
    ; __append("</strong></p></div>\r\n  ")
    ;  } 
    ; __append("\r\n\r\n  <div class=\"fb-title-row\">\r\n    <h1 class=\"fb-title\">Inventory</h1>\r\n    <span class=\"fb-pagecount\">")
    ; __append(escapeFn( owned.length ))
    ; __append(" ")
    ; __append(escapeFn( owned.length === 1 ? 'item' : 'items' ))
    ; __append("</span>\r\n  </div>\r\n\r\n  <section class=\"fb-panel\">\r\n    <h2 class=\"fb-panel__title\">Currently wearing</h2>\r\n    <div class=\"fb-panel__body\">\r\n      ")
    ;  if (wearing.length === 0) { 
    ; __append("\r\n        <p class=\"fb-muted\">Nothing equipped.</p>\r\n      ")
    ;  } else { 
    ; __append("\r\n        <ul class=\"fb-wearing\">\r\n          ")
    ;  wearing.forEach(function (item) { 
    ; __append("\r\n            <li class=\"fb-wearing__item\">\r\n              <span class=\"fb-wearing__thumb\" style=\"--thumb: ")
    ; __append(escapeFn( item.thumb ))
    ; __append(";\" aria-hidden=\"true\">\r\n                ")
    ;  if (item.image) { 
    ; __append("<img src=\"")
    ; __append(escapeFn( item.image ))
    ; __append("\" alt=\"\">")
    ;  } 
    ; __append("\r\n              </span>\r\n              <span>\r\n                <a href=\"/catalog/")
    ; __append(escapeFn( item.id ))
    ; __append("\">")
    ; __append(escapeFn( item.name ))
    ; __append("</a><br>\r\n                <span class=\"fb-muted\">")
    ; __append(escapeFn( item.category ))
    ; __append("</span>\r\n              </span>\r\n            </li>\r\n          ")
    ;  }); 
    ; __append("\r\n        </ul>\r\n      ")
    ;  } 
    ; __append("\r\n    </div>\r\n  </section>\r\n\r\n  <section class=\"fb-panel\">\r\n    <h2 class=\"fb-panel__title\">")
    ; __append(escapeFn( viewerName ))
    ; __append("'s Items</h2>\r\n    <div class=\"fb-panel__body\">\r\n      ")
    ;  if (owned.length === 0) { 
    ; __append("\r\n        <p class=\"fb-muted\">You do not own any items yet. <a href=\"/catalog\">Look through the catalog</a>.</p>\r\n      ")
    ;  } else { 
    ; __append("\r\n        <ul class=\"fb-grid--items\">\r\n          ")
    ;  owned.forEach(function (item) { 
    ; __append("\r\n            <li class=\"fb-card-item\">\r\n              <span class=\"fb-card-item__thumb\" style=\"--thumb: ")
    ; __append(escapeFn( item.thumb ))
    ; __append(";\" aria-hidden=\"true\">\r\n                ")
    ;  if (item.image) { 
    ; __append("<img src=\"")
    ; __append(escapeFn( item.image ))
    ; __append("\" alt=\"\">")
    ;  } 
    ; __append("\r\n              </span>\r\n              <a class=\"fb-card-item__name\" href=\"/catalog/")
    ; __append(escapeFn( item.id ))
    ; __append("\">")
    ; __append(escapeFn( item.name ))
    ; __append("</a>\r\n              <p class=\"fb-card-item__meta\">\r\n                ")
    ; __append(escapeFn( item.category ))
    ; __append("<br>\r\n                ")
    ;  if (item.equipped) { 
    ; __append("\r\n                  <strong>Wearing</strong>\r\n                ")
    ;  } else { 
    ; __append("\r\n                  <span class=\"fb-muted\">Not worn</span>\r\n                ")
    ;  } 
    ; __append("\r\n              </p>\r\n              ")
    ;  if (canManage) { 
    ; __append("\r\n                <form method=\"post\" action=\"/inventory/")
    ; __append(escapeFn( item.id ))
    ; __append("/")
    ; __append(escapeFn( item.equipped ? 'remove' : 'wear' ))
    ; __append("\">\r\n                  <button class=\"fb-btn\" type=\"submit\">")
    ; __append(escapeFn( item.equipped ? 'Take off' : 'Wear' ))
    ; __append("</button>\r\n                </form>\r\n              ")
    ;  } 
    ; __append("\r\n            </li>\r\n          ")
    ;  }); 
    ; __append("\r\n        </ul>\r\n      ")
    ;  } 
    ; __append("\r\n    </div>\r\n  </section>\r\n\r\n  <div class=\"fb-notice\">\r\n    <p><strong>Owning and wearing are stored on the account.</strong></p>\r\n    <p>An item enters this list when it is bought, and the equipped flag lives on the ownership row, so taking a hat off here is the same fact the server would read when drawing your avatar. One item per category is worn at a time: a second hat replaces the first.</p>\r\n  </div>\r\n</main>\r\n\r\n")
    ; __append( include('../partials/footer') )
    ; __append("\r\n</body>\r\n</html>\r\n")
  return __output;

},
  "pages/item": function anonymous(locals, escapeFn, include, rethrow
) {
var No = locals.No, Not = locals.Not, Owned = locals.Owned, Take = locals.Take, Wear = locals.Wear, balance = locals.balance, bodyClass = locals.bodyClass, bucks = locals.bucks, category = locals.category, creator = locals.creator, description = locals.description, equipped = locals.equipped, fb = locals.fb, footer = locals.footer, given = locals.given, head = locals.head, header = locals.header, id = locals.id, image = locals.image, it = locals.it, item = locals.item, name = locals.name, notice = locals.notice, now = locals.now, off = locals.off, owned = locals.owned, page = locals.page, pageTitle = locals.pageTitle, partials = locals.partials, remove = locals.remove, signedIn = locals.signedIn, site = locals.site, thumb = locals.thumb, tickets = locals.tickets, was = locals.was, wear = locals.wear, worn = locals.worn;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append("\r\n")
    ; __append( include('../partials/head', { pageTitle: pageTitle, bodyClass: 'fb-item-page' }) )
    ; __append("\r\n<link rel=\"stylesheet\" href=\"/css/item2009.css?v=1\">\r\n")
    ; __append( include('../partials/header') )
    ; __append("\r\n\r\n<main class=\"fb-item2009\">\r\n  <div class=\"fb-container\">\r\n    <h1 class=\"fb-item2009__title\">")
    ; __append(escapeFn( item.name ))
    ; __append("</h1>\r\n\r\n    ")
    ;  if (notice) { 
    ; __append("\r\n      <p class=\"fb-item2009__notice\">")
    ; __append(escapeFn( notice ))
    ; __append("</p>\r\n    ")
    ;  } 
    ; __append("\r\n\r\n    <div class=\"fb-item2009__cols\">\r\n      <section class=\"fb-item2009__shot\">\r\n        <div class=\"fb-item2009__image\" style=\"--thumb: ")
    ; __append(escapeFn( item.thumb ))
    ; __append(";\">\r\n          ")
    ;  if (item.image) { 
    ; __append("\r\n            <img src=\"")
    ; __append(escapeFn( item.image ))
    ; __append("\" alt=\"")
    ; __append(escapeFn( item.name ))
    ; __append("\">\r\n          ")
    ;  } 
    ; __append("\r\n        </div>\r\n      </section>\r\n\r\n      <section class=\"fb-item2009__panel\">\r\n        <h2 class=\"fb-item2009__kind\">")
    ; __append(escapeFn( site.name ))
    ; __append(" ")
    ; __append(escapeFn( item.category ))
    ; __append("</h2>\r\n\r\n        <div class=\"fb-item2009__mini\" style=\"--thumb: ")
    ; __append(escapeFn( item.thumb ))
    ; __append(";\">\r\n          ")
    ;  if (item.image) { 
    ; __append("<img src=\"")
    ; __append(escapeFn( item.image ))
    ; __append("\" alt=\"\">")
    ;  } 
    ; __append("\r\n        </div>\r\n\r\n        <p class=\"fb-item2009__line\">Creator:\r\n          <a href=\"/people/")
    ; __append(escapeFn( encodeURIComponent(item.creator) ))
    ; __append("\">")
    ; __append(escapeFn( item.creator ))
    ; __append("</a></p>\r\n        <p class=\"fb-item2009__line\">Kind:\r\n          <a href=\"/catalog?category=")
    ; __append(escapeFn( encodeURIComponent(item.category) ))
    ; __append("\">")
    ; __append(escapeFn( item.category ))
    ; __append("</a></p>\r\n        <p class=\"fb-item2009__line\">Your account:\r\n          ")
    ; __append(escapeFn( item.owned ? (item.equipped ? 'Owned, worn now' : 'Owned') : 'Not owned' ))
    ; __append("</p>\r\n\r\n        <p class=\"fb-item2009__label\">Description:</p>\r\n        <div class=\"fb-item2009__desc\">")
    ; __append(escapeFn( item.description || 'No description was given for this item.' ))
    ; __append("</div>\r\n\r\n        ")
    ;  if (item.owned) { 
    ; __append("\r\n          <p class=\"fb-item2009__line\">This item is on your account.</p>\r\n          <form class=\"fb-item2009__buy\" method=\"post\" action=\"/inventory/")
    ; __append(escapeFn( item.id ))
    ; __append("/")
    ; __append(escapeFn( item.equipped ? 'remove' : 'wear' ))
    ; __append("\">\r\n            <button class=\"fb-item2009__btn\" type=\"submit\">")
    ; __append(escapeFn( item.equipped ? 'Take it off' : 'Wear it' ))
    ; __append("</button>\r\n          </form>\r\n          <p class=\"fb-item2009__line\"><a href=\"/inventory\">Your inventory</a></p>\r\n        ")
    ;  } else if (!signedIn) { 
    ; __append("\r\n          <p class=\"fb-item2009__line\"><a href=\"/login\">Log in</a> to buy this item. Prices are per account,\r\n            so nothing can be bought from a signed-out page.</p>\r\n        ")
    ;  } else { 
    ; __append("\r\n          ")
    ;  if (balance) { 
    ; __append("\r\n            <p class=\"fb-item2009__line\">You have ")
    ; __append(escapeFn( balance.tickets ))
    ; __append(" Tickets and ")
    ; __append(escapeFn( balance.bucks ))
    ; __append(" Bucks.</p>\r\n          ")
    ;  } 
    ; __append("\r\n          <form class=\"fb-item2009__buy\" method=\"post\" action=\"/catalog/")
    ; __append(escapeFn( item.id ))
    ; __append("/buy\">\r\n            ")
    ;  if (item.tickets !== null) { 
    ; __append("\r\n              <button class=\"fb-item2009__btn fb-item2009__btn--tickets\" type=\"submit\"\r\n                name=\"currency\" value=\"tickets\">Buy with ")
    ; __append(escapeFn( item.tickets ))
    ; __append(" Tickets</button>\r\n            ")
    ;  } 
    ; __append("\r\n            ")
    ;  if (item.bucks !== null) { 
    ; __append("\r\n              <button class=\"fb-item2009__btn fb-item2009__btn--bucks\" type=\"submit\"\r\n                name=\"currency\" value=\"bucks\">Buy with ")
    ; __append(escapeFn( item.bucks ))
    ; __append(" Bucks</button>\r\n            ")
    ;  } 
    ; __append("\r\n          </form>\r\n          <p class=\"fb-item2009__fine\">The price is read from the item on the server, so the form cannot\r\n            send one of its own. Buying writes a ledger entry and puts the item in your inventory.</p>\r\n        ")
    ;  } 
    ; __append("\r\n      </section>\r\n    </div>\r\n\r\n    <section class=\"fb-item2009__comments\">\r\n      <h2 class=\"fb-item2009__comments-tab\">Commentary</h2>\r\n      <p class=\"fb-item2009__comments-text\">Commentary for this item has been disabled.</p>\r\n    </section>\r\n  </div>\r\n</main>\r\n\r\n")
    ; __append( include('../partials/footer') )
    ; __append("\r\n</body>\r\n</html>\r\n")
  return __output;

},
  "pages/login": function anonymous(locals, escapeFn, include, rethrow
) {
var error = locals.error, footer = locals.footer, head = locals.head, header = locals.header, pageTitle = locals.pageTitle, partials = locals.partials, username = locals.username, values = locals.values;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append( include('../partials/head', { pageTitle: pageTitle }) )
    ; __append("\n")
    ; __append( include('../partials/header') )
    ; __append("\n\n<main class=\"fb-container fb-main\">\n  <div class=\"fb-content\">\n    <h1 class=\"fb-title fb-title--small\">Log In or Sign Up</h1>\n\n    ")
    ;  if (error) { 
    ; __append("\n      <div class=\"fb-notice\">\n        <p><strong>That did not work.</strong></p>\n        <p>")
    ; __append(escapeFn( error ))
    ; __append("</p>\n      </div>\n    ")
    ;  } 
    ; __append("\n\n    <form class=\"fb-auth\" method=\"post\" action=\"/login\">\n      <div class=\"fb-auth__row\">\n        <label for=\"login-username\">Character Name</label>\n        <input id=\"login-username\" name=\"username\" type=\"text\" autocomplete=\"username\"\n               value=\"")
    ; __append(escapeFn( values ? values.username : '' ))
    ; __append("\" maxlength=\"20\" required autofocus>\n      </div>\n      <div class=\"fb-auth__row\">\n        <label for=\"login-password\">Password</label>\n        <input id=\"login-password\" name=\"password\" type=\"password\" autocomplete=\"current-password\"\n               minlength=\"8\" required>\n      </div>\n      <div class=\"fb-auth__actions\">\n        <button class=\"fb-btn fb-btn--primary\" type=\"submit\">Log In</button>\n      </div>\n    </form>\n\n    <div class=\"fb-prose\" style=\"margin-top:16px\">\n      <p><strong>New to FieldBrik?</strong> <a href=\"/register\">Create an account</a>. Signing in needs the name and password you chose when the account was made; accounts are created on the sign-up page.</p>\n\n      <p>A name is 3 to 20 characters: letters, numbers and underscores. A password needs at least 8 characters.</p>\n\n      <h2>Names that are not available</h2>\n      <p>Slurs, sexual terms and the names of people who committed atrocities are refused, as are names that would look like FieldBrik staff. The name is checked on the server, so it is refused however it is sent.</p>\n\n      <h2>Forgotten your password?</h2>\n      <p>Password recovery is not built yet. If an account is locked out, the support page says how to ask for help.</p>\n    </div>\n  </div>\n</main>\n\n")
    ; __append( include('../partials/footer') )
    ; __append("\n</body>\n</html>\n")
  return __output;

},
  "pages/message": function anonymous(locals, escapeFn, include, rethrow
) {
var Messages = locals.Messages, RE = locals.RE, Sent = locals.Sent, To = locals.To, backHref = locals.backHref, backLabel = locals.backLabel, body = locals.body, bodyClass = locals.bodyClass, date = locals.date, fb = locals.fb, footer = locals.footer, forEach = locals.forEach, from = locals.from, head = locals.head, header = locals.header, id = locals.id, isSent = locals.isSent, message = locals.message, messages = locals.messages, notice = locals.notice, other = locals.other, outgoing = locals.outgoing, page = locals.page, pageTitle = locals.pageTitle, paragraph = locals.paragraph, partials = locals.partials, replyTo = locals.replyTo, sent = locals.sent, slice = locals.slice, subject = locals.subject, to = locals.to, toLowerCase = locals.toLowerCase, toUpperCase = locals.toUpperCase;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append("\r\n")
    ; __append( include('../partials/head', { pageTitle: pageTitle, bodyClass: 'fb-message-page' }) )
    ; __append("\r\n<link rel=\"stylesheet\" href=\"/css/message2009.css?v=1\">\r\n\r\n")
    ; __append("\r\n")
    ;  var isSent = (typeof outgoing !== 'undefined' && outgoing); 
    ; __append("\r\n")
    ;  var replyTo = isSent ? message.to : message.from; 
    ; __append("\r\n")
    ;  var other = isSent ? message.to : message.from; 
    ; __append("\r\n")
    ;  var backHref = isSent ? '/messages/sent' : '/messages'; 
    ; __append("\r\n")
    ;  var backLabel = isSent ? 'Sent Messages' : 'Messages'; 
    ; __append("\r\n\r\n")
    ; __append( include('../partials/header') )
    ; __append("\r\n\r\n<main class=\"fb-pm2009\">\r\n  <div class=\"fb-container\">\r\n    <h1 class=\"fb-pm2009__title\">Private Message</h1>\r\n\r\n    ")
    ;  if (typeof notice !== 'undefined' && notice) { 
    ; __append("\r\n      <p class=\"fb-pm2009__notice\">")
    ; __append(escapeFn( notice ))
    ; __append("</p>\r\n    ")
    ;  } 
    ; __append("\r\n\r\n    <section class=\"fb-pm2009__frame\">\r\n      <div class=\"fb-pm2009__who\">\r\n        <p class=\"fb-pm2009__date\">")
    ; __append(escapeFn( message.date ))
    ; __append("</p>\r\n\r\n        <div class=\"fb-pm2009__avatar\" aria-hidden=\"true\">\r\n          <span>")
    ; __append(escapeFn( String(other).slice(0, 1).toUpperCase() ))
    ; __append("</span>\r\n        </div>\r\n\r\n        <p class=\"fb-pm2009__name\">\r\n          <a href=\"/people/")
    ; __append(escapeFn( encodeURIComponent(other) ))
    ; __append("\">")
    ; __append(escapeFn( other ))
    ; __append("</a>\r\n        </p>\r\n\r\n        <p class=\"fb-pm2009__subject\">")
    ; __append(escapeFn( isSent ? 'To: ' : 'RE: ' ))
    ; __append(escapeFn( message.subject ))
    ; __append("</p>\r\n\r\n        ")
    ;  if (!isSent) { 
    ; __append("\r\n          <p class=\"fb-pm2009__report\">\r\n            <a href=\"/reports/new?kind=message&amp;id=")
    ; __append(escapeFn( message.id ))
    ; __append("\">\r\n              <span class=\"fb-pm2009__report-ico\" aria-hidden=\"true\">!</span>\r\n              Report Abuse\r\n            </a>\r\n          </p>\r\n        ")
    ;  } 
    ; __append("\r\n      </div>\r\n\r\n      <div class=\"fb-pm2009__body\">\r\n        ")
    ;  message.body.forEach(function (paragraph) { 
    ; __append("\r\n          <p>")
    ; __append(escapeFn( paragraph ))
    ; __append("</p>\r\n        ")
    ;  }); 
    ; __append("\r\n      </div>\r\n    </section>\r\n\r\n    <div class=\"fb-pm2009__actions\">\r\n      <a class=\"fb-pm2009__btn\" href=\"#reply\">Reply</a>\r\n      <form class=\"fb-pm2009__inline\" method=\"post\" action=\"/messages/")
    ; __append(escapeFn( message.id ))
    ; __append("/delete\">\r\n        <button class=\"fb-pm2009__btn\" type=\"submit\">Delete</button>\r\n      </form>\r\n      <a class=\"fb-pm2009__btn\" href=\"")
    ; __append(escapeFn( backHref ))
    ; __append("\">Cancel</a>\r\n    </div>\r\n\r\n    <section class=\"fb-pm2009__compose\" id=\"reply\">\r\n      <h2 class=\"fb-pm2009__sub\">Reply to ")
    ; __append(escapeFn( replyTo ))
    ; __append("</h2>\r\n      <p class=\"fb-pm2009__hint\">\r\n        ")
    ;  if (isSent) { 
    ; __append("\r\n          This message went to ")
    ; __append(escapeFn( replyTo ))
    ; __append(". A reply goes back to them, because that is who the\r\n          conversation is with.\r\n        ")
    ;  } else { 
    ; __append("\r\n          The reply goes to ")
    ; __append(escapeFn( replyTo ))
    ; __append(", because that is who this conversation is with.\r\n        ")
    ;  } 
    ; __append("\r\n      </p>\r\n      <form class=\"fb-pm2009__form\" method=\"post\" action=\"/messages/")
    ; __append(escapeFn( message.id ))
    ; __append("/reply\">\r\n        <label class=\"fb-pm2009__label\" for=\"reply-body\">Message</label>\r\n        <textarea id=\"reply-body\" name=\"body\" rows=\"6\" maxlength=\"5000\" required></textarea>\r\n        <div class=\"fb-pm2009__send\">\r\n          <button class=\"fb-pm2009__btn fb-pm2009__btn--primary\" type=\"submit\">Send Reply</button>\r\n          <a class=\"fb-pm2009__btn\" href=\"")
    ; __append(escapeFn( backHref ))
    ; __append("\">Cancel</a>\r\n        </div>\r\n      </form>\r\n      <p class=\"fb-pm2009__fine\">\r\n        Deleting removes your copy only; the other person's copy is theirs to keep or delete.\r\n        <a href=\"")
    ; __append(escapeFn( backHref ))
    ; __append("\">Back to ")
    ; __append(escapeFn( backLabel.toLowerCase() ))
    ; __append("</a>.\r\n      </p>\r\n    </section>\r\n  </div>\r\n</main>\r\n\r\n")
    ; __append( include('../partials/footer') )
    ; __append("\r\n</body>\r\n</html>\r\n")
  return __output;

},
  "pages/messages": function anonymous(locals, escapeFn, include, rethrow
) {
var date = locals.date, footer = locals.footer, forEach = locals.forEach, from = locals.from, head = locals.head, header = locals.header, id = locals.id, length = locals.length, message = locals.message, messages = locals.messages, notice = locals.notice, pageTitle = locals.pageTitle, partials = locals.partials, read = locals.read, sentCount = locals.sentCount, subject = locals.subject, unread = locals.unread;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append( include('../partials/head', { pageTitle: pageTitle }) )
    ; __append("\r\n")
    ; __append( include('../partials/header') )
    ; __append("\r\n\r\n<main class=\"fb-container fb-main\">\r\n  ")
    ;  if (notice) { 
    ; __append("\r\n    <div class=\"fb-notice\"><p><strong>")
    ; __append(escapeFn( notice ))
    ; __append("</strong></p></div>\r\n  ")
    ;  } 
    ; __append("\r\n\r\n  <div class=\"fb-title-row\">\r\n    <h1 class=\"fb-title\">Messages</h1>\r\n    <span class=\"fb-pagecount\">")
    ; __append(escapeFn( unread ))
    ; __append(" unread</span>\r\n  </div>\r\n\r\n  <p class=\"fb-panel__more\">\r\n    <strong>Inbox</strong> &middot;\r\n    <a href=\"/messages/sent\">Sent (")
    ; __append(escapeFn( sentCount ))
    ; __append(")</a> &middot;\r\n    <a href=\"/messages/compose\">Write a message</a> &middot;\r\n    <a href=\"/reports/mine\">My Reports</a>\r\n  </p>\r\n\r\n  <table class=\"fb-table\">\r\n    <thead>\r\n      <tr>\r\n        <th scope=\"col\">From</th>\r\n        <th scope=\"col\">Subject</th>\r\n        <th scope=\"col\">Received</th>\r\n        <th scope=\"col\">Delete</th>\r\n      </tr>\r\n    </thead>\r\n    <tbody>\r\n      ")
    ;  if (messages.length === 0) { 
    ; __append("\r\n        <tr>\r\n          <td colspan=\"4\" class=\"fb-table__last\">No messages yet.</td>\r\n        </tr>\r\n      ")
    ;  } 
    ; __append("\r\n      ")
    ;  messages.forEach(function (message) { 
    ; __append("\r\n        <tr>\r\n          <td><a class=\"fb-table__name\" href=\"/people/")
    ; __append(escapeFn( encodeURIComponent(message.from) ))
    ; __append("\">")
    ; __append(escapeFn( message.from ))
    ; __append("</a></td>\r\n          <td>\r\n            <a href=\"/messages/")
    ; __append(escapeFn( message.id ))
    ; __append("\">")
    ; __append(escapeFn( message.subject ))
    ; __append("</a>\r\n            ")
    ;  if (!message.read) { 
    ; __append("<span class=\"fb-msg--unread\">new</span>")
    ;  } 
    ; __append("\r\n          </td>\r\n          <td>")
    ; __append(escapeFn( message.date ))
    ; __append("</td>\r\n          <td class=\"fb-table__last\">\r\n            <form method=\"post\" action=\"/messages/")
    ; __append(escapeFn( message.id ))
    ; __append("/delete\">\r\n              <button class=\"fb-btn\" type=\"submit\">Delete</button>\r\n            </form>\r\n          </td>\r\n        </tr>\r\n      ")
    ;  }); 
    ; __append("\r\n    </tbody>\r\n  </table>\r\n\r\n  <p class=\"fb-pagination\">Showing up to 100, newest first.</p>\r\n\r\n  <section class=\"fb-panel\">\r\n    <h2 class=\"fb-panel__title\">New Message</h2>\r\n    <div class=\"fb-panel__body\">\r\n      <form class=\"fb-auth\" method=\"post\" action=\"/messages\">\r\n        <div class=\"fb-auth__row\">\r\n          <label for=\"msg-to\">To</label>\r\n          <input id=\"msg-to\" name=\"to\" type=\"text\" placeholder=\"Username\" maxlength=\"20\" required>\r\n        </div>\r\n        <div class=\"fb-auth__row\">\r\n          <label for=\"msg-subject\">Subject</label>\r\n          <input id=\"msg-subject\" name=\"subject\" type=\"text\" maxlength=\"120\">\r\n        </div>\r\n        <div class=\"fb-auth__row fb-auth__row--top\">\r\n          <label for=\"msg-body\">Message</label>\r\n          <textarea id=\"msg-body\" name=\"body\" rows=\"5\" maxlength=\"5000\" required></textarea>\r\n        </div>\r\n        <div class=\"fb-auth__actions\">\r\n          <button class=\"fb-btn fb-btn--primary\" type=\"submit\">Send</button>\r\n        </div>\r\n      </form>\r\n    </div>\r\n  </section>\r\n\r\n  <div class=\"fb-notice\">\r\n    <p><strong>Messages are private.</strong></p>\r\n    <p>A message is addressed to one member and is shown to the two accounts in it. Deleting one\r\n       removes your copy and leaves the other person's alone. Every message you receive can be\r\n       reported from the message itself, and <a href=\"/reports/mine\">My Reports</a> shows what\r\n       happened to a report you filed.</p>\r\n  </div>\r\n</main>\r\n\r\n")
    ; __append( include('../partials/footer') )
    ; __append("\r\n</body>\r\n</html>\r\n")
  return __output;

},
  "pages/messages-compose": function anonymous(locals, escapeFn, include, rethrow
) {
var failure = locals.failure, footer = locals.footer, head = locals.head, header = locals.header, pageTitle = locals.pageTitle, partials = locals.partials, subject = locals.subject, to = locals.to;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append( include('../partials/head', { pageTitle: pageTitle }) )
    ; __append("\r\n")
    ; __append( include('../partials/header') )
    ; __append("\r\n\r\n<main class=\"fb-container fb-main\">\r\n  <p class=\"fb-crumbs\"><a href=\"/messages\">Messages</a> &raquo; New message</p>\r\n\r\n  ")
    ;  if (failure) { 
    ; __append("\r\n    <div class=\"fb-notice\"><p><strong>")
    ; __append(escapeFn( failure ))
    ; __append("</strong></p></div>\r\n  ")
    ;  } 
    ; __append("\r\n\r\n  <div class=\"fb-title-row\">\r\n    <h1 class=\"fb-title\">New Message</h1>\r\n  </div>\r\n\r\n  <section class=\"fb-panel\">\r\n    <h2 class=\"fb-panel__title\">Write to a member</h2>\r\n    <div class=\"fb-panel__body\">\r\n      <form class=\"fb-auth\" method=\"post\" action=\"/messages\">\r\n        <div class=\"fb-auth__row\">\r\n          <label for=\"msg-to\">To</label>\r\n          <input id=\"msg-to\" name=\"to\" type=\"text\" value=\"")
    ; __append(escapeFn( to ))
    ; __append("\" placeholder=\"Username\"\r\n                 maxlength=\"20\" required autofocus>\r\n        </div>\r\n        <div class=\"fb-auth__row\">\r\n          <label for=\"msg-subject\">Subject</label>\r\n          <input id=\"msg-subject\" name=\"subject\" type=\"text\" value=\"")
    ; __append(escapeFn( subject ))
    ; __append("\" maxlength=\"120\">\r\n        </div>\r\n        <div class=\"fb-auth__row fb-auth__row--top\">\r\n          <label for=\"msg-body\">Message</label>\r\n          <textarea id=\"msg-body\" name=\"body\" rows=\"7\" maxlength=\"5000\" required></textarea>\r\n        </div>\r\n        <div class=\"fb-auth__actions\">\r\n          <button class=\"fb-btn fb-btn--primary\" type=\"submit\">Send</button>\r\n        </div>\r\n      </form>\r\n    </div>\r\n    <p class=\"fb-panel__strip\">\r\n      Up to 5000 characters. The name is matched on the server, so a member who has blocked you\r\n      cannot be written to.\r\n    </p>\r\n  </section>\r\n\r\n  <p class=\"fb-panel__more\"><a href=\"/messages\">Back to the inbox</a></p>\r\n</main>\r\n\r\n")
    ; __append( include('../partials/footer') )
    ; __append("\r\n</body>\r\n</html>\r\n")
  return __output;

},
  "pages/messages-sent": function anonymous(locals, escapeFn, include, rethrow
) {
var date = locals.date, footer = locals.footer, forEach = locals.forEach, head = locals.head, header = locals.header, id = locals.id, length = locals.length, message = locals.message, messages = locals.messages, not = locals.not, notice = locals.notice, opened = locals.opened, pageTitle = locals.pageTitle, partials = locals.partials, read = locals.read, subject = locals.subject, to = locals.to, yet = locals.yet;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append( include('../partials/head', { pageTitle: pageTitle }) )
    ; __append("\r\n")
    ; __append( include('../partials/header') )
    ; __append("\r\n\r\n<main class=\"fb-container fb-main\">\r\n  ")
    ;  if (notice) { 
    ; __append("\r\n    <div class=\"fb-notice\"><p><strong>")
    ; __append(escapeFn( notice ))
    ; __append("</strong></p></div>\r\n  ")
    ;  } 
    ; __append("\r\n\r\n  <div class=\"fb-title-row\">\r\n    <h1 class=\"fb-title\">Sent Messages</h1>\r\n    <span class=\"fb-pagecount\">")
    ; __append(escapeFn( messages.length ))
    ; __append(" sent</span>\r\n  </div>\r\n\r\n  <p class=\"fb-panel__more\">\r\n    <a href=\"/messages\">Inbox</a> &middot;\r\n    <strong>Sent</strong> &middot;\r\n    <a href=\"/messages/compose\">Write a message</a>\r\n  </p>\r\n\r\n  <table class=\"fb-table\">\r\n    <thead>\r\n      <tr>\r\n        <th scope=\"col\">To</th>\r\n        <th scope=\"col\">Subject</th>\r\n        <th scope=\"col\">Sent</th>\r\n        <th scope=\"col\">Opened</th>\r\n      </tr>\r\n    </thead>\r\n    <tbody>\r\n      ")
    ;  if (messages.length === 0) { 
    ; __append("\r\n        <tr>\r\n          <td colspan=\"4\" class=\"fb-table__last\">You have not sent a message yet.</td>\r\n        </tr>\r\n      ")
    ;  } 
    ; __append("\r\n      ")
    ;  messages.forEach(function (message) { 
    ; __append("\r\n        <tr>\r\n          <td><a class=\"fb-table__name\" href=\"/people/")
    ; __append(escapeFn( encodeURIComponent(message.to) ))
    ; __append("\">")
    ; __append(escapeFn( message.to ))
    ; __append("</a></td>\r\n          <td><a href=\"/messages/sent/")
    ; __append(escapeFn( message.id ))
    ; __append("\">")
    ; __append(escapeFn( message.subject ))
    ; __append("</a></td>\r\n          <td>")
    ; __append(escapeFn( message.date ))
    ; __append("</td>\r\n          <td class=\"fb-table__last\">")
    ; __append(escapeFn( message.read ? 'opened' : 'not yet' ))
    ; __append("</td>\r\n        </tr>\r\n      ")
    ;  }); 
    ; __append("\r\n    </tbody>\r\n  </table>\r\n\r\n  <p class=\"fb-pagination\">Showing up to 100, newest first.</p>\r\n\r\n  <div class=\"fb-notice\">\r\n    <p><strong>Only the recipient can read what you sent.</strong></p>\r\n    <p>Deleting a message here removes your copy; theirs stays where it is. \"Opened\" is set the\r\n       moment they open it, not when it is delivered.</p>\r\n  </div>\r\n</main>\r\n\r\n")
    ; __append( include('../partials/footer') )
    ; __append("\r\n</body>\r\n</html>\r\n")
  return __output;

},
  "pages/my-page": function anonymous(locals, escapeFn, include, rethrow
) {
var Offline = locals.Offline, Online = locals.Online, actor = locals.actor, art = locals.art, avatar = locals.avatar, badge = locals.badge, badges = locals.badges, color = locals.color, creator = locals.creator, description = locals.description, domain = locals.domain, footer = locals.footer, forEach = locals.forEach, friend = locals.friend, friendTotal = locals.friendTotal, friends = locals.friends, games = locals.games, head = locals.head, header = locals.header, heldBadges = locals.heldBadges, href = locals.href, id = locals.id, img = locals.img, items = locals.items, joined = locals.joined, label = locals.label, lastOnline = locals.lastOnline, length = locals.length, link = locals.link, md = locals.md, name = locals.name, newestPlaces = locals.newestPlaces, now = locals.now, online = locals.online, pageTitle = locals.pageTitle, partials = locals.partials, place = locals.place, profileLinks = locals.profileLinks, reason = locals.reason, s = locals.s, site = locals.site, size = locals.size, slice = locals.slice, slug = locals.slug, sm = locals.sm, stats = locals.stats, thumb = locals.thumb, thumbUrl = locals.thumbUrl, thumbnailUrl = locals.thumbnailUrl, username = locals.username, viewer = locals.viewer, warning = locals.warning, warnings = locals.warnings, when = locals.when;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append( include('../partials/head', { pageTitle: pageTitle }) )
    ; __append("\r\n")
    ; __append( include('../partials/header') )
    ; __append("\r\n\r\n<main class=\"fb-container fb-main\">\r\n  <div class=\"fb-cols\">\r\n\r\n    <aside class=\"fb-col-profile\">\r\n      <div class=\"fb-profile\">\r\n        <h1 class=\"fb-profile__greeting\">Hi, ")
    ; __append(escapeFn( viewer.username ))
    ; __append("!</h1>\r\n        <p class=\"fb-profile__sub\">Your Profile:</p>\r\n        <p class=\"fb-profile__url\"><a href=\"/people/")
    ; __append(escapeFn( viewer.username ))
    ; __append("\">")
    ; __append(escapeFn( site.domain ))
    ; __append("/user/")
    ; __append(escapeFn( viewer.id ))
    ; __append("</a></p>\r\n\r\n        <div class=\"fb-profile__body\">\r\n          ")
    ; __append( include('../partials/avatar', { avatar: viewer.avatar, size: 'md' }) )
    ; __append("\r\n          <ul class=\"fb-profile__links\">\r\n            ")
    ;  profileLinks.forEach(function (link) { 
    ; __append("\r\n              <li><a href=\"")
    ; __append(escapeFn( link.href ))
    ; __append("\">")
    ; __append(escapeFn( link.label ))
    ; __append("</a></li>\r\n            ")
    ;  }); 
    ; __append("\r\n          </ul>\r\n        </div>\r\n\r\n        <p class=\"fb-profile__foot\"><a href=\"/reports/mine\">My Reports</a></p>\r\n      </div>\r\n\r\n      <section class=\"fb-panel\">\r\n        <h2 class=\"fb-panel__title\">Badges</h2>\r\n        <div class=\"fb-panel__body\">\r\n          <ul class=\"fb-grid--badges\">\r\n            ")
    ;  heldBadges.forEach(function (badge) { 
    ; __append("\r\n              <li class=\"fb-badge\" title=\"")
    ; __append(escapeFn( badge.description ))
    ; __append("\">\r\n                ")
    ;  if (badge.art) { 
    ; __append("\r\n                  <img class=\"fb-badge__art\" src=\"")
    ; __append(escapeFn( badge.art ))
    ; __append("\" alt=\"\" width=\"34\" height=\"34\">\r\n                ")
    ;  } else { 
    ; __append("\r\n                  <span class=\"fb-badge__pip\" style=\"--badge: ")
    ; __append(escapeFn( badge.color ))
    ; __append(";\" aria-hidden=\"true\"></span>\r\n                ")
    ;  } 
    ; __append("\r\n                ")
    ; __append(escapeFn( badge.name ))
    ; __append("\r\n              </li>\r\n            ")
    ;  }); 
    ; __append("\r\n          </ul>\r\n        </div>\r\n      </section>\r\n\r\n      <section class=\"fb-panel\">\r\n        <h2 class=\"fb-panel__title\">Statistics</h2>\r\n        <div class=\"fb-panel__body\">\r\n          <ul class=\"fb-statlines\">\r\n            <li>Joined: <strong>")
    ; __append(escapeFn( viewer.joined ))
    ; __append("</strong></li>\r\n            <li>Friends: <strong>")
    ; __append(escapeFn( viewer.stats.friends ))
    ; __append("</strong></li>\r\n            <li>Badges: <strong>")
    ; __append(escapeFn( viewer.stats.badges ))
    ; __append("</strong></li>\r\n            <li>Games created: <strong>")
    ; __append(escapeFn( viewer.stats.games ))
    ; __append("</strong></li>\r\n            <li>Items owned: <strong>")
    ; __append(escapeFn( viewer.stats.items ))
    ; __append("</strong></li>\r\n            <li>Last online: <strong>")
    ; __append(escapeFn( viewer.online ? 'Online now' : viewer.lastOnline.slice(0, 10) ))
    ; __append("</strong></li>\r\n          </ul>\r\n        </div>\r\n      </section>\r\n    </aside>\r\n\r\n    <div class=\"fb-col-main\">\r\n      ")
    ;  if (warnings.length > 0) { 
    ; __append("\r\n        <div class=\"fb-notice\">\r\n          <p><strong>")
    ; __append(escapeFn( warnings.length ))
    ; __append(" warning")
    ; __append(escapeFn( warnings.length === 1 ? '' : 's' ))
    ; __append(" on your account</strong></p>\r\n          <ul class=\"fb-list\">\r\n            ")
    ;  warnings.forEach(function (warning) { 
    ; __append("\r\n              <li>\r\n                <strong>")
    ; __append(escapeFn( warning.when ))
    ; __append("</strong> &mdash; ")
    ; __append(escapeFn( warning.reason ))
    ; __append("\r\n                <span class=\"fb-panel__strip\">from ")
    ; __append(escapeFn( warning.actor ))
    ; __append("</span>\r\n                <form method=\"post\" action=\"/warnings/")
    ; __append(escapeFn( warning.id ))
    ; __append("/dismiss\">\r\n                  <button class=\"fb-btn\" type=\"submit\">Dismiss</button>\r\n                </form>\r\n              </li>\r\n            ")
    ;  }); 
    ; __append("\r\n          </ul>\r\n          <p>Dismissing says you have read it. The warning stays on your account's record.</p>\r\n        </div>\r\n      ")
    ;  } 
    ; __append("\r\n\r\n      <section class=\"fb-panel\">\r\n        <h2 class=\"fb-panel__title\">Showcase</h2>\r\n        <div class=\"fb-panel__body fb-prose\">\r\n          <p>")
    ; __append(escapeFn( viewer.description ))
    ; __append("</p>\r\n        </div>\r\n        <p class=\"fb-panel__strip\">Visited 0 times</p>\r\n      </section>\r\n\r\n      <section class=\"fb-panel\">\r\n        <h2 class=\"fb-panel__title\">\r\n          <span class=\"fb-panel__title-row\">\r\n            <span>")
    ; __append(escapeFn( viewer.username ))
    ; __append("'s Friends</span>\r\n            <a href=\"/friends\">See all ")
    ; __append(escapeFn( friendTotal ))
    ; __append("</a>\r\n          </span>\r\n        </h2>\r\n        <div class=\"fb-panel__body\">\r\n          <ul class=\"fb-grid--people\">\r\n            ")
    ;  friends.forEach(function (friend) { 
    ; __append("\r\n              <li class=\"fb-card-person\">\r\n                ")
    ; __append( include('../partials/avatar', { avatar: friend.avatar, size: 'sm' }) )
    ; __append("\r\n                <a class=\"fb-card-person__name\" href=\"/people/")
    ; __append(escapeFn( friend.username ))
    ; __append("\">")
    ; __append(escapeFn( friend.username ))
    ; __append("</a>\r\n                <span class=\"fb-card-person__status\">")
    ; __append(escapeFn( friend.online ? 'Online' : 'Offline' ))
    ; __append("</span>\r\n              </li>\r\n            ")
    ;  }); 
    ; __append("\r\n          </ul>\r\n        </div>\r\n      </section>\r\n\r\n      <section class=\"fb-panel\">\r\n        <h2 class=\"fb-panel__title\">\r\n          <span class=\"fb-panel__title-row\">\r\n            <span>Newest Places</span>\r\n            <a href=\"/places/mine\">My places</a>\r\n          </span>\r\n        </h2>\r\n        <div class=\"fb-panel__body\">\r\n          ")
    ;  if (newestPlaces.length === 0) { 
    ; __append("\r\n            <p class=\"fb-muted\">Nobody has published a place yet. <a href=\"/places/new\">Build the first one</a>.</p>\r\n          ")
    ;  } else { 
    ; __append("\r\n            <ul class=\"fb-grid--games\">\r\n              ")
    ;  newestPlaces.forEach(function (place) { 
    ; __append("\r\n                <li>\r\n                  <a class=\"fb-card-game__thumb\" href=\"/games/")
    ; __append(escapeFn( place.slug ))
    ; __append("\" style=\"--thumb: ")
    ; __append(escapeFn( place.thumb ))
    ; __append(";\" aria-hidden=\"true\" tabindex=\"-1\">")
    ; __append( include('../partials/thumb-img', { thumbUrl: place.thumbnailUrl }) )
    ; __append("</a>\r\n                  <a class=\"fb-card-game__title\" href=\"/games/")
    ; __append(escapeFn( place.slug ))
    ; __append("\">")
    ; __append(escapeFn( place.name ))
    ; __append("</a>\r\n                  <p class=\"fb-card-game__meta\">\r\n                    By <a href=\"/people/")
    ; __append(escapeFn( encodeURIComponent(place.creator) ))
    ; __append("\">")
    ; __append(escapeFn( place.creator ))
    ; __append("</a>\r\n                  </p>\r\n                </li>\r\n              ")
    ;  }); 
    ; __append("\r\n            </ul>\r\n          ")
    ;  } 
    ; __append("\r\n        </div>\r\n        <p class=\"fb-pagination\"><a href=\"/games\">Every place</a></p>\r\n      </section>\r\n    </div>\r\n\r\n  </div>\r\n</main>\r\n\r\n")
    ; __append( include('../partials/footer') )
    ; __append("\r\n</body>\r\n</html>\r\n")
  return __output;

},
  "pages/news": function anonymous(locals, escapeFn, include, rethrow
) {
var active = locals.active, article = locals.article, articles = locals.articles, author = locals.author, category = locals.category, categoryFacets = locals.categoryFacets, date = locals.date, facet = locals.facet, footer = locals.footer, forEach = locals.forEach, head = locals.head, header = locals.header, href = locals.href, is = locals.is, label = locals.label, length = locals.length, pageTitle = locals.pageTitle, partials = locals.partials, slug = locals.slug, summary = locals.summary, title = locals.title, total = locals.total;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append( include('../partials/head', { pageTitle: pageTitle }) )
    ; __append("\r\n")
    ; __append( include('../partials/header') )
    ; __append("\r\n\r\n<main class=\"fb-container fb-main\">\r\n  <div class=\"fb-title-row\">\r\n    <h1 class=\"fb-title\">News</h1>\r\n    <span class=\"fb-pagecount\">")
    ; __append(escapeFn( articles.length ))
    ; __append(" ")
    ; __append(escapeFn( articles.length === 1 ? 'article' : 'articles' ))
    ; __append("</span>\r\n  </div>\r\n\r\n  <div class=\"fb-cols\">\r\n    <aside class=\"fb-col-side\">\r\n      <h2 class=\"fb-facets__heading\">Category</h2>\r\n      <ul class=\"fb-facets__list\">\r\n        ")
    ;  categoryFacets.forEach(function (facet) { 
    ; __append("\r\n          <li class=\"")
    ; __append(escapeFn( facet.active ? 'is-active' : '' ))
    ; __append("\"><a href=\"")
    ; __append(escapeFn( facet.href ))
    ; __append("\">")
    ; __append(escapeFn( facet.label ))
    ; __append("</a></li>\r\n        ")
    ;  }); 
    ; __append("\r\n      </ul>\r\n    </aside>\r\n\r\n    <div class=\"fb-col-main\">\r\n      ")
    ;  if (articles.length === 0) { 
    ; __append("\r\n        <div class=\"fb-notice\">\r\n          ")
    ;  if (total === 0) { 
    ; __append("\r\n            <p><strong>No articles have been published yet.</strong></p>\r\n            <p>The team posts development updates here. Nothing is shown until something is actually written, so this page never invents an announcement.</p>\r\n          ")
    ;  } else { 
    ; __append("\r\n            <p><strong>Nothing published in that category yet.</strong></p>\r\n            <p><a href=\"/news\">Show every article</a>.</p>\r\n          ")
    ;  } 
    ; __append("\r\n        </div>\r\n      ")
    ;  } else { 
    ; __append("\r\n        <ul class=\"fb-newslist\">\r\n          ")
    ;  articles.forEach(function (article) { 
    ; __append("\r\n            <li class=\"fb-newsitem\">\r\n              <a class=\"fb-newsitem__title\" href=\"/news/")
    ; __append(escapeFn( article.slug ))
    ; __append("\">")
    ; __append(escapeFn( article.title ))
    ; __append("</a>\r\n              <p class=\"fb-newsitem__meta\">\r\n                By ")
    ; __append(escapeFn( article.author ))
    ; __append(" &middot; ")
    ; __append(escapeFn( article.date ))
    ; __append(" &middot;\r\n                <a href=\"/news?category=")
    ; __append(escapeFn( encodeURIComponent(article.category) ))
    ; __append("\">")
    ; __append(escapeFn( article.category ))
    ; __append("</a>\r\n              </p>\r\n              ")
    ;  if (article.summary) { 
    ; __append("\r\n                <p class=\"fb-newsitem__summary\">")
    ; __append(escapeFn( article.summary ))
    ; __append("</p>\r\n              ")
    ;  } 
    ; __append("\r\n            </li>\r\n          ")
    ;  }); 
    ; __append("\r\n        </ul>\r\n      ")
    ;  } 
    ; __append("\r\n\r\n      <div class=\"fb-notice\">\r\n        <p><strong>These are the platform's own announcements.</strong></p>\r\n        <p>Everything listed here was written by the FieldBrik team about FieldBrik, and is stored in the site's own database. Posts by members belong on the <a href=\"/forum\">forum</a>.</p>\r\n      </div>\r\n    </div>\r\n  </div>\r\n</main>\r\n\r\n")
    ; __append( include('../partials/footer') )
    ; __append("\r\n</body>\r\n</html>\r\n")
  return __output;

},
  "pages/news-article": function anonymous(locals, escapeFn, include, rethrow
) {
var article = locals.article, author = locals.author, category = locals.category, date = locals.date, footer = locals.footer, forEach = locals.forEach, head = locals.head, header = locals.header, pageTitle = locals.pageTitle, paragraph = locals.paragraph, paragraphs = locals.paragraphs, partials = locals.partials, summary = locals.summary, title = locals.title;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append( include('../partials/head', { pageTitle: pageTitle }) )
    ; __append("\r\n")
    ; __append( include('../partials/header') )
    ; __append("\r\n\r\n<main class=\"fb-container fb-main\">\r\n  <p class=\"fb-crumbs\"><a href=\"/news\">News</a> &raquo; ")
    ; __append(escapeFn( article.title ))
    ; __append("</p>\r\n\r\n  <div class=\"fb-title-row\">\r\n    <h1 class=\"fb-title\">")
    ; __append(escapeFn( article.title ))
    ; __append("</h1>\r\n  </div>\r\n\r\n  <p class=\"fb-newsitem__meta\">\r\n    By ")
    ; __append(escapeFn( article.author ))
    ; __append(" &middot; ")
    ; __append(escapeFn( article.date ))
    ; __append(" &middot;\r\n    <a href=\"/news?category=")
    ; __append(escapeFn( encodeURIComponent(article.category) ))
    ; __append("\">")
    ; __append(escapeFn( article.category ))
    ; __append("</a>\r\n  </p>\r\n\r\n  ")
    ;  if (article.summary) { 
    ; __append("\r\n    <p class=\"fb-subtitle\">")
    ; __append(escapeFn( article.summary ))
    ; __append("</p>\r\n  ")
    ;  } 
    ; __append("\r\n\r\n  <div class=\"fb-content\">\r\n    <div class=\"fb-prose\">\r\n      ")
    ;  article.paragraphs.forEach(function (paragraph) { 
    ; __append("\r\n        <p>")
    ; __append(escapeFn( paragraph ))
    ; __append("</p>\r\n      ")
    ;  }); 
    ; __append("\r\n    </div>\r\n  </div>\r\n\r\n  <p class=\"fb-panel__more\"><a href=\"/news\">Back to all news</a></p>\r\n</main>\r\n\r\n")
    ; __append( include('../partials/footer') )
    ; __append("\r\n</body>\r\n</html>\r\n")
  return __output;

},
  "pages/parents": function anonymous(locals, escapeFn, include, rethrow
) {
var card = locals.card, cards = locals.cards, footer = locals.footer, forEach = locals.forEach, head = locals.head, header = locals.header, href = locals.href, pageTitle = locals.pageTitle, partials = locals.partials, text = locals.text, title = locals.title;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append( include('../partials/head', { pageTitle: pageTitle }) )
    ; __append("\r\n")
    ; __append( include('../partials/header') )
    ; __append("\r\n\r\n<main class=\"fb-container fb-main\">\r\n  <div class=\"fb-content\">\r\n    <h1 class=\"fb-title\">FieldBrik Parents</h1>\r\n\r\n    <ul class=\"fb-grid--parents\">\r\n      ")
    ;  cards.forEach(function (card) { 
    ; __append("\r\n        <li class=\"fb-card-parent\">\r\n          <div>\r\n            <a class=\"fb-card-parent__title\" href=\"")
    ; __append(escapeFn( card.href ))
    ; __append("\">")
    ; __append(escapeFn( card.title ))
    ; __append("</a>\r\n            <p class=\"fb-card-parent__text\">")
    ; __append(escapeFn( card.text ))
    ; __append("</p>\r\n          </div>\r\n        </li>\r\n      ")
    ;  }); 
    ; __append("\r\n    </ul>\r\n  </div>\r\n</main>\r\n\r\n")
    ; __append( include('../partials/footer') )
    ; __append("\r\n</body>\r\n</html>\r\n")
  return __output;

},
  "pages/parents-faq": function anonymous(locals, escapeFn, include, rethrow
) {
var footer = locals.footer, head = locals.head, header = locals.header, nav = locals.nav, pageTitle = locals.pageTitle, parents = locals.parents, partials = locals.partials;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append( include('../partials/head', { pageTitle: pageTitle }) )
    ; __append("\r\n")
    ; __append( include('../partials/header') )
    ; __append("\r\n\r\n<main class=\"fb-container fb-main\">\r\n  <div class=\"fb-title-row\">\r\n    <h1 class=\"fb-title\">Parents</h1>\r\n  </div>\r\n\r\n  ")
    ; __append( include('../partials/parents-nav') )
    ; __append("\r\n\r\n  <div class=\"fb-content\">\r\n    <h2 class=\"fb-title fb-title--small\">FAQs</h2>\r\n\r\n    <p class=\"fb-muted\">Written from the decisions already made about this build. The wording will be reviewed before the site takes real registrations.</p>\r\n\r\n    <div class=\"fb-prose\">\r\n      <dl class=\"fb-faq\">\r\n        <dt>Is FieldBrik free?</dt>\r\n        <dd>Yes. Building, publishing, playing and using the forum are free. Carpenters Club is an optional paid membership that adds recognition; nothing required to use the site sits behind it.</dd>\r\n\r\n        <dt>What does Carpenters Club cost?</dt>\r\n        <dd>Three tiers, each available monthly, quarterly, yearly or as a one-off permanent payment. Prices are listed on the <a href=\"/carpenters-club\">Carpenters Club</a> page. Payment is not open yet.</dd>\r\n\r\n        <dt>What is asked for when my child signs up?</dt>\r\n        <dd>A username, an email address and a password. No real name, address, phone number or date of birth. The email is never shown to other members.</dd>\r\n\r\n        <dt>Can my child spend money on the site?</dt>\r\n        <dd>Not at present. There is no checkout and no payment page anywhere on FieldBrik, so nothing can be bought. When a checkout exists, card details will be handled by a payment provider and never stored on this site.</dd>\r\n\r\n        <dt>What is a Buck and what is a Ticket?</dt>\r\n        <dd>Tickets are earned by using the site. Bucks are the premium currency. They are linked at one Buck to ten Tickets, so an item priced at thirty Bucks also displays as three hundred Tickets.</dd>\r\n\r\n        <dt>Can strangers message my child?</dt>\r\n        <dd>Yes, any member can send a private message to any other member. Only the sender and the recipient can open it, and it stays marked unread until it is opened. Blocking a member stops messages and friend requests between the two accounts. Any message can be reported with the Report Abuse link on it, and the report goes into the moderation queue.</dd>\r\n\r\n        <dt>What happens if someone breaks the rules?</dt>\r\n        <dd>A moderator can warn or restrict the account. Restrictions apply across the whole site, not one page at a time, and temporary ones expire on their own. Every action is logged with a reason.</dd>\r\n\r\n        <dt>What information is kept about my child?</dt>\r\n        <dd>The <a href=\"/privacy\">privacy policy</a> lists it in full: account details, the places and items they create, messages, and sign-in records. No advertising or tracking networks are embedded.</dd>\r\n\r\n        <dt>Can I close the account?</dt>\r\n        <dd>Yes. Account deletion is a request on the account settings page: profile content is removed and identifying details are cleared, while moderation and transaction records are kept without identifying the member.</dd>\r\n\r\n        <dt>Are there time limits or parental controls?</dt>\r\n        <dd>Not yet, and this page will not pretend otherwise. Per-account time limits are a feature we have not built. For now the control is the same as any other site: when the device is used, and for how long.</dd>\r\n\r\n        <dt>How do I contact someone?</dt>\r\n        <dd>Through the <a href=\"/support\">support page</a>.</dd>\r\n      </dl>\r\n    </div>\r\n\r\n    ")
    ; __append( include('../partials/parents-nav') )
    ; __append("\r\n  </div>\r\n</main>\r\n\r\n")
    ; __append( include('../partials/footer') )
    ; __append("\r\n</body>\r\n</html>\r\n")
  return __output;

},
  "pages/parents-guestbook": function anonymous(locals, escapeFn, include, rethrow
) {
var footer = locals.footer, head = locals.head, header = locals.header, nav = locals.nav, pageTitle = locals.pageTitle, parents = locals.parents, partials = locals.partials;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append( include('../partials/head', { pageTitle: pageTitle }) )
    ; __append("\r\n")
    ; __append( include('../partials/header') )
    ; __append("\r\n\r\n<main class=\"fb-container fb-main\">\r\n  <div class=\"fb-title-row\">\r\n    <h1 class=\"fb-title\">Parents</h1>\r\n  </div>\r\n\r\n  ")
    ; __append( include('../partials/parents-nav') )
    ; __append("\r\n\r\n  <div class=\"fb-content\">\r\n    <h2 class=\"fb-title fb-title--small\">What Parents are Saying</h2>\r\n\r\n    <div class=\"fb-prose\">\r\n      <p>A guestbook for parents and guardians: comments from people whose children use FieldBrik.</p>\r\n    </div>\r\n\r\n    <table class=\"fb-table\">\r\n      <thead>\r\n        <tr>\r\n          <th scope=\"col\">From</th>\r\n          <th scope=\"col\">Comment</th>\r\n          <th scope=\"col\">Date</th>\r\n        </tr>\r\n      </thead>\r\n      <tbody>\r\n        <tr>\r\n          <td colspan=\"3\" class=\"fb-table__last\">No comments yet.</td>\r\n        </tr>\r\n      </tbody>\r\n    </table>\r\n\r\n    <div class=\"fb-notice\">\r\n      <p><strong>This page is empty on purpose.</strong></p>\r\n      <p>A guestbook with invented quotes on it would be worse than an empty one: the whole point of the page is that real parents said these things. The table fills as comments are left.</p>\r\n      <p>Leaving a comment needs an account and a moderation queue, so it opens with the social service after accounts. Every entry is reviewed before it appears, and comments cannot be posted anonymously.</p>\r\n    </div>\r\n\r\n    ")
    ; __append( include('../partials/parents-nav') )
    ; __append("\r\n  </div>\r\n</main>\r\n\r\n")
    ; __append( include('../partials/footer') )
    ; __append("\r\n</body>\r\n</html>\r\n")
  return __output;

},
  "pages/parents-guide": function anonymous(locals, escapeFn, include, rethrow
) {
var footer = locals.footer, head = locals.head, header = locals.header, nav = locals.nav, pageTitle = locals.pageTitle, parents = locals.parents, partials = locals.partials;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append( include('../partials/head', { pageTitle: pageTitle }) )
    ; __append("\r\n")
    ; __append( include('../partials/header') )
    ; __append("\r\n\r\n<main class=\"fb-container fb-main\">\r\n  <div class=\"fb-title-row\">\r\n    <h1 class=\"fb-title\">Parents</h1>\r\n  </div>\r\n\r\n  ")
    ; __append( include('../partials/parents-nav') )
    ; __append("\r\n\r\n  <div class=\"fb-content\">\r\n    <h2 class=\"fb-title fb-title--small\">FieldBrik Guide</h2>\r\n\r\n    <div class=\"fb-prose\">\r\n      <p>FieldBrik is an online building toy. Members assemble a character, build places out of virtual bricks, publish them, and visit each other's creations. There is also a forum, private messaging and a catalog of items for the character.</p>\r\n\r\n      <h2>What a member does</h2>\r\n      <ul class=\"fb-list\">\r\n        <li><strong>Builds</strong> a place from a brick palette inside a place editor.</li>\r\n        <li><strong>Publishes</strong> it so other members can visit and play it.</li>\r\n        <li><strong>Visits</strong> other members' places, alone or with others.</li>\r\n        <li><strong>Trades ideas</strong> in the forum, and messages friends directly.</li>\r\n      </ul>\r\n\r\n      <h2>Parts of the site</h2>\r\n      <dl class=\"fb-faq\">\r\n        <dt>Games</dt>\r\n        <dd>Browse published places by popularity, visits or creator.</dd>\r\n        <dt>Catalog</dt>\r\n        <dd>Hats, shirts, trousers and accessories for a character. Each item has a Tickets price, a Bucks price, or both.</dd>\r\n        <dt>People</dt>\r\n        <dd>Find a member and see their public profile, badges and creations.</dd>\r\n        <dt>Forum</dt>\r\n        <dd>Discussion sections for announcements, help, building and scripting.</dd>\r\n        <dt>Carpenters Club</dt>\r\n        <dd>An optional paid membership. Nothing needed to build, publish or play is behind it.</dd>\r\n      </dl>\r\n\r\n      <h2>Badges</h2>\r\n      <p>A badge is a small marker on a profile. Some are granted automatically because of a role on the site, such as Moderator or Administrator. Others are awarded by staff. A badge is stored on the account and is granted by the server, so it cannot be added by editing anything in a browser.</p>\r\n\r\n      <h2>Bucks and Tickets</h2>\r\n      <p><strong>Tickets</strong> are earned by using the site, and carry the catalog economy. <strong>Bucks</strong> are the premium currency. The two are linked at one Buck to ten Tickets.</p>\r\n      <p>Carpenters Club is the only thing on FieldBrik that costs money. Prices are listed on the <a href=\"/carpenters-club\">Carpenters Club</a> page, and payment is not open yet.</p>\r\n    </div>\r\n\r\n    ")
    ; __append( include('../partials/parents-nav') )
    ; __append("\r\n  </div>\r\n</main>\r\n\r\n")
    ; __append( include('../partials/footer') )
    ; __append("\r\n</body>\r\n</html>\r\n")
  return __output;

},
  "pages/parents-learning": function anonymous(locals, escapeFn, include, rethrow
) {
var footer = locals.footer, head = locals.head, header = locals.header, nav = locals.nav, pageTitle = locals.pageTitle, parents = locals.parents, partials = locals.partials;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append( include('../partials/head', { pageTitle: pageTitle }) )
    ; __append("\r\n")
    ; __append( include('../partials/header') )
    ; __append("\r\n\r\n<main class=\"fb-container fb-main\">\r\n  <div class=\"fb-title-row\">\r\n    <h1 class=\"fb-title\">Parents</h1>\r\n  </div>\r\n\r\n  ")
    ; __append( include('../partials/parents-nav') )
    ; __append("\r\n\r\n  <div class=\"fb-content\">\r\n    <h2 class=\"fb-title fb-title--small\">FieldBrik and Learning</h2>\r\n\r\n    <div class=\"fb-prose\">\r\n      <p>Building in FieldBrik is quiet engineering. A member decides what a place should do, assembles it out of parts that each have a size and a position, tests it, watches it fail, and changes it. That loop is the same one used to build anything physical, and it is the part that transfers.</p>\r\n\r\n      <h2>Design and engineering</h2>\r\n      <ul class=\"fb-list\">\r\n        <li>Working within constraints: a brick palette, a budget, and parts that only fit together in certain ways.</li>\r\n        <li>Thinking in three dimensions: a staircase that looks right from the front still has to be climbable from the side.</li>\r\n        <li>Iteration: the first version is rarely the one that works, and finding out why is the exercise.</li>\r\n        <li>Explaining a build to other members, in the forum or in a place description.</li>\r\n      </ul>\r\n\r\n      <h2>Simple programming</h2>\r\n      <p>A place can be given behaviour: a door that opens, a lift that moves, a trap that resets. That is a sequence of steps with a condition attached, which is the same idea as a program, expressed in something a member can see working in front of them.</p>\r\n\r\n      <h2>Reading and writing</h2>\r\n      <p>Place descriptions, forum posts and messages are all writing that other people read. The forum sections exist partly for that reason: describing what you built, and answering a question about it clearly, is a skill worth practising in a place where the audience is interested.</p>\r\n\r\n      <h2>What it is not</h2>\r\n      <p>FieldBrik is not a curriculum and does not claim to teach a subject. There are no lessons, no tests and no progress reports. It is a building toy that happens to reward the same habits as the subjects above.</p>\r\n    </div>\r\n\r\n    ")
    ; __append( include('../partials/parents-nav') )
    ; __append("\r\n  </div>\r\n</main>\r\n\r\n")
    ; __append( include('../partials/footer') )
    ; __append("\r\n</body>\r\n</html>\r\n")
  return __output;

},
  "pages/parents-safety": function anonymous(locals, escapeFn, include, rethrow
) {
var footer = locals.footer, head = locals.head, header = locals.header, nav = locals.nav, pageTitle = locals.pageTitle, parents = locals.parents, partials = locals.partials;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append( include('../partials/head', { pageTitle: pageTitle }) )
    ; __append("\r\n")
    ; __append( include('../partials/header') )
    ; __append("\r\n\r\n<main class=\"fb-container fb-main\">\r\n  <div class=\"fb-title-row\">\r\n    <h1 class=\"fb-title\">Parents</h1>\r\n  </div>\r\n\r\n  ")
    ; __append( include('../partials/parents-nav') )
    ; __append("\r\n\r\n  <div class=\"fb-content\">\r\n    <h2 class=\"fb-title fb-title--small\">Keeping Kids Safe</h2>\r\n\r\n    <div class=\"fb-prose\">\r\n      <h2>What is asked for at sign-up</h2>\r\n      <p>A username, an email address and a password. Nothing else. No real name, no address, no phone number, and no date of birth is collected by the site as it is currently built. The email is used to sign in and to recover the account, and it is never shown to another member.</p>\r\n      <p>A sign-up step for members under the age of majority, involving a parent or guardian, is still being designed. It is not drawn on the registration page as a checkbox that does nothing.</p>\r\n\r\n      <h2>Who can contact a member</h2>\r\n      <p>Members can send each other private messages. A message is shown only to the account that sent it and the account it was addressed to, and it is marked unread until it is opened. Blocking a member is built: a blocked member cannot send a message to the account that blocked them, and the block stops friend requests between the two as well.</p>\r\n\r\n      <h2>Reporting</h2>\r\n      <p>Every profile and every private message carries a Report Abuse link. A report asks for a\r\n         reason from a fixed list and an optional explanation, and it lands in one moderation queue\r\n         rather than an inbox where it might sit unread. The member it is about is not told who\r\n         reported them, and filing a report does not itself ban anybody: a member of staff reads it\r\n         and decides whether a warning or a restriction is warranted.</p>\r\n\r\n      <h2>How moderation works</h2>\r\n      <p>A moderator can warn an account or restrict it. Restrictions are recorded against the account and checked on every request, so a restricted account cannot avoid them by finding a page that forgot to check. A temporary restriction stops applying when its end date passes and stays in the account's history. Every administrative action is written to a log with the reason and the staff member, and that log cannot be edited from the admin panel.</p>\r\n\r\n      <h2>About this page</h2>\r\n      <p>This page describes what the site is built to do. FieldBrik 0.3 is still under construction: accounts, profiles, friends, private messages, reporting, the forum, the catalog and the admin panel are in place, while the building client is not. Where a feature is described in the future tense, it does not exist yet and is not being pretended.</p>\r\n    </div>\r\n\r\n    ")
    ; __append( include('../partials/parents-nav') )
    ; __append("\r\n  </div>\r\n</main>\r\n\r\n")
    ; __append( include('../partials/footer') )
    ; __append("\r\n</body>\r\n</html>\r\n")
  return __output;

},
  "pages/people": function anonymous(locals, escapeFn, include, rethrow
) {
var Offline = locals.Offline, Online = locals.Online, active = locals.active, avatar = locals.avatar, facet = locals.facet, footer = locals.footer, forEach = locals.forEach, friends = locals.friends, head = locals.head, header = locals.header, href = locals.href, is = locals.is, joined = locals.joined, label = locals.label, length = locals.length, member = locals.member, members = locals.members, online = locals.online, pageTitle = locals.pageTitle, partials = locals.partials, people = locals.people, query = locals.query, size = locals.size, sortFacets = locals.sortFacets, stats = locals.stats, user = locals.user, username = locals.username, xs = locals.xs;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append( include('../partials/head', { pageTitle: pageTitle }) )
    ; __append("\r\n")
    ; __append( include('../partials/header') )
    ; __append("\r\n\r\n<main class=\"fb-container fb-main\">\r\n  <div class=\"fb-title-row\">\r\n    <h1 class=\"fb-title\">People</h1>\r\n    <span class=\"fb-pagecount\">")
    ; __append(escapeFn( people.length ))
    ; __append(" ")
    ; __append(escapeFn( people.length === 1 ? 'member' : 'members' ))
    ; __append("</span>\r\n  </div>\r\n\r\n  <div class=\"fb-cols\">\r\n    <aside class=\"fb-col-side\">\r\n      <h2 class=\"fb-facets__heading\">Sort by</h2>\r\n      <ul class=\"fb-facets__list\">\r\n        ")
    ;  sortFacets.forEach(function (facet) { 
    ; __append("\r\n          <li class=\"")
    ; __append(escapeFn( facet.active ? 'is-active' : '' ))
    ; __append("\"><a href=\"")
    ; __append(escapeFn( facet.href ))
    ; __append("\">")
    ; __append(escapeFn( facet.label ))
    ; __append("</a></li>\r\n        ")
    ;  }); 
    ; __append("\r\n      </ul>\r\n    </aside>\r\n\r\n    <div class=\"fb-col-main\">\r\n      <form class=\"fb-toolbar\" method=\"get\" action=\"/people\">\r\n        <input type=\"search\" name=\"q\" value=\"")
    ; __append(escapeFn( query ))
    ; __append("\" placeholder=\"Search usernames\">\r\n        <button class=\"fb-btn\" type=\"submit\">Search</button>\r\n        ")
    ;  if (query) { 
    ; __append("<a class=\"fb-muted\" href=\"/people\">Clear</a>")
    ;  } 
    ; __append("\r\n      </form>\r\n\r\n      ")
    ;  if (people.length === 0) { 
    ; __append("\r\n        <div class=\"fb-notice\">\r\n          <p><strong>No member uses that name.</strong></p>\r\n          <p>Usernames are unique, so check the spelling. <a href=\"/people\">See every member</a>.</p>\r\n        </div>\r\n      ")
    ;  } else { 
    ; __append("\r\n        <table class=\"fb-table\">\r\n          <thead>\r\n            <tr>\r\n              <th scope=\"col\">Avatar</th>\r\n              <th scope=\"col\">Name</th>\r\n              <th scope=\"col\">Status</th>\r\n              <th scope=\"col\">Friends</th>\r\n              <th scope=\"col\">Joined</th>\r\n            </tr>\r\n          </thead>\r\n          <tbody>\r\n            ")
    ;  people.forEach(function (user) { 
    ; __append("\r\n              <tr>\r\n                <td class=\"fb-table__avatar\">\r\n                  ")
    ; __append( include('../partials/avatar', { avatar: user.avatar, size: 'xs' }) )
    ; __append("\r\n                </td>\r\n                <td><a class=\"fb-table__name\" href=\"/people/")
    ; __append(escapeFn( user.username ))
    ; __append("\">")
    ; __append(escapeFn( user.username ))
    ; __append("</a></td>\r\n                <td>")
    ; __append(escapeFn( user.online ? 'Online' : 'Offline' ))
    ; __append("</td>\r\n                <td>")
    ; __append(escapeFn( user.stats.friends ))
    ; __append("</td>\r\n                <td>")
    ; __append(escapeFn( user.joined ))
    ; __append("</td>\r\n              </tr>\r\n            ")
    ;  }); 
    ; __append("\r\n          </tbody>\r\n        </table>\r\n        <p class=\"fb-pagination\">Page 1 of 1</p>\r\n      ")
    ;  } 
    ; __append("\r\n    </div>\r\n  </div>\r\n</main>\r\n\r\n")
    ; __append( include('../partials/footer') )
    ; __append("\r\n</body>\r\n</html>\r\n")
  return __output;

},
  "pages/place-edit": function anonymous(locals, escapeFn, include, rethrow
) {
var Create = locals.Create, Draft = locals.Draft, Edit = locals.Edit, New = locals.New, Place = locals.Place, Publish = locals.Publish, Published = locals.Published, Save = locals.Save, Unpublish = locals.Unpublish, a = locals.a, btn = locals.btn, created = locals.created, description = locals.description, draft = locals.draft, failure = locals.failure, fb = locals.fb, file = locals.file, fileHistory = locals.fileHistory, filename = locals.filename, footer = locals.footer, forEach = locals.forEach, formatLabel = locals.formatLabel, head = locals.head, header = locals.header, id = locals.id, latestFile = locals.latestFile, length = locals.length, name = locals.name, note = locals.note, notice = locals.notice, pageTitle = locals.pageTitle, partials = locals.partials, place = locals.place, places = locals.places, primary = locals.primary, published = locals.published, size = locals.size, slug = locals.slug, thumbnailUrl = locals.thumbnailUrl, toFixed = locals.toFixed, version = locals.version;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append( include('../partials/head', { pageTitle: pageTitle }) )
    ; __append("\r\n")
    ; __append( include('../partials/header') )
    ; __append("\r\n\r\n<main class=\"fb-container fb-main\">\r\n  <p class=\"fb-crumbs\">\r\n    <a href=\"/home\">Home</a> &raquo;\r\n    ")
    ;  if (place) { 
    ; __append("<a href=\"/games/")
    ; __append(escapeFn( place.slug ))
    ; __append("\">")
    ; __append(escapeFn( place.name ))
    ; __append("</a> &raquo; Edit")
    ;  } else { 
    ; __append("New place")
    ;  } 
    ; __append("\r\n  </p>\r\n\r\n  ")
    ;  if (failure) { 
    ; __append("\r\n    <div class=\"fb-notice\"><p><strong>")
    ; __append(escapeFn( failure ))
    ; __append("</strong></p></div>\r\n  ")
    ;  } else if (notice) { 
    ; __append("\r\n    <div class=\"fb-notice\"><p><strong>")
    ; __append(escapeFn( notice ))
    ; __append("</strong></p></div>\r\n  ")
    ;  } 
    ; __append("\r\n\r\n  <div class=\"fb-title-row\">\r\n    <h1 class=\"fb-title\">")
    ; __append(escapeFn( place ? 'Edit ' + place.name : 'New Place' ))
    ; __append("</h1>\r\n    ")
    ;  if (place) { 
    ; __append("<span class=\"fb-pagecount\">")
    ; __append(escapeFn( place.published ? 'Published' : 'Draft' ))
    ; __append("</span>")
    ;  } 
    ; __append("\r\n  </div>\r\n\r\n  <section class=\"fb-panel\">\r\n    <h2 class=\"fb-panel__title\">The listing</h2>\r\n    <div class=\"fb-panel__body\">\r\n      <form class=\"fb-form\" method=\"post\" action=\"")
    ; __append(escapeFn( place ? '/places/' + place.id : '/places' ))
    ; __append("\">\r\n        <label for=\"fb-place-name\">Name</label>\r\n        <input id=\"fb-place-name\" name=\"name\" type=\"text\" maxlength=\"60\" required\r\n               value=\"")
    ; __append(escapeFn( place ? place.name : '' ))
    ; __append("\">\r\n\r\n        <label for=\"fb-place-description\">Description</label>\r\n        <textarea id=\"fb-place-description\" name=\"description\" rows=\"8\" maxlength=\"2000\">")
    ; __append(escapeFn( place ? place.description : '' ))
    ; __append("</textarea>\r\n\r\n        ")
    ;  if (!place) { 
    ; __append("\r\n          <label for=\"fb-place-publish\">Visibility</label>\r\n          <select id=\"fb-place-publish\" name=\"published\">\r\n            <option value=\"0\">Draft - only I can see it</option>\r\n            <option value=\"1\">Published - listed on the Home page</option>\r\n          </select>\r\n        ")
    ;  } 
    ; __append("\r\n\r\n        <button class=\"fb-btn fb-btn--primary\" type=\"submit\">")
    ; __append(escapeFn( place ? 'Save place' : 'Create place' ))
    ; __append("</button>\r\n      </form>\r\n    </div>\r\n    <p class=\"fb-panel__strip\">\r\n      The address is made from the name when the place is created and does not change afterwards,\r\n      so a link somebody shared keeps working if you rename it later.\r\n    </p>\r\n  </section>\r\n\r\n  ")
    ;  if (place) { 
    ; __append("\r\n    <section class=\"fb-panel\" id=\"fb-place-file-panel\">\r\n      <h2 class=\"fb-panel__title\">Place file</h2>\r\n      <div class=\"fb-panel__body\">\r\n        ")
    ;  if (latestFile) { 
    ; __append("\r\n          <p><strong>Version ")
    ; __append(escapeFn( latestFile.version ))
    ; __append(" is published.</strong>\r\n             <span class=\"fb-muted\">")
    ; __append(escapeFn( latestFile.filename ))
    ; __append("</span></p>\r\n          <table class=\"fb-table fb-table--kv\">\r\n            <tbody>\r\n              <tr><th scope=\"row\">Format</th><td>")
    ; __append(escapeFn( latestFile.formatLabel ))
    ; __append("</td></tr>\r\n              <tr><th scope=\"row\">Size</th><td>")
    ; __append(escapeFn( (latestFile.size / 1024).toFixed(1) ))
    ; __append(" KB</td></tr>\r\n              <tr><th scope=\"row\">Published</th><td>")
    ; __append(escapeFn( latestFile.created ))
    ; __append("</td></tr>\r\n              ")
    ;  if (latestFile.note) { 
    ; __append("<tr><th scope=\"row\">Note</th><td>")
    ; __append(escapeFn( latestFile.note ))
    ; __append("</td></tr>")
    ;  } 
    ; __append("\r\n            </tbody>\r\n          </table>\r\n          <p class=\"fb-panel__more\">\r\n            <a class=\"fb-btn fb-btn--primary\" href=\"/games/")
    ; __append(escapeFn( place.slug ))
    ; __append("/file\">Download version ")
    ; __append(escapeFn( latestFile.version ))
    ; __append("</a>\r\n          </p>\r\n        ")
    ;  } else { 
    ; __append("\r\n          <p class=\"fb-muted\">No file has been published for this place. Version 1 starts with the\r\n             first upload below.</p>\r\n        ")
    ;  } 
    ; __append("\r\n\r\n        <form id=\"fb-place-file\" class=\"fb-form\" method=\"post\"\r\n              action=\"/places/")
    ; __append(escapeFn( place.id ))
    ; __append("/file\"\r\n              data-redirect=\"/places/")
    ; __append(escapeFn( place.id ))
    ; __append("/edit?done=file\"\r\n              data-max-bytes=\"1572864\">\r\n          <label for=\"fb-place-file-input\">Choose a place file</label>\r\n          <input id=\"fb-place-file-input\" name=\"file\" type=\"file\" required\r\n                 accept=\".fbrx,.rbxl,.rbxlx,.xml,application/xml,text/xml\">\r\n          <p class=\"fb-muted\">A .fbrx from Studio, a .rbxlx, an XML-saved .rbxl, or a .xml place.\r\n             The file must be XML with a &lt;roblox&gt; root and can be up to 1.5 MB. A binary .rbxl\r\n             has to be saved as XML first.</p>\r\n\r\n          <label for=\"fb-place-file-note\">What changed? (optional)</label>\r\n          <input id=\"fb-place-file-note\" name=\"note\" type=\"text\" maxlength=\"160\"\r\n                 placeholder=\"e.g. Fixed the bridge and added a spawn\">\r\n\r\n          <button class=\"fb-btn fb-btn--primary\" type=\"submit\">Publish file</button>\r\n          <p id=\"fb-place-file-status\" class=\"fb-filebox__status\" role=\"status\" aria-live=\"polite\"></p>\r\n          <noscript><p class=\"fb-muted\">Publishing a file here needs JavaScript to read it in the\r\n            browser. The same file can be posted to <code>/places/")
    ; __append(escapeFn( place.id ))
    ; __append("/file</code> with\r\n            the filename in <code>X-FieldBrik-Filename</code>.</p></noscript>\r\n        </form>\r\n\r\n        ")
    ;  if (fileHistory && fileHistory.length > 1) { 
    ; __append("\r\n          <table class=\"fb-table\">\r\n            <thead><tr><th scope=\"col\">Version</th><th scope=\"col\">File</th><th scope=\"col\">Published</th></tr></thead>\r\n            <tbody>\r\n              ")
    ;  fileHistory.forEach(function (file) { 
    ; __append("\r\n                <tr>\r\n                  <td>v")
    ; __append(escapeFn( file.version ))
    ; __append("</td>\r\n                  <td>")
    ; __append(escapeFn( file.filename ))
    ;  if (file.note) { 
    ; __append(" <span class=\"fb-muted\">&mdash; ")
    ; __append(escapeFn( file.note ))
    ; __append("</span>")
    ;  } 
    ; __append("</td>\r\n                  <td>")
    ; __append(escapeFn( file.created ))
    ; __append("</td>\r\n                </tr>\r\n              ")
    ;  }); 
    ; __append("\r\n            </tbody>\r\n          </table>\r\n        ")
    ;  } 
    ; __append("\r\n      </div>\r\n      <p class=\"fb-panel__strip\">Publishing keeps every earlier version. The newest version is what\r\n        the place's download link serves; a published draft's file is only visible to you until you\r\n        publish the place itself.</p>\r\n    </section>\r\n\r\n    <section class=\"fb-panel\" id=\"fb-place-thumbnail-panel\">\r\n      <h2 class=\"fb-panel__title\">Thumbnail</h2>\r\n      <div class=\"fb-panel__body\">\r\n        <p class=\"fb-muted\">The picture on this place's page and on every tile that links to it.\r\n           It is cropped to 320&times;200, so the middle of the picture is what shows.</p>\r\n\r\n        <div id=\"fb-place-thumb-preview\" class=\"fb-thumbpreview\">\r\n          ")
    ;  if (place.thumbnailUrl) { 
    ; __append("\r\n            <img class=\"fb-thumbpreview__img\" src=\"")
    ; __append(escapeFn( place.thumbnailUrl ))
    ; __append("\" alt=\"Current thumbnail\">\r\n          ")
    ;  } else { 
    ; __append("\r\n            <p class=\"fb-muted\">No thumbnail yet. Until there is one, the tiles keep their colour swatch.</p>\r\n          ")
    ;  } 
    ; __append("\r\n        </div>\r\n\r\n        <form id=\"fb-place-thumbnail\" class=\"fb-form\" method=\"post\"\r\n              action=\"/places/")
    ; __append(escapeFn( place.id ))
    ; __append("/thumbnail\"\r\n              data-redirect=\"/places/")
    ; __append(escapeFn( place.id ))
    ; __append("/edit?done=thumbnail\"\r\n              data-max-bytes=\"262144\">\r\n          <label for=\"fb-place-thumbnail-input\">Choose a PNG or JPEG</label>\r\n          <input id=\"fb-place-thumbnail-input\" name=\"thumbnail\" type=\"file\"\r\n                 accept=\"image/png,image/jpeg\">\r\n          <button class=\"fb-btn fb-btn--primary\" type=\"submit\">Save thumbnail</button>\r\n          <p id=\"fb-place-thumbnail-status\" class=\"fb-filebox__status\" role=\"status\" aria-live=\"polite\"></p>\r\n          <noscript><p class=\"fb-muted\">Saving a thumbnail here needs JavaScript, so the picture can be\r\n            cropped in the browser. A PNG or JPEG can also be posted to\r\n            <code>/places/")
    ; __append(escapeFn( place.id ))
    ; __append("/thumbnail</code> as JSON\r\n            <code>{ \"content\": \"&lt;base64&gt;\" }</code>.</p></noscript>\r\n        </form>\r\n      </div>\r\n      <p class=\"fb-panel__strip\">The picture is cropped and shrunk in the browser before it is sent, so\r\n        the stored image is a few tens of KB and the place page stays quick to open. Replacing it changes\r\n        the address on every tile, so nobody keeps seeing an old one.</p>\r\n    </section>\r\n\r\n    <section class=\"fb-panel\">\r\n      <h2 class=\"fb-panel__title\">Visibility</h2>\r\n      <div class=\"fb-panel__body\">\r\n        <p>\r\n          This place is <strong>")
    ; __append(escapeFn( place.published ? 'published' : 'a draft' ))
    ; __append("</strong>.\r\n          ")
    ;  if (place.published) { 
    ; __append("\r\n            Anybody can open <a href=\"/games/")
    ; __append(escapeFn( place.slug ))
    ; __append("\">/games/")
    ; __append(escapeFn( place.slug ))
    ; __append("</a> and it is listed on the Home page.\r\n          ")
    ;  } else { 
    ; __append("\r\n            Only you can open it. Publishing lists it on the Home page.\r\n          ")
    ;  } 
    ; __append("\r\n        </p>\r\n        <form method=\"post\" action=\"/places/")
    ; __append(escapeFn( place.id ))
    ; __append("/status\">\r\n          <input type=\"hidden\" name=\"published\" value=\"")
    ; __append(escapeFn( place.published ? '0' : '1' ))
    ; __append("\">\r\n          <button class=\"fb-btn")
    ; __append(escapeFn( place.published ? '' : ' fb-btn--primary' ))
    ; __append("\" type=\"submit\">\r\n            ")
    ; __append(escapeFn( place.published ? 'Unpublish' : 'Publish' ))
    ; __append("\r\n          </button>\r\n        </form>\r\n      </div>\r\n    </section>\r\n  ")
    ;  } 
    ; __append("\r\n\r\n  <div class=\"fb-notice\">\r\n    <p><strong>A place is a listing plus its published file.</strong></p>\r\n    <p>Studio writes a .fbrx place, and this page stores it as an exact version. The site can\r\n       store and serve the file today; playing it still needs the FieldBrik client, so there is no\r\n       Play button yet. The download link always serves the newest version.</p>\r\n  </div>\r\n\r\n  <p class=\"fb-panel__more\"><a href=\"/places/mine\">My places</a> &middot; <a href=\"/home\">All places</a></p>\r\n</main>\r\n\r\n<script src=\"/js/place-file.js\" defer></script>\r\n<script src=\"/js/place-thumbnail.js\" defer></script>\r\n")
    ; __append( include('../partials/footer') )
    ; __append("\r\n</body>\r\n</html>\r\n")
  return __output;

},
  "pages/places-mine": function anonymous(locals, escapeFn, include, rethrow
) {
var Draft = locals.Draft, Publish = locals.Publish, Published = locals.Published, Unpublish = locals.Unpublish, created = locals.created, description = locals.description, footer = locals.footer, forEach = locals.forEach, head = locals.head, header = locals.header, id = locals.id, length = locals.length, name = locals.name, notice = locals.notice, pageTitle = locals.pageTitle, partials = locals.partials, place = locals.place, places = locals.places, published = locals.published, slice = locals.slice, slug = locals.slug, updated = locals.updated;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append( include('../partials/head', { pageTitle: pageTitle }) )
    ; __append("\r\n")
    ; __append( include('../partials/header') )
    ; __append("\r\n\r\n<main class=\"fb-container fb-main\">\r\n  ")
    ;  if (notice) { 
    ; __append("\r\n    <div class=\"fb-notice\"><p><strong>")
    ; __append(escapeFn( notice ))
    ; __append("</strong></p></div>\r\n  ")
    ;  } 
    ; __append("\r\n\r\n  <div class=\"fb-title-row\">\r\n    <h1 class=\"fb-title\">My Places</h1>\r\n    <span class=\"fb-pagecount\">")
    ; __append(escapeFn( published ))
    ; __append(" of ")
    ; __append(escapeFn( places.length ))
    ; __append(" published</span>\r\n  </div>\r\n\r\n  <table class=\"fb-table\">\r\n    <thead>\r\n      <tr>\r\n        <th scope=\"col\">Place</th>\r\n        <th scope=\"col\">Built</th>\r\n        <th scope=\"col\">Updated</th>\r\n        <th scope=\"col\">Status</th>\r\n        <th scope=\"col\">Manage</th>\r\n      </tr>\r\n    </thead>\r\n    <tbody>\r\n      ")
    ;  if (places.length === 0) { 
    ; __append("\r\n        <tr>\r\n          <td colspan=\"5\" class=\"fb-table__last\">You have not made a place yet.</td>\r\n        </tr>\r\n      ")
    ;  } 
    ; __append("\r\n      ")
    ;  places.forEach(function (place) { 
    ; __append("\r\n        <tr>\r\n          <td>\r\n            <strong><a href=\"/games/")
    ; __append(escapeFn( place.slug ))
    ; __append("\">")
    ; __append(escapeFn( place.name ))
    ; __append("</a></strong>\r\n            ")
    ;  if (place.description) { 
    ; __append("<br><span class=\"fb-muted\">")
    ; __append(escapeFn( place.description.slice(0, 80) ))
    ;  if (place.description.length > 80) { 
    ; __append("&hellip;")
    ;  } 
    ; __append("</span>")
    ;  } 
    ; __append("\r\n          </td>\r\n          <td>")
    ; __append(escapeFn( place.created ))
    ; __append("</td>\r\n          <td>")
    ; __append(escapeFn( place.updated ))
    ; __append("</td>\r\n          <td>")
    ; __append(escapeFn( place.published ? 'Published' : 'Draft' ))
    ; __append("</td>\r\n          <td>\r\n            <a class=\"fb-btn\" href=\"/places/")
    ; __append(escapeFn( place.id ))
    ; __append("/edit\">Edit</a>\r\n            <form method=\"post\" action=\"/places/")
    ; __append(escapeFn( place.id ))
    ; __append("/status\">\r\n              <input type=\"hidden\" name=\"published\" value=\"")
    ; __append(escapeFn( place.published ? '0' : '1' ))
    ; __append("\">\r\n              <button class=\"fb-btn\" type=\"submit\">")
    ; __append(escapeFn( place.published ? 'Unpublish' : 'Publish' ))
    ; __append("</button>\r\n            </form>\r\n          </td>\r\n        </tr>\r\n      ")
    ;  }); 
    ; __append("\r\n    </tbody>\r\n  </table>\r\n\r\n  <p class=\"fb-panel__more\"><a class=\"fb-btn fb-btn--primary\" href=\"/places/new\">Create a place</a></p>\r\n\r\n  <div class=\"fb-notice\">\r\n    <p><strong>Drafts are private.</strong></p>\r\n    <p>An unpublished place is not in the Games list and only you can open its page. Publishing is\r\n       reversible: unpublish it and it leaves the list without losing the page, the description or\r\n       its address.</p>\r\n  </div>\r\n</main>\r\n\r\n")
    ; __append( include('../partials/footer') )
    ; __append("\r\n</body>\r\n</html>\r\n")
  return __output;

},
  "pages/privacy": function anonymous(locals, escapeFn, include, rethrow
) {
var bodyClass = locals.bodyClass, fb = locals.fb, footer = locals.footer, head = locals.head, header = locals.header, page = locals.page, pageTitle = locals.pageTitle, partials = locals.partials, privacy = locals.privacy;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append("\r\n")
    ; __append( include('../partials/head', { pageTitle: pageTitle, bodyClass: 'fb-privacy-page' }) )
    ; __append("\r\n<link rel=\"stylesheet\" href=\"/css/legal2009.css?v=1\">\r\n")
    ; __append( include('../partials/header') )
    ; __append("\r\n\r\n<main class=\"fb-legal2009\">\r\n  <div class=\"fb-container\">\r\n    <h1 class=\"fb-legal2009__title\">FieldBrik Privacy Policy</h1>\r\n    <p class=\"fb-legal2009__note\">\r\n      Draft, pending legal review. This describes what FieldBrik collects and why, in the terms the\r\n      site is actually built to. Last edited 7 November 2026.\r\n    </p>\r\n\r\n    <h2 class=\"fb-legal2009__head\">About FieldBrik</h2>\r\n    <p>FieldBrik is an online social building site. FieldBrik works like this:</p>\r\n    <ul class=\"fb-legal2009__list\">\r\n      <li>a user creates a character, which is their identity on FieldBrik: a name, a description and\r\n        an avatar they colour themselves</li>\r\n      <li>users interact through place pages, personal messaging kept on this site, the forum, friends\r\n        lists and catalogs; there is no chat inside a game yet, because the client that would play a\r\n        place does not exist</li>\r\n      <li>users build places out of parts and publish them; a published place has its own page and\r\n        appears in Games</li>\r\n      <li>users search games, read the catalog and look at other members' pages, and a signed-out\r\n        visitor can do all of that without an account</li>\r\n      <li>users earn Tickets by taking part and may hold Bucks; both are recorded as ledger entries on\r\n        the account</li>\r\n      <li>users buy catalog items with either currency, and the item is added to their inventory</li>\r\n      <li>nothing on FieldBrik is paid for: there is no checkout, and no card or bank details are\r\n        collected anywhere on the site</li>\r\n    </ul>\r\n\r\n    <h2 class=\"fb-legal2009__head\">Requested Information</h2>\r\n    <p>\r\n      Visitors may browse as guests. A guest can read places, the catalog, the forum, news and members'\r\n      pages, and stays anonymous while doing it: no name, no address, no message and no place of their\r\n      own.\r\n    </p>\r\n    <p>\r\n      An account is needed to save anything, publish a place, send a message or take part in the\r\n      economy. Creating one asks for three things: a username, an email address and a password. The\r\n      password is stored only as a one-way hash, so it cannot be read back by staff or by anybody who\r\n      copies the database.\r\n    </p>\r\n    <p>\r\n      The username is public: it is shown on a member's page, on the places and catalog items they\r\n      made, and on the messages they send. The email address is never shown to other members. A name\r\n      that would look like FieldBrik staff, or that is abusive, is refused by the server at sign-up,\r\n      however the form is sent.\r\n    </p>\r\n    <p>\r\n      Signing in is recorded: the time of the attempt, whether it worked, and the network address it\r\n      came from. That record is what lets a session be ended and misuse investigated. Sessions are\r\n      held in a cookie, described below.\r\n    </p>\r\n\r\n    <h2 class=\"fb-legal2009__head\">What Is Not Collected</h2>\r\n    <p>\r\n      No payment details, no advertising or tracking network, no location, no contact list and no\r\n      device data. There is no third-party analytics script on any page, and no profile of what a\r\n      member reads is built to sell.\r\n    </p>\r\n\r\n    <h2 class=\"fb-legal2009__head\">Why It Is Collected</h2>\r\n    <p>\r\n      To run the account, show the member's page, deliver messages, keep the economy honest and\r\n      enforce the <a href=\"/terms\">Terms of Service</a>. Moderation records exist so that a\r\n      restriction cannot be escaped by making a new account.\r\n    </p>\r\n\r\n    <h2 class=\"fb-legal2009__head\">Cookies</h2>\r\n    <p>\r\n      One cookie, and only one: the session cookie that keeps a member signed in. It is marked\r\n      HttpOnly, so a script on the page cannot read it, and it stops working when the member signs out\r\n      or the session ends.\r\n    </p>\r\n\r\n    <h2 class=\"fb-legal2009__head\">Who Can See What</h2>\r\n    <p>\r\n      A username, avatar, description, badges and published places are visible to anyone. An email\r\n      address is visible to nobody but the account it belongs to. Private messages are readable by the\r\n      sender and the recipient, and by staff only when a message is reported or a safety investigation\r\n      needs it. Reports are never shown to the member they are about.\r\n    </p>\r\n\r\n    <h2 class=\"fb-legal2009__head\">Moderation Records</h2>\r\n    <p>\r\n      A warning, a restriction or a ban is recorded with its reason, when it was issued, when it ends\r\n      and which staff member issued it. The account it applies to can see it. It is kept after the\r\n      restriction lifts, because a pattern of behaviour is what moderation acts on.\r\n    </p>\r\n\r\n    <h2 class=\"fb-legal2009__head\">How Long It Is Kept</h2>\r\n    <p>\r\n      Account data is kept while the account exists. When an account is closed, profile content is\r\n      removed and the identifying fields are cleared. Moderation and ledger records are retained in a\r\n      form that no longer identifies the member, because deleting them on request would let a ban or a\r\n      currency record be erased.\r\n    </p>\r\n\r\n    <h2 class=\"fb-legal2009__head\">Parents</h2>\r\n    <p>\r\n      The <a href=\"/parents\">Parents</a> page explains what an account involves, what is asked for at\r\n      sign-up, and how to ask for an account to be closed.\r\n    </p>\r\n\r\n    <h2 class=\"fb-legal2009__head\">Changes</h2>\r\n    <p>\r\n      When this policy changes, the date at the top of the page changes with it. A change that widens\r\n      what is collected will be announced on the site before it takes effect.\r\n    </p>\r\n\r\n    <h2 class=\"fb-legal2009__head\">Contact</h2>\r\n    <p>Privacy requests go through the <a href=\"/support\">support page</a>.</p>\r\n  </div>\r\n</main>\r\n\r\n")
    ; __append( include('../partials/footer') )
    ; __append("\r\n</body>\r\n</html>\r\n")
  return __output;

},
  "pages/profile": function anonymous(locals, escapeFn, include, rethrow
) {
var Last = locals.Last, Offline = locals.Offline, Online = locals.Online, art = locals.art, avatar = locals.avatar, badge = locals.badge, badges = locals.badges, blocked = locals.blocked, color = locals.color, created = locals.created, description = locals.description, domain = locals.domain, footer = locals.footer, forEach = locals.forEach, friend = locals.friend, friendAction = locals.friendAction, friends = locals.friends, games = locals.games, head = locals.head, header = locals.header, heldBadges = locals.heldBadges, id = locals.id, img = locals.img, incoming = locals.incoming, items = locals.items, joined = locals.joined, lastOnline = locals.lastOnline, length = locals.length, md = locals.md, name = locals.name, none = locals.none, notice = locals.notice, now = locals.now, online = locals.online, out = locals.out, outgoing = locals.outgoing, pageTitle = locals.pageTitle, partials = locals.partials, person = locals.person, place = locals.place, signed = locals.signed, site = locals.site, size = locals.size, slice = locals.slice, slug = locals.slug, sm = locals.sm, stats = locals.stats, thumb = locals.thumb, thumbUrl = locals.thumbUrl, thumbnailUrl = locals.thumbnailUrl, username = locals.username, viewer = locals.viewer;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append( include('../partials/head', { pageTitle: pageTitle }) )
    ; __append("\r\n")
    ; __append( include('../partials/header') )
    ; __append("\r\n\r\n<main class=\"fb-container fb-main\">\r\n  <p class=\"fb-crumbs\"><a href=\"/people\">People</a> &raquo; ")
    ; __append(escapeFn( person.username ))
    ; __append("</p>\r\n\r\n  ")
    ;  if (notice) { 
    ; __append("\r\n    <div class=\"fb-notice\">\r\n      <p><strong>")
    ; __append(escapeFn( notice ))
    ; __append("</strong></p>\r\n    </div>\r\n  ")
    ;  } 
    ; __append("\r\n\r\n  <div class=\"fb-cols\">\r\n\r\n    <aside class=\"fb-col-profile\">\r\n      <div class=\"fb-profile\">\r\n        ")
    ; __append( include('../partials/avatar', { avatar: person.avatar, size: 'md' }) )
    ; __append("\r\n        <h1 class=\"fb-profile__greeting\">")
    ; __append(escapeFn( person.username ))
    ; __append("</h1>\r\n        <p class=\"fb-profile__sub\">\r\n          ")
    ; __append(escapeFn( person.online ? 'Online now' : 'Last online ' + person.lastOnline.slice(0, 10) ))
    ; __append("\r\n        </p>\r\n        <p class=\"fb-profile__url\">")
    ; __append(escapeFn( site.domain ))
    ; __append("/user/")
    ; __append(escapeFn( person.id ))
    ; __append("</p>\r\n        <div class=\"fb-profile__foot\">\r\n          ")
    ;  if (friendAction === 'friends') { 
    ; __append("\r\n            <form method=\"post\" action=\"/friends/remove/")
    ; __append(escapeFn( person.username ))
    ; __append("\">\r\n              <button class=\"fb-btn\" type=\"submit\">Remove Friend</button>\r\n            </form>\r\n          ")
    ;  } else if (friendAction === 'incoming') { 
    ; __append("\r\n            <form method=\"post\" action=\"/friends/accept/")
    ; __append(escapeFn( person.username ))
    ; __append("\">\r\n              <button class=\"fb-btn fb-btn--primary\" type=\"submit\">Accept Request</button>\r\n            </form>\r\n            <form method=\"post\" action=\"/friends/decline/")
    ; __append(escapeFn( person.username ))
    ; __append("\">\r\n              <button class=\"fb-btn\" type=\"submit\">Decline</button>\r\n            </form>\r\n          ")
    ;  } else if (friendAction === 'outgoing') { 
    ; __append("\r\n            <form method=\"post\" action=\"/friends/cancel/")
    ; __append(escapeFn( person.username ))
    ; __append("\">\r\n              <button class=\"fb-btn\" type=\"submit\">Cancel Request</button>\r\n            </form>\r\n          ")
    ;  } else if (friendAction === 'blocked') { 
    ; __append("\r\n            <span class=\"fb-muted\">Blocked</span>\r\n          ")
    ;  } else if (friendAction === 'none') { 
    ; __append("\r\n            <form method=\"post\" action=\"/friends/request/")
    ; __append(escapeFn( person.username ))
    ; __append("\">\r\n              <button class=\"fb-btn fb-btn--primary\" type=\"submit\">Add Friend</button>\r\n            </form>\r\n          ")
    ;  } 
    ; __append("\r\n          ")
    ;  if (friendAction !== 'signed-out' && friendAction !== 'blocked' && person.username !== viewer.username) { 
    ; __append("\r\n            <a class=\"fb-btn\" href=\"/messages/compose?to=")
    ; __append(escapeFn( encodeURIComponent(person.username) ))
    ; __append("\">Send Message</a>\r\n            <a href=\"/reports/new?kind=member&amp;user=")
    ; __append(escapeFn( encodeURIComponent(person.username) ))
    ; __append("\">Report Abuse</a>\r\n          ")
    ;  } 
    ; __append("\r\n        </div>\r\n      </div>\r\n\r\n      <section class=\"fb-panel\">\r\n        <h2 class=\"fb-panel__title\">Badges</h2>\r\n        <div class=\"fb-panel__body\">\r\n          ")
    ;  if (heldBadges.length === 0) { 
    ; __append("\r\n            <p class=\"fb-muted\">No badges yet.</p>\r\n          ")
    ;  } else { 
    ; __append("\r\n            <ul class=\"fb-grid--badges\">\r\n              ")
    ;  heldBadges.forEach(function (badge) { 
    ; __append("\r\n                <li class=\"fb-badge\" title=\"")
    ; __append(escapeFn( badge.description ))
    ; __append("\">\r\n                  ")
    ;  if (badge.art) { 
    ; __append("\r\n                    <img class=\"fb-badge__art\" src=\"")
    ; __append(escapeFn( badge.art ))
    ; __append("\" alt=\"\" width=\"34\" height=\"34\">\r\n                  ")
    ;  } else { 
    ; __append("\r\n                    <span class=\"fb-badge__pip\" style=\"--badge: ")
    ; __append(escapeFn( badge.color ))
    ; __append(";\" aria-hidden=\"true\"></span>\r\n                  ")
    ;  } 
    ; __append("\r\n                  ")
    ; __append(escapeFn( badge.name ))
    ; __append("\r\n                </li>\r\n              ")
    ;  }); 
    ; __append("\r\n            </ul>\r\n          ")
    ;  } 
    ; __append("\r\n        </div>\r\n      </section>\r\n\r\n      <section class=\"fb-panel\">\r\n        <h2 class=\"fb-panel__title\">Statistics</h2>\r\n        <div class=\"fb-panel__body\">\r\n          <ul class=\"fb-statlines\">\r\n            <li>Joined: <strong>")
    ; __append(escapeFn( person.joined ))
    ; __append("</strong></li>\r\n            <li>Friends: <strong>")
    ; __append(escapeFn( person.stats.friends ))
    ; __append("</strong></li>\r\n            <li>Badges: <strong>")
    ; __append(escapeFn( person.stats.badges ))
    ; __append("</strong></li>\r\n            <li>Games created: <strong>")
    ; __append(escapeFn( person.stats.games ))
    ; __append("</strong></li>\r\n            <li>Items owned: <strong>")
    ; __append(escapeFn( person.stats.items ))
    ; __append("</strong></li>\r\n          </ul>\r\n        </div>\r\n      </section>\r\n    </aside>\r\n\r\n    <div class=\"fb-col-main\">\r\n      <section class=\"fb-panel\">\r\n        <h2 class=\"fb-panel__title\">Showcase</h2>\r\n        <div class=\"fb-panel__body fb-prose\">\r\n          <p>")
    ; __append(escapeFn( person.description ))
    ; __append("</p>\r\n        </div>\r\n        <p class=\"fb-panel__strip\">Visited 0 times</p>\r\n      </section>\r\n\r\n      <section class=\"fb-panel\">\r\n        <h2 class=\"fb-panel__title\">\r\n          <span class=\"fb-panel__title-row\">\r\n            <span>")
    ; __append(escapeFn( person.username ))
    ; __append("'s Friends</span>\r\n            <span class=\"fb-muted\">")
    ; __append(escapeFn( person.stats.friends ))
    ; __append(" total</span>\r\n          </span>\r\n        </h2>\r\n        <div class=\"fb-panel__body\">\r\n          <ul class=\"fb-grid--people\">\r\n            ")
    ;  friends.forEach(function (friend) { 
    ; __append("\r\n              <li class=\"fb-card-person\">\r\n                ")
    ; __append( include('../partials/avatar', { avatar: friend.avatar, size: 'sm' }) )
    ; __append("\r\n                <a class=\"fb-card-person__name\" href=\"/people/")
    ; __append(escapeFn( friend.username ))
    ; __append("\">")
    ; __append(escapeFn( friend.username ))
    ; __append("</a>\r\n                <span class=\"fb-card-person__status\">")
    ; __append(escapeFn( friend.online ? 'Online' : 'Offline' ))
    ; __append("</span>\r\n              </li>\r\n            ")
    ;  }); 
    ; __append("\r\n          </ul>\r\n        </div>\r\n      </section>\r\n\r\n      <section class=\"fb-panel\">\r\n        <h2 class=\"fb-panel__title\">")
    ; __append(escapeFn( person.username ))
    ; __append("'s Places</h2>\r\n        <div class=\"fb-panel__body\">\r\n          ")
    ;  if (created.length === 0) { 
    ; __append("\r\n            <p class=\"fb-muted\">No published places yet.</p>\r\n          ")
    ;  } else { 
    ; __append("\r\n            <ul class=\"fb-grid--games\">\r\n              ")
    ;  created.forEach(function (place) { 
    ; __append("\r\n                <li>\r\n                  <a class=\"fb-card-game__thumb\" href=\"/games/")
    ; __append(escapeFn( place.slug ))
    ; __append("\" style=\"--thumb: ")
    ; __append(escapeFn( place.thumb ))
    ; __append(";\" aria-hidden=\"true\" tabindex=\"-1\">")
    ; __append( include('../partials/thumb-img', { thumbUrl: place.thumbnailUrl }) )
    ; __append("</a>\r\n                  <a class=\"fb-card-game__title\" href=\"/games/")
    ; __append(escapeFn( place.slug ))
    ; __append("\">")
    ; __append(escapeFn( place.name ))
    ; __append("</a>\r\n                  <p class=\"fb-card-game__meta\">\r\n                    ")
    ;  if (place.created) { 
    ; __append("Built ")
    ; __append(escapeFn( place.created ))
    ;  } else { 
    ; __append("By ")
    ; __append(escapeFn( person.username ))
    ;  } 
    ; __append("\r\n                  </p>\r\n                </li>\r\n              ")
    ;  }); 
    ; __append("\r\n            </ul>\r\n          ")
    ;  } 
    ; __append("\r\n        </div>\r\n      </section>\r\n\r\n      <div class=\"fb-notice\">\r\n        <p><strong>Everything on this page is real.</strong></p>\r\n        <p>Badges, statistics and the friends listed here all come from the database, and those\r\n           friends are that member's real accepted friendships, and each place listed above is one\r\n           they published. Adding a friend sends a request\r\n           that only becomes a friendship when the other person accepts, and Send Message writes\r\n           a private message that lands in their inbox.</p>\r\n        <p>There is a Report Abuse link on every profile and on every message you receive. A report\r\n           goes into one moderation queue, is never shown to the member it is about, and is\r\n           answered by a member of staff rather than by an automatic ban.</p>\r\n      </div>\r\n    </div>\r\n\r\n  </div>\r\n</main>\r\n\r\n")
    ; __append( include('../partials/footer') )
    ; __append("\r\n</body>\r\n</html>\r\n")
  return __output;

},
  "pages/register": function anonymous(locals, escapeFn, include, rethrow
) {
var birthDay = locals.birthDay, birthMonth = locals.birthMonth, birthYear = locals.birthYear, bodyClass = locals.bodyClass, checked = locals.checked, day = locals.day, days = locals.days, error = locals.error, extraCss = locals.extraCss, female = locals.female, footer = locals.footer, forEach = locals.forEach, gender = locals.gender, head = locals.head, header = locals.header, index = locals.index, male = locals.male, months = locals.months, name = locals.name, pageTitle = locals.pageTitle, partials = locals.partials, selected = locals.selected, username = locals.username, values = locals.values, year = locals.year, years = locals.years;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append( include('../partials/head', { pageTitle: pageTitle, extraCss: extraCss, bodyClass: bodyClass }) )
    ; __append("\n")
    ; __append( include('../partials/header') )
    ; __append("\n\n<main class=\"fb-join\">\n  ")
    ; __append("\n  <svg class=\"fb-join__skyline\" viewBox=\"0 0 960 320\" preserveAspectRatio=\"xMidYMax slice\"\n       aria-hidden=\"true\" focusable=\"false\">\n    <g fill=\"#1a5c9a\">\n      <rect x=\"0\" y=\"168\" width=\"52\" height=\"152\"/>\n      <rect x=\"52\" y=\"204\" width=\"34\" height=\"116\"/>\n      <rect x=\"86\" y=\"152\" width=\"60\" height=\"168\"/>\n      <rect x=\"146\" y=\"186\" width=\"26\" height=\"134\"/>\n      <rect x=\"172\" y=\"162\" width=\"44\" height=\"158\"/>\n      <rect x=\"216\" y=\"210\" width=\"30\" height=\"110\"/>\n      <rect x=\"246\" y=\"176\" width=\"58\" height=\"144\"/>\n      <rect x=\"304\" y=\"198\" width=\"36\" height=\"122\"/>\n      <rect x=\"340\" y=\"156\" width=\"50\" height=\"164\"/>\n      <rect x=\"390\" y=\"188\" width=\"28\" height=\"132\"/>\n      <rect x=\"418\" y=\"170\" width=\"54\" height=\"150\"/>\n      <rect x=\"472\" y=\"206\" width=\"32\" height=\"114\"/>\n      <rect x=\"504\" y=\"160\" width=\"46\" height=\"160\"/>\n      <rect x=\"550\" y=\"190\" width=\"30\" height=\"130\"/>\n      <rect x=\"580\" y=\"178\" width=\"56\" height=\"142\"/>\n      <rect x=\"636\" y=\"200\" width=\"34\" height=\"120\"/>\n      <rect x=\"670\" y=\"150\" width=\"50\" height=\"170\"/>\n      <rect x=\"720\" y=\"184\" width=\"28\" height=\"136\"/>\n      <rect x=\"748\" y=\"172\" width=\"54\" height=\"148\"/>\n      <rect x=\"802\" y=\"204\" width=\"32\" height=\"116\"/>\n      <rect x=\"834\" y=\"158\" width=\"46\" height=\"162\"/>\n      <rect x=\"880\" y=\"192\" width=\"34\" height=\"128\"/>\n      <rect x=\"914\" y=\"166\" width=\"46\" height=\"154\"/>\n    </g>\n    <g fill=\"#093561\">\n      <rect x=\"0\" y=\"232\" width=\"40\" height=\"88\"/>\n      <rect x=\"40\" y=\"258\" width=\"52\" height=\"62\"/>\n      <rect x=\"92\" y=\"240\" width=\"34\" height=\"80\"/>\n      <rect x=\"126\" y=\"266\" width=\"48\" height=\"54\"/>\n      <rect x=\"174\" y=\"236\" width=\"30\" height=\"84\"/>\n      <rect x=\"204\" y=\"254\" width=\"44\" height=\"66\"/>\n      <rect x=\"248\" y=\"262\" width=\"36\" height=\"58\"/>\n      <rect x=\"284\" y=\"244\" width=\"52\" height=\"76\"/>\n      <rect x=\"336\" y=\"270\" width=\"30\" height=\"50\"/>\n      <rect x=\"366\" y=\"250\" width=\"46\" height=\"70\"/>\n      <rect x=\"412\" y=\"264\" width=\"38\" height=\"56\"/>\n      <rect x=\"450\" y=\"246\" width=\"32\" height=\"74\"/>\n      <rect x=\"482\" y=\"268\" width=\"50\" height=\"52\"/>\n      <rect x=\"532\" y=\"252\" width=\"34\" height=\"68\"/>\n      <rect x=\"566\" y=\"266\" width=\"42\" height=\"54\"/>\n      <rect x=\"608\" y=\"242\" width=\"30\" height=\"78\"/>\n      <rect x=\"638\" y=\"260\" width=\"48\" height=\"60\"/>\n      <rect x=\"686\" y=\"272\" width=\"36\" height=\"48\"/>\n      <rect x=\"722\" y=\"254\" width=\"44\" height=\"66\"/>\n      <rect x=\"766\" y=\"266\" width=\"30\" height=\"54\"/>\n      <rect x=\"796\" y=\"258\" width=\"50\" height=\"62\"/>\n      <rect x=\"846\" y=\"270\" width=\"34\" height=\"50\"/>\n      <rect x=\"880\" y=\"256\" width=\"44\" height=\"64\"/>\n      <rect x=\"924\" y=\"268\" width=\"36\" height=\"52\"/>\n    </g>\n  </svg>\n  <div class=\"fb-join__fog\" aria-hidden=\"true\"></div>\n\n  <div class=\"fb-join__inner\">\n    <div class=\"fb-join__lede\">\n      <h1 class=\"fb-join__title\">Join the builders</h1>\n      <p class=\"fb-join__sub\">and explore their creations</p>\n    </div>\n\n    <div class=\"fb-join__cols\">\n      <figure class=\"fb-join__showcase\">\n        <svg class=\"fb-join__scene\" viewBox=\"0 0 320 180\" role=\"img\"\n             aria-label=\"A small scene built from bricks\">\n          <defs>\n            <linearGradient id=\"fbSceneSky\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\">\n              <stop offset=\"0\" stop-color=\"#8ecbf2\"/>\n              <stop offset=\"1\" stop-color=\"#e9f6fe\"/>\n            </linearGradient>\n          </defs>\n          <rect width=\"320\" height=\"180\" fill=\"url(#fbSceneSky)\"/>\n          <path d=\"M0 112l44-26 38 16 42-24 40 22 36-18 40 20 38-16 42 22v12H0z\" fill=\"#6fae66\"/>\n          <rect y=\"120\" width=\"320\" height=\"60\" fill=\"#7cc63f\"/>\n          <rect y=\"120\" width=\"320\" height=\"6\" fill=\"#8fd955\"/>\n          <rect x=\"40\" y=\"118\" width=\"76\" height=\"30\" fill=\"#79bf3c\"/>\n          <rect x=\"40\" y=\"118\" width=\"76\" height=\"6\" fill=\"#a3dd6a\"/>\n          <rect x=\"126\" y=\"132\" width=\"54\" height=\"22\" fill=\"#e8a52c\"/>\n          <rect x=\"126\" y=\"132\" width=\"54\" height=\"5\" fill=\"#f7c25c\"/>\n          <rect x=\"196\" y=\"112\" width=\"84\" height=\"38\" fill=\"#4f8fd6\"/>\n          <rect x=\"196\" y=\"112\" width=\"84\" height=\"6\" fill=\"#7cb0ea\"/>\n          <rect x=\"214\" y=\"82\" width=\"18\" height=\"30\" fill=\"#c0392b\"/>\n          <rect x=\"214\" y=\"82\" width=\"18\" height=\"5\" fill=\"#e05a4a\"/>\n          <rect x=\"238\" y=\"88\" width=\"18\" height=\"24\" fill=\"#c0392b\"/>\n          <rect x=\"238\" y=\"88\" width=\"18\" height=\"4\" fill=\"#e05a4a\"/>\n        </svg>\n        <figcaption>What will you build?</figcaption>\n      </figure>\n\n      <form class=\"fb-join__panel\" method=\"post\" action=\"/register\">\n        <p class=\"fb-join__tabs\">\n          <span class=\"fb-join__tab is-active\">Sign up</span>\n          <span class=\"fb-join__tab-sep\">|</span>\n          <a class=\"fb-join__tab\" href=\"/login\">Login</a>\n        </p>\n\n        ")
    ;  if (error) { 
    ; __append("\n          <p class=\"fb-join__error\">")
    ; __append(escapeFn( error ))
    ; __append("</p>\n        ")
    ;  } 
    ; __append("\n\n        <label class=\"fb-join__label\" for=\"birth-month\">Birthday</label>\n        <div class=\"fb-join__birthday\">\n          <select id=\"birth-month\" name=\"birth-month\" required>\n            <option value=\"\">Month</option>\n            ")
    ;  months.forEach(function (name, index) { 
    ; __append("\n              <option value=\"")
    ; __append(escapeFn( index + 1 ))
    ; __append("\"")
    ; __append(escapeFn( values && String(values.birthMonth) === String(index + 1) ? ' selected' : '' ))
    ; __append(">")
    ; __append(escapeFn( name ))
    ; __append("</option>\n            ")
    ;  }); 
    ; __append("\n          </select>\n          <select id=\"birth-day\" name=\"birth-day\" required aria-label=\"Day\">\n            <option value=\"\">Day</option>\n            ")
    ;  days.forEach(function (day) { 
    ; __append("\n              <option value=\"")
    ; __append(escapeFn( day ))
    ; __append("\"")
    ; __append(escapeFn( values && String(values.birthDay) === String(day) ? ' selected' : '' ))
    ; __append(">")
    ; __append(escapeFn( day ))
    ; __append("</option>\n            ")
    ;  }); 
    ; __append("\n          </select>\n          <select id=\"birth-year\" name=\"birth-year\" required aria-label=\"Year\">\n            <option value=\"\">Year</option>\n            ")
    ;  years.forEach(function (year) { 
    ; __append("\n              <option value=\"")
    ; __append(escapeFn( year ))
    ; __append("\"")
    ; __append(escapeFn( values && String(values.birthYear) === String(year) ? ' selected' : '' ))
    ; __append(">")
    ; __append(escapeFn( year ))
    ; __append("</option>\n            ")
    ;  }); 
    ; __append("\n          </select>\n        </div>\n        <p class=\"fb-join__hint\">Enter your birthday for a personalised experience.<br>It will not be given to any third party.</p>\n\n        <span class=\"fb-join__label\">Gender</span>\n        <div class=\"fb-join__genders\">\n          <label><input type=\"radio\" name=\"gender\" value=\"male\" required")
    ; __append(escapeFn( values && values.gender === 'male' ? ' checked' : '' ))
    ; __append("> Male</label>\n          <label><input type=\"radio\" name=\"gender\" value=\"female\"")
    ; __append(escapeFn( values && values.gender === 'female' ? ' checked' : '' ))
    ; __append("> Female</label>\n        </div>\n\n        <label class=\"fb-join__label\" for=\"signup-username\">Username</label>\n        <input id=\"signup-username\" name=\"username\" type=\"text\" maxlength=\"20\"\n               autocomplete=\"username\" required\n               value=\"")
    ; __append(escapeFn( values ? values.username : '' ))
    ; __append("\">\n        <p class=\"fb-join__hint\">3 to 20 letters, numbers and underscores. No spaces.</p>\n\n        <label class=\"fb-join__label\" for=\"signup-password\">Password</label>\n        <input id=\"signup-password\" name=\"password\" type=\"password\" minlength=\"8\"\n               maxlength=\"72\" autocomplete=\"new-password\" required>\n        <p class=\"fb-join__hint\">8 characters or more. Longer is better than complicated.</p>\n\n        <label class=\"fb-join__label\" for=\"signup-confirm\">Confirm Password</label>\n        <input id=\"signup-confirm\" name=\"confirm\" type=\"password\" minlength=\"8\"\n               maxlength=\"72\" autocomplete=\"new-password\" required>\n\n        <button class=\"fb-join__submit\" type=\"submit\">Sign Up</button>\n\n        <p class=\"fb-join__fineprint\">By creating an account you agree to the\n          <a href=\"/terms\">Terms of Service</a> and the <a href=\"/privacy\">Privacy Policy</a>.</p>\n      </form>\n    </div>\n  </div>\n</main>\n\n")
    ; __append( include('../partials/footer') )
    ; __append("\n</body>\n</html>\n")
  return __output;

},
  "pages/report-new": function anonymous(locals, escapeFn, include, rethrow
) {
var failure = locals.failure, footer = locals.footer, forEach = locals.forEach, head = locals.head, header = locals.header, id = locals.id, key = locals.key, kind = locals.kind, kindLabel = locals.kindLabel, label = locals.label, message = locals.message, pageTitle = locals.pageTitle, partials = locals.partials, reason = locals.reason, reasons = locals.reasons, subject = locals.subject, target = locals.target, username = locals.username;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append( include('../partials/head', { pageTitle: pageTitle }) )
    ; __append("\r\n")
    ; __append( include('../partials/header') )
    ; __append("\r\n\r\n<main class=\"fb-container fb-main\">\r\n  <p class=\"fb-crumbs\"><a href=\"/reports/mine\">My Reports</a> &raquo; New report</p>\r\n\r\n  ")
    ;  if (failure) { 
    ; __append("\r\n    <div class=\"fb-notice\"><p><strong>")
    ; __append(escapeFn( failure ))
    ; __append("</strong></p></div>\r\n  ")
    ;  } 
    ; __append("\r\n\r\n  <div class=\"fb-title-row\">\r\n    <h1 class=\"fb-title\">Report ")
    ; __append(escapeFn( target.username ))
    ; __append("</h1>\r\n  </div>\r\n\r\n  <section class=\"fb-panel\">\r\n    <h2 class=\"fb-panel__title\">What is being reported</h2>\r\n    <div class=\"fb-panel__body\">\r\n      <table class=\"fb-table fb-table--kv\">\r\n        <tbody>\r\n          <tr><th scope=\"row\">Member</th><td><a href=\"/people/")
    ; __append(escapeFn( encodeURIComponent(target.username) ))
    ; __append("\">")
    ; __append(escapeFn( target.username ))
    ; __append("</a></td></tr>\r\n          <tr><th scope=\"row\">About</th><td>")
    ; __append(escapeFn( kindLabel ))
    ; __append("</td></tr>\r\n          ")
    ;  if (message) { 
    ; __append("\r\n            <tr><th scope=\"row\">Message</th><td>&ldquo;")
    ; __append(escapeFn( message.subject ))
    ; __append("&rdquo;</td></tr>\r\n          ")
    ;  } 
    ; __append("\r\n        </tbody>\r\n      </table>\r\n    </div>\r\n    <p class=\"fb-panel__strip\">\r\n      A report is read by FieldBrik staff. It is not shown to ")
    ; __append(escapeFn( target.username ))
    ; __append(".\r\n    </p>\r\n  </section>\r\n\r\n  <section class=\"fb-panel\">\r\n    <h2 class=\"fb-panel__title\">Reason</h2>\r\n    <div class=\"fb-panel__body\">\r\n      <form class=\"fb-form\" method=\"post\" action=\"/reports\">\r\n        <input type=\"hidden\" name=\"kind\" value=\"")
    ; __append(escapeFn( kind ))
    ; __append("\">\r\n        <input type=\"hidden\" name=\"target_user_id\" value=\"")
    ; __append(escapeFn( target.id ))
    ; __append("\">\r\n        <input type=\"hidden\" name=\"target_username\" value=\"")
    ; __append(escapeFn( target.username ))
    ; __append("\">\r\n        ")
    ;  if (message) { 
    ; __append("\r\n          <input type=\"hidden\" name=\"message_id\" value=\"")
    ; __append(escapeFn( message.id ))
    ; __append("\">\r\n        ")
    ;  } 
    ; __append("\r\n\r\n        <label for=\"fb-report-reason\">Why are you reporting this?</label>\r\n        <select id=\"fb-report-reason\" name=\"reason\" required>\r\n          ")
    ;  reasons.forEach(function (reason) { 
    ; __append("\r\n            <option value=\"")
    ; __append(escapeFn( reason.key ))
    ; __append("\">")
    ; __append(escapeFn( reason.label ))
    ; __append("</option>\r\n          ")
    ;  }); 
    ; __append("\r\n        </select>\r\n\r\n        <label for=\"fb-report-detail\">What happened? (optional, but it helps)</label>\r\n        <textarea id=\"fb-report-detail\" name=\"detail\" rows=\"5\" maxlength=\"2000\"></textarea>\r\n\r\n        <button class=\"fb-btn fb-btn--primary\" type=\"submit\">Send report</button>\r\n      </form>\r\n    </div>\r\n  </section>\r\n\r\n  <div class=\"fb-notice\">\r\n    <p><strong>One open report at a time.</strong></p>\r\n    <p>While a report about this is open, a second one is refused. If the situation gets\r\n       worse, reply to the message or <a href=\"/support\">contact support</a> and say so.</p>\r\n  </div>\r\n\r\n  <p class=\"fb-panel__more\"><a href=\"/reports/mine\">My reports</a></p>\r\n</main>\r\n\r\n")
    ; __append( include('../partials/footer') )
    ; __append("\r\n</body>\r\n</html>\r\n")
  return __output;

},
  "pages/reports-mine": function anonymous(locals, escapeFn, include, rethrow
) {
var created = locals.created, entries = locals.entries, entry = locals.entry, footer = locals.footer, forEach = locals.forEach, handled = locals.handled, head = locals.head, header = locals.header, kindLabel = locals.kindLabel, length = locals.length, notice = locals.notice, open = locals.open, pageTitle = locals.pageTitle, partials = locals.partials, reasonLabel = locals.reasonLabel, status = locals.status, target = locals.target;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append( include('../partials/head', { pageTitle: pageTitle }) )
    ; __append("\r\n")
    ; __append( include('../partials/header') )
    ; __append("\r\n\r\n<main class=\"fb-container fb-main\">\r\n  ")
    ;  if (notice) { 
    ; __append("\r\n    <div class=\"fb-notice\"><p><strong>")
    ; __append(escapeFn( notice ))
    ; __append("</strong></p></div>\r\n  ")
    ;  } 
    ; __append("\r\n\r\n  <div class=\"fb-title-row\">\r\n    <h1 class=\"fb-title\">My Reports</h1>\r\n    <span class=\"fb-pagecount\">")
    ; __append(escapeFn( open ))
    ; __append(" open</span>\r\n  </div>\r\n\r\n  <table class=\"fb-table\">\r\n    <thead>\r\n      <tr>\r\n        <th scope=\"col\">Member</th>\r\n        <th scope=\"col\">About</th>\r\n        <th scope=\"col\">Reason</th>\r\n        <th scope=\"col\">Sent</th>\r\n        <th scope=\"col\">Status</th>\r\n      </tr>\r\n    </thead>\r\n    <tbody>\r\n      ")
    ;  if (entries.length === 0) { 
    ; __append("\r\n        <tr>\r\n          <td colspan=\"5\" class=\"fb-table__last\">\r\n            You have not reported anybody. The report link is on a member's profile and on a message.\r\n          </td>\r\n        </tr>\r\n      ")
    ;  } 
    ; __append("\r\n      ")
    ;  entries.forEach(function (entry) { 
    ; __append("\r\n        <tr>\r\n          <td><a class=\"fb-table__name\" href=\"/people/")
    ; __append(escapeFn( encodeURIComponent(entry.target) ))
    ; __append("\">")
    ; __append(escapeFn( entry.target ))
    ; __append("</a></td>\r\n          <td>")
    ; __append(escapeFn( entry.kindLabel ))
    ; __append("</td>\r\n          <td>")
    ; __append(escapeFn( entry.reasonLabel ))
    ; __append("</td>\r\n          <td>")
    ; __append(escapeFn( entry.created ))
    ; __append("</td>\r\n          <td class=\"fb-table__last\">\r\n            ")
    ;  if (entry.status === 'open') { 
    ; __append("Open\r\n            ")
    ;  } else if (entry.status === 'handled') { 
    ; __append("Handled\r\n            ")
    ;  } else { 
    ; __append("Closed, no action")
    ;  } 
    ; __append("\r\n          </td>\r\n        </tr>\r\n      ")
    ;  }); 
    ; __append("\r\n    </tbody>\r\n  </table>\r\n\r\n  <div class=\"fb-notice\">\r\n    <p><strong>A report is not a ban.</strong></p>\r\n    <p>It puts the member in front of a moderator, who decides whether anything should happen.\r\n       You are not told what was decided, and the member is not told who reported them.</p>\r\n  </div>\r\n\r\n  <p class=\"fb-panel__more\"><a href=\"/people\">Find a member</a></p>\r\n</main>\r\n\r\n")
    ; __append( include('../partials/footer') )
    ; __append("\r\n</body>\r\n</html>\r\n")
  return __output;

},
  "pages/settings": function anonymous(locals, escapeFn, include, rethrow
) {
var disabled = locals.disabled, error = locals.error, footer = locals.footer, head = locals.head, header = locals.header, notice = locals.notice, otherSessions = locals.otherSessions, pageTitle = locals.pageTitle, partials = locals.partials, session = locals.session, sessions = locals.sessions, viewerName = locals.viewerName;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append( include('../partials/head', { pageTitle: pageTitle }) )
    ; __append("\r\n")
    ; __append( include('../partials/header') )
    ; __append("\r\n\r\n<main class=\"fb-container fb-main\">\r\n  <div class=\"fb-title-row\">\r\n    <h1 class=\"fb-title\">Account Settings</h1>\r\n    <span class=\"fb-pagecount\">")
    ; __append(escapeFn( viewerName ))
    ; __append("</span>\r\n  </div>\r\n\r\n  ")
    ;  if (notice) { 
    ; __append("\r\n    <div class=\"fb-notice\">\r\n      <p><strong>")
    ; __append(escapeFn( notice ))
    ; __append("</strong></p>\r\n    </div>\r\n  ")
    ;  } 
    ; __append("\r\n\r\n  ")
    ;  if (error) { 
    ; __append("\r\n    <div class=\"fb-notice\">\r\n      <p><strong>That did not work.</strong></p>\r\n      <p>")
    ; __append(escapeFn( error ))
    ; __append("</p>\r\n    </div>\r\n  ")
    ;  } 
    ; __append("\r\n\r\n  <section class=\"fb-panel\">\r\n    <h2 class=\"fb-panel__title\">Change Password</h2>\r\n    <div class=\"fb-panel__body\">\r\n      <form class=\"fb-auth\" method=\"post\" action=\"/settings/password\">\r\n        <div class=\"fb-auth__row\">\r\n          <label for=\"pw-current\">Current password</label>\r\n          <input id=\"pw-current\" name=\"current\" type=\"password\" autocomplete=\"current-password\" required>\r\n        </div>\r\n        <div class=\"fb-auth__row\">\r\n          <label for=\"pw-new\">New password</label>\r\n          <input id=\"pw-new\" name=\"password\" type=\"password\" autocomplete=\"new-password\" minlength=\"8\" required>\r\n        </div>\r\n        <div class=\"fb-auth__row\">\r\n          <label for=\"pw-confirm\">Confirm new password</label>\r\n          <input id=\"pw-confirm\" name=\"confirm\" type=\"password\" autocomplete=\"new-password\" minlength=\"8\" required>\r\n        </div>\r\n        <div class=\"fb-auth__actions\">\r\n          <button class=\"fb-btn fb-btn--primary\" type=\"submit\">Change Password</button>\r\n        </div>\r\n      </form>\r\n      <p class=\"fb-muted\">Changing your password signs out every other device. This one stays signed in.</p>\r\n    </div>\r\n  </section>\r\n\r\n  <section class=\"fb-panel\">\r\n    <h2 class=\"fb-panel__title\">Sessions</h2>\r\n    <div class=\"fb-panel__body fb-panel__body--flush\">\r\n      <table class=\"fb-table fb-table--kv\">\r\n        <tbody>\r\n          <tr>\r\n            <th scope=\"row\">This device</th>\r\n            <td>Signed in. Signing out ends this session on the server, not just in the browser.</td>\r\n          </tr>\r\n          <tr>\r\n            <th scope=\"row\">Other sessions</th>\r\n            <td>\r\n              ")
    ; __append(escapeFn( otherSessions ))
    ; __append(" ")
    ; __append(escapeFn( otherSessions === 1 ? 'session' : 'sessions' ))
    ; __append("\r\n              <span class=\"fb-muted\">&mdash; a session lasts 14 days unless it is ended here.</span>\r\n            </td>\r\n          </tr>\r\n        </tbody>\r\n      </table>\r\n    </div>\r\n    <div class=\"fb-panel__body\">\r\n      <form method=\"post\" action=\"/settings/sessions\">\r\n        <button class=\"fb-btn\" type=\"submit\" ")
    ; __append(escapeFn( otherSessions === 0 ? 'disabled' : '' ))
    ; __append(">Sign Out Other Devices</button>\r\n      </form>\r\n    </div>\r\n  </section>\r\n\r\n  <section class=\"fb-panel\">\r\n    <h2 class=\"fb-panel__title\">Notifications</h2>\r\n    <div class=\"fb-panel__body\">\r\n      <ul class=\"fb-checks\">\r\n        <li><label><input type=\"checkbox\" checked disabled> New friend requests</label></li>\r\n        <li><label><input type=\"checkbox\" checked disabled> New private messages</label></li>\r\n        <li><label><input type=\"checkbox\" checked disabled> Warnings and moderation notices</label></li>\r\n        <li><label><input type=\"checkbox\" disabled> News and announcements</label></li>\r\n      </ul>\r\n      <p class=\"fb-muted\">These are fixed, not saved: there is no preferences table yet, so the boxes are read-only rather than pretending to remember a choice. Moderation notices are always on.</p>\r\n    </div>\r\n  </section>\r\n\r\n  <section class=\"fb-panel\">\r\n    <h2 class=\"fb-panel__title\">Close Account</h2>\r\n    <div class=\"fb-panel__body\">\r\n      <p>Closing your account marks it closed, ends every session and takes your name out of the member directory and every public page. Moderation and currency records are kept, because a ban or a balance cannot be erased on request.</p>\r\n      <p>This version has no way to reopen a closed account, so treat it as a one-way door.</p>\r\n      <form class=\"fb-auth\" method=\"post\" action=\"/settings/close\">\r\n        <div class=\"fb-auth__row\">\r\n          <label for=\"close-password\">Confirm your password</label>\r\n          <input id=\"close-password\" name=\"password\" type=\"password\" autocomplete=\"current-password\" required>\r\n        </div>\r\n        <div class=\"fb-auth__actions\">\r\n          <button class=\"fb-btn\" type=\"submit\">Close My Account</button>\r\n        </div>\r\n      </form>\r\n    </div>\r\n  </section>\r\n</main>\r\n\r\n")
    ; __append( include('../partials/footer') )
    ; __append("\r\n</body>\r\n</html>\r\n")
  return __output;

},
  "pages/share": function anonymous(locals, escapeFn, include, rethrow
) {
var bad = locals.bad, email = locals.email, footer = locals.footer, head = locals.head, header = locals.header, inviteLink = locals.inviteLink, message = locals.message, name = locals.name, ok = locals.ok, pageTitle = locals.pageTitle, partials = locals.partials, result = locals.result, site = locals.site, text = locals.text, values = locals.values;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append("\n")
    ; __append( include('../partials/head', { pageTitle: pageTitle }) )
    ; __append("\n")
    ; __append( include('../partials/header') )
    ; __append("\n\n<main class=\"fb-share2009\">\n  <div class=\"fb-container\">\n    <h1 class=\"fb-share2009__title\">Share ")
    ; __append(escapeFn( site.name ))
    ; __append(" with a Friend</h1>\n    <p class=\"fb-share2009__lede\">Fill out the form to share ")
    ; __append(escapeFn( site.name ))
    ; __append(" with a friend who's not already\n      a member of the site.</p>\n\n    ")
    ;  if (result) { 
    ; __append("\n      <p class=\"fb-share2009__result fb-share2009__result--")
    ; __append(escapeFn( result.ok ? 'ok' : 'bad' ))
    ; __append("\">")
    ; __append(escapeFn( result.text ))
    ; __append("</p>\n    ")
    ;  } 
    ; __append("\n\n    <form class=\"fb-share2009__form\" method=\"post\" action=\"/share\">\n      <div class=\"fb-share2009__row\">\n        <label class=\"fb-share2009__label\" for=\"share-name\">Your Name:</label>\n        <div class=\"fb-share2009__field\">\n          <input id=\"share-name\" name=\"name\" type=\"text\" maxlength=\"60\" value=\"")
    ; __append(escapeFn( values.name ))
    ; __append("\"\n            placeholder=\"Your ")
    ; __append(escapeFn( site.name ))
    ; __append(" name\">\n        </div>\n        <p class=\"fb-share2009__hint\">This will identify you to a friend who may not recognise your\n          ")
    ; __append(escapeFn( site.name ))
    ; __append(" account name.</p>\n      </div>\n\n      <div class=\"fb-share2009__row\">\n        <label class=\"fb-share2009__label\" for=\"share-email\">Email:</label>\n        <div class=\"fb-share2009__field\">\n          <input id=\"share-email\" name=\"email\" type=\"email\" maxlength=\"120\" value=\"")
    ; __append(escapeFn( values.email ))
    ; __append("\" required>\n        </div>\n        <p class=\"fb-share2009__hint\">")
    ; __append(escapeFn( site.name ))
    ; __append(" takes your privacy and the privacy of your friends\n          seriously. <a href=\"/privacy\">View our privacy policy.</a></p>\n      </div>\n\n      <div class=\"fb-share2009__row\">\n        <label class=\"fb-share2009__label\" for=\"share-message\">Message:</label>\n        <div class=\"fb-share2009__field\">\n          <textarea id=\"share-message\" name=\"message\" rows=\"9\" maxlength=\"1000\">")
    ; __append(escapeFn( values.message ))
    ; __append("</textarea>\n        </div>\n        <p class=\"fb-share2009__hint\">Feel free to include a note to your friend before sending. We'll include\n          some information and a link back to ")
    ; __append(escapeFn( site.name ))
    ; __append(".</p>\n      </div>\n\n      <div class=\"fb-share2009__send\">\n        <button class=\"fb-share2009__btn\" type=\"submit\">Send Invite</button>\n      </div>\n    </form>\n\n    <p class=\"fb-share2009__fine\">\n      Sending is not connected to a mail service in this build, so the button checks the form and then gives you\n      the link to pass on yourself. The address is not stored.\n      The invitation link is <strong>")
    ; __append(escapeFn( inviteLink ))
    ; __append("</strong>.\n    </p>\n  </div>\n</main>\n\n")
    ; __append( include('../partials/footer') )
    ; __append("\n</body>\n</html>\n")
  return __output;

},
  "pages/support": function anonymous(locals, escapeFn, include, rethrow
) {
var footer = locals.footer, head = locals.head, header = locals.header, pageTitle = locals.pageTitle, partials = locals.partials, site = locals.site, supportEmailPlaceholder = locals.supportEmailPlaceholder;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append( include('../partials/head', { pageTitle: pageTitle }) )
    ; __append("\r\n")
    ; __append( include('../partials/header') )
    ; __append("\r\n\r\n<main class=\"fb-container fb-main\">\r\n  <div class=\"fb-content\">\r\n    <h1 class=\"fb-title\">Support</h1>\r\n    <p class=\"fb-muted\">Account problems, reports and questions.</p>\r\n\r\n    <div class=\"fb-prose\">\r\n      <h2>Contact Us</h2>\r\n      <p>For account recovery, billing questions, moderation appeals or anything the <a href=\"/help\">Help</a> page does not answer, contact the support team.</p>\r\n\r\n      <div class=\"fb-notice\">\r\n        <p><strong>Contact address not yet active.</strong></p>\r\n        <p>The support inbox is being set up. The address that will receive support mail is <code>")
    ; __append(escapeFn( site.supportEmailPlaceholder ))
    ; __append("</code>. It is displayed here for layout purposes only and does not accept mail yet.</p>\r\n      </div>\r\n\r\n      <h2>What to include</h2>\r\n      <p>When you contact support, include your username, what you expected to happen, what happened instead, and the approximate time it occurred. If your report concerns another member, include their username and, where relevant, the message they sent.</p>\r\n\r\n      <h2>Before you write</h2>\r\n      <ul class=\"fb-list\">\r\n        <li>Problems signing in are usually solved by resetting your password rather than contacting support.</li>\r\n        <li>Reports about a member are handled by moderators, who can issue warnings and restrict accounts.</li>\r\n        <li>If you believe a ban was issued in error, include your account ID so it can be looked up.</li>\r\n        <li>Never send your password to anyone, including staff. No member of support will ask for it.</li>\r\n      </ul>\r\n    </div>\r\n  </div>\r\n</main>\r\n\r\n")
    ; __append( include('../partials/footer') )
    ; __append("\r\n</body>\r\n</html>\r\n")
  return __output;

},
  "pages/terms": function anonymous(locals, escapeFn, include, rethrow
) {
var footer = locals.footer, head = locals.head, header = locals.header, pageTitle = locals.pageTitle, partials = locals.partials;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append( include('../partials/head', { pageTitle: pageTitle }) )
    ; __append("\r\n")
    ; __append( include('../partials/header') )
    ; __append("\r\n\r\n<main class=\"fb-container fb-main\">\r\n  <div class=\"fb-content\">\r\n    <h1 class=\"fb-title fb-title--small\">Terms of Service</h1>\r\n\r\n    <div class=\"fb-notice\">\r\n      <p><strong>Draft, pending legal review.</strong></p>\r\n      <p>This page describes how FieldBrik actually works and what it expects of members. It is not yet a final legal agreement: the wording still needs review before the site takes real registrations or payments. Last edited 2 November 2026.</p>\r\n    </div>\r\n\r\n    <div class=\"fb-prose\">\r\n      <h2>1. What FieldBrik is</h2>\r\n      <p>FieldBrik is an online building and gaming community. Members create an account, build places, publish them, play each other's places, and talk to each other in the forum and by private message. The website and the client application are both part of the service.</p>\r\n\r\n      <h2>2. Your account</h2>\r\n      <p>You need an account to build, publish, post or message. You are responsible for what happens on your account, so keep your password to yourself. One account per person. Accounts are not transferable and cannot be sold.</p>\r\n      <p>If you are under the age of majority where you live, a parent or guardian must agree to these terms on your behalf. The <a href=\"/parents\">Parents</a> section explains what an account involves in plain language.</p>\r\n\r\n      <h2>3. Conduct</h2>\r\n      <p>FieldBrik is a place for building and playing. The following are not allowed:</p>\r\n      <ul class=\"fb-list\">\r\n        <li>Harassment, threats, hateful content, or targeting another member.</li>\r\n        <li>Sexual content, or content that is inappropriate for a site used by children.</li>\r\n        <li>Sharing another person's private information.</li>\r\n        <li>Impersonating staff, or claiming a role you do not have.</li>\r\n        <li>Exploiting bugs, automating access, or attempting to bypass moderation, permissions or the economy.</li>\r\n        <li>Advertising, scams, or links to content that breaks these rules.</li>\r\n      </ul>\r\n\r\n      <h2>4. Your content</h2>\r\n      <p>You keep ownership of the places, items and posts you create. By publishing them you give FieldBrik permission to store them, display them, and let other members visit, play and view them. You can remove your content, and removal stops it being served.</p>\r\n      <p>Do not upload work that belongs to somebody else without permission.</p>\r\n\r\n      <h2>5. Moderation</h2>\r\n      <p>Staff may review content, remove it, warn an account, or restrict an account. Restrictions are recorded against the account and apply across the whole site: a restricted account cannot get around them by visiting a different page. Where a restriction has an end date, it stops applying at that time and remains in the account's history.</p>\r\n\r\n      <h2>6. Bucks, Tickets and memberships</h2>\r\n      <p>Tickets are earned in the service. Bucks are a premium currency. Catalog items may be sold for Tickets, for Bucks, or both. Carpenters Club is an optional paid membership; its tiers and prices are listed on the <a href=\"/carpenters-club\">Carpenters Club</a> page.</p>\r\n      <p>No purchase is live yet: there is no checkout on this site. Currency and membership terms, including refunds, will be published here before anything can be bought.</p>\r\n\r\n      <h2>7. Ending an account</h2>\r\n      <p>You may request deletion of your account at any time. FieldBrik may suspend or close an account that breaks these terms. Records of moderation actions are kept after an account closes so that restrictions cannot be evaded by making a new one.</p>\r\n\r\n      <h2>8. Changes</h2>\r\n      <p>These terms will change as the service is built. Material changes will be announced on the <a href=\"/news\">News</a> page.</p>\r\n\r\n      <h2>9. Contact</h2>\r\n      <p>Questions about these terms go to the <a href=\"/support\">support page</a>.</p>\r\n    </div>\r\n  </div>\r\n</main>\r\n\r\n")
    ; __append( include('../partials/footer') )
    ; __append("\r\n</body>\r\n</html>\r\n")
  return __output;

},
  "partials/appbar": function anonymous(locals, escapeFn, include, rethrow
) {
var US = locals.US, active = locals.active, authState = locals.authState, bucks = locals.bucks, catalog = locals.catalog, currency = locals.currency, currentPath = locals.currentPath, earned = locals.earned, en = locals.en, forum = locals.forum, gear = locals.gear, home = locals.home, icon = locals.icon, is = locals.is, kind = locals.kind, member = locals.member, message = locals.message, name = locals.name, news = locals.news, people = locals.people, person = locals.person, premium = locals.premium, query = locals.query, site = locals.site, tickets = locals.tickets, toLocaleString = locals.toLocaleString, toUpperCase = locals.toUpperCase, viewer = locals.viewer;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append("\n<header class=\"fb-bar\">\n  <a class=\"fb-bar__brand\" href=\"/home\">")
    ; __append(escapeFn( site.name.toUpperCase() ))
    ; __append("</a>\n\n  <nav class=\"fb-bar__nav\" aria-label=\"Site\">\n    <a class=\"fb-bar__link")
    ; __append(escapeFn( currentPath === '/home' ? ' is-active' : '' ))
    ; __append("\" href=\"/home\">Home</a>\n    <a class=\"fb-bar__link")
    ; __append(escapeFn( currentPath === '/catalog' ? ' is-active' : '' ))
    ; __append("\" href=\"/catalog\">Catalog</a>\n    <a class=\"fb-bar__link")
    ; __append(escapeFn( currentPath === '/forum' ? ' is-active' : '' ))
    ; __append("\" href=\"/forum\">Forum</a>\n    <a class=\"fb-bar__link")
    ; __append(escapeFn( currentPath === '/news' ? ' is-active' : '' ))
    ; __append("\" href=\"/news\">News</a>\n    <a class=\"fb-bar__link")
    ; __append(escapeFn( currentPath === '/people' ? ' is-active' : '' ))
    ; __append("\" href=\"/people\">People</a>\n  </nav>\n\n  <form class=\"fb-bar__search\" method=\"get\" action=\"/home\" role=\"search\">\n    <input name=\"q\" type=\"search\" value=\"")
    ; __append(escapeFn( typeof query !== 'undefined' ? query : '' ))
    ; __append("\" placeholder=\"Search\" aria-label=\"Search places and creators\">\n    <button class=\"fb-bar__searchbtn\" type=\"submit\" aria-label=\"Search\">\n      <svg width=\"15\" height=\"15\" viewBox=\"0 0 16 16\" aria-hidden=\"true\">\n        <circle cx=\"6.6\" cy=\"6.6\" r=\"4.6\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\"></circle>\n        <line x1=\"10.2\" y1=\"10.2\" x2=\"14.6\" y2=\"14.6\" stroke=\"currentColor\" stroke-width=\"1.7\"></line>\n      </svg>\n    </button>\n  </form>\n\n  <div class=\"fb-bar__icons\">\n    <a class=\"fb-bar__icon\" href=\"/my-page\" title=\"My FieldBrik\" aria-label=\"My FieldBrik\">")
    ; __append( include('icon', { name: 'person' }) )
    ; __append("</a>\n    <a class=\"fb-bar__icon\" href=\"/messages\" title=\"Messages\" aria-label=\"Messages\">")
    ; __append( include('icon', { name: 'message' }) )
    ; __append("</a>\n\n    ")
    ;  if (authState === 'member') { 
    ; __append("\n      <span class=\"fb-bar__count\" title=\"")
    ; __append(escapeFn( site.currency.premium ))
    ; __append("\">")
    ; __append( include('currency-icon', { kind: 'bucks' }) )
    ; __append(escapeFn( viewer.currency.bucks.toLocaleString('en-US') ))
    ; __append("</span>\n      <span class=\"fb-bar__count\" title=\"")
    ; __append(escapeFn( site.currency.earned ))
    ; __append("\">")
    ; __append( include('currency-icon', { kind: 'tickets' }) )
    ; __append(escapeFn( viewer.currency.tickets.toLocaleString('en-US') ))
    ; __append("</span>\n      <a class=\"fb-bar__icon\" href=\"/settings\" title=\"Settings\" aria-label=\"Settings\">")
    ; __append( include('icon', { name: 'gear' }) )
    ; __append("</a>\n    ")
    ;  } else { 
    ; __append("\n      <a class=\"fb-bar__login\" href=\"/login\">Log In</a>\n      <a class=\"fb-bar__login\" href=\"/register\">Sign Up</a>\n    ")
    ;  } 
    ; __append("\n  </div>\n</header>\n")
  return __output;

},
  "partials/avatar": function anonymous(locals, escapeFn, include, rethrow
) {
var avatar = locals.avatar, face = locals.face, head = locals.head, leftArm = locals.leftArm, leftLeg = locals.leftLeg, live = locals.live, rightArm = locals.rightArm, rightLeg = locals.rightLeg, size = locals.size, torso = locals.torso;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append("\r\n<div\r\n  class=\"fb-avatar fb-avatar--")
    ; __append(escapeFn( size ))
    ; __append("\"\r\n  data-avatar\r\n  data-head=\"")
    ; __append(escapeFn( avatar.head ))
    ; __append("\"\r\n  data-torso=\"")
    ; __append(escapeFn( avatar.torso ))
    ; __append("\"\r\n  data-left-arm=\"")
    ; __append(escapeFn( avatar.leftArm ))
    ; __append("\"\r\n  data-right-arm=\"")
    ; __append(escapeFn( avatar.rightArm ))
    ; __append("\"\r\n  data-left-leg=\"")
    ; __append(escapeFn( avatar.leftLeg ))
    ; __append("\"\r\n  data-right-leg=\"")
    ; __append(escapeFn( avatar.rightLeg ))
    ; __append("\"\r\n  data-face=\"")
    ; __append(escapeFn( avatar.face ))
    ; __append("\"\r\n  style=\"--av-head: ")
    ; __append(escapeFn( avatar.head ))
    ; __append("; --av-torso: ")
    ; __append(escapeFn( avatar.torso ))
    ; __append("; --av-arms: ")
    ; __append(escapeFn( avatar.leftArm ))
    ; __append("; --av-legs: ")
    ; __append(escapeFn( avatar.leftLeg ))
    ; __append(";\"\r\n  ")
    ;  if (typeof live !== 'undefined' && live) { 
    ; __append("data-avatar-live")
    ;  } 
    ; __append("\r\n>\r\n  <span class=\"fb-avatar__fallback\" aria-hidden=\"true\">\r\n    <span class=\"fb-avatar__head\">\r\n      <span class=\"fb-avatar__face fb-avatar__face--")
    ; __append(escapeFn( avatar.face ))
    ; __append("\"></span>\r\n    </span>\r\n    <span class=\"fb-avatar__torso\"></span>\r\n    <span class=\"fb-avatar__arm fb-avatar__arm--left\"></span>\r\n    <span class=\"fb-avatar__arm fb-avatar__arm--right\"></span>\r\n    <span class=\"fb-avatar__leg fb-avatar__leg--left\"></span>\r\n    <span class=\"fb-avatar__leg fb-avatar__leg--right\"></span>\r\n  </span>\r\n</div>\r\n")
  return __output;

},
  "partials/currency-icon": function anonymous(locals, escapeFn, include, rethrow
) {
var kind = locals.kind;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append("\r\n<span class=\"fb-ico fb-ico--")
    ; __append(escapeFn( kind ))
    ; __append("\"><img src=\"/img/")
    ; __append(escapeFn( kind ))
    ; __append(".png\" alt=\"\" width=\"16\" height=\"16\"></span>\r\n")
  return __output;

},
  "partials/footer": function anonymous(locals, escapeFn, include, rethrow
) {
var disclaimer = locals.disclaimer, footer = locals.footer, forEach = locals.forEach, href = locals.href, index = locals.index, label = locals.label, line = locals.line, lines = locals.lines, link = locals.link, links = locals.links, site = locals.site;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append("<footer class=\"fb-footer\">\r\n  <div class=\"fb-container\">\r\n    ")
    ;  site.footer.lines.forEach(function (line) { 
    ; __append("\r\n      <p>")
    ; __append(escapeFn( line ))
    ; __append("</p>\r\n    ")
    ;  }); 
    ; __append("\r\n    <p class=\"fb-footer__links\">\r\n      ")
    ;  site.footer.links.forEach(function (link, index) { 
    ; __append("\r\n        ")
    ;  if (index > 0) { 
    ; __append("<span class=\"fb-footer__sep\" aria-hidden=\"true\">|</span>")
    ;  } 
    ; __append("\r\n        <a href=\"")
    ; __append(escapeFn( link.href ))
    ; __append("\">")
    ; __append(escapeFn( link.label ))
    ; __append("</a>\r\n      ")
    ;  }); 
    ; __append("\r\n    </p>\r\n    <p class=\"fb-footer__links\">")
    ; __append(escapeFn( site.disclaimer ))
    ; __append("</p>\r\n  </div>\r\n</footer>\r\n\r\n")
    ; __append("\r\n<script type=\"module\" src=\"/js/avatar-stage.js\"></script>\r\n")
  return __output;

},
  "partials/head": function anonymous(locals, escapeFn, include, rethrow
) {
var admin = locals.admin, bodyClass = locals.bodyClass, extraCss = locals.extraCss, indexOf = locals.indexOf, isAdminPage = locals.isAdminPage, name = locals.name, pageTitle = locals.pageTitle, site = locals.site, tagline = locals.tagline;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append("<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"utf-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n  <title>")
    ; __append(escapeFn( pageTitle ))
    ; __append("</title>\n  <meta name=\"description\" content=\"")
    ; __append(escapeFn( site.name ))
    ; __append(" - ")
    ; __append(escapeFn( site.tagline ))
    ; __append("\">\n  ")
    ; __append("\n  <link rel=\"stylesheet\" href=\"/css/fieldbrik.css?v=4\">\n  ")
    ; __append("\n  <link rel=\"stylesheet\" href=\"/css/art.css?v=1\">\n  ")
    ; __append("\n  ")
    ;  if (typeof extraCss !== 'undefined' && extraCss) { 
    ; __append("\n  <link rel=\"stylesheet\" href=\"")
    ; __append(escapeFn( extraCss ))
    ; __append("\">\n  ")
    ;  } 
    ; __append("\n  ")
    ; __append("\n  ")
    ;  var isAdminPage = (typeof extraCss !== 'undefined' && extraCss && String(extraCss).indexOf('admin') !== -1); 
    ; __append("\n  ")
    ;  if (!isAdminPage) { 
    ; __append("\n  <link rel=\"stylesheet\" href=\"/css/legacy2009.css?v=1\">\n  ")
    ; __append("\n  <link rel=\"stylesheet\" href=\"/css/topbar2009.css?v=1\">\n  ")
    ; __append("\n  <link rel=\"stylesheet\" href=\"/css/banner2009.css?v=1\">\n  ")
    ;  } 
    ; __append("\n</head>\n")
    ; __append("\n")
    ;  if (typeof bodyClass !== 'undefined' && bodyClass) { 
    ; __append("<body class=\"")
    ; __append(escapeFn( bodyClass ))
    ; __append("\">")
    ;  } else { 
    ; __append("<body>")
    ;  } 
    ; __append("\n")
  return __output;

},
  "partials/header": function anonymous(locals, escapeFn, include, rethrow
) {
var US = locals.US, active = locals.active, admin = locals.admin, authState = locals.authState, bucks = locals.bucks, currency = locals.currency, currentPath = locals.currentPath, earned = locals.earned, en = locals.en, forEach = locals.forEach, has = locals.has, href = locals.href, icon = locals.icon, index = locals.index, indexOf = locals.indexOf, is = locals.is, item = locals.item, items = locals.items, joined = locals.joined, kind = locals.kind, label = locals.label, length = locals.length, link = locals.link, member = locals.member, name = locals.name, nav2009 = locals.nav2009, people = locals.people, premium = locals.premium, site = locals.site, staffRank = locals.staffRank, subMenuItemselected = locals.subMenuItemselected, subnav2009 = locals.subnav2009, tickets = locals.tickets, toLocaleString = locals.toLocaleString, username = locals.username, viewer = locals.viewer;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append("\n<header class=\"fb-header fb-header--")
    ; __append(escapeFn( authState ))
    ; __append("\">\n  <div class=\"fb-container fb-header__row\">\n    <div class=\"fb-who2009\">\n      ")
    ;  if (authState === 'member' && viewer && viewer.username) { 
    ; __append("\n        <p class=\"fb-who2009__line\">Logged in as\n          <a href=\"/home\"><strong>")
    ; __append(escapeFn( viewer.username ))
    ; __append("</strong></a> |\n          <a href=\"/logout\">Logout</a></p>\n        <p class=\"fb-who2009__line fb-who2009__line--dim\">Member since ")
    ; __append(escapeFn( viewer.joined ))
    ; __append("</p>\n      ")
    ;  } else { 
    ; __append("\n        <p class=\"fb-who2009__line\"><a href=\"/login\">Log in</a> | <a href=\"/register\">Sign up</a></p>\n        <p class=\"fb-who2009__line fb-who2009__line--dim\">Building and playing are free.</p>\n      ")
    ;  } 
    ; __append("\n    </div>\n\n    <a class=\"fb-wordmark2009\" href=\"/\">")
    ; __append(escapeFn( site.name ))
    ; __append("</a>\n\n    <div class=\"fb-account2009\">\n      ")
    ;  if (authState === 'member' && viewer && viewer.username) { 
    ; __append("\n        <span class=\"fb-account2009__line\">\n          ")
    ; __append( include('currency-icon', { kind: 'bucks' }) )
    ; __append("\n          <strong>")
    ; __append(escapeFn( viewer.currency.bucks.toLocaleString('en-US') ))
    ; __append("</strong> ")
    ; __append(escapeFn( site.currency.premium ))
    ; __append("\n        </span>\n        <span class=\"fb-account2009__line\">\n          ")
    ; __append( include('currency-icon', { kind: 'tickets' }) )
    ; __append("\n          <strong>")
    ; __append(escapeFn( viewer.currency.tickets.toLocaleString('en-US') ))
    ; __append("</strong> ")
    ; __append(escapeFn( site.currency.earned ))
    ; __append("\n        </span>\n      ")
    ;  } else { 
    ; __append("\n        <a class=\"fb-account2009__line\" href=\"/register\">Create an account</a>\n        <span class=\"fb-account2009__line\">It takes a minute.</span>\n      ")
    ;  } 
    ; __append("\n    </div>\n  </div>\n</header>\n\n<nav class=\"fb-nav\" aria-label=\"Site\">\n  <div class=\"fb-container fb-nav__inner\">\n    ")
    ;  site.nav2009.forEach(function (link, index) { 
    ; __append("\n      ")
    ;  if (index > 0) { 
    ; __append("<span class=\"fb-tab__sep\" aria-hidden=\"true\">|</span>")
    ;  } 
    ; __append("\n      <a class=\"fb-tab")
    ; __append(escapeFn( (typeof currentPath !== 'undefined' && currentPath === link.href) ? ' is-active' : '' ))
    ; __append("\" href=\"")
    ; __append(escapeFn( link.href ))
    ; __append("\">")
    ; __append(escapeFn( link.label ))
    ; __append("</a>\n    ")
    ;  }); 
    ; __append("\n\n    ")
    ;  var staffRank = (authState === 'member' && viewer && viewer.staffRank) ? Number(viewer.staffRank) : 0; 
    ; __append("\n    ")
    ;  if (staffRank >= 100) { 
    ; __append("\n      <span class=\"fb-tab__sep\" aria-hidden=\"true\">|</span>\n      <a class=\"fb-tab")
    ; __append(escapeFn( (typeof currentPath !== 'undefined' && currentPath.indexOf('/admin') === 0) ? ' is-active' : '' ))
    ; __append("\" href=\"/admin\">Admin</a>\n    ")
    ;  } 
    ; __append("\n\n    <form class=\"fb-navsearch\" method=\"get\" action=\"/games\" role=\"search\">\n      <input name=\"q\" type=\"search\" placeholder=\"Search\" aria-label=\"Search places\">\n      <button class=\"fb-btn\" type=\"submit\">Go</button>\n    </form>\n  </div>\n</nav>\n\n")
    ;  if (authState === 'member' && viewer && viewer.username) { 
    ; __append("\n  <nav class=\"fb-submenu\" aria-label=\"My FieldBrik\">\n    <div class=\"fb-container\">\n      <ul class=\"fb-submenu__list\">\n        ")
    ;  site.subnav2009.forEach(function (link, index) { 
    ; __append("\n          ")
    ;  var href = link.href || ('/people/' + encodeURIComponent(viewer.username)); 
    ; __append("\n          <li")
    ; __append(escapeFn( link.items ? ' class="has-items"' : '' ))
    ; __append(">\n            <a class=\"")
    ; __append(escapeFn( (typeof currentPath !== 'undefined' && currentPath === href) ? 'subMenuItemselected' : '' ))
    ; __append("\" href=\"")
    ; __append(escapeFn( href ))
    ; __append("\">")
    ; __append(escapeFn( link.label ))
    ; __append("</a>\n            ")
    ;  if (link.items) { 
    ; __append("\n              ")
    ; __append("\n              <ul class=\"fb-submenu__drop\">\n                ")
    ;  link.items.forEach(function (item) { 
    ; __append("\n                  <li><a href=\"")
    ; __append(escapeFn( item.href ))
    ; __append("\">")
    ; __append(escapeFn( item.label ))
    ; __append("</a></li>\n                ")
    ;  }); 
    ; __append("\n              </ul>\n            ")
    ;  } 
    ; __append("\n            ")
    ;  if (index < site.subnav2009.length - 1) { 
    ; __append("<span class=\"Separator\">&nbsp;|&nbsp;</span>")
    ;  } 
    ; __append("\n          </li>\n        ")
    ;  }); 
    ; __append("\n      </ul>\n    </div>\n  </nav>\n")
    ;  } 
    ; __append("\n\n")
    ; __append("\n<div class=\"fb-banner2009\" id=\"fb-site-banner\" role=\"status\" hidden></div>\n<script src=\"/js/banner.js\" defer></script>\n")
  return __output;

},
  "partials/icon": function anonymous(locals, escapeFn, include, rethrow
) {
var bag = locals.bag, blog = locals.blog, calendar = locals.calendar, character = locals.character, coin = locals.coin, friends = locals.friends, gear = locals.gear, grid = locals.grid, help = locals.help, home = locals.home, message = locals.message, name = locals.name, parents = locals.parents, person = locals.person, star = locals.star;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append("\n<svg class=\"fb-ico\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\">\n")
    ;  if (name === 'home') { 
    ; __append("\n  <path d=\"M2.5 7.2 8 2.8l5.5 4.4V13a.7.7 0 0 1-.7.7H3.2a.7.7 0 0 1-.7-.7z\"></path>\n  <path d=\"M6.3 13.7V9.5h3.4v4.2\"></path>\n")
    ;  } else if (name === 'person') { 
    ; __append("\n  <circle cx=\"8\" cy=\"5.3\" r=\"2.6\"></circle>\n  <path d=\"M2.9 13.8c0-2.6 2.3-4.2 5.1-4.2s5.1 1.6 5.1 4.2\"></path>\n")
    ;  } else if (name === 'message') { 
    ; __append("\n  <rect x=\"2\" y=\"3.6\" width=\"12\" height=\"8.8\" rx=\"1\"></rect>\n  <path d=\"m2.7 4.6 5.3 3.9 5.3-3.9\"></path>\n")
    ;  } else if (name === 'friends') { 
    ; __append("\n  <circle cx=\"5.7\" cy=\"5.7\" r=\"2.2\"></circle>\n  <path d=\"M1.9 13.1c0-2.1 1.7-3.4 3.8-3.4s3.8 1.3 3.8 3.4\"></path>\n  <path d=\"M10.7 4.2a2.2 2.2 0 0 1 0 4.3M11.5 10c1.5.4 2.5 1.6 2.5 3.1\"></path>\n")
    ;  } else if (name === 'character') { 
    ; __append("\n  <circle cx=\"8\" cy=\"3.7\" r=\"1.9\"></circle>\n  <path d=\"M8 5.6v4.1M8 6.7 5.5 8.5M8 6.7l2.5 1.8M8 9.7v3.5\"></path>\n")
    ;  } else if (name === 'bag') { 
    ; __append("\n  <path d=\"M3 5.6h10l.8 8.4H2.2z\"></path>\n  <path d=\"M5.8 5.6V4a2.2 2.2 0 0 1 4.4 0v1.6\"></path>\n")
    ;  } else if (name === 'coin') { 
    ; __append("\n  <circle cx=\"8\" cy=\"8\" r=\"5.6\"></circle>\n  <path d=\"M8 4.8v6.4M6.4 6.3h2.3a1.3 1.3 0 0 1 0 2.6H6.9a1.3 1.3 0 0 0 0 2.6h2.5\"></path>\n")
    ;  } else if (name === 'blog') { 
    ; __append("\n  <path d=\"M2.4 3.5h11.2v6.6H8.2L5 12.6V10H2.4z\"></path>\n  <path d=\"M4.6 5.8h6.8M4.6 7.8h4.4\"></path>\n")
    ;  } else if (name === 'calendar') { 
    ; __append("\n  <rect x=\"2.3\" y=\"3.7\" width=\"11.4\" height=\"9.9\" rx=\"1\"></rect>\n  <path d=\"M2.3 6.7h11.4M5.4 2.5v2.4M10.6 2.5v2.4\"></path>\n")
    ;  } else if (name === 'grid') { 
    ; __append("\n  <rect x=\"2.4\" y=\"2.4\" width=\"4.6\" height=\"4.6\"></rect>\n  <rect x=\"9\" y=\"2.4\" width=\"4.6\" height=\"4.6\"></rect>\n  <rect x=\"2.4\" y=\"9\" width=\"4.6\" height=\"4.6\"></rect>\n  <rect x=\"9\" y=\"9\" width=\"4.6\" height=\"4.6\"></rect>\n")
    ;  } else if (name === 'star') { 
    ; __append("\n  <path d=\"m8 2.4 1.7 3.5 3.8.5-2.8 2.7.7 3.8L8 11.1l-3.4 1.8.7-3.8L2.5 6.4l3.8-.5z\"></path>\n")
    ;  } else if (name === 'parents') { 
    ; __append("\n  <circle cx=\"5.4\" cy=\"4.8\" r=\"2\"></circle>\n  <circle cx=\"10.7\" cy=\"5.4\" r=\"1.6\"></circle>\n  <path d=\"M1.7 13c0-2 1.7-3.2 3.7-3.2S9.1 11 9.1 13M9.5 13c0-1.6 1.2-2.6 2.7-2.6s2.6 1 2.6 2.6\"></path>\n")
    ;  } else if (name === 'help') { 
    ; __append("\n  <circle cx=\"8\" cy=\"8\" r=\"5.7\"></circle>\n  <path d=\"M6.3 6.2a1.8 1.8 0 1 1 2.4 1.7c-.5.2-.7.6-.7 1.1v.4\"></path>\n  <circle cx=\"8\" cy=\"11.6\" r=\".7\" fill=\"currentColor\" stroke=\"none\"></circle>\n")
    ;  } else if (name === 'gear') { 
    ; __append("\n  <circle cx=\"8\" cy=\"8\" r=\"2.2\"></circle>\n  <path d=\"M8 1.8v1.7M8 12.5v1.7M1.8 8h1.7M12.5 8h1.7M3.6 3.6l1.2 1.2M11.2 11.2l1.2 1.2M12.4 3.6l-1.2 1.2M4.8 11.2l-1.2 1.2\"></path>\n")
    ;  } 
    ; __append("\n</svg>\n")
  return __output;

},
  "partials/parents-nav": function anonymous(locals, escapeFn, include, rethrow
) {
var active = locals.active, activeTab = locals.activeTab, aria = locals.aria, current = locals.current, forEach = locals.forEach, is = locals.is, key = locals.key, label = locals.label, page = locals.page, tab = locals.tab, tabs = locals.tabs;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append("\r\n<nav class=\"fb-subtabs\" aria-label=\"Parents section\">\r\n  ")
    ;  tabs.forEach(function (tab) { 
    ; __append("\r\n    <a class=\"fb-subtab")
    ; __append(escapeFn( tab.key === activeTab ? ' is-active' : '' ))
    ; __append("\" href=\"/parents/")
    ; __append(escapeFn( tab.key ))
    ; __append("\"")
    ; __append(escapeFn( tab.key === activeTab ? ' aria-current="page"' : '' ))
    ; __append(">")
    ; __append(escapeFn( tab.label ))
    ; __append("</a>\r\n  ")
    ;  }); 
    ; __append("\r\n</nav>\r\n")
  return __output;

},
  "partials/sidebar": function anonymous(locals, escapeFn, include, rethrow
) {
var active = locals.active, authState = locals.authState, bag = locals.bag, blog = locals.blog, calendar = locals.calendar, canOpenPanel = locals.canOpenPanel, carpenters = locals.carpenters, catalog = locals.catalog, character = locals.character, club = locals.club, coin = locals.coin, currentPath = locals.currentPath, earnings = locals.earnings, friends = locals.friends, grid = locals.grid, guest = locals.guest, help = locals.help, home = locals.home, icon = locals.icon, inventory = locals.inventory, is = locals.is, member = locals.member, message = locals.message, messages = locals.messages, my = locals.my, name = locals.name, news = locals.news, page = locals.page, parents = locals.parents, person = locals.person, site = locals.site, star = locals.star, username = locals.username, viewer = locals.viewer;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ; __append("\n<aside class=\"fb-side\">\n  ")
    ;  if (authState === 'member' && typeof viewer !== 'undefined' && viewer && viewer.username) { 
    ; __append("\n    <a class=\"fb-side__who\" href=\"/my-page\">")
    ; __append(escapeFn( viewer.username ))
    ; __append("</a>\n  ")
    ;  } else { 
    ; __append("\n    <a class=\"fb-side__who\" href=\"/home\">")
    ; __append(escapeFn( site.name ))
    ; __append("</a>\n  ")
    ;  } 
    ; __append("\n\n  <a class=\"fb-side__upgrade\" href=\"/carpenters-club\">Upgrade Now</a>\n\n  <nav class=\"fb-side__nav\" aria-label=\"Main navigation\">\n    <a class=\"fb-side__link")
    ; __append(escapeFn( currentPath === '/home' ? ' is-active' : '' ))
    ; __append("\" href=\"/home\">")
    ; __append( include('icon', { name: 'home' }) )
    ; __append("<span>Home</span></a>\n    <a class=\"fb-side__link")
    ; __append(escapeFn( currentPath === '/my-page' ? ' is-active' : '' ))
    ; __append("\" href=\"/my-page\">")
    ; __append( include('icon', { name: 'person' }) )
    ; __append("<span>Profile</span></a>\n    <a class=\"fb-side__link")
    ; __append(escapeFn( currentPath === '/messages' ? ' is-active' : '' ))
    ; __append("\" href=\"/messages\">")
    ; __append( include('icon', { name: 'message' }) )
    ; __append("<span>Messages</span></a>\n    <a class=\"fb-side__link")
    ; __append(escapeFn( currentPath === '/friends' ? ' is-active' : '' ))
    ; __append("\" href=\"/friends\">")
    ; __append( include('icon', { name: 'friends' }) )
    ; __append("<span>Friends</span></a>\n    <a class=\"fb-side__link")
    ; __append(escapeFn( currentPath === '/character' ? ' is-active' : '' ))
    ; __append("\" href=\"/character\">")
    ; __append( include('icon', { name: 'character' }) )
    ; __append("<span>Character</span></a>\n    <a class=\"fb-side__link")
    ; __append(escapeFn( currentPath === '/inventory' ? ' is-active' : '' ))
    ; __append("\" href=\"/inventory\">")
    ; __append( include('icon', { name: 'bag' }) )
    ; __append("<span>Inventory</span></a>\n    <a class=\"fb-side__link")
    ; __append(escapeFn( currentPath === '/earnings' ? ' is-active' : '' ))
    ; __append("\" href=\"/earnings\">")
    ; __append( include('icon', { name: 'coin' }) )
    ; __append("<span>Money</span></a>\n    <a class=\"fb-side__link")
    ; __append(escapeFn( currentPath === '/news' ? ' is-active' : '' ))
    ; __append("\" href=\"/news\">")
    ; __append( include('icon', { name: 'blog' }) )
    ; __append("<span>Blog</span></a>\n    <span class=\"fb-side__link is-off\">")
    ; __append( include('icon', { name: 'calendar' }) )
    ; __append("<span>Events</span></span>\n\n    <span class=\"fb-side__rule\" aria-hidden=\"true\"></span>\n\n    <a class=\"fb-side__link")
    ; __append(escapeFn( currentPath === '/catalog' ? ' is-active' : '' ))
    ; __append("\" href=\"/catalog\">")
    ; __append( include('icon', { name: 'grid' }) )
    ; __append("<span>Catalog</span></a>\n    <a class=\"fb-side__link")
    ; __append(escapeFn( currentPath === '/carpenters-club' ? ' is-active' : '' ))
    ; __append("\" href=\"/carpenters-club\">")
    ; __append( include('icon', { name: 'star' }) )
    ; __append("<span>Carpenters Club</span></a>\n    <a class=\"fb-side__link")
    ; __append(escapeFn( currentPath === '/parents' ? ' is-active' : '' ))
    ; __append("\" href=\"/parents\">")
    ; __append( include('icon', { name: 'parents' }) )
    ; __append("<span>Parents</span></a>\n    <a class=\"fb-side__link")
    ; __append(escapeFn( currentPath === '/help' ? ' is-active' : '' ))
    ; __append("\" href=\"/help\">")
    ; __append( include('icon', { name: 'help' }) )
    ; __append("<span>Help</span></a>\n  </nav>\n\n  ")
    ;  if (authState === 'guest') { 
    ; __append("\n    <div class=\"fb-side__auth\">\n      <a href=\"/login\">Log In</a>\n      <a href=\"/register\">Sign Up</a>\n    </div>\n  ")
    ;  } 
    ; __append("\n\n  ")
    ; __append("\n  ")
    ;  if (typeof canOpenPanel !== 'undefined' && canOpenPanel) { 
    ; __append("\n    <a class=\"fb-side__panel\" href=\"/admin\">Panel</a>\n  ")
    ;  } 
    ; __append("\n</aside>\n")
  return __output;

},
  "partials/thumb-img": function anonymous(locals, escapeFn, include, rethrow
) {
var thumbUrl = locals.thumbUrl;

escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
    ;  if (thumbUrl) { 
    ; __append("<img class=\"fb-thumb-img\" src=\"")
    ; __append(escapeFn( thumbUrl ))
    ; __append("\" alt=\"\" loading=\"lazy\">")
    ;  } 
    ; __append("\n")
  return __output;

},
};

/* ---- runtime ------------------------------------------------------------ */

/**
 * Resolves an include target against the file that is including it, the way
 * EJS does: include('currency-icon') from partials/header means
 * partials/currency-icon, and include('../partials/head') from pages/home means
 * partials/head.
 */
function normalise(fromName, target) {
  const segments = fromName.split('/').slice(0, -1).concat(String(target).replace(/\.ejs$/, '').split('/'));
  const out = [];
  for (const segment of segments) {
    if (segment === '' || segment === '.') continue;
    if (segment === '..') out.pop();
    else out.push(segment);
  }
  return out.join('/');
}

/**
 * Renders a view to HTML.
 *
 * @param {string} name   view name, e.g. 'pages/home'
 * @param {object} locals values the template reads
 * @returns {string} HTML
 */
function render(name, locals) {
  return renderAt(String(name).replace(/\.ejs$/, ''), locals || {}, 0);
}

function renderAt(name, locals, depth) {
  const view = VIEWS[name];
  if (!view) throw new Error('Unknown view "' + name + '"');
  if (depth > 16) throw new Error('Include depth exceeded while rendering "' + name + '"');

  // Each template gets its own include so relative paths resolve from *its*
  // location, and a partial sees its parent's locals plus whatever was passed.
  const include = (target, data) =>
    renderAt(normalise(name, target), data ? Object.assign({}, locals, data) : locals, depth + 1);

  return view(locals, undefined, include, undefined);
}

module.exports = { render, VIEWS };
