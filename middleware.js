// Portão de senha do dashboard Agenda Lucrativa. Roda antes de QUALQUER arquivo do site,
// então nem o link direto de um HTML abre sem login.
// A senha vem da variável de ambiente DASH_SENHA (cadastrada no painel do Vercel, nunca no código).
import { next } from '@vercel/functions';

export const config = { matcher: ['/((?!favicon\\.ico$).*)'] };

const COOKIE = 'dash_al_sessao';
const TRINTA_DIAS = 60 * 60 * 24 * 30;

async function tokenDa(senha) {
  // Trocar a senha no Vercel derruba todas as sessões abertas
  const enc = new TextEncoder();
  const chave = await crypto.subtle.importKey('raw', enc.encode(senha), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', chave, enc.encode('dash-agenda-lucrativa-v1'));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function iguais(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

function destinoSeguro(v) {
  return typeof v === 'string' && v.startsWith('/') && !v.startsWith('//') ? v : '/';
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function telaDeLogin(volta, erro, status) {
  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>Agenda Lucrativa · Dashboard</title>
<link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{min-height:100vh;display:grid;place-items:center;padding:16px;background:#0c0c0c;color:#f5f5f4;font-family:'Figtree',system-ui,sans-serif}
.box{width:100%;max-width:380px;background:#161616;border:1px solid #2a2a2a;border-radius:24px;padding:32px 28px}
.logo{display:flex;align-items:center;gap:10px;font-weight:700;font-size:20px;margin-bottom:26px}
.mk{width:36px;height:36px;border-radius:10px;background:#f5f5f4;color:#0c0c0c;display:grid;place-items:center}
h1{font-size:26px;font-weight:600;letter-spacing:-.8px;margin-bottom:6px}
p{color:#9a9a97;font-size:14.5px;margin-bottom:22px}
input{width:100%;height:48px;border-radius:999px;border:1px solid #363636;background:#0c0c0c;color:#f5f5f4;padding:0 18px;font:inherit;font-size:15.5px;outline:0}
input:focus{border-color:#8d8d8a}
button{width:100%;height:48px;margin-top:12px;border:0;border-radius:999px;background:#f5f5f4;color:#0c0c0c;font:inherit;font-weight:600;font-size:15.5px;cursor:pointer}
.erro{color:#ff8a7a;font-size:13.5px;margin-top:12px}
</style></head><body><form class="box" method="POST" action="/__entrar">
<div class="logo"><span class="mk"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M10.4 2h3.2v7.1l5-5 2.3 2.3-5 5H22v3.2h-7.1l5 5-2.3 2.3-5-5V22h-3.2v-7.1l-5 5-2.3-2.3 5-5H2v-3.2h7.1l-5-5 2.3-2.3 5 5z"/></svg></span>Agenda Lucrativa</div>
<h1>Área restrita</h1><p>Digite a senha para abrir o dashboard do funil.</p>
<input type="password" name="senha" placeholder="Senha" autocomplete="current-password" autofocus required>
<input type="hidden" name="volta" value="${esc(volta)}">
<button type="submit">Entrar</button>
${erro ? '<div class="erro">Senha incorreta. Tente de novo.</div>' : ''}
</form></body></html>`;
  return new Response(html, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow' },
  });
}

function rotear(url) {
  return next();
}

export default async function middleware(request) {
  const senha = process.env.DASH_SENHA;
  if (!senha) {
    return new Response('Dashboard fechado: falta cadastrar a senha (variável DASH_SENHA) no projeto da Vercel.', { status: 503 });
  }
  const url = new URL(request.url);
  const token = await tokenDa(senha);

  if (url.pathname === '/__entrar' && request.method === 'POST') {
    const form = await request.formData();
    const volta = destinoSeguro(form.get('volta'));
    if (iguais(String(form.get('senha') || ''), senha)) {
      return new Response(null, {
        status: 303,
        headers: {
          Location: volta,
          'Set-Cookie': `${COOKIE}=${token}; Path=/; Max-Age=${TRINTA_DIAS}; HttpOnly; Secure; SameSite=Lax`,
        },
      });
    }
    await new Promise((r) => setTimeout(r, 900)); // freia tentativa em série
    return telaDeLogin(volta, true, 401);
  }

  if (url.pathname === '/__sair') {
    return new Response(null, {
      status: 303,
      headers: { Location: '/', 'Set-Cookie': `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax` },
    });
  }

  const cookie = (request.headers.get('cookie') || '').split(/;\s*/).find((c) => c.startsWith(COOKIE + '='));
  if (cookie && iguais(cookie.slice(COOKIE.length + 1), token)) return rotear(url);

  return telaDeLogin(url.pathname + url.search, false, 401);
}
