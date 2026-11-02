// robots.txt e sitemap.xml, servidos na raiz do site. Saem do domínio em
// site.url (src/dados/doutor.js): sem ele, o robots.txt vai sem a linha
// "Sitemap:" e o sitemap.xml não é gerado (as URLs dele têm de ser absolutas).
import { escapar } from './util.js';

export function robotsTxt(c) {
  const linhas = ['User-agent: *', 'Allow: /'];
  if (c.site.temUrl) linhas.push('', `Sitemap: ${c.site.url}/sitemap.xml`);
  return `${linhas.join('\n')}\n`;
}

// Um endereço só: o site é uma página.
export function sitemapXml(c) {
  if (!c.site.temUrl) return null;
  const hoje = new Date().toISOString().slice(0, 10);
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    '  <url>',
    `    <loc>${escapar(c.site.url)}/</loc>`,
    `    <lastmod>${hoje}</lastmod>`,
    '  </url>',
    '</urlset>',
    '',
  ].join('\n');
}
