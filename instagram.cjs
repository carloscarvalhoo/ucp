const TTL = 5 * 60 * 1000;
const httpsUrl = (value) => {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' ? u.href : null;
  } catch {
    return null;
  }
};
function decode(fragment) {
  let value = fragment;
  for (let i = 0; i < 2; i++) {
    try {
      value = JSON.parse('"' + value + '"');
    } catch {
      return '';
    }
  }
  return value;
}
function parseEmbedHTML(html) {
  const blocks = html.split('\\"shortcode_media\\":{').slice(1, 21);
  const posts = [];
  for (const block of blocks) {
    const shortcode = block.match(/\\"shortcode\\":\\"([A-Za-z0-9_-]{5,15})\\"/)?.[1];
    const displayUrl = block.match(/\\"display_url\\":\\"((?:[^"\\]|\\.)*?)\\"/)?.[1];
    const isVideo = block.match(/\\"is_video\\":(true|false)/)?.[1] === 'true';
    const ts = block.match(/\\"taken_at_timestamp\\":(\d+)/)?.[1];
    const captionRaw = block.match(/\\"text\\":\\"((?:[^"\\]|\\.)*?)\\"/)?.[1];
    if (!shortcode || !displayUrl || !ts) continue;
    const image = httpsUrl(decode(displayUrl));
    const timestamp = new Date(Number(ts) * 1000).toISOString();
    if (!image || !Number.isFinite(Date.parse(timestamp))) continue;
    posts.push({
      id: shortcode,
      caption: decode(captionRaw || '').slice(0, 2200),
      type: isVideo ? 'VIDEO' : 'IMAGE',
      image,
      permalink: `https://www.instagram.com/p/${shortcode}/`,
      timestamp,
    });
  }
  return posts;
}
function createInstagramFeed({ env = process.env, fetchImpl = fetch, now = Date.now } = {}) {
  let cache = null,
    inflight = null,
    retryAfter = 0;
  async function refresh() {
    const username = env.INSTAGRAM_USERNAME || 'ucpparana';
    if (!/^[A-Za-z0-9._]{1,30}$/.test(username)) throw new Error('Invalid Instagram username');
    const response = await fetchImpl(`https://www.instagram.com/${username}/embed/`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; UCPSiteBot/1.0)' },
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) throw new Error('Instagram request failed');
    const html = await response.text();
    const posts = parseEmbedHTML(html)
      .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
      .slice(0, 5);
    if (!posts.length) throw new Error('No posts found in Instagram embed page');
    cache = { status: 'ok', posts, updatedAt: new Date(now()).toISOString() };
    return cache;
  }
  return async function getFeed() {
    if (cache && now() - Date.parse(cache.updatedAt) < TTL) return cache;
    if (now() < retryAfter)
      return cache ? { ...cache, status: 'stale' } : { status: 'unavailable', posts: [], updatedAt: null };
    if (!inflight)
      inflight = refresh()
        .catch(() => {
          retryAfter = now() + 10 * 60000;
          return cache ? { ...cache, status: 'stale' } : { status: 'unavailable', posts: [], updatedAt: null };
        })
        .finally(() => {
          inflight = null;
        });
    return inflight;
  };
}
module.exports = { createInstagramFeed };
