// confere que configuração errada do amostra.js aparece como texto de erro na caixa (não caixa vazia nem "undefined")
const path = require('node:path');
const { chromium } = require(path.join(__dirname, '../skill/site-que-vende/scripts/node_modules/playwright'));
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + path.join(__dirname, 'casos/amostra-erros.html')); await p.waitForTimeout(400);
  const t = await p.evaluate(() => Object.fromEntries(['moeda', 'nulo', 'semrotulo', 'semtitulo'].map(id => [id, document.getElementById(id).textContent.trim()])));
  await b.close();
  const esp = { moeda: /moeda/, nulo: /objeto/, semrotulo: /rotulo/, semtitulo: /titulo/ }; let f = 0;
  for (const [k, re] of Object.entries(esp)) { const ok = re.test(t[k]) && !/undefined/.test(t[k]); console.log((ok ? '  ok   ' : '  ERRO ') + 'amostra.js com erro "' + k + '": ' + (t[k] || '(caixa vazia)').slice(0, 70)); if (!ok) f++; }
  process.exit(f ? 1 : 0);
})();
