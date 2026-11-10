#!/usr/bin/env node
// site-que-vende — mede os 5 padrões na página renderizada e diz o que consertar.
//
// Uso: node auditar.js <url | arquivo.html> [--saida pasta] [--cta seletor] [--raiz pasta] [--json]   (--help explica)
//
//   1. Espelho      a 1ª tela tem título, promessa e UM botão que diz o que acontece (desktop e celular)
//   2. Marca-texto  a cor do botão só aparece no que é clique; divisão do espaço (regra 60/30/10)
//   3. Camadas      algo real no fundo, uma peça atravessando a borda, sombra só no que importa
//   4. Movimento    título e botão prontos no instante, no máximo 1 coisa se movendo por tela, respeita "reduzir movimento"
//   5. Amostra      existe uma ferramenta (quiz, calculadora, simulador) que responde na hora, e é curta
//
// Sai 0 se os 5 passam, 1 se algum falha, 2 em erro de uso. Grava relatorio.html, relatorio.json e consertar.md em --saida.
// O auditor mede o que dá para medir. Se o texto fala com a pessoa certa, só gente (ou o agente, com o brief) julga:
// por isso o relatório devolve as 3 perguntas do espelho com o título, o subtítulo e o botão que ele encontrou.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const os = require('node:os');

function carregarPlaywright() {
  const lugares = [process.env.PLAYWRIGHT_DIR, __dirname, process.cwd()].filter(Boolean);
  for (const l of lugares) { const p = path.join(l, 'node_modules', 'playwright'); if (fs.existsSync(p)) return require(p); }
  try { return require('playwright'); } catch (_) { /* segue para a mensagem */ }
  console.error('Playwright não encontrado. Rode uma vez (baixa o Chromium, uns 150 MB):\n  cd "' + __dirname + '" && npm install && npx playwright install chromium');
  process.exit(2);
}

const AJUDA = `site-que-vende: mede os 5 padrões do site que vende na página renderizada.

Uso:  node auditar.js <url | arquivo.html> [opções]

  --saida <pasta>   onde gravar relatorio.html, relatorio.json, consertar.md e as fotos (padrão: ./auditoria)
  --cta <seletor>   diz qual é o botão principal (CSS), sem editar o HTML. Ex.: --cta "a.btn-reservar"
                    (na sua página, o jeito é marcar o botão com o atributo data-cta)
  --raiz <pasta>    arquivo local que usa ../ fora da pasta dele: a pasta que o servidor de teste deve servir
  --json            imprime o relatório em JSON no lugar do texto
  --help            esta ajuda

Código de saída: 0 = os 5 passam · 1 = algum falha · 2 = erro de uso ou a página não abriu.
O auditor abre a página no computador (1440x900) e no celular (390x844), rola, mexe nos controles da amostra
(sliders, opções, botões). Durante esse teste ele barra todo envio (formulário, fetch, qualquer pedido que não seja GET) e
toda saída da página: nada é enviado ao site. Cada auditoria leva de 20 a 60 s.`;

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) { console.log(AJUDA); process.exit(0); }
const alvo = args.find(x => !x.startsWith('--') && !['--saida', '--raiz', '--cta'].includes(args[args.indexOf(x) - 1]));
const opt = n => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : null; };
const soJson = args.includes('--json');
if (!alvo) { console.error('uso: node auditar.js <url | arquivo.html> [--saida pasta] [--cta seletor] [--raiz pasta] [--json]   (--help explica)'); process.exit(2); }
const ehUrl = /^https?:\/\//i.test(alvo);
if (!ehUrl && !fs.existsSync(alvo)) { console.error('arquivo não encontrado: ' + alvo); process.exit(2); }
const saida = path.resolve(opt('saida') || 'auditoria');

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.webm': 'video/webm',
  '.woff2': 'font/woff2', '.json': 'application/json', '.ico': 'image/x-icon', '.gif': 'image/gif' };

function servir() { // arquivo local: serve a partir da raiz do repositório (a página pode usar ../), senão da pasta dela
  let raiz = path.dirname(path.resolve(alvo));
  for (let d = raiz; d !== path.dirname(d); d = path.dirname(d)) if (fs.existsSync(path.join(d, '.git'))) { raiz = d; break; }
  if (opt('raiz')) raiz = path.resolve(opt('raiz'));
  const srv = http.createServer((req, res) => {
    let f = path.join(raiz, decodeURIComponent(req.url.split('?')[0]));
    if ((f === raiz || f.startsWith(raiz + path.sep)) && fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
    if (!(f === raiz || f.startsWith(raiz + path.sep)) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise(ok => srv.listen(0, '127.0.0.1', () => ok({ srv, url: 'http://127.0.0.1:' + srv.address().port + '/' + path.relative(raiz, path.resolve(alvo)).split(path.sep).join('/') })));
}

const TELAS = [{ nome: 'desktop', width: 1440, height: 900 }, { nome: 'celular', width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }];
const MEDIR = fs.readFileSync(path.join(__dirname, 'medir.js'), 'utf8');
const espera = ms => new Promise(r => setTimeout(r, ms));
const CTA = opt('cta');
const naoCarregou = new Set();

// frases que servem para qualquer empresa = não servem para ninguém
const GENERICO = [/bem[- ]vind/i, /welcome to/i, /bienvenid/i, /solu[çc][õo]es? (inovador|inteligent|completa|digita)/i, /innovative solutions?/i, /soluciones innovadoras/i,
  /pr[óo]xim[ao] n[íi]vel/i, /next[- ]level/i, /next[- ]gen/i, /o futuro d/i, /the future of/i, /el futuro de/i, /transforme (o )?seu neg[óo]cio/i, /transform your business/i,
  /de ponta/i, /cutting[- ]edge/i, /state[- ]of[- ]the[- ]art/i, /revolucion/i, /revolutioniz/i, /powered by ai/i, /com (o poder d[ae] )?(ia|intelig[êe]ncia artificial)\b/i, /ai[- ]powered/i, /impulsad[oa] por ia/i,
  /excel[êe]ncia/i, /qualidade e (confian|tradi)/i, /sua empresa (mais|no)/i, /unlock|desbloqueie|supercharge|eleve (o|seu)/i, /lorem ipsum/i];
const BOTAO_VAGO = /^(saiba mais|saber mais|clique aqui|enviar|envie|submit|send|learn more|read more|click here|leia mais|ver mais|veja mais|continuar|ok|começar|comece|get started|start|más información|enviar mensaje|contato|contact|contacto|fale conosco|contact us)[\s!.→›»]*$/i;
const PRIMEIRA_PESSOA = /^(somos|n[óo]s\b|nossa?s?\b|a nossa|o nosso|h[áa] (mais de )?\d+ anos|desde \d{4}|we are|we're|our\b|since \d{4}|nuestr[oa]s?\b)/i;
const SEGUNDA_PESSOA = /\b(voc[êe]s?|seus?|suas?|teus?|tuas?|te\b|your?|you'?re|tu\b|tus?\b|usted|su\b|sus\b)/i;

async function cores(browser, png, destaque) { // divisão do espaço na página inteira (reduzida), sem dependência de imagem
  const p = await browser.newPage();
  const r = await p.evaluate(async ({ b64, destaque }) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const w = 240, h = Math.max(1, Math.round(img.height * w / img.width)); const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d'); x.drawImage(img, 0, 0, w, h); const d = x.getImageData(0, 0, w, h).data, n = w * h, cont = new Map();
    for (let i = 0; i < d.length; i += 4) { const k = (d[i] >> 4) << 8 | (d[i + 1] >> 4) << 4 | (d[i + 2] >> 4); cont.set(k, (cont.get(k) || 0) + 1); }
    const rgb = k => ({ r: ((k >> 8) & 15) * 17, g: ((k >> 4) & 15) * 17, b: (k & 15) * 17 });
    const dist = (a, b) => Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b);
    const hsl = c => { const r = c.r / 255, g = c.g / 255, b = c.b / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), dd = mx - mn; let hh = 0; const l = (mx + mn) / 2, s = dd === 0 ? 0 : dd / (1 - Math.abs(2 * l - 1)); if (dd) hh = mx === r ? ((g - b) / dd) % 6 : mx === g ? (b - r) / dd + 2 : (r - g) / dd + 4; return { h: (hh * 60 + 360) % 360, s, l }; };
    const ord = [...cont.entries()].sort((a, b) => b[1] - a[1]); const grupos = [];
    for (const [k, v] of ord) { const c1 = rgb(k); const g = grupos.find(g => dist(g.c, c1) < 44); if (g) g.n += v; else if (grupos.length < 40) grupos.push({ c: c1, n: v }); }
    grupos.sort((a, b) => b.n - a.n);
    let nd = 0; const ha = hsl(destaque), colorido = ha.s >= .35;
    for (const [k, v] of cont) { const c1 = rgb(k), h1 = hsl(c1); const dh = Math.abs(h1.h - ha.h); if (colorido ? (h1.s >= .35 && h1.l > .12 && h1.l < .9 && Math.min(dh, 360 - dh) <= 18) : dist(c1, destaque) < 28) nd += v; }
    const hx = c => '#' + [c.r, c.g, c.b].map(v => v.toString(16).padStart(2, '0')).join('');
    return { fundo: { cor: hx(grupos[0].c), pct: Math.round(grupos[0].n / n * 100) }, segunda: grupos[1] ? { cor: hx(grupos[1].c), pct: Math.round(grupos[1].n / n * 100) } : null, destaquePct: +(nd / n * 100).toFixed(1) };
  }, { b64: png.toString('base64'), destaque });
  await p.close(); return r;
}
const hexRgb = h => ({ r: parseInt(h.slice(1, 3), 16), g: parseInt(h.slice(3, 5), 16), b: parseInt(h.slice(5, 7), 16) });

async function abrir(browser, url, tela, reduzir) {
  const ctx = await browser.newContext({ viewport: { width: tela.width, height: tela.height }, isMobile: !!tela.isMobile, hasTouch: !!tela.hasTouch,
    deviceScaleFactor: tela.deviceScaleFactor || 1, reducedMotion: reduzir ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage(); if (CTA) await page.addInitScript(sel => { window.__sqvCta = sel; }, CTA); await page.addInitScript(MEDIR);
  page.on('response', r => { if (r.status() === 404) naoCarregou.add(r.url().replace(/^https?:\/\/127\.0\.0\.1:\d+/, '')); });
  try { await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 }); }
  catch (err) { // site lento: segue se já chegou alguma página; senão, erro claro
    const temCorpo = await page.evaluate(() => !!document.body && document.body.innerText.length > 50).catch(() => false);
    if (!temCorpo) {
      const m = String(err && err.message || err).split('\n')[0];
      const motivo = /ERR_NAME_NOT_RESOLVED|ENOTFOUND/.test(m) ? 'esse endereço não existe (o domínio não foi encontrado)' : /ERR_CONNECTION|ECONNREFUSED/.test(m) ? 'o servidor recusou a conexão' : /ERR_CERT/.test(m) ? 'o certificado de segurança do site está com problema' : /Timeout/.test(m) ? 'o site não respondeu em 45 s' : m;
      throw new Error('a página não abriu: ' + motivo + ' (' + (ehUrl ? alvo : url) + ').');
    }
  }
  await page.evaluate(() => !!window.__sqv).then(ok => ok || page.evaluate(MEDIR));
  return { ctx, page };
}
async function movimentoPorTela(page, limiteTelas = 8) { // rola tela a tela e conta o que se mexe (na entrada e em repouso)
  const telas = [];
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
  const total = await page.evaluate(() => Math.max(document.documentElement.scrollHeight, document.body.scrollHeight));
  const vh = page.viewportSize().height; const n = Math.min(limiteTelas, Math.max(1, Math.ceil(total / vh)));
  for (let i = 0; i < n; i++) {
    if (i) { await page.evaluate(y => window.scrollTo(0, y), i * vh); await espera(90); }
    const entrada = i ? await page.evaluate(() => window.__sqv.mexendo(170)) : [];
    await espera(i ? 1500 : 0);
    const repouso = await page.evaluate(() => window.__sqv.mexendo(170));
    telas.push({ tela: i + 1, entrada, repouso });
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  return telas;
}

(async () => {
  const { chromium } = carregarPlaywright();
  let srv = null, url = alvo; if (!ehUrl) { const s = await servir(); srv = s.srv; url = s.url; }
  fs.mkdirSync(saida, { recursive: true });
  const browser = await chromium.launch();
  const R = { alvo, quando: new Date().toISOString(), telas: {} };
  try {
    for (const tela of TELAS) {
      const { ctx, page } = await abrir(browser, url, tela, false);
      await espera(400);                                     // "no instante": 0,4 s depois do HTML chegar
      const pronto = await page.evaluate(() => window.__sqv.textoPronto());
      const entrada1 = await page.evaluate(() => window.__sqv.mexendo(170));
      await page.waitForLoadState('load', { timeout: 30000 }).catch(() => {}); await espera(2200);
      const m = { pronto, espelho: await page.evaluate(() => window.__sqv.espelho()) };
      await page.screenshot({ path: path.join(saida, tela.nome + '-tela1.png') });
      if (tela.nome === 'desktop') {
        m.camadas = await page.evaluate(() => window.__sqv.camadas());
        m.marca = await page.evaluate(() => window.__sqv.marcaTexto(false));
        const png = await page.screenshot({ fullPage: true, path: path.join(saida, 'desktop-pagina.png') });
        if (!m.marca.semCta) m.cores = await cores(browser, png, hexRgb(m.marca.destaque));
      }
      m.movimento = await movimentoPorTela(page); m.entradaNaAbertura = entrada1; // a abertura já é julgada pelo "texto pronto"
      if (tela.nome === 'desktop') {
        await page.evaluate(() => window.__sqv.marcaTexto(true));
        await page.screenshot({ fullPage: true, path: path.join(saida, 'desktop-marca-texto.png') });
        // sondagem da amostra: nada sai da página. Todo pedido que não seja GET (envio por formulário, fetch, beacon) e toda
        // navegação são barrados (a navegação recebe 204, que mantém a página onde está); janela nova é ignorada. O que foi barrado vai para o relatório.
        const bloq = [];
        await page.route('**/*', route => { const q = route.request(); if (q.method() !== 'GET' || q.isNavigationRequest()) { bloq.push(q.method() + ' ' + q.url().replace(/^https?:\/\/127\.0\.0\.1:\d+/, '')); return q.isNavigationRequest() ? route.fulfill({ status: 204, body: '' }) : route.abort(); } return route.continue(); });
        await page.evaluate(() => { window.open = () => null; });
        m.amostra = await page.evaluate(() => window.__sqv.amostra());
        await espera(300); await page.unroute('**/*'); m.bloqueados = bloq;
      }
      await ctx.close();
      const r = await abrir(browser, url, tela, true); await r.page.waitForLoadState('load', { timeout: 30000 }).catch(() => {}); await espera(1200);
      m.reduzido = { pronto: await r.page.evaluate(() => window.__sqv.textoPronto()), movimento: await movimentoPorTela(r.page, 4) };
      await r.ctx.close();
      R.telas[tela.nome] = m;
    }
  } finally { await browser.close(); if (srv) srv.close(); }

  if (R.telas.desktop.espelho.erroCta) { console.error(`erro: --cta "${CTA}" não casou com nenhum elemento da página. Confira o seletor (ex.: --cta "a.btn-reservar").`); process.exit(2); }
  // ---------------- julgamento ----------------
  const d = R.telas.desktop, c = R.telas.celular, P = [];
  const padrao = (n, nome, frase) => { const p = { n, nome, frase, falhas: [], avisos: [], medidas: {}, consertar: [] }; P.push(p); return p; };
  const falha = (p, motivo, conserto) => { p.falhas.push(motivo); if (conserto) p.consertar.push(conserto); };

  // 1
  let p = padrao(1, 'Teste do espelho', 'A primeira tela diz para quem é, o que a pessoa ganha e o que fazer agora.');
  const e = d.espelho; p.medidas = { titulo: e.titulo, subtitulo: e.subtitulo, 'botão principal': e.cta === null ? null : (e.cta || '(sem texto)') + '  [' + e.ctaSel + ', escolhido por: ' + e.ctaPor + ']', 'botão principal no celular': c.espelho.cta === e.cta ? 'o mesmo' : (c.espelho.cta || '(nenhum)') + '  [' + c.espelho.ctaSel + ']', 'botão na 1ª tela (desktop)': e.ctaNaTela1, 'botão na 1ª tela (celular)': c.espelho.ctaNaTela1, 'outros botões cheios na 1ª tela': e.outrosTela1 };
  if (!e.titulo || !e.tituloNaTela1) falha(p, 'Não há título na primeira tela.', 'Ponha um título (h1) na primeira tela com o resultado que o visitante leva.');
  else {
    const g = GENERICO.find(r => r.test(e.titulo));
    if (g) falha(p, `Título genérico: "${e.titulo}" serve para qualquer empresa (o trecho "${g.exec(e.titulo)[0]}" não diz nada sobre o cliente).`, 'Reescreva o título com o resultado para UMA pessoa: em vez do recurso ("agendamento com IA"), o que ela ganha ("encha sua agenda sem responder mensagem").');
    const palavras = e.titulo.split(/\s+/).length;
    if (palavras > 16) falha(p, `Título com ${palavras} palavras: ninguém lê isso em 3 segundos.`, 'Corte o título para até 12 palavras; o resto vai para o subtítulo.');
    if (!g && PRIMEIRA_PESSOA.test(e.titulo)) p.avisos.push(`O título fala da empresa ("${PRIMEIRA_PESSOA.exec(e.titulo)[0].trim()}…"), não do visitante: confira se ele diz o que a pessoa ganha.`);
    if (!g && !SEGUNDA_PESSOA.test(e.titulo + ' ' + e.subtitulo)) p.avisos.push('Título e subtítulo não falam com "você/seu": confira se o visitante certo se reconhece.');
  }
  const comoTrocar = ' Se o botão principal é outro, marque o certo com o atributo data-cta (ou rode com --cta "seletor").';
  if (e.cta === null) falha(p, 'Não achei um botão de ação (com cor de fundo própria) na página.', 'Crie UM botão principal com o que acontece ao clicar ("Agende sua avaliação grátis") e marque-o com data-cta.');
  else if (!e.cta) falha(p, `O botão que mais chama atenção (${e.ctaSel}) não tem texto: é um ícone.` + comoTrocar, 'Dê à ação principal um botão com texto ("Pedir pelo WhatsApp", "Ver horários livres") na primeira tela.');
  else {
    if (!e.ctaNaTela1) falha(p, `O botão principal ("${e.cta}") não aparece na primeira tela do computador.`, 'Suba o botão principal para a primeira tela, logo abaixo do título.');
    if (!c.espelho.ctaNaTela1) falha(p, 'No celular, o botão principal não aparece na primeira tela.', 'No celular (390 px), encurte o que vem antes para o botão caber na primeira tela.');
    if (BOTAO_VAGO.test(e.cta)) falha(p, `O botão diz "${e.cta}": não conta o que acontece depois do clique.`, 'Troque o texto do botão pela ação e pelo ganho: "Ver horários livres", "Calcular meu orçamento".');
    const vagos = e.outrosTela1.filter(t => BOTAO_VAGO.test(t));
    if (vagos.length) falha(p, `Outro botão da primeira tela diz ${vagos.map(x => '"' + x + '"').join(', ')}: não conta o que acontece depois do clique.`, 'Todo botão da primeira tela diz a ação; o que não for a ação principal vira link de texto.');
    if (e.concorrentes.length) falha(p, `Há outro botão forte, de outra cor, disputando a primeira tela com "${e.cta}": ${e.concorrentes.map(x => '"' + x + '"').join(', ')}.` + comoTrocar, 'Deixe UMA ação principal na primeira tela; a segunda vira link de texto.');
  }
  p.revisar = ['Para quem é? (o visitante certo se reconhece no título?)', 'O que eu ganho? (é resultado, não recurso?)', 'O que eu faço agora? (um botão, uma ação?)'];

  // 2
  p = padrao(2, 'Regra do marca-texto', 'A cor de destaque só aparece no que é para clicar.');
  const mk = d.marca;
  if (mk.semCta) falha(p, 'Sem botão principal não há cor de destaque para medir.', 'Resolva o padrão 1 primeiro (um botão principal).');
  else {
    p.medidas = { 'cor de destaque (a do botão)': mk.destaque, 'contraste do botão com o fundo': mk.contrasteBotao, 'usos fora de clique': mk.destaqueColorido ? mk.foraDoClique : 'não medido (botão neutro)', 'por tipo': mk.destaqueColorido ? mk.porTipo : {}, 'onde': mk.destaqueColorido ? mk.exemplos : [],
      'fundo': d.cores.fundo.cor + ' ' + d.cores.fundo.pct + '%', 'segunda cor': d.cores.segunda ? d.cores.segunda.cor + ' ' + d.cores.segunda.pct + '%' : '-', 'destaque na página': mk.destaqueColorido ? d.cores.destaquePct + '%' : 'não medido (botão neutro)' };
    if (!mk.separa) falha(p, `O botão quase não se separa do fundo em volta (contraste ${mk.contrasteBotao}:1 e matiz parecido).`, 'Escolha para o botão uma cor que contraste pelo menos 3:1 com o fundo em volta, ou uma cor viva de matiz oposto ao do fundo.');
    if (!mk.destaqueColorido) p.avisos.push('O botão principal é neutro (preto, branco ou cinza): não dá para medir onde mais a cor aparece. Funciona se nada na tela tiver o mesmo peso; uma cor viva só dele costuma render mais.');
    if (mk.destaqueColorido && mk.foraDoClique > 2) falha(p, `A cor do botão (${mk.destaque}) aparece em ${mk.foraDoClique} lugares que não são clique (${Object.entries(mk.porTipo).map(([k, v]) => v + ' ' + k).join(', ')}). Veja desktop-marca-texto.png.`,
      `Tire a cor ${mk.destaque} de títulos, ícones, bordas e fundos: ela fica só em botões e links. O resto usa a cor de texto e a cor de estrutura.`);
    if (mk.destaqueColorido && d.cores.destaquePct > 15) falha(p, `A cor de destaque ocupa ${d.cores.destaquePct}% da página (a regra 60/30/10 pede perto de 10%).`, 'Reduza a área pintada com a cor de destaque: 60% fundo, 30% estrutura (texto, menu, cartões), 10% destaque.');
    if (d.cores.fundo.pct < 40) p.avisos.push(`A cor de fundo ocupa só ${d.cores.fundo.pct}% da página: muitas cores brigando (a regra pede perto de 60%).`);
  }

  // 3
  p = padrao(3, 'Frente, meio e fundo', 'A página tem camadas: cenário atrás, conteúdo no meio, o botão na frente.');
  const k = d.camadas; p.medidas = { 'fundo da 1ª tela': k.fundoTela1 || 'cor lisa', 'seções': k.secoes, 'peças que atravessam a borda de uma seção': k.atravessamBorda, 'elementos com sombra': k.sombras, 'caixas': k.caixas, 'botão (ou o cartão dele) com sombra': k.ctaSombra };
  if (!k.fundoTela1) falha(p, 'A primeira tela é uma caixa de cor lisa: não há foto, forma nem degradê atrás do texto.', 'Ponha algo real no fundo da primeira tela: foto do trabalho ou do produto, ou uma forma suave.');
  if (k.secoes >= 2 && !k.atravessamBorda) falha(p, 'Nenhuma peça atravessa a borda de uma seção: a página é uma pilha de caixas.', 'Deixe UMA peça (cartão ou imagem) entrar pela metade na seção de baixo (margem negativa ou translateY).');
  if (!k.sombras && k.fundoTela1 && k.atravessamBorda) p.avisos.push('Nenhum elemento tem sombra. O fundo e a peça que atravessa a borda já dão camadas; uma sombra suave no botão principal o poria na frente.');
  else if (!k.sombras) falha(p, 'Nenhum elemento tem sombra: tudo está no mesmo plano.', 'Dê sombra suave só ao que importa: o botão principal ou o cartão principal.');
  else if (k.sombras > Math.max(6, k.caixas * .5)) falha(p, `${k.sombras} elementos com sombra: se tudo flutua, nada está na frente.`, 'Tire a sombra dos cartões comuns e deixe só no botão principal e em um cartão.');
  else if (!k.ctaSombra) p.avisos.push('O botão principal não tem sombra (nem o cartão onde ele está): é ele que deveria estar na frente.');

  // 4
  p = padrao(4, 'Movimento com função', 'Texto pronto no instante, uma coisa se move por tela, e dá para desligar.');
  const maxMov = t => t.movimento.reduce((a, x) => { const n = Math.max(x.entrada.length, x.repouso.length); return n > a.n ? { n, tela: x.tela, quem: (x.entrada.length >= x.repouso.length ? x.entrada : x.repouso) } : a; }, { n: 0, tela: 0, quem: [] });
  const md = maxMov(d), mc = maxMov(c), pior = md.n >= mc.n ? md : mc;
  const redMov = Math.max(...[d, c].map(t => Math.max(...t.reduzido.movimento.map(x => Math.max(x.entrada.length, x.repouso.length)))));
  p.medidas = { 'título pronto em 0,4 s (desktop / celular)': d.pronto.titulo + ' / ' + c.pronto.titulo, 'botão pronto em 0,4 s (desktop / celular)': d.pronto.botao + ' / ' + c.pronto.botao,
    'máximo de coisas se movendo numa tela': pior.n + (pior.n ? ' (tela ' + pior.tela + ': ' + pior.quem.slice(0, 5).join(', ') + ')' : ''), 'movendo com "reduzir movimento" ligado': redMov };
  const onde = (a, b) => a === false && b === false ? 'no computador e no celular' : a === false ? 'no computador' : 'no celular';
  const tp = d.pronto.titulo === false ? d.pronto : c.pronto;
  if (d.pronto.titulo === false || c.pronto.titulo === false) falha(p, `O título não está legível 0,4 s depois de a página abrir, ${onde(d.pronto.titulo, c.pronto.titulo)} (${tp.tituloNaTela === false ? 'ele ainda está fora da tela' : 'opacidade ' + tp.opTitulo}): o visitante espera a animação.`, 'Título, texto e botão da primeira tela aparecem prontos, sem fade nem entrada. Animação de entrada só da segunda tela para baixo.');
  const bp = d.pronto.botao === false ? d.pronto : c.pronto;
  if (d.pronto.botao === false || c.pronto.botao === false) falha(p, `O botão principal não está visível 0,4 s depois de a página abrir, ${onde(d.pronto.botao, c.pronto.botao)} (${bp.botaoNaTela === false ? 'ele entra na tela depois, por animação ou porque o conteúdo acima ainda está carregando' : 'opacidade ' + bp.opBotao}).`, 'O botão da primeira tela aparece pronto, sem animação de entrada.');
  if (pior.n > 3) falha(p, `${pior.n} coisas se movem ao mesmo tempo na tela ${pior.tela} (${pior.quem.slice(0, 5).join(', ')}).`, 'Escolha UMA coisa para se mover por tela (o produto, o resultado, o antes e depois) e deixe o resto parado.');
  else if (pior.n > 1) p.avisos.push(`${pior.n} coisas se movem na tela ${pior.tela}; a regra é uma por tela.`);
  if (redMov > 0) falha(p, `Com "reduzir movimento" ligado no aparelho, ${redMov} elemento(s) continuam se movendo.`, 'Respeite prefers-reduced-motion: dentro de @media (prefers-reduced-motion: reduce), desligue animation e transition; no JS, confira matchMedia antes de animar.');
  if (pior.n === 0 && !p.falhas.length) p.avisos.push('Nada se move na página. Tudo bem para vender; se quiser parecer mais caro, mova UMA coisa (o produto).');

  // 5
  p = padrao(5, 'Amostra grátis', 'O visitante prova o resultado (quiz, calculadora, ferramenta) antes de deixar o contato.');
  const a = d.amostra; p.medidas = { 'ferramenta encontrada': a.encontrada ? a.onde : 'não', 'responde na hora': !!a.reage, 'passos até o fim': a.passos || 0, 'campos': a.campos || 0, 'formulário de contato': a.soContato, 'envios barrados durante o teste': (d.bloqueados || []).length };
  if (!a.encontrada) falha(p, a.soContato ? 'A página explica e entrega um formulário de contato: não há nada para o visitante experimentar.' : 'Não há ferramenta para o visitante experimentar (quiz, calculadora, simulador).',
    'Ache a pergunta que todo cliente faz antes de comprar ("quanto custa?", "qual serve para mim?") e responda com uma amostra: copie amostras/amostra.js e use <amostra-calculadora> ou <amostra-quiz>.');
  else if (!a.reage) falha(p, `Há controles na página (${a.onde}: "${(a.texto || '').slice(0, 50)}…"), mas mexer neles não mostra resultado nenhum na tela: não é uma amostra. (O auditor mexe nos campos e clica; nenhum envio sai da página.)`, 'A amostra tem de mostrar o resultado na própria página, na hora, sem enviar nada e sem pedir e-mail antes: use <amostra-calculadora> ou <amostra-quiz> de amostras/amostra.js.');
  else if (a.passos > 7 || a.campos > 7) falha(p, `A amostra tem ${a.passos > 7 ? a.passos + ' perguntas em sequência' : a.campos + ' campos'}: comprida demais para alguém chegar ao fim.`, 'Corte a amostra para 3 a 5 perguntas.');

  for (const x of P) x.passa = x.falhas.length === 0;
  R.padroes = P; R.nota = P.filter(x => x.passa).length; R.passa = R.nota === 5; R.naoCarregou = [...naoCarregou];

  // ---------------- saídas ----------------
  fs.writeFileSync(path.join(saida, 'relatorio.json'), JSON.stringify(R, null, 1));
  const md2 = ['# Consertar — ' + alvo, '', `Auditoria do site-que-vende: ${R.nota} de 5 padrões passam.`, '',
    'Cole este arquivo no seu agente de código (Claude Code, Codex, Cursor) junto com a página. Depois rode o auditor de novo.', ''];
  for (const x of P) if (!x.passa) { md2.push(`## ${x.n}. ${x.nome}`, '', 'Problemas medidos:', ...x.falhas.map(f => '- ' + f), '', 'O que fazer:', ...x.consertar.map(f => '- ' + f), ''); }
  if (!mk.semCta && mk.destaqueColorido && mk.exemplos.length) md2.push('## Onde a cor do botão (' + mk.destaque + ') aparece fora de clique', '', ...mk.exemplos.map(x => '- ' + x), mk.foraDoClique > mk.exemplos.length ? `- … e mais ${mk.foraDoClique - mk.exemplos.length}` : '', '');
  if (e.cta !== null) md2.push('## Botão tratado como principal', '', `"${e.cta || '(sem texto)'}" (${e.ctaSel}), escolhido por: ${e.ctaPor}. Se o principal é outro, marque o certo com o atributo data-cta e rode de novo.`, '');
  if (naoCarregou.size) md2.push('## Arquivos que não carregaram (404)', '', ...[...naoCarregou].slice(0, 10).map(x => '- ' + x), '');
  md2.push('## Revisão humana (o auditor não julga texto)', '', `Título: "${e.titulo || ''}"`, `Subtítulo: "${e.subtitulo || ''}"`, `Botão: "${e.cta || ''}"`, '', ...P[0].revisar.map(q => '- ' + q), '',
    'Regras ao consertar: não invente depoimento, número nem cliente; não mude o que já passa; mantenha o texto do dono quando ele responder às três perguntas.');
  fs.writeFileSync(path.join(saida, 'consertar.md'), md2.join('\n') + '\n');
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  const fmt = v => typeof v === 'object' && v !== null ? esc(JSON.stringify(v)) : v === true ? 'sim' : v === false ? 'não' : v === null || v === undefined ? '-' : esc(v);
  const img = f => 'data:image/png;base64,' + fs.readFileSync(path.join(saida, f)).toString('base64');
  fs.writeFileSync(path.join(saida, 'relatorio.html'), `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>site-que-vende — ${esc(alvo)}</title>
<style>body{font:16px/1.5 system-ui,sans-serif;margin:0;background:#f4f4f1;color:#16161a}main{max-width:980px;margin:0 auto;padding:28px 18px}h1{font-size:26px;margin:0 0 4px}
.nota{font-size:44px;font-weight:800}.p{background:#fff;border-radius:14px;padding:18px 20px;margin:16px 0;border-left:8px solid #1a8f4c}.p.f{border-color:#c62828}h2{margin:0 0 4px;font-size:20px}
.s{font-weight:700;color:#1a8f4c}.f .s{color:#c62828}table{border-collapse:collapse;font-size:14px;margin:8px 0}td{padding:3px 12px 3px 0;vertical-align:top;color:#444}li{margin:4px 0}
.av{color:#8a5a00}img{max-width:100%;border:1px solid #ccc;border-radius:8px}.g{display:grid;grid-template-columns:3fr 1fr;gap:14px;align-items:start}small{color:#666}</style><main>
<h1>site-que-vende</h1><small>${esc(alvo)} · ${R.quando.slice(0, 16).replace('T', ' ')}</small><p class="nota">${R.nota} de 5</p>
${P.map(x => `<section class="p ${x.passa ? '' : 'f'}"><h2>${x.n}. ${esc(x.nome)} <span class="s">${x.passa ? 'PASSA' : 'FALHA'}</span></h2><small>${esc(x.frase)}</small>
${x.falhas.length ? '<ul>' + x.falhas.map(f => '<li>' + esc(f) + '</li>').join('') + '</ul><b>Como consertar</b><ul>' + x.consertar.map(f => '<li>' + esc(f) + '</li>').join('') + '</ul>' : ''}
${x.avisos.length ? '<ul class="av">' + x.avisos.map(f => '<li>Aviso: ' + esc(f) + '</li>').join('') + '</ul>' : ''}
<table>${Object.entries(x.medidas).map(([q, v]) => `<tr><td>${esc(q)}</td><td><b>${fmt(v)}</b></td></tr>`).join('')}</table>
${x.revisar ? '<b>Para você responder (o auditor não julga texto)</b><ul>' + x.revisar.map(f => '<li>' + esc(f) + '</li>').join('') + '</ul>' : ''}</section>`).join('')}
<h2>Primeira tela</h2><div class="g"><img src="${img('desktop-tela1.png')}" alt="primeira tela no computador"><img src="${img('celular-tela1.png')}" alt="primeira tela no celular"></div>
<h2>Mapa do marca-texto</h2><small>Tracejado rosa = a cor do botão usada em algo que não é clique.</small><p><img src="${img('desktop-marca-texto.png')}" alt="mapa do marca-texto"></p></main></html>`);

  if (soJson) console.log(JSON.stringify(R, null, 1));
  else {
    console.log(`\nsite-que-vende · ${alvo}\n`);
    for (const x of P) {
      console.log(`${x.passa ? 'PASSA' : 'FALHA'}  ${x.n}. ${x.nome}`);
      for (const f of x.falhas) console.log('         - ' + f);
      for (const f of x.avisos) console.log('         · aviso: ' + f);
    }
    if ((d.bloqueados || []).length) console.log(`\naviso: ao mexer nos controles, a página tentou ${d.bloqueados.length} envio(s) ou saída(s); o auditor barrou todos (nada foi enviado): ${d.bloqueados.slice(0, 3).join(', ')}`);
    if (naoCarregou.size) console.log(`\naviso: ${naoCarregou.size} arquivo(s) da página não carregaram (404): ${[...naoCarregou].slice(0, 3).join(', ')}` + (ehUrl ? '' : '\n       Página local que usa ../ fora da pasta dela? Passe --raiz <pasta que contém tudo>.'));
    console.log(`\n${R.nota} de 5 padrões passam.  Relatório: ${path.join(saida, 'relatorio.html')}` + (R.passa ? '' : `\nO que consertar (cole no seu agente): ${path.join(saida, 'consertar.md')}`) + '\n');
  }
  process.exit(R.passa ? 0 : 1);
})().catch(err => {
  const m = String(err && err.message || err);
  console.error('erro: ' + (/context was destroyed|navigation/i.test(m) ? 'a página saiu do endereço no meio da medição (redirecionamento ou script que navega sozinho). Rode de novo; se repetir, audite o endereço final.' : m.split('\n')[0]));
  process.exit(2);
});
