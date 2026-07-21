# 🗃️ Multibox (Firefox MV3)

Abra **várias sessões isoladas do mesmo site** no mesmo Firefox — ex: **2 WhatsApp Web**
logados em contas diferentes, 2 Instagram, 2 Gmail, etc. Cada "caixa" é um **container**
(`contextualIdentities`) com cookies/localStorage próprios.

> ☕ **Apoie o projeto:** se te ajudou, ajude a manter o desenvolvimento e custear os gastos →
> **[Doar no Ko-fi](https://ko-fi.com/anchelslabdev)** (aceita cartão internacional e PayPal).

## Como usar
Funciona com **qualquer site/aplicação** — não só os apps de exemplo.
- Clique no ícone do Multibox.
- **➕ Abrir esta página numa nova caixa** → duplica o site atual numa sessão nova (login separado).
- **Abrir qualquer site em nova caixa** → digite qualquer URL (ex: `netflix.com`) e abra numa caixa.
- **Meus apps** → lista de atalhos que você mesmo edita: `＋ adicionar app` (nome + URL de qualquer site) e `✕` pra remover. Vem com WhatsApp/Telegram/Instagram/Gmail de exemplo, mas você troca por quais quiser.
- **Suas caixas** → `abrir aqui` põe a página atual naquela caixa; `✕` remove a caixa (fecha as abas).
- Botão direito em qualquer página/link → **Multibox: abrir em NOVA caixa**.

As abas de cada caixa aparecem com uma **cor** embaixo (recurso nativo de containers do Firefox),
então dá pra saber qual é qual.

## Requisito
Usa o recurso de **Containers** do Firefox. A permissão `contextualIdentities` já liga isso;
se por acaso não funcionar, garanta `privacy.userContext.enabled = true` no `about:config`
(ou tenha o "Multi-Account Containers" da Mozilla instalado uma vez).

## Instalar (teste rápido)
`about:debugging#/runtime/this-firefox` → **Carregar extensão temporária** → escolha o `manifest.json`.
> Some ao fechar o Firefox. Pra deixar permanente, empacote e assine (veja abaixo).

## Empacotar
Rode o `empacotar.ps1` (clique direito → Executar com PowerShell). Gera `..\multibox.xpi`
com barras normais e `manifest.json` na raiz (o `Compress-Archive` do PowerShell gera zip
inválido pro Firefox — use o script).

## Deixar permanente / assinar
Firefox normal só instala extensão **assinada pela Mozilla**:
- **AMO unlisted** (`web-ext sign`, grátis) → `.xpi` assinado que instala em qualquer Firefox.
- **Firefox ESR/Developer** com `xpinstall.signatures.required=false` → instala não assinado.
