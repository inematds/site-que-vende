# site-que-vende

[![site-que-vende](guia/assets/banner-es.jpg)](https://inematds.github.io/site-que-vende/guia/es/)

**🇧🇷 [Português](README.md) · 🇺🇸 [English](README.en.md) · 🇪🇸 [Español](README.es.md)**

## Qué es

site-que-vende es un kit que mide en el navegador los cinco patrones que distinguen un sitio que atrae clientes de un sitio «bonito y barato» hecho con IA, y te dice qué corregir. Abre tu página en una computadora y en un celular, mide texto, color, capas, movimiento y muestra gratis, y devuelve un informe con la lista de correcciones lista para pegar en tu agente de código. Incluye una skill para Claude Code, dos componentes de muestra gratis (quiz y calculadora) y un par de páginas de ejemplo: una mala y una buena.

[Guía completa](https://inematds.github.io/site-que-vende/guia/es/) ·
[Ejemplo malo](https://inematds.github.io/site-que-vende/exemplos/ruim/) (0 de 5) ·
[Ejemplo bueno](https://inematds.github.io/site-que-vende/exemplos/bom/) (5 de 5) ·
[Muestras](https://inematds.github.io/site-que-vende/skill/site-que-vende/amostras/exemplo.html)

## Los 5 patrones

| # | Patrón | En una frase | El auditor mide |
|---|---|---|---|
| 1 | Prueba del espejo | La primera pantalla dice para quién es, qué gana esa persona y qué hacer ahora | título genérico, botón en la primera pantalla (computadora y celular), texto del botón, botones que compiten entre sí |
| 2 | Regla del resaltador | El color de acento solo aparece en lo que se puede tocar (60/30/10) | dónde aparece el color del botón fuera de elementos clicables y cuánto espacio ocupa en la página |
| 3 | Frente, medio y fondo | Escenario detrás, contenido en el medio, botón al frente | fondo de la primera pantalla, elemento que cruza el borde, cantidad de sombras |
| 4 | Movimiento con función | El texto aparece de inmediato, algo se mueve por pantalla y se puede desactivar | título en 0,4 s, elementos que se mueven por pantalla, «reducir movimiento» |
| 5 | Muestra gratis | El visitante prueba el resultado antes de dejar sus datos de contacto | si hay una herramienta, si responde al instante y si es breve |

Detalles y cifras de las pruebas: [`cinco-padroes.md`](skill/site-que-vende/referencias/cinco-padroes.md).

## Úsalo en 2 minutos

```bash
git clone https://github.com/inematds/site-que-vende && cd site-que-vende
cd skill/site-que-vende/scripts && npm install && npx playwright install chromium && cd -

node skill/site-que-vende/scripts/auditar.js https://seusite.com.br --saida auditoria
# ou um arquivo:  node skill/site-que-vende/scripts/auditar.js minha-pagina/index.html
```

Salida (el ejemplo malo de este repositorio):

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

Los mensajes del auditor se generan en portugués.

Código de salida: `0` pasó las cinco pruebas, `1` falló alguna, `2` error de uso. Sirve en CI.

## Qué incluye

| Componente | Archivo | Función |
|---|---|---|
| Auditor | `skill/site-que-vende/scripts/auditar.js` | abre la página (URL o archivo), mide los 5 patrones, guarda `relatorio.html`, `relatorio.json`, `consertar.md` y las capturas |
| Mediciones | `skill/site-que-vende/scripts/medir.js` | el código que se ejecuta dentro de la página (color, botón, capas, movimiento, muestra) |
| Muestras | `skill/site-que-vende/amostras/amostra.js` | `<amostra-calculadora>` y `<amostra-quiz>`: un archivo, sin dependencias, configurados con JSON |
| Modelo de las muestras | `skill/site-que-vende/amostras/exemplo.html` | quiz y calculadora en funcionamiento, para copiar |
| Skill | `skill/site-que-vende/SKILL.md` | los 5 pasos para el agente: brief → medir → corregir → medir → revisión humana |
| Brief | `skill/site-que-vende/referencias/brief.md` | las preguntas previas al diseño y el pedido listo para pegar |
| Los 5 patrones | `skill/site-que-vende/referencias/cinco-padroes.md` | la idea, las cifras de las pruebas y lo que se mide |
| Ejemplos | `exemplos/ruim/` y `exemplos/bom/` | el mismo negocio ficticio: uno falla en los 5 patrones y el otro los supera |
| Pruebas | `tests/rodar.sh` | 21 verificaciones: el malo falla por el motivo correcto, el bueno pasa y las muestras funcionan |

## El proceso, de principio a fin (7 pasos)

🧠 = sesión con la persona (consume tokens) · ⚙️ = script (cero tokens) · 👤 = tú

| # | Paso | Comando / qué sucede | Quién |
|---|---|---|---|
| 1 | Brief | responder las preguntas de `referencias/brief.md` (para quién, qué gana, qué hace ahora, tres colores, pregunta de la muestra) | 👤 + 🧠 |
| 2 | Página | la IA genera la página con el «pedido listo» del brief (o ya tienes el sitio en línea) | 🧠 |
| 3 | Medir | `node skill/site-que-vende/scripts/auditar.js <url ou arquivo> --saida auditoria` | ⚙️ |
| 4 | Corregir | pegar `auditoria/consertar.md` en el agente; corrige solo lo que falló, en orden del 1 al 5 | 🧠 |
| 5 | Muestra | si falló el patrón 5: copiar `amostras/amostra.js` y configurar el quiz o la calculadora con los números del negocio | 👤 + 🧠 |
| 6 | Volver a medir | repetir los pasos 3 y 4 hasta obtener `5 de 5` (máximo 3 rondas; después de eso, decidir con la persona) | ⚙️ |
| 7 | Revisión humana y publicación | mirar `desktop-tela1.png` y `celular-tela1.png`, responder las tres preguntas del espejo y publicar | 👤 |

Pruebas del kit: `bash tests/rodar.sh`.

## Instalar la skill en Claude Code

```bash
ln -s "$PWD/skill/site-que-vende" ~/.claude/skills/site-que-vende
```

Después, solo tienes que pedir: «audita mi sitio con site-que-vende» o «¿por qué mi sitio no convierte?».
En otro agente (Codex, Cursor), di: «lee `skill/site-que-vende/SKILL.md` y sigue los pasos».
Sin ningún agente, el auditor y las muestras funcionan por sí solos.

## Usar una muestra en tu sitio

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

El color del botón viene de tu página: `:root { --amostra-destaque: #c2410c; }`. No se envía nada a ningún servidor.

## Límites (lee antes de confiar)

- El auditor mide la forma, no la verdad: un título específico y falso pasa. Por eso existe la revisión humana del paso 7.
- Si el botón principal es negro, blanco o gris, el patrón 2 se convierte en una advertencia, porque no se puede contar dónde más aparece el color.
- Los sitios de marcas grandes suelen fallar en varios patrones y aun así vender: ya tienen la confianza que un negocio pequeño necesita ganarse en la primera pantalla.
- Pasar las cinco pruebas no garantiza ventas. Garantiza que el sitio no pierde clientes por los cinco motivos más comunes.
- Los mensajes del auditor están en portugués. Las páginas auditadas pueden estar en portugués, inglés o español.

## Licencia

MIT. Las páginas de ejemplo usan una empresa ficticia.
