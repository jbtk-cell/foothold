/**
 * One live region for the whole page.
 *
 * A learner using a screen reader gets told "Not yet" when a check fails,
 * which is true and useless - the reason lives in a panel nothing announces.
 * Everything worth hearing goes through here instead, phrased the way you
 * would say it out loud rather than the way it is laid out on screen.
 *
 * Announcements are polite: they wait for a gap rather than cutting across
 * whatever is being read. Nothing here is urgent enough to interrupt.
 */

let region = null;
let last = '';

function ensure() {
  if (region) return region;
  region = document.getElementById('announcer');
  if (!region) {
    region = document.createElement('div');
    region.id = 'announcer';
    region.className = 'visually-hidden';
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    document.body.appendChild(region);
  }
  return region;
}

export function announce(message) {
  const text = String(message || '').trim();
  if (!text) return;

  const node = ensure();
  // An identical string is not treated as a change, so it would be read once
  // and then stay silent however many times it happened again.
  node.textContent = text === last ? `${text} ` : text;
  last = text;
}
