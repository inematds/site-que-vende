# Brief — as perguntas antes de qualquer design

Responda antes de pedir a página à IA. Cole as respostas no pedido. Sem elas, a IA escreve para "qualquer empresa".

## As três do espelho (obrigatórias)

1. **Para quem é?** Uma pessoa, não um mercado. "Cabeleireira que atende sozinha", não "profissionais de beleza".
2. **O que ela ganha?** O resultado na vida dela, não o recurso. "Agenda cheia sem responder mensagem", não "agendamento com IA".
3. **O que ela faz agora?** Uma ação só, com o que acontece depois do clique. "Ver horários livres", não "Saiba mais".

## As que afinam o texto

4. Que palavra essa pessoa usa para procurar isso? (Use a mesma palavra no título.)
5. Qual é a pergunta que todo cliente faz antes de comprar? (Vira a amostra grátis: calculadora, quiz ou ferramenta.)
6. Onde ela vai abrir o site: celular ou computador? (Se for celular, o botão cabe na primeira tela de 390 px?)
7. Qual é a dúvida ou o medo que faz ela desistir? (Responda logo abaixo do botão, em uma linha.)
8. Que foto mostra o mundo dela? (Do seu trabalho ou do seu produto. Nada de aperto de mão de banco de imagem.)

## As três cores

9. Fundo (60%), estrutura (30%: texto, menu, cartões) e destaque (10%: só botão e link). Se não souber, escolha
   uma paleta pronta, pegue três códigos e diga à IA: "use só estas três cores, regra 60/30/10, a de destaque
   apenas em botões e links".

## Pedido pronto para colar

```
Crie a página de <negócio>.
Para quem é: <1>
O que a pessoa ganha: <2>
Ação principal (um botão, marcado com data-cta): <3>
Palavra que ela usa: <4>
Amostra grátis (responde a "<5>"): copie o arquivo amostra.js do kit site-que-vende (skill/site-que-vende/amostras/) para este site e use <amostra-calculadora> ou <amostra-quiz>; os números são estes: <...>
Cores: fundo <hex>, estrutura <hex>, destaque <hex> (destaque só em botões e links).
Primeira tela: título, uma linha de apoio e o botão, prontos sem animação, com uma foto real no fundo.
Uma peça atravessa a borda da primeira seção. Sombra só no botão e no cartão principal.
No máximo uma coisa se move por tela, e nada se move com prefers-reduced-motion: reduce.
Não invente depoimento, número nem cliente.
Depois rode o auditor do kit: node <pasta-do-kit>/skill/site-que-vende/scripts/auditar.js index.html  e conserte até dar 5 de 5.
```
