# FALHAS — site-que-vende

| data | o que quebrou | menor correção | prompt \| infra |
|---|---|---|---|
| 11/11/2026 | 3ª revisão: GET com dados, pixel e WebSocket passavam na sondagem (o texto dizia "nada é enviado"); data-cta ignorado em botão de contorno; URIError com % no nome; alvo pasta perdia caminhos; amostra.js com moeda/JSON errados mostrava caixa vazia | só GET estático do próprio site passa + routeWebSocket; marca lida antes dos filtros; try no decode; pasta → pasta/index.html; validação na caixa (1.2.1) | prompt |
