function publicURL(value) {
  if (typeof value !== 'string' || /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(value)) return value;
  return value.replace(/(?:^|\/)index\.html(?=[?#]|$)/, '/').replace(/\.html(?=[?#]|$)/, '');
}
function storageRoute(value) {
  const clean = value.split(/[?#]/)[0];
  return clean === '/' ? '/index.html' : clean.replace(/\/$/, '') + '.html';
}
module.exports = { publicURL, storageRoute };
