// Depuração: o que a página de busca do Unsplash entrega ao navegador automatizado.
import { chromium } from 'playwright';

const navegador = await chromium.launch({ channel: 'chrome' });
const pagina = await navegador.newPage({ viewport: { width: 1400, height: 1000 }, locale: 'en-US' });
const resposta = await pagina.goto('https://unsplash.com/s/photos/beige-silk-fabric', { waitUntil: 'domcontentloaded', timeout: 60000 });
await pagina.waitForTimeout(5000);
await pagina.screenshot({ path: 'capturas/unsplash-depuracao.png' });
const info = await pagina.evaluate(() => ({
  titulo: document.title,
  links: [...document.querySelectorAll('a[href*="/photos/"]')].slice(0, 5).map((a) => a.getAttribute('href')),
  imgs: [...document.querySelectorAll('img')].slice(0, 8).map((i) => (i.currentSrc || i.src || '').slice(0, 120)),
  texto: document.body.innerText.slice(0, 300),
}));
console.log('status', resposta?.status());
console.log(JSON.stringify(info, null, 2));
await navegador.close();
