# Os 5 padrões do site que vende

Para cada padrão: a ideia, o que os testes mostraram, o que o auditor mede e como consertar.
Os números são de testes publicados por quem os fez; onde o número vem de quem vende a ferramenta, está dito.

## 1. Teste do espelho (texto)

**Ideia.** Quando a pessoa certa chega na primeira tela, ela tem de se ver: o problema dela, o mundo dela e um
sinal claro de que está no lugar certo. A primeira tela responde: para quem é, o que eu ganho, o que eu faço agora.

**O que os testes mostraram.**
- Uma página de vagas para caminhoneiros convertia 12,1%. Antes de mexer no design, ouviram os motoristas: metade
  acessava pelo celular, o título não tinha benefício e a foto era um aperto de mão de banco de imagem. A página
  refeita em volta do motorista chegou a 21,7%: 79,3% melhor.
- Um site trocou o título "Empresas crescem mais rápido online" por "Crie uma página para o seu negócio": 90% mais
  cliques para a página de preços.
- Outro passou a repetir no título a palavra que a pessoa tinha buscado: 31,4% mais conversão.

**O auditor mede** (computador 1440×900 e celular 390×844): há título na primeira tela; ele não é frase que serve
para qualquer empresa; tem até 16 palavras; existe UM botão principal na primeira tela nos dois tamanhos; o texto
do botão diz o que acontece (não "Saiba mais", "Enviar"); não há um segundo botão forte disputando.

**Ele não mede** se o texto é verdadeiro nem se fala com a pessoa certa. Por isso devolve as três perguntas.

## 2. Regra do marca-texto (cor)

**Ideia.** Se você marca uma linha do livro, acha em dois segundos. Se marca todas, não marcou nenhuma. A IA põe
a cor de destaque no título, nos ícones, na borda, no fundo e no botão; aí o botão some. Regra dos decoradores,
60/30/10: 60% fundo, 30% estrutura (texto, menu, cartões), 10% destaque, que só vai em botão e link.

**O auditor mede:** a cor do botão principal; em quantos elementos que não são clique ela aparece (título, texto,
ícone, borda, fundo: tolera 2); se o botão se separa do fundo em volta; quanto da página a cor de destaque ocupa
(falha acima de 15%) e quanto ocupa a cor de fundo. A imagem `desktop-marca-texto.png` marca cada uso indevido.

## 3. Frente, meio e fundo (camadas)

**Ideia.** No site barato tudo está chapado no mesmo plano e o olho não sabe por onde começar. Num palco há o
cenário pintado, os móveis e o ator. No site: fundo (foto ou forma), meio (o conteúdo), frente (o botão).

**Três passos:** algo real no fundo; uma peça atravessando a borda da seção (cartão ou imagem que entra pela
metade na seção de baixo); sombra só no que importa.

**O auditor mede:** se a primeira tela tem foto, vídeo, forma ou degradê atrás do texto; quantas peças cruzam o
limite entre duas seções (precisa de pelo menos uma); quantos elementos têm sombra (zero = tudo no mesmo plano;
mais que 6 e mais que metade das caixas = sombra em tudo).

## 4. Movimento com função (animação)

**Ideia.** Animação é o jeito mais rápido de um site parecer caro e também de parecer feito por IA. Cada animação
precisa de um trabalho: mostrar o produto, apontar o próximo passo ou mostrar o que acabou de acontecer.

**O que os estudos mostraram.**
- Movimento puxa o olhar. Isso é a vantagem e o defeito: puxa para longe do que a pessoa veio fazer.
- Um estudo universitário testou o mesmo site com e sem parallax: as pessoas acharam a versão com parallax mais
  divertida e com cara mais profissional, mas a experiência de uso, no geral, não melhorou.
- Numa pesquisa americana, cerca de um terço dos adultos acima de 40 anos tinha algum sinal de disfunção do ouvido
  interno (equilíbrio). Por isso celulares e computadores têm a opção "reduzir movimento".

**Três regras:** uma coisa se move por tela; título, texto e botão da primeira tela aparecem prontos; quem ligou
"reduzir movimento" não vê animação.

**O auditor mede:** se título e botão estão legíveis 0,4 s depois de a página chegar; quantas coisas mudam de
opacidade, posição (transform), recorte ou filtro em cada tela, ao rolar e em repouso (falha com 4 ou mais, avisa
com 2 ou 3); e quantas continuam se movendo com `prefers-reduced-motion: reduce` (tem de ser zero).

## 5. Amostra grátis (ferramenta)

**Ideia.** Quase todo site explica tudo e entrega um formulário. Melhor: deixar a pessoa provar o resultado antes
de pedir qualquer coisa. Funciona pelo efeito IKEA: a gente valoriza mais o que ajudou a montar. Quando a pessoa
põe os números dela, o resultado é dela.

**Exemplo.** Um ortodontista pôs no site uma calculadora do preço do aparelho, a pergunta que todo paciente faz.
A empresa que fez a ferramenta diz que ela converteu perto de 45% (número do fabricante, não de estudo independente).

**Três formatos:** quiz ("qual serviço é o seu?"), calculadora de preço, ferramenta útil (conversor, simulador,
estimativa). Tem de ser curto para a pessoa chegar ao fim.

**O auditor mede:** se existe uma ferramenta que não é formulário de contato; se ela muda o resultado na tela
quando alguém mexe (ele mexe nos controles e clica); e o tamanho (falha acima de 7 passos ou campos).

**Pronto para colar:** `amostras/amostra.js` traz `<amostra-calculadora>` e `<amostra-quiz>`.
