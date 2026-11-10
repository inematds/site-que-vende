#!/usr/bin/env bash
# Teste de aceitação do kit: a página ruim tem de FALHAR nos 5 padrões (com o motivo certo em cada um)
# e a página boa tem de PASSAR nos 5. Também confere as amostras (quiz e calculadora) no navegador.
# Uso: bash tests/rodar.sh
set -u
cd "$(dirname "$0")/.."
A="node skill/site-que-vende/scripts/auditar.js"; T=$(mktemp -d); falhas=0
ok(){ echo "  ok   $1"; }; ruim(){ echo "  ERRO $1"; falhas=$((falhas+1)); }
tem(){ grep -q "$2" "$1" && ok "$3" || ruim "$3"; }

echo "1) página ruim falha nos 5"
$A exemplos/ruim/index.html --saida "$T/ruim" > "$T/ruim.txt" 2>&1; rc=$?
[ $rc -eq 1 ] && ok "sai com código 1" || ruim "código de saída $rc (esperado 1)"
tem "$T/ruim.txt" "0 de 5" "0 de 5 padrões"
tem "$T/ruim.txt" "Título genérico" "1 espelho: título genérico"
tem "$T/ruim.txt" "não conta o que acontece" "1 espelho: botão vago"
tem "$T/ruim.txt" "lugares que não são clique" "2 marca-texto: destaque fora do clique"
tem "$T/ruim.txt" "caixa de cor lisa" "3 camadas: fundo liso"
tem "$T/ruim.txt" "pilha de caixas" "3 camadas: nada atravessa a borda"
tem "$T/ruim.txt" "mesmo plano" "3 camadas: sem sombra"
tem "$T/ruim.txt" "não está legível 0,4 s" "4 movimento: título espera a animação"
tem "$T/ruim.txt" "se movem ao mesmo tempo" "4 movimento: várias coisas se movendo"
tem "$T/ruim.txt" "reduzir movimento" "4 movimento: ignora reduzir movimento"
tem "$T/ruim.txt" "formulário de contato" "5 amostra: só formulário"
for f in relatorio.html relatorio.json consertar.md desktop-marca-texto.png; do [ -s "$T/ruim/$f" ] && ok "gera $f" || ruim "não gerou $f"; done

echo "2) página boa passa nos 5"
$A exemplos/bom/index.html --saida "$T/bom" > "$T/bom.txt" 2>&1; rc=$?
[ $rc -eq 0 ] && ok "sai com código 0" || { ruim "código de saída $rc (esperado 0)"; cat "$T/bom.txt"; }
tem "$T/bom.txt" "5 de 5" "5 de 5 padrões"

echo "3) amostras (quiz e calculadora)"
$A skill/site-que-vende/amostras/exemplo.html --saida "$T/am" --json > "$T/am.json" 2>/dev/null
node -e '
const r=JSON.parse(require("fs").readFileSync(process.argv[1]));const a=r.padroes[4];
if(!a.passa){console.log("  ERRO amostra não passou: "+a.falhas.join("; "));process.exit(1)}
console.log("  ok   padrão 5 passa na página de amostras ("+a.medidas["ferramenta encontrada"]+", "+a.medidas["passos até o fim"]+" passo(s))")' "$T/am.json" || falhas=$((falhas+1))

echo "4) uso errado"
$A > /dev/null 2>&1; [ $? -eq 2 ] && ok "sem argumento sai 2" || ruim "sem argumento deveria sair 2"
$A nao-existe.html > /dev/null 2>&1; [ $? -eq 2 ] && ok "arquivo inexistente sai 2" || ruim "arquivo inexistente deveria sair 2"

rm -rf "$T"
[ $falhas -eq 0 ] && { echo "TUDO OK"; exit 0; } || { echo "$falhas ERRO(S)"; exit 1; }
