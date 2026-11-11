# site-que-vende

[![site-que-vende](guia/assets/banner.jpg)](https://inematds.github.io/site-que-vende/guia/)

**🇧🇷 [Português](README.md) · 🇺🇸 [English](README.en.md) · 🇪🇸 [Español](README.es.md)**

## O que é

O site-que-vende é um kit que mede, no navegador, os cinco padrões que separam o site que traz cliente do site
"bonito e barato" feito com IA, e diz o que consertar. Ele abre a sua página no computador e no celular, mede
texto, cor, camadas, movimento e amostra grátis, e devolve um relatório com a lista de consertos pronta para colar
no seu agente de código. Vem com uma skill para o Claude Code, dois componentes de amostra grátis (quiz e
calculadora) e um par de páginas de exemplo, uma ruim e uma boa.

[Guia completo](https://inematds.github.io/site-que-vende/guia/) ·
[Exemplo ruim](https://inematds.github.io/site-que-vende/exemplos/ruim/) (0 de 5) ·
[Exemplo bom](https://inematds.github.io/site-que-vende/exemplos/bom/) (5 de 5) ·
[Amostras](https://inematds.github.io/site-que-vende/skill/site-que-vende/amostras/exemplo.html)

## Os 5 padrões

| # | Padrão | Em uma frase | O auditor mede |
|---|---|---|---|
| 1 | Teste do espelho | A primeira tela diz para quem é, o que a pessoa ganha e o que fazer agora | título genérico, botão na 1ª tela (computador e celular), texto do botão, botões disputando |
| 2 | Regra do marca-texto | A cor de destaque só aparece no que é clique (60/30/10) | onde a cor do botão aparece fora de clique, quanto da página ela ocupa |
| 3 | Frente, meio e fundo | Cenário atrás, conteúdo no meio, botão na frente | fundo da 1ª tela, peça atravessando a borda, quantas sombras |
| 4 | Movimento com função | Texto pronto no instante, uma coisa se move por tela, dá para desligar | título em 0,4 s, coisas se movendo por tela, "reduzir movimento" |
| 5 | Amostra grátis | O visitante prova o resultado antes de deixar o contato | existe ferramenta, ela responde na hora, é curta |

Detalhes e números dos testes: [`cinco-padroes.md`](skill/site-que-vende/referencias/cinco-padroes.md).

## Usar em 2 minutos

```bash
git clone https://github.com/inematds/site-que-vende && cd site-que-vende
cd skill/site-que-vende/scripts && npm install && npx playwright install chromium && cd -

node skill/site-que-vende/scripts/auditar.js https://seusite.com.br --saida auditoria
# ou um arquivo:  node skill/site-que-vende/scripts/auditar.js minha-pagina/index.html
```

Saída (o exemplo ruim deste repositório):

```
FALHA  1. Teste do espelho
         - Título genérico: "Soluções inovadoras de agendamento com IA" serve para qualquer empresa
         - O botão diz "Enviar": não conta o que acontece depois do clique.
FALHA  2. Regra do marca-texto
         - A cor do botão (#8b5cf6) aparece em 35 lugares que não são clique (9 borda, 11 texto, 11 título, 4 ícone ou selo).
...
0 de 5 padrões passam.  Relatório: auditoria/relatorio.html
O que consertar (cole no seu agente): auditoria/consertar.md
```

Código de saída: `0` passou nos cinco, `1` algum falhou, `2` erro de uso ou a página não abriu. Serve em CI.

O que saber antes de rodar:

- Cada auditoria leva de 20 a 60 segundos e grava de 1 a 20 MB em `auditoria/` (fotos e relatório). Ponha `auditoria/` no `.gitignore` do site.
- A página é aberta 4 vezes (computador e celular, com e sem "reduzir movimento"): o que ela envia sozinha ao abrir, como analytics, sai 4 vezes. Ao mexer na amostra, o auditor barra todo pedido de rede (envio, GET com dados, pixel, WebSocket), menos arquivos estáticos do próprio site. A lista de títulos genéricos é fixa e erra nos dois sentidos: confira o título você mesmo.
- Enquanto testa a amostra, o auditor barra todo envio da página (formulário, `fetch`, qualquer pedido que não seja GET) e toda saída para outro endereço. Nada é enviado ao site, e o relatório lista o que foi barrado.
- O auditor rola a página e **mexe nos controles** da amostra (sliders, opções, botões) para ver se ela responde. Ele **não envia formulário e não segue link**.
- **Qual é o botão principal?** Ele escolhe o maior botão cheio da primeira tela e diz qual escolheu no relatório. Se escolheu errado, marque o certo no HTML com o atributo `data-cta` (`<a data-cta href="...">`), ou, em site que você não pode editar, rode com `--cta "seletor-css"`.
- Página local que usa arquivos fora da pasta dela (`../`) e não está num repositório git: passe `--raiz <pasta que contém tudo>`. O auditor avisa quando algum arquivo deu 404.
- Os padrões 1 e 4 são medidos no computador (1440×900) e no celular (390×844); os padrões 2, 3 e 5, no computador.
- `node skill/site-que-vende/scripts/auditar.js --help` mostra todas as opções.

## O que tem aqui

| Peça | Arquivo | Faz |
|---|---|---|
| Auditor | `skill/site-que-vende/scripts/auditar.js` | abre a página (URL ou arquivo), mede os 5 padrões, grava `relatorio.html`, `relatorio.json`, `consertar.md` e as fotos |
| Medições | `skill/site-que-vende/scripts/medir.js` | o código que roda dentro da página (cor, botão, camadas, movimento, amostra) |
| Amostras | `skill/site-que-vende/amostras/amostra.js` | `<amostra-calculadora>` e `<amostra-quiz>`: um arquivo, sem dependência, configurados por JSON |
| Modelo das amostras | `skill/site-que-vende/amostras/exemplo.html` | quiz e calculadora funcionando, para copiar |
| Skill | `skill/site-que-vende/SKILL.md` | os 5 passos para o agente: brief → medir → consertar → medir → revisão humana |
| Brief | `skill/site-que-vende/referencias/brief.md` | as perguntas antes do design e o pedido pronto para colar |
| Chaves das amostras | `skill/site-que-vende/referencias/amostras.md` | todas as chaves do JSON do quiz e da calculadora, variáveis de cor e o evento de resultado |
| Os 5 padrões | `skill/site-que-vende/referencias/cinco-padroes.md` | a ideia, os números dos testes e o que é medido |
| Exemplos | `exemplos/ruim/` e `exemplos/bom/` | o mesmo negócio fictício: um falha nos 5, o outro passa nos 5 |
| Testes | `tests/rodar.sh` | 38 verificações: o ruim falha com o motivo certo, o bom passa, as amostras funcionam e 7 casos que já enganaram o auditor |

## O processo, do início ao fim (7 passos)

🧠 = sessão com a pessoa (gasta tokens) · ⚙️ = script (zero token) · 👤 = você

| # | Passo | Comando / o que acontece | Quem |
|---|---|---|---|
| 1 | Brief | responder às perguntas de `referencias/brief.md` (para quem, o que ganha, o que faz agora, três cores, pergunta da amostra) | 👤 + 🧠 |
| 2 | Página | a IA gera a página com o "pedido pronto" do brief (ou você já tem o site no ar) | 🧠 |
| 3 | Medir | `node skill/site-que-vende/scripts/auditar.js <url ou arquivo> --saida auditoria` | ⚙️ |
| 4 | Consertar | colar `auditoria/consertar.md` no agente; ele conserta só o que falhou, na ordem 1 → 5 | 🧠 |
| 5 | Amostra | se o padrão 5 falhou: copiar `amostras/amostra.js` e configurar o quiz ou a calculadora com os números do negócio | 👤 + 🧠 |
| 6 | Medir de novo | repetir 3 e 4 até `5 de 5` (no máximo 3 voltas; depois disso, decidir com a pessoa) | ⚙️ |
| 7 | Revisão humana e publicar | olhar `desktop-tela1.png` e `celular-tela1.png`, responder às três perguntas do espelho, publicar | 👤 |

Testes do kit: `bash tests/rodar.sh`.

## Instalar a skill no Claude Code

```bash
ln -s "$PWD/skill/site-que-vende" ~/.claude/skills/site-que-vende
```

Depois é só pedir: "audita meu site com o site-que-vende" ou "por que meu site não converte?".
Em outro agente (Codex, Cursor), diga: "leia `skill/site-que-vende/SKILL.md` e siga os passos".
Sem agente nenhum, o auditor e as amostras funcionam sozinhos.

## Usar uma amostra no seu site

```html
<amostra-calculadora>
  <script type="application/json">
  { "titulo": "Quanto custa pintar a sua casa?", "base": 350,
    "campos": [
      {"rotulo": "Área de parede", "tipo": "faixa", "min": 20, "max": 300, "passo": 10, "valor": 80, "unidade": "m²", "porUnidade": 28},
      {"rotulo": "Acabamento", "tipo": "opcoes", "opcoes": [{"rotulo": "Econômico", "vezes": 1}, {"rotulo": "Premium", "vezes": 1.6}]}
    ],
    "margem": 12, "prefixo": "Sua pintura fica entre",
    "botao": {"texto": "Receber o orçamento exato", "href": "#contato"} }
  </script>
</amostra-calculadora>
<script src="amostra.js"></script>
```

A cor do botão vem da sua página: `:root { --amostra-destaque: #c2410c; }`. Nada é enviado a servidor nenhum.
Todas as chaves (inclusive `multiplica`, `margem`, `moeda`, `idioma`): [`amostras.md`](skill/site-que-vende/referencias/amostras.md).

## Limites (leia antes de confiar)

- O auditor mede forma, não verdade: um título específico e falso passa. A revisão humana do passo 7 existe por isso.
- Botão principal preto, branco ou cinza: o padrão 2 vira aviso, porque não dá para contar onde mais a cor aparece.
- Site de marca grande costuma falhar em vários padrões e vender assim mesmo: ele já tem a confiança que o site de
  um negócio pequeno precisa conquistar na primeira tela.
- Passar nos cinco não garante venda. Tira do caminho cinco motivos comuns de um site perder cliente; o resto é oferta, preço e tráfego.
- "Sombra", "peça atravessando a borda" e "uma coisa se move por tela" são escolhas de design deste kit. Um site chapado bem resolvido pode vender; o auditor avisa onde ele difere do padrão.
- As mensagens do auditor estão em português. As páginas auditadas podem estar em português, inglês ou espanhol.
- Os tetos do auditor (15% de cor de destaque, 2 usos fora de clique, 6 sombras, 7 perguntas, 4 coisas se movendo) são escolhas deste kit, não números de estudo.
- Um arquivo local é servido em 127.0.0.1 a partir da raiz do repositório git, só enquanto a medição roda.

## Licença

MIT. As páginas de exemplo usam uma empresa fictícia.
