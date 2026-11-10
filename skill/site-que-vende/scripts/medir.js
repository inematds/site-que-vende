// Código que roda DENTRO da página (page.addInitScript/evaluate). Expõe window.__sqv com as medições.
// Sem dependências. Tudo aqui é heurística medida no que o navegador desenhou, não no HTML escrito.
(() => {
  if (window.__sqv) return;
  const VW = () => window.innerWidth, VH = () => window.innerHeight;

  // ---------- cor ----------
  function cor(str) {
    const m = /rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:[ ,/]+([\d.]+%?))?\s*\)/.exec(str || '');
    if (!m) return null;
    let a = m[4] === undefined ? 1 : (m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]));
    return { r: +m[1], g: +m[2], b: +m[3], a };
  }
  function hsl(c) {
    const r = c.r / 255, g = c.g / 255, b = c.b / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    let h = 0; const l = (mx + mn) / 2, s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
    if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return { h: (h * 60 + 360) % 360, s, l };
  }
  const hex = c => '#' + [c.r, c.g, c.b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
  const dist = (a, b) => Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b);
  function lum(c) { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }; return .2126 * f(c.r) + .7152 * f(c.g) + .0722 * f(c.b); }
  function contraste(a, b) { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
  const saturada = c => { const h = hsl(c); return h.s >= .35 && h.l > .12 && h.l < .9; };
  // "mesma cor de destaque": mesmo matiz (±18°) e ainda colorida
  function parecida(c, alvo) {
    if (!c || c.a < .5) return false;
    if (!saturada(alvo)) return dist(c, alvo) < 28;
    if (!saturada(c)) return false;
    const d = Math.abs(hsl(c).h - hsl(alvo).h); return Math.min(d, 360 - d) <= 18;
  }
  // fundo próprio: cor sólida ou a 1ª cor de um degradê
  function fundoProprio(cs) {
    const c = cor(cs.backgroundColor); if (c && c.a >= .5) return c;
    if (cs.backgroundImage.includes('gradient')) { const g = cor(cs.backgroundImage); if (g && g.a >= .5) return g; }
    return null;
  }
  function fundoAtras(el) {
    for (let p = el.parentElement; p; p = p.parentElement) { const f = fundoProprio(getComputedStyle(p)); if (f) return f; }
    return { r: 255, g: 255, b: 255, a: 1 };
  }

  // ---------- visibilidade ----------
  function opacidade(el) { let o = 1; for (let p = el; p && p.nodeType === 1; p = p.parentElement) o *= parseFloat(getComputedStyle(p).opacity || 1); return o; }
  function visivel(el) {
    const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return false;
    const cs = getComputedStyle(el); return cs.visibility !== 'hidden' && cs.display !== 'none';
  }
  const naTela = r => r.bottom > 4 && r.top < VH() - 4 && r.right > 4 && r.left < VW() - 4;
  const dentro = r => r.top >= -2 && r.bottom <= VH() + 2 && r.left >= -2 && r.right <= VW() + 2;
  const texto = el => (el.innerText || el.value || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
  const temTextoProprio = el => [...el.childNodes].some(n => n.nodeType === 3 && n.nodeValue.trim().length > 1);
  const CLICAVEL = 'a,button,[role=button],input,select,label,summary,textarea';

  function seletor(el) {
    if (!el || !el.tagName) return '';
    const t = el.tagName.toLowerCase();
    if (el.id) return t + '#' + el.id;
    const c = [...el.classList].slice(0, 2).join('.');
    if (c) return t + '.' + c;
    const pai = el.parentElement; if (!pai) return t;
    const irm = [...pai.children].filter(x => x.tagName === el.tagName);
    const eu = t + (irm.length > 1 ? ':nth-of-type(' + (irm.indexOf(el) + 1) + ')' : '');
    const p = pai.id ? pai.tagName.toLowerCase() + '#' + pai.id : pai.classList[0] ? pai.tagName.toLowerCase() + '.' + pai.classList[0] : pai.tagName.toLowerCase();
    return p + ' > ' + eu;
  }
  const rotulo = el => texto(el) || el.getAttribute('title') || (el.querySelector && el.querySelector('img[alt]') ? el.querySelector('img[alt]').alt : '') || '';

  // ---------- botão principal (CTA) ----------
  function pertoDoTitulo(r) { // o botão da promessa fica logo abaixo (ou ao lado) do título
    const h = document.querySelector('h1'); if (!h) return false; const hr = h.getBoundingClientRect();
    return r.top >= hr.top - 10 && r.top - hr.bottom < 320;
  }
  function botoes() {
    const out = [];
    for (const el of document.querySelectorAll('a,button,input[type=submit],input[type=button],[role=button]')) {
      if (!visivel(el)) continue;
      const cs = getComputedStyle(el), r = el.getBoundingClientRect(), f = fundoProprio(cs);
      if (!f || r.height < 26 || r.height > 110 || r.width < 56 || r.width > 720) continue;
      const atras = fundoAtras(el), d = dist(f, atras); if (d < 30) continue;
      const rot = { top: r.top + scrollY, left: r.left, w: r.width, h: r.height };
      const flutua = getComputedStyle(el).position === 'fixed' || !!el.closest('[style*="position: fixed"],[style*="position:fixed"]');
      const txt = rotulo(el);
      // botão flutuante sem texto (ícone de WhatsApp, chat) pesa pouco: quase nunca é a ação principal da página
      out.push({ el, cor: f, atras, d, r: rot, texto: txt, sel: seletor(el), marcado: el.hasAttribute('data-cta') || (window.__sqvCta && el.matches(window.__sqvCta)),
        peso: Math.min(r.width, 360) * r.height * (d / 255) * (saturada(f) ? 1.6 : 1) * (!txt ? .15 : 1) * (flutua ? .5 : 1)
          * (pertoDoTitulo(r) ? 2 : 1) * (el.closest('form') && (el.type === 'submit' || el.tagName === 'INPUT') ? .5 : 1) });
    }
    return out;
  }
  function cta() {
    const bs = botoes(); if (!bs.length) return null;
    const marc = bs.filter(b => b.marcado);
    if (window.__sqvCta && !document.querySelector(window.__sqvCta)) return { erroCta: true };
    const tela1 = bs.filter(b => b.r.top + b.r.h <= VH() + 2);
    const lista = marc.length ? marc : tela1.length ? tela1 : bs;
    const b = lista.reduce((a, x) => x.peso > a.peso ? x : a);
    // outros botões cheios na 1ª tela, com outro texto: disputam a atenção (cor diferente pesa mais; mesma cor também conta se for grande)
    const outros = tela1.filter(x => x !== b && x.texto && x.texto !== b.texto && x.peso > b.peso * .3 && !x.el.closest('nav,header nav'));
    return Object.assign({}, b, { naTela1: b.r.top + b.r.h <= VH() + 2, escolhidoPor: marc.length ? (window.__sqvCta ? '--cta' : 'data-cta') : 'botão cheio de maior peso na 1ª tela (tamanho, cor e proximidade do título)',
      concorrentes: outros.filter(x => dist(x.cor, b.cor) > 40).map(x => x.texto), outrosTela1: outros.map(x => x.texto) });
  }
  function titulo() {
    let h = [...document.querySelectorAll('h1')].find(visivel);
    if (!h) { // maior texto da primeira tela
      let melhor = null, tam = 0;
      for (const el of document.querySelectorAll('h2,h3,p,div,span')) {
        if (!temTextoProprio(el) || !visivel(el)) continue; const r = el.getBoundingClientRect(); if (r.top > VH()) continue;
        const t = parseFloat(getComputedStyle(el).fontSize); if (t > tam) { tam = t; melhor = el; }
      }
      h = tam >= 26 ? melhor : null;
    }
    return h;
  }
  function subtitulo(h) {
    if (!h) return '';
    const hr = h.getBoundingClientRect();
    let melhor = '', md = 1e9;
    for (const el of document.querySelectorAll('p,h2,h3')) {
      if (el === h || !visivel(el) || el.contains(h)) continue; const r = el.getBoundingClientRect();
      const d = r.top - hr.bottom; if (d >= -4 && d < 260 && d < md && texto(el).length > 12) { md = d; melhor = texto(el); }
    }
    return melhor;
  }

  // ---------- 1. espelho ----------
  function espelho() {
    const h = titulo(); let c = cta(); const erroCta = !!(c && c.erroCta); if (erroCta) c = null;
    const hr = h && h.getBoundingClientRect();
    return {
      erroCta, titulo: h ? texto(h) : null, tituloNaTela1: !!h && hr.top + scrollY < VH() - 20,
      subtitulo: subtitulo(h), cta: c ? c.texto : null, ctaSel: c ? c.sel : null, ctaPor: c ? c.escolhidoPor : null, ctaNaTela1: !!c && c.naTela1,
      concorrentes: c ? c.concorrentes : [], outrosTela1: c ? c.outrosTela1 : [],
      imagensTela1: [...document.images].filter(i => visivel(i) && i.getBoundingClientRect().top < VH()).map(i => i.alt || i.currentSrc.split('/').pop()).slice(0, 6),
    };
  }

  // ---------- 2. marca-texto ----------
  function marcaTexto(pintar) {
    const c = cta(); if (!c || c.erroCta) return { semCta: true };
    const alvo = c.cor, usos = [], cliques = [];
    const els = [...document.body.querySelectorAll('*')].slice(0, 4000);
    for (const el of els) {
      if (!visivel(el) || el.closest('[data-sqv]')) continue;
      const cs = getComputedStyle(el), r = el.getBoundingClientRect(); let tipo = null;
      const svg = el instanceof SVGElement;
      if (svg) { if (el.tagName !== 'svg' && (parecida(cor(cs.fill), alvo) || parecida(cor(cs.stroke), alvo))) tipo = 'ícone'; }
      else {
        const f = fundoProprio(cs);
        if (f && parecida(f, alvo) && r.width * r.height > 36) tipo = (r.width <= 64 && r.height <= 64) ? 'ícone ou selo' : 'fundo';
        else if (temTextoProprio(el) && parecida(cor(cs.color), alvo)) tipo = /^H[1-6]$/.test(el.tagName) || parseFloat(cs.fontSize) >= 26 ? 'título' : 'texto';
        else if (['Top', 'Right', 'Bottom', 'Left'].some(l => parseFloat(cs['border' + l + 'Width']) >= 1 && cs['border' + l + 'Style'] !== 'none' && parecida(cor(cs['border' + l + 'Color']), alvo))) tipo = 'borda';
      }
      if (!tipo) continue;
      const raiz = svg ? (el.closest('svg') || el) : el;
      if (raiz.closest(CLICAVEL)) { cliques.push(raiz); continue; }
      if (usos.some(u => u.el === raiz)) continue;
      usos.push({ el: raiz, tipo, texto: texto(raiz).slice(0, 40), sel: seletor(raiz) });
    }
    if (pintar) for (const u of usos) { u.el.style.outline = '3px dashed #ff00c8'; u.el.style.outlineOffset = '2px'; }
    const porTipo = {}; for (const u of usos) porTipo[u.tipo] = (porTipo[u.tipo] || 0) + 1;
    // o botão "se separa" do fundo por claro/escuro (3:1) ou por ser a única cor viva num fundo neutro ou de matiz oposto
    const ct = contraste(alvo, c.atras), dh = Math.abs(hsl(alvo).h - hsl(c.atras).h), matiz = Math.min(dh, 360 - dh);
    const separa = ct >= 3 || (saturada(alvo) && ct >= 1.2 && (!saturada(c.atras) || matiz >= 60));
    return { destaque: hex(alvo), destaqueColorido: saturada(alvo), contrasteBotao: +ct.toFixed(2), separa,
      foraDoClique: usos.length, porTipo, exemplos: usos.slice(0, 12).map(u => u.tipo + ' em ' + u.sel + (u.texto ? ' ("' + u.texto + '")' : '')), noClique: new Set(cliques).size };
  }

  // ---------- 3. frente, meio, fundo ----------
  function secoes() {
    let cont = document.body;
    for (let i = 0; i < 6; i++) {
      const altos = [...cont.children].filter(e => visivel(e) && e.getBoundingClientRect().height >= 120 && getComputedStyle(e).position !== 'fixed');
      if (altos.length === 1 && altos[0].children.length) cont = altos[0]; else break;
    }
    return { cont, lista: [...cont.children].filter(e => visivel(e) && e.getBoundingClientRect().height >= 120 && !['fixed', 'sticky'].includes(getComputedStyle(e).position)) };
  }
  function camadas() {
    const vp = VW() * VH(); let fundo = null;
    for (const el of document.body.querySelectorAll('*')) {
      if (!visivel(el)) continue; const r = el.getBoundingClientRect(); if (r.top + scrollY >= VH() || r.bottom + scrollY <= 0) continue;
      const area = Math.max(0, Math.min(r.right, VW()) - Math.max(r.left, 0)) * Math.max(0, Math.min(r.bottom + scrollY, VH()) - Math.max(r.top + scrollY, 0));
      const tag = el.tagName.toLowerCase(), bi = getComputedStyle(el).backgroundImage;
      if (['img', 'video', 'canvas', 'picture', 'svg'].includes(tag) && area >= vp * .1) { fundo = tag === 'svg' ? 'forma (svg)' : tag === 'img' ? 'foto/imagem' : tag; break; }
      if (bi && bi !== 'none' && area >= vp * .4) { fundo = bi.includes('url(') ? 'imagem de fundo' : 'degradê'; break; }
    }
    const { cont, lista } = secoes(); const cruzam = [];
    const limites = lista.slice(0, -1).map(s => s.getBoundingClientRect().bottom + scrollY);
    if (limites.length) for (const el of cont.querySelectorAll('*')) {
      if (lista.includes(el) || !visivel(el)) continue; const cs = getComputedStyle(el);
      if (['fixed', 'sticky'].includes(cs.position)) continue;
      const r = el.getBoundingClientRect(), t = r.top + scrollY, b = r.bottom + scrollY;
      if (r.width < 80 || r.height < 60 || r.height > VH() * 1.6) continue;
      if (limites.some(l => t < l - 20 && b > l + 20) && !cruzam.some(x => x.contains(el) || el.contains(x))) cruzam.push(el);
    }
    // peça que É filha direta do contêiner e invade a vizinha (cartão com margem negativa entre duas seções)
    const rs = lista.map(e => { const r = e.getBoundingClientRect(); return { e, t: r.top + scrollY, b: r.bottom + scrollY }; });
    for (let i = 0; i < rs.length; i++) for (let k = 0; k < rs.length; k++) {
      if (i === k) continue; const inv = Math.min(rs[i].b, rs[k].b) - Math.max(rs[i].t, rs[k].t);
      if (inv >= 20 && inv < (rs[i].b - rs[i].t) - 20 && (rs[i].b - rs[i].t) <= (rs[k].b - rs[k].t) && !cruzam.includes(rs[i].e)) cruzam.push(rs[i].e);
    }
    let sombras = 0, caixas = 0; let c = cta(); if (c && c.erroCta) c = null; let ctaSombra = false;
    for (const el of document.body.querySelectorAll('*')) {
      if (!visivel(el) || el instanceof SVGElement) continue; const cs = getComputedStyle(el), r = el.getBoundingClientRect(), a = r.width * r.height;
      const bs = cs.boxShadow || '', mm = /(-?[\d.]+)px (-?[\d.]+)px ([\d.]+)px/.exec(bs);
      const tem = (bs !== 'none' && !bs.includes('inset') && mm && parseFloat(mm[3]) >= 6) || /drop-shadow/.test(cs.filter);
      const caixa = a >= 3000 && a <= vp * .6 && (fundoProprio(cs) || parseFloat(cs.borderTopWidth) >= 1) && dist(fundoProprio(cs) || { r: 0, g: 0, b: 0 }, fundoAtras(el)) > 6;
      if (caixa) caixas++;
      if (tem && a >= 400) { sombras++; if (c && (el === c.el || el.contains(c.el))) ctaSombra = true; }
    }
    return { fundoTela1: fundo, secoes: lista.length, atravessamBorda: cruzam.length, sombras, caixas, ctaSombra };
  }

  // ---------- 4. movimento ----------
  function foto() {
    const m = new Map();
    const els = [...document.body.querySelectorAll('*')].slice(0, 2500);
    for (const el of els) {
      if (!visivel(el)) continue; const r = el.getBoundingClientRect(); if (!naTela(r) || r.width * r.height < 80) continue;
      const cs = getComputedStyle(el);
      // só o que é animação (opacidade, transform, recorte, filtro). Mudança de posição por imagem carregando não conta.
      m.set(el, (+cs.opacity).toFixed(2) + '|' + cs.transform + '|' + cs.clipPath + '|' + cs.backgroundPosition + '|' + cs.strokeDashoffset + '|' + cs.filter);
    }
    for (const v of document.querySelectorAll('video')) if (visivel(v) && naTela(v.getBoundingClientRect())) m.set(v, 't' + v.currentTime);
    return m;
  }
  async function mexendo(ms = 170) {
    const a = foto(); await new Promise(r => setTimeout(r, ms)); const b = foto(); const mov = [];
    for (const [el, v] of b) if (a.has(el) && a.get(el) !== v) mov.push(el);
    for (const an of (document.getAnimations ? document.getAnimations() : [])) {
      const el = an.effect && an.effect.target; if (an.playState === 'running' && el && el.isConnected && visivel(el) && naTela(el.getBoundingClientRect()) && !mov.includes(el)) mov.push(el);
    }
    const raizes = mov.filter(el => !mov.some(o => o !== el && o.contains(el)));
    return raizes.map(el => (el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.classList[0] ? '.' + el.classList[0] : '')));
  }
  function textoPronto() {
    const h = titulo(); let c = cta(); if (c && c.erroCta) c = null; const ok = el => !!el && opacidade(el) >= .9 && naTela(el.getBoundingClientRect());
    const b = c && c.naTela1 ? c.el : null;
    return { titulo: h ? ok(h) : null, botao: b ? ok(b) : null, opTitulo: h ? +opacidade(h).toFixed(2) : null, tituloNaTela: h ? naTela(h.getBoundingClientRect()) : null,
      opBotao: b ? +opacidade(b).toFixed(2) : null, botaoNaTela: b ? naTela(b.getBoundingClientRect()) : null };
  }

  // ---------- 5. amostra grátis ----------
  const PALAVRAS = /quiz|calcul|simul|estim|descubra|or[çc]amento|convers|quanto custa|teste gr|experimente|pre[çc]o|cotiz|presupuest|prueba|calculator|estimate|how much|try it|find out/i;
  function recipientesAmostra() {
    const out = new Set(document.querySelectorAll('[data-amostra]'));
    for (const el of document.body.querySelectorAll('*')) if (el.tagName.toLowerCase().startsWith('amostra-')) out.add(el);
    const campos = 'input[type=range],input[type=number],input[type=radio],input[type=checkbox],input[type=file],input[type=color],input[type=date],select';
    for (const i of document.querySelectorAll(campos)) {
      if ([...out].some(o => o.contains(i))) continue;
      const c = i.closest('form,section,article,[role=group],[role=radiogroup],fieldset') || i.parentElement; if (c) out.add(c);
    }
    for (const el of document.querySelectorAll('section,article,form,div[id],div[class]')) {
      if ([...out].some(o => o.contains(el) || el.contains(o))) continue;
      const t = texto(el); if (t.length > 900 || t.length < 20 || !PALAVRAS.test(t)) continue;
      if (el.querySelectorAll('button,input').length >= 2 && !el.querySelector('a[href^="http"]')) out.add(el);
    }
    return [...out].filter(c => {
      if (c.hasAttribute && c.hasAttribute('data-amostra') || c.tagName.toLowerCase().startsWith('amostra-')) return true;
      return !c.querySelector('input[type=email],input[type=tel],input[type=password],textarea'); // isso é formulário de contato
    });
  }
  async function amostra() {
    // sondagem segura: nenhum envio de formulário e nenhum link sai da página enquanto o auditor mexe nos controles
    const trava = e => e.preventDefault();
    const travaLink = e => { const a = e.target.closest && e.target.closest('a[href]'); if (a && !(a.getAttribute('href') || '').startsWith('#')) e.preventDefault(); };
    window.addEventListener('submit', trava, true); window.addEventListener('click', travaLink, true);
    try { return await sondar(); } finally { window.removeEventListener('submit', trava, true); window.removeEventListener('click', travaLink, true); }
  }
  async function sondar() {
    const rec = recipientesAmostra();
    const soContato = !!document.querySelector('form input[type=email],form input[type=tel],form textarea');
    // "controles" = o que a pessoa pode responder agora (rótulos e botões). Passo novo = os controles mudaram (outra pergunta).
    const controles = c => [...c.querySelectorAll('button,[role=button],[role=radio],legend')].filter(visivel).map(texto).join('|') + '#' + c.querySelectorAll('input,select,textarea').length;
    let melhor = null;
    for (const c of rec.slice(0, 4)) {
      let passos = 0, reage = false, antes = texto(c), ctrl = controles(c);
      const campos = c.querySelectorAll('input:not([type=hidden]):not([type=submit]),select,textarea').length;
      for (let i = 0; i < 12; i++) {
        for (const el of c.querySelectorAll('input[type=range],input[type=number]')) {
          const mn = parseFloat(el.min || 0), mx = parseFloat(el.max || 100), st = parseFloat(el.step) || 1, v = Math.round((mn + (mx - mn) * (.35 + .1 * i)) / st) * st;
          Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, String(Math.min(mx, v)));
          el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
        }
        for (const el of c.querySelectorAll('select')) { if (el.options.length > 1) { el.selectedIndex = Math.min(el.options.length - 1, 1 + (i % 2)); el.dispatchEvent(new Event('change', { bubbles: true })); el.dispatchEvent(new Event('input', { bubbles: true })); } }
        const r = [...c.querySelectorAll('input[type=radio],input[type=checkbox]')].find(e => visivel(e) || visivel(e.parentElement)); if (r && !r.checked) r.click();
        const b = [...c.querySelectorAll('button,[role=button],[role=radio]')].find(e => visivel(e) && !e.disabled && e.type !== 'reset' && !(e.tagName === 'A' && !(e.getAttribute('href') || '#').startsWith('#')) && !/voltar|refazer|de novo|back|again|start over|volver|otra vez|de nuevo/i.test(texto(e)));
        if (b) b.click();
        await new Promise(res => setTimeout(res, 260));
        const depois = texto(c), ctrl2 = controles(c);
        if (depois !== antes) reage = true;
        if (ctrl2 !== ctrl) { passos++; ctrl = ctrl2; antes = depois; continue; }   // apareceu outra pergunta: segue
        break;                                                                       // mesmos controles: é ferramenta de uma tela só
      }
      if (reage && passos === 0) passos = 1;
      const m = { reage, passos, campos, onde: seletor(c), texto: texto(c).slice(0, 80) };
      if (!melhor || (m.reage && !melhor.reage)) melhor = m;
    }
    return { encontrada: !!melhor, soContato, ...(melhor || {}) };
  }

  window.__sqv = { espelho, marcaTexto, camadas, mexendo, textoPronto, amostra, _cta: cta };
})();
