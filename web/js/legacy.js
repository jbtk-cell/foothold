/**
 * The message for browsers that cannot load ES modules.
 *
 * It carries the `nomodule` attribute, so any browser new enough to run the
 * course ignores this file entirely and never fetches it.
 */
document.getElementById('view').innerHTML =
  '<div class="error-page"><h1>This browser is too old</h1>' +
  '<p>Foothold runs Python inside the page, which needs a browser released ' +
  'after mid-2023: Chrome 80, Edge 80, Safari 15, or Firefox 114 and up. ' +
  'Updating the one you have is usually enough.</p></div>';
