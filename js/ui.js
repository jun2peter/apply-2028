// 여러 화면에서 같이 쓰는 작은 조각들
import { TABS, TONE, DONE } from './config.js';
import { sheetUrl } from './data.js';

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// '2027-12-01', '2027. 12. 1', '2027/12/01' 모두 받는다
export function parseDate(s) {
  const m = String(s || '').match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
}

export function today() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function daysUntil(d) {
  return Math.round((d - today()) / 86400000);
}

const pad = (n) => String(n).padStart(2, '0');
export const fmtDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fmtShort = (d) => `${d.getMonth() + 1}/${d.getDate()}`;

export const splitList = (s) => String(s || '').split(/[,\n]/).map((x) => x.trim()).filter(Boolean);
export const isDone = (status) => DONE.has(status);
export const tone = (s) => TONE[s] || 'idle';

export function pill(s) {
  return s ? `<span class="pill tone-${tone(s)}">${esc(s)}</span>` : '';
}

export function chip(s, cls = '') {
  return s ? `<span class="chip ${cls}">${esc(s)}</span>` : '';
}

// 마감 표시: D-12 / 오늘 / 3일 지남 / (끝난 일은 날짜만)
export function due(dateStr, done = false) {
  const d = parseDate(dateStr);
  if (!d) return '';
  const n = daysUntil(d);
  let cls = 'due';
  let label;
  if (done) { label = fmtShort(d); cls += ' is-done'; }
  else if (n < 0) { label = `${-n}일 지남`; cls += ' is-over'; }
  else if (n === 0) { label = '오늘'; cls += ' is-soon'; }
  else { label = `D-${n}`; if (n <= 7) cls += ' is-soon'; }
  return `<span class="${cls}" title="${fmtDate(d)}">${label}</span>`;
}

export function editLink(tabKey, row) {
  return `<a class="edit" href="${sheetUrl(TABS[tabKey].gid, row)}" target="_blank" rel="noopener" title="시트에서 이 줄 열기" aria-label="시트에서 이 줄 열기">↗</a>`;
}

export function extLink(url, label) {
  if (!url) return '';
  const href = /^https?:\/\//.test(url) ? url : `https://${url}`;
  return `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(label)} ↗</a>`;
}

export function pageHead(title, tabKey, desc = '') {
  return `<header class="page-head">
    <div><h1>${esc(title)}</h1>${desc ? `<p>${desc}</p>` : ''}</div>
    <a class="btn" href="${sheetUrl(TABS[tabKey].gid)}" target="_blank" rel="noopener">시트에서 편집 ↗</a>
  </header>`;
}

export function empty(msg, tabKey) {
  const link = tabKey
    ? `<a href="${sheetUrl(TABS[tabKey].gid)}" target="_blank" rel="noopener">${esc(TABS[tabKey].name)} 탭 열기 ↗</a>`
    : '';
  return `<div class="empty"><p>${msg}</p>${link}</div>`;
}

// 진행 막대
export function bar(done, total) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return `<span class="bar" role="img" aria-label="${done}/${total} 완료"><span style="width:${pct}%"></span></span>`;
}

// 필터 같은 개인 설정은 이 브라우저에만 저장
export const prefs = {
  get(key, fallback) {
    try { const v = localStorage.getItem(`listmanager:${key}`); return v === null ? fallback : JSON.parse(v); } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(`listmanager:${key}`, JSON.stringify(value)); } catch { /* 무시 */ }
  },
};

// 드롭다운 목록 안에서의 순서. 목록에 없는 값은 맨 뒤.
export function rank(list, v) {
  const i = list.indexOf(v);
  return i < 0 ? 99 : i;
}
