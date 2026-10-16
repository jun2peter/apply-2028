// 구글 시트를 CSV로 받아 탭별 객체 배열로 바꾼다.
// 시트가 '링크가 있는 모든 사용자: 뷰어'로 공유돼 있어야 로그인 없이 읽힌다.
import { SHEET_ID, TABS } from './config.js';

const CACHE_KEY = 'apply-2028:data:v1';

export function csvUrl(gid) {
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;
}

// row를 주면 그 줄로 바로 이동하는 편집 링크
export function sheetUrl(gid, row) {
  let url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit#gid=${gid}`;
  if (row) url += `&range=A${row}`;
  return url;
}

export function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

// 1행을 머리글로 쓰고, 빈 줄은 버린다. _row는 시트의 실제 줄 번호.
export function toObjects(rows) {
  const [header = [], ...body] = rows;
  const keys = header.map((h) => h.trim());
  return body
    .map((r, i) => {
      const o = { _row: i + 2 };
      keys.forEach((k, j) => { if (k) o[k] = (r[j] ?? '').trim(); });
      return o;
    })
    .filter((o) => keys.some((k) => k && o[k]));
}

export async function fetchTab(gid, name) {
  const res = await fetch(csvUrl(gid), { cache: 'no-store' });
  if (!res.ok) throw new Error(`'${name}' 탭을 읽지 못했습니다 (HTTP ${res.status}).`);
  const text = await res.text();
  if (text.trimStart().startsWith('<')) {
    throw new Error(`'${name}' 탭 대신 로그인 화면이 왔습니다. 시트 공유를 '링크가 있는 모든 사용자: 뷰어'로 바꿔 주세요.`);
  }
  const parsed = parseCSV(text);
  return { header: (parsed[0] || []).map((h) => h.trim()), rows: toObjects(parsed) };
}

export async function loadAll() {
  const entries = await Promise.all(
    Object.entries(TABS).map(async ([key, { gid, name }]) => [key, (await fetchTab(gid, name)).rows]),
  );
  const data = Object.fromEntries(entries);
  data._loadedAt = new Date().toISOString();
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch { /* 저장 안 돼도 화면은 그대로 */ }
  return data;
}

export function loadCached() {
  try {
    const saved = localStorage.getItem(CACHE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}
