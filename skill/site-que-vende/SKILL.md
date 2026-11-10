---
name: site-que-vende
description: Revisa e conserta um site (ou landing page) feito com IA para ele trazer cliente - mede 5 padrões na página renderizada (primeira tela que fala com a pessoa certa, cor de destaque só no clique, camadas, movimento com função, amostra grátis) e conserta até passar. Use quando pedirem "revisa meu site", "por que meu site não converte", "meu site parece barato / com cara de IA", "audita essa landing page", "faz um site que vende", ou antes de entregar qualquer site de negócio.
---

# site-que-vende

Um site feito com IA costuma sair bonito e mesmo assim parecer barato, sempre pelos mesmos cinco motivos.
Esta skill não confia no olho: ela **mede** os cinco padrões no navegador e só entrega quando o auditor passa.

Explicação de cada padrão, com os números dos testes: `referencias/cinco-padroes.md`.

**Caminhos.** Os caminhos deste arquivo (`scripts/`, `amostras/`, `referencias/`) são relativos à pasta desta skill
(`~/.claude/skills/site-que-vende/` quando instalada, ou `skill/site-que-vende/` dentro do repositório do kit). Você
trabalha na pasta do site do cliente: chame o auditor pelo caminho completo e **copie** `amostras/amostra.js` para
dentro do site. Abaixo, `$KIT` é essa pasta.

## Quando NÃO usar

Site que não vende nada (portfólio de arte, convite, página de evento visual): os padrões 1 e 5 não se aplicam.
Rode o auditor só para ver as medidas e avise a pessoa.

## Os 5 passos

### 1. Brief (antes de qualquer design)

Se a página ainda não existe, ou se o padrão 1 falhar, faça as perguntas de `referencias/brief.md` e grave as
respostas em `BRIEF.md`. São três respostas obrigatórias: para quem é, o que a pessoa ganha, o que ela faz agora.
**Não invente as respostas.** Sem elas, o texto sai genérico e nenhum design salva.

### 2. Medir

```bash
node $KIT/scripts/auditar.js <url ou arquivo.html> --saida auditoria
```

Sai `0` se os cinco passam e `1` se algum falha. Grava em `auditoria/`:
`relatorio.html` (para a pessoa abrir), `relatorio.json` (medidas), `consertar.md` (lista do que fazer) e
`desktop-marca-texto.png` (a cor do botão marcada em tudo que não é clique).

Primeira vez: `cd $KIT/scripts && npm install && npx playwright install chromium` (baixa o Chromium, uns 150 MB).

O relatório diz qual botão ele tratou como principal. Se for o errado, marque o certo com `data-cta` no HTML
(ou `--cta "seletor"` em site que você não edita) e meça de novo. Enquanto testa a amostra, o auditor barra todo envio
(formulário, `fetch`, qualquer pedido que não seja GET) e toda saída da página, e lista o que barrou. Ponha `auditoria/`
no `.gitignore` do site.

- Site com servidor de desenvolvimento (Vite, Next e parecidos): suba o servidor e audite pela URL (`http://localhost:5173`), não pelo arquivo.
- Código de saída `2` = a página não abriu, o seletor de `--cta` não casou ou faltou argumento: leia a mensagem, corrija e rode de novo; não é falha dos padrões.
- Página local que usa `../` fora de um repositório git: passe `--raiz <pasta que contém tudo>`.
- Os tetos (15% de cor, 2 usos fora de clique, 6 sombras, 7 perguntas, 4 coisas se movendo) são escolhas do kit: se a pessoa discordar de um aviso de design, a decisão é dela.

### 3. Consertar

Leia `auditoria/consertar.md` e conserte **só o que falhou**, um padrão por vez, nesta ordem: 1 → 2 → 3 → 4 → 5
(texto antes de cor, cor antes de camada). Regras:

- Padrão 1: reescreva com as respostas do brief. Resultado no título, não recurso. Um botão, uma ação.
- Padrão 2: três cores só. A do botão não aparece em título, ícone, borda nem fundo.
- Padrão 3: algo real no fundo da primeira tela; UMA peça entrando na seção de baixo; sombra só no botão e num cartão.
- Padrão 4: primeira tela sem animação de entrada; uma coisa se move por tela; `@media (prefers-reduced-motion: reduce)` desliga tudo.
- Padrão 5: copie `$KIT/amostras/amostra.js` para o site e use `<amostra-calculadora>` ou `<amostra-quiz>`
  (modelo em `amostras/exemplo.html`, todas as chaves em `referencias/amostras.md`). A pergunta da amostra é a que todo cliente faz antes de comprar.
  **Os números da calculadora vêm do dono do negócio**; se não tiver, pergunte.

### 4. Medir de novo

Repita os passos 2 e 3 até sair `5 de 5`. Não mexa no auditor nem nas regras para passar.
Se depois de 3 voltas um padrão ainda falha, pare e mostre a medida à pessoa: pode ser decisão dela.

### 5. Revisão humana

O auditor não julga texto. Mostre à pessoa a primeira tela (`auditoria/desktop-tela1.png` e `celular-tela1.png`)
com as três perguntas do fim do `consertar.md` e espere a resposta antes de publicar.

## O que nunca fazer

- Inventar depoimento, número, cliente, prêmio ou selo.
- Pôr `data-cta` num botão escondido, ou esconder elementos, só para o auditor passar.
- Trocar o texto que o dono escreveu quando ele já responde às três perguntas.
- Pedir e-mail antes de mostrar o resultado da amostra.

## Limites do auditor (diga isso à pessoa)

- Ele mede forma, não verdade: um título específico e falso passa.
- Botão principal preto, branco ou cinza: o padrão 2 não consegue contar onde mais a cor aparece (vira aviso).
- Animação feita em `<canvas>` ou WebGL conta como uma coisa só.
- Site de marca grande costuma falhar em vários padrões e vender assim mesmo: ele já tem a confiança que o
  site de um negócio pequeno precisa conquistar na primeira tela.
- Passar nos cinco não garante venda. Garante que o site não perde cliente pelos cinco motivos mais comuns.
