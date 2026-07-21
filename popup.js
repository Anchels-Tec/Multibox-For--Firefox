'use strict';
const $ = id => document.getElementById(id);
const send = msg => browser.runtime.sendMessage(msg);

// apps padrão (semente na 1ª vez) — o usuário pode adicionar/remover QUALQUER um
const APPS_PADRAO = [
  { nome: 'WhatsApp',  emoji: '💬', url: 'https://web.whatsapp.com/' },
  { nome: 'Telegram',  emoji: '✈️', url: 'https://web.telegram.org/' },
  { nome: 'Instagram', emoji: '📷', url: 'https://www.instagram.com/' },
  { nome: 'Gmail',     emoji: '📧', url: 'https://mail.google.com/' },
];

let abaAtual = null;

// aceita "netflix.com", "site.com/app" ou URL completa
function normalizarUrl(s) {
  s = (s || '').trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
  try { new URL(s); return s; } catch { return null; }
}

async function carregarApps() {
  const { apps } = await browser.storage.local.get('apps');
  if (!apps) { await browser.storage.local.set({ apps: APPS_PADRAO }); return APPS_PADRAO.slice(); }
  return apps;
}
async function salvarApps(apps) { await browser.storage.local.set({ apps }); }

async function init() {
  const [t] = await browser.tabs.query({ active: true, currentWindow: true });
  abaAtual = t;
  const ehWeb = t && /^https?:\/\//i.test(t.url || '');
  try { $('site').textContent = ehWeb ? new URL(t.url).hostname : 'página interna (use o campo abaixo pra abrir um site)'; }
  catch { $('site').textContent = '—'; }
  $('btn-nova').disabled = !ehWeb;

  await renderApps();
  await renderLista();
}

async function renderApps() {
  const apps = await carregarApps();
  const box = $('presets');
  box.innerHTML = '';
  apps.forEach((a, i) => {
    const b = document.createElement('div');
    b.className = 'preset';
    b.innerHTML = `<span class="pemoji">${esc(a.emoji || '🗔')}</span><span class="pnome">${esc(a.nome)}</span><span class="prm" title="remover">✕</span>`;
    b.querySelector('.pnome').addEventListener('click', () => abrirNova(a.url, a.nome));
    b.querySelector('.pemoji').addEventListener('click', () => abrirNova(a.url, a.nome));
    b.querySelector('.prm').addEventListener('click', async (e) => {
      e.stopPropagation();
      const arr = await carregarApps(); arr.splice(i, 1); await salvarApps(arr); renderApps();
    });
    box.appendChild(b);
  });
}

async function abrirNova(url, nome) {
  const u = normalizarUrl(url);
  if (!u) return;
  await send({ type: 'novaCaixa', url: u, nome });
  window.close();
}

async function renderLista() {
  const caixas = await send({ type: 'listar' });
  const box = $('lista');
  if (!caixas || !caixas.length) { box.innerHTML = '<div class="vazio">Nenhuma caixa ainda.</div>'; return; }
  box.innerHTML = '';
  const podeAqui = abaAtual && /^https?:\/\//i.test(abaAtual.url || '');
  for (const c of caixas) {
    const el = document.createElement('div');
    el.className = 'box';
    el.innerHTML = `
      <span class="dot" style="background:${c.colorCode || '#3b82f6'}"></span>
      <span class="nome">${esc(c.name)}</span>
      <button class="mini abrir" title="Abrir a página atual nesta caixa" ${podeAqui ? '' : 'disabled'}>abrir aqui</button>
      <button class="mini rm" title="Remover a caixa e fechar suas abas">✕</button>`;
    el.querySelector('.abrir').addEventListener('click', async () => {
      await send({ type: 'abrirNaCaixa', cookieStoreId: c.cookieStoreId, url: abaAtual.url });
      window.close();
    });
    el.querySelector('.rm').addEventListener('click', async () => {
      await send({ type: 'removerCaixa', cookieStoreId: c.cookieStoreId });
      renderLista();
    });
    box.appendChild(el);
  }
}

// abrir a página atual em nova caixa
$('btn-nova').addEventListener('click', async () => {
  if (abaAtual) abrirNova(abaAtual.url);
});

// abrir uma URL digitada (qualquer site)
async function abrirUrlDigitada() {
  const u = normalizarUrl($('url').value);
  if (!u) { $('url').focus(); return; }
  await send({ type: 'novaCaixa', url: u });
  window.close();
}
$('btn-url').addEventListener('click', abrirUrlDigitada);
$('url').addEventListener('keydown', e => { if (e.key === 'Enter') abrirUrlDigitada(); });

// adicionar app personalizado
$('btn-add').addEventListener('click', () => { $('add-form').hidden = false; $('btn-add').hidden = true; $('app-nome').focus(); });
$('app-cancelar').addEventListener('click', () => { $('add-form').hidden = true; $('btn-add').hidden = false; });
$('app-salvar').addEventListener('click', async () => {
  const nome = $('app-nome').value.trim();
  const url = normalizarUrl($('app-url').value);
  if (!nome || !url) { return; }
  const arr = await carregarApps();
  arr.push({ nome, url });
  await salvarApps(arr);
  $('app-nome').value = ''; $('app-url').value = '';
  $('add-form').hidden = true; $('btn-add').hidden = false;
  renderApps();
});

function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])); }

init();
