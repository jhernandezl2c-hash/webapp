export default async function handler(req, res) {
  const ch = req.query.c;
  if (!ch) return res.status(400).send('Missing channel');

  const target = `https://vileembeds.pages.dev/embed/${ch}`;

  try {
    const r = await fetch(target, {
      headers: {
        'Referer': 'https://timstreams.st/',
        'Origin': 'https://timstreams.st',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });

    let html = await r.text();

    // Inyectar base tag para que todos los assets carguen de vileembeds
    // y meta referrer para que el player haga sus requests correctamente
    const inject = `
<base href="https://vileembeds.pages.dev/">
<meta name="referrer" content="origin">`;
    html = html.replace(/<head>/i, `<head>${inject}`);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Frame-Options', 'ALLOWALL');
    res.setHeader('Cache-Control', 'no-store');
    res.send(html);
  } catch (e) {
    res.status(500).send(`Proxy error: ${e.message}`);
  }
}
