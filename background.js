'use strict';
// ══════════════════════════════════════════════════════════════════
//  Multibox — cada "caixa" é um container (contextualIdentities) com
//  cookies/localStorage próprios. Abrir o mesmo site em caixas diferentes
//  = logins separados no MESMO Firefox (ex: 2 WhatsApp Web).
// ══════════════════════════════════════════════════════════════════

const CORES  = ['blue', 'turquoise', 'green', 'yellow', 'orange', 'red', 'pink', 'purple'];
const ICONES = ['fingerprint', 'briefcase', 'dollar', 'cart', 'gift', 'vacation', 'food', 'fruit', 'pet', 'tree', 'chill', 'fence'];

async function proximoN() {
  const { contador } = await browser.storage.local.get('contador');
  const n = (contador || 0) + 1;
  await browser.storage.local.set({ contador: n });
  return n;
}
async function idsSalvos() {
  const { caixas } = await browser.storage.local.get('caixas');
  return caixas || [];
}
async function salvarIds(ids) { await browser.storage.local.set({ caixas: ids }); }

// lista as caixas do Multibox que ainda existem (reconcilia com o Firefox)
async function listar() {
  const ids = await idsSalvos();
  const todas = await browser.contextualIdentities.query({});
  const porId = Object.fromEntries(todas.map(c => [c.cookieStoreId, c]));
  const vivos = ids.filter(id => porId[id]);
  if (vivos.length !== ids.length) await salvarIds(vivos);
  return vivos.map(id => ({
    cookieStoreId: id, name: porId[id].name, color: porId[id].color,
    colorCode: porId[id].colorCode, icon: porId[id].icon,
  }));
}

function urlValida(u) { return typeof u === 'string' && /^https?:\/\//i.test(u); }

async function novaCaixa(url, nome) {
  const n = await proximoN();
  const ci = await browser.contextualIdentities.create({
    name: nome || `Caixa ${n}`,
    color: CORES[(n - 1) % CORES.length],
    icon: ICONES[(n - 1) % ICONES.length],
  });
  const ids = await idsSalvos(); ids.push(ci.cookieStoreId); await salvarIds(ids);
  if (urlValida(url)) await browser.tabs.create({ url, cookieStoreId: ci.cookieStoreId, active: true });
  return { cookieStoreId: ci.cookieStoreId, name: ci.name, color: ci.color, colorCode: ci.colorCode, icon: ci.icon };
}

async function abrirNaCaixa(cookieStoreId, url) {
  if (!urlValida(url)) return { ok: false, error: 'URL inválida (só http/https)' };
  await browser.tabs.create({ url, cookieStoreId, active: true });
  return { ok: true };
}

async function removerCaixa(cookieStoreId) {
  const tabs = await browser.tabs.query({ cookieStoreId });
  for (const t of tabs) { try { await browser.tabs.remove(t.id); } catch (_) {} }
  try { await browser.contextualIdentities.remove(cookieStoreId); } catch (_) {}
  await salvarIds((await idsSalvos()).filter(id => id !== cookieStoreId));
  return { ok: true };
}

browser.runtime.onMessage.addListener((msg) => {
  switch (msg && msg.type) {
    case 'listar':      return listar();
    case 'novaCaixa':   return novaCaixa(msg.url, msg.nome);
    case 'abrirNaCaixa':return abrirNaCaixa(msg.cookieStoreId, msg.url);
    case 'removerCaixa':return removerCaixa(msg.cookieStoreId);
    default: return false;
  }
});

// menu de contexto: abrir a página/link em uma NOVA caixa
browser.runtime.onInstalled.addListener(() => {
  browser.menus.create({ id: 'mb-nova', title: 'Multibox: abrir em NOVA caixa', contexts: ['page', 'link'] });
});
browser.menus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'mb-nova') {
    const url = info.linkUrl || info.pageUrl || (tab && tab.url);
    if (urlValida(url)) await novaCaixa(url);
  }
});
