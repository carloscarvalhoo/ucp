const { parseHTML } = require('linkedom');
const mapURL =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3622.986832446136!2d-51.78632132387822!3d-24.761640606784653!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ee9146c7d92471%3A0x5df32aac65faf107!2sUCP%20-%20Faculdades%20do%20Centro%20do%20Paran%C3%A1!5e0!3m2!1spt-BR!2sbr!4v1792168882935!5m2!1spt-BR!2sbr';
module.exports = function locationHTML(html) {
  const { document } = parseHTML('<html><body>' + html + '</body></html>');
  for (const img of document.querySelectorAll('img')) img.remove();
  for (const link of document.querySelectorAll('a[href]'))
    if (link.getAttribute('href').includes('google.com/maps/embed')) link.remove();
  const map = document.createElement('div');
  map.className = 'location-map';
  const frame = document.createElement('iframe');
  for (const [key, value] of Object.entries({
    src: mapURL,
    title: 'Localização da UCP no Google Maps',
    width: '600',
    height: '450',
    loading: 'lazy',
    referrerpolicy: 'strict-origin-when-cross-origin',
    allowfullscreen: '',
  }))
    frame.setAttribute(key, value);
  map.append(frame);
  document.body.append(map);
  return document.body.innerHTML;
};
