// site-que-vende — amostras grátis prontas para colar: <amostra-calculadora> e <amostra-quiz>.
// Um arquivo, sem dependência, sem rede, sem coletar nada. A configuração vai num <script type="application/json"> dentro da tag.
// Aparência: herda a fonte da página e usa a SUA cor de destaque só no botão: defina --amostra-destaque (e, se quiser,
// --amostra-fundo, --amostra-texto, --amostra-borda, --amostra-raio) no CSS da página.
// Acessível: campos com rótulo, resultado em <output aria-live>, teclado, e nenhuma animação.
(() => {
  const CSS = `
amostra-calculadora,amostra-quiz{display:block;box-sizing:border-box;max-width:460px;padding:22px;border-radius:var(--amostra-raio,16px);
  background:var(--amostra-fundo,#fff);color:var(--amostra-texto,#1b1b1f);border:1px solid var(--amostra-borda,rgba(0,0,0,.12));text-align:left}
.am-t{font-size:1.15em;font-weight:700;margin:0 0 4px}.am-s{margin:0 0 14px;opacity:.75;font-size:.92em}
.am-c{margin:0 0 14px;border:0;padding:0}.am-c label,.am-c legend{display:flex;justify-content:space-between;gap:12px;font-weight:600;font-size:.95em;margin:0 0 6px;padding:0;width:100%}
.am-c input[type=range]{width:100%;height:32px;margin:0;accent-color:var(--amostra-texto,#1b1b1f)}
.am-o{display:flex;flex-wrap:wrap;gap:8px}.am-o label{display:inline-flex;align-items:center;min-height:44px;box-sizing:border-box;width:auto;font-weight:500;padding:8px 14px;border:1px solid var(--amostra-borda,rgba(0,0,0,.2));border-radius:999px;cursor:pointer;margin:0}
.am-o input{position:absolute;opacity:0;pointer-events:none}.am-o label:has(input:checked){background:var(--amostra-texto,#1b1b1f);color:var(--amostra-fundo,#fff)}
.am-o label:has(input:focus-visible),.am-q button:focus-visible,.am-b:focus-visible{outline:3px solid var(--amostra-texto,#1b1b1f);outline-offset:2px}
.am-r{display:block;margin:6px 0 14px;padding:14px;border-radius:12px;background:rgba(127,127,127,.12)}.am-r b{display:block;font-size:1.6em;line-height:1.15}.am-r small{opacity:.75}
.am-b{display:inline-block;padding:12px 18px;border-radius:999px;border:0;font:inherit;font-weight:700;cursor:pointer;text-decoration:none;background:var(--amostra-destaque,#c2410c);color:var(--amostra-destaque-texto,#fff)}
.am-p{font-size:.85em;opacity:.7;margin:0 0 8px}.am-q{display:grid;gap:8px;margin:10px 0 0}
.am-q button{font:inherit;text-align:left;padding:12px 14px;border-radius:12px;cursor:pointer;background:transparent;color:inherit;border:1px solid var(--amostra-borda,rgba(0,0,0,.2))}
.am-q button:hover{background:rgba(127,127,127,.12)}.am-l{background:none;border:0;padding:0;margin:12px 0 0;font:inherit;font-size:.9em;text-decoration:underline;cursor:pointer;color:inherit;display:block}`;
  function estilo() { if (document.getElementById('amostra-css')) return; const s = document.createElement('style'); s.id = 'amostra-css'; s.textContent = CSS; document.head.appendChild(s); }
  const el = (tag, attrs = {}, ...filhos) => { const e = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) if (k === 'class') e.className = v; else e.setAttribute(k, v);
    for (const f of filhos) e.append(f); return e; };
  function ler(host) {
    const s = host.querySelector('script[type="application/json"]');
    if (!s) { host.textContent = 'amostra: falta o <script type="application/json"> com a configuração'; return null; }
    try { return JSON.parse(s.textContent); } catch (err) { host.textContent = 'amostra: configuração JSON inválida (' + err.message + ')'; return null; }
  }
  const dinheiro = (v, cfg) => new Intl.NumberFormat(cfg.idioma || document.documentElement.lang || 'pt-BR', { style: 'currency', currency: cfg.moeda || 'BRL', maximumFractionDigits: 0 }).format(v);
  // textos fixos em 3 idiomas: segue "idioma" do JSON ou o lang da página (pt, en, es); cada um pode ser trocado no JSON
  const TXT = { pt: { pergunta: 'Pergunta {n} de {t}', ate: ' a ', prefixo: 'Estimativa', paraVoce: 'Para você', refazer: 'Responder de novo' },
    en: { pergunta: 'Question {n} of {t}', ate: ' to ', prefixo: 'Estimate', paraVoce: 'For you', refazer: 'Start over' },
    es: { pergunta: 'Pregunta {n} de {t}', ate: ' a ', prefixo: 'Estimación', paraVoce: 'Para ti', refazer: 'Responder de nuevo' } };
  const txt = cfg => TXT[String(cfg.idioma || document.documentElement.lang || 'pt').slice(0, 2).toLowerCase()] || TXT.pt;
  let n = 0;

  // <amostra-calculadora>: resultado = (base + soma dos campos) × multiplicadores, mostrado como faixa (± margem)
  // campos: {rotulo, tipo:"faixa", min, max, passo, valor, unidade, porUnidade} | {rotulo, tipo:"opcoes", opcoes:[{rotulo, soma, vezes}]}
  // faixa com "multiplica": true entra como multiplicador (ex.: horários vagos × valor do serviço × 4 semanas)
  class Calculadora extends HTMLElement {
    connectedCallback() {
      if (this._ok) return;
      if (!this.querySelector('script[type="application/json"]') && document.readyState === 'loading') return document.addEventListener('DOMContentLoaded', () => this.connectedCallback(), { once: true });
      this._ok = true; estilo(); const cfg = ler(this); if (!cfg) return; const id = 'am' + (++n);
      const errC = !Array.isArray(cfg.campos) || !cfg.campos.length ? 'falta a lista "campos"'
        : (cfg.campos.find(c => !['faixa', 'opcoes'].includes(c.tipo)) ? 'campo com "tipo" desconhecido: use "faixa" ou "opcoes"'
        : (cfg.campos.find(c => c.tipo === 'opcoes' && (!Array.isArray(c.opcoes) || !c.opcoes.length)) ? 'campo "opcoes" sem a lista "opcoes"'
        : (cfg.campos.find(c => c.tipo === 'faixa' && (c.min === undefined || c.max === undefined)) ? 'campo "faixa" precisa de "min" e "max"' : '')));
      if (errC) { this.textContent = 'amostra-calculadora: ' + errC; return; }
      this.setAttribute('data-amostra', 'calculadora');
      const form = el('form', { novalidate: '' }); form.addEventListener('submit', e => e.preventDefault());
      if (cfg.titulo) form.append(el('p', { class: 'am-t' }, cfg.titulo)); if (cfg.subtitulo) form.append(el('p', { class: 'am-s' }, cfg.subtitulo));
      const leitores = [];
      (cfg.campos || []).forEach((c, i) => {
        if (c.tipo === 'faixa') {
          const inp = el('input', { type: 'range', id: id + i, min: c.min, max: c.max, step: c.passo || 1, value: c.valor ?? c.min });
          const val = el('span', {}); const rot = el('label', { for: id + i }, c.rotulo, val);
          const mostra = () => { val.textContent = inp.value + (c.unidade ? ' ' + c.unidade : ''); };
          inp.addEventListener('input', mostra); mostra(); form.append(el('div', { class: 'am-c' }, rot, inp));
          leitores.push(() => c.multiplica ? { soma: 0, vezes: (+inp.value) * (c.porUnidade || 1) } : { soma: (+inp.value) * (c.porUnidade || 0), vezes: 1 });
        } else {
          const grupo = el('div', { class: 'am-o' });
          c.opcoes.forEach((o, j) => { const r = el('input', { type: 'radio', name: id + i, value: j }); if (j === (c.padrao || 0)) r.checked = true; grupo.append(el('label', {}, r, o.rotulo)); });
          form.append(el('fieldset', { class: 'am-c' }, el('legend', {}, c.rotulo), grupo));
          leitores.push(() => { const o = c.opcoes[+(form.querySelector(`input[name=${id + i}]:checked`) || { value: 0 }).value]; return { soma: o.soma || 0, vezes: o.vezes ?? 1 }; });
        }
      });
      const out = el('output', { class: 'am-r', 'aria-live': 'polite' }); form.append(out);
      if (cfg.botao) form.append(el('a', { class: 'am-b', href: cfg.botao.href || '#', 'data-amostra-cta': '' }, cfg.botao.texto));
      if (cfg.nota) form.append(el('p', { class: 'am-s', style: 'margin:12px 0 0' }, cfg.nota));
      let ultimo = null; // null = primeira conta, ao carregar: não é uso, não dispara evento
      const calc = () => {
        let total = cfg.base || 0, vezes = 1; for (const l of leitores) { const r = l(); total += r.soma; vezes *= r.vezes; } total *= vezes;
        const m = (cfg.margem ?? 10) / 100, arr = cfg.arredondar || 10, a = Math.round(total * (1 - m) / arr) * arr, b = Math.round(total * (1 + m) / arr) * arr;
        out.replaceChildren(el('small', {}, cfg.prefixo || txt(cfg).prefixo), el('b', {}, a === b ? dinheiro(a, cfg) : dinheiro(a, cfg) + (cfg.ate || txt(cfg).ate) + dinheiro(b, cfg)), el('small', {}, cfg.sufixo || ''));
        const chave = a + '|' + b; if (ultimo !== null && chave !== ultimo) this.dispatchEvent(new CustomEvent('amostra-resultado', { bubbles: true, detail: { min: a, max: b } }));
        ultimo = chave;
      };
      form.addEventListener('input', calc); form.addEventListener('change', calc); calc(); this.append(form);
    }
  }

  // <amostra-quiz>: cada opção soma pontos em um ou mais resultados; ganha o que tiver mais pontos
  // perguntas: [{texto, opcoes:[{rotulo, pontos:{chave: n}}]}]   resultados: {chave: {titulo, texto, botao:{texto, href}}}
  class Quiz extends HTMLElement {
    connectedCallback() {
      if (this._ok) return;
      if (!this.querySelector('script[type="application/json"]') && document.readyState === 'loading') return document.addEventListener('DOMContentLoaded', () => this.connectedCallback(), { once: true });
      this._ok = true; estilo(); const cfg = ler(this); if (!cfg) return;
      const errQ = !Array.isArray(cfg.perguntas) || !cfg.perguntas.length ? 'falta a lista "perguntas"'
        : (cfg.perguntas.find(q => !q.texto || !Array.isArray(q.opcoes) || !q.opcoes.length) ? 'cada pergunta precisa de "texto" e de uma lista "opcoes"'
        : (!cfg.resultados || !Object.keys(cfg.resultados).length ? 'falta o objeto "resultados"'
        : ((() => { for (const q of cfg.perguntas) for (const o of q.opcoes) for (const k of Object.keys(o.pontos || {})) if (!(k in cfg.resultados)) return 'a opção "' + o.rotulo + '" dá pontos para "' + k + '", que não existe em "resultados"'; return ''; })())));
      if (errQ) { this.textContent = 'amostra-quiz: ' + errQ; return; }
      this.setAttribute('data-amostra', 'quiz'); const caixa = el('div', { 'aria-live': 'polite' }); this.append(caixa);
      let i = 0, pontos = {};
      const pergunta = () => {
        const p = cfg.perguntas[i]; const ops = el('div', { class: 'am-q', role: 'group', 'aria-label': p.texto });
        p.opcoes.forEach(o => { const b = el('button', { type: 'button' }, o.rotulo);
          b.addEventListener('click', () => { for (const [k, v] of Object.entries(o.pontos || {})) pontos[k] = (pontos[k] || 0) + v; i++; (i < cfg.perguntas.length ? pergunta : resultado)(); }); ops.append(b); });
        caixa.replaceChildren(...(i === 0 && cfg.titulo ? [el('p', { class: 'am-t' }, cfg.titulo)] : []), el('p', { class: 'am-p' }, (cfg.textoPergunta || txt(cfg).pergunta).replace('{n}', i + 1).replace('{t}', cfg.perguntas.length)), el('p', { class: 'am-t' }, p.texto), ops);
        if (i > 0) ops.querySelector('button').focus({ preventScroll: true });
      };
      const resultado = () => {
        const chave = Object.keys(cfg.resultados).reduce((a, k) => (pontos[k] || 0) > (pontos[a] || 0) ? k : a), r = cfg.resultados[chave];
        const de = el('button', { type: 'button', class: 'am-l' }, cfg.refazer || txt(cfg).refazer); de.addEventListener('click', () => { i = 0; pontos = {}; pergunta(); });
        const out = el('output', { class: 'am-r', tabindex: '-1' }, el('small', {}, cfg.prefixo || txt(cfg).paraVoce), el('b', {}, r.titulo), el('small', {}, r.texto || ''));
        caixa.replaceChildren(out, ...(r.botao ? [el('a', { class: 'am-b', href: r.botao.href || '#', 'data-amostra-cta': '' }, r.botao.texto)] : []), de);
        out.focus({ preventScroll: true });
        this.dispatchEvent(new CustomEvent('amostra-resultado', { bubbles: true, detail: { resultado: chave } }));
      };
      pergunta();
    }
  }
  if (!customElements.get('amostra-calculadora')) customElements.define('amostra-calculadora', Calculadora);
  if (!customElements.get('amostra-quiz')) customElements.define('amostra-quiz', Quiz);
})();
