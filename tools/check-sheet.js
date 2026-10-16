// 시트가 사이트가 기대하는 모양인지 점검한다: node tools/check-sheet.js
// 머리글 누락, 드롭다운 목록에 없는 값, 읽을 수 없는 날짜, 학교 탭에 없는 학교 코드를 알려 준다.
import { TABS, COLUMNS, VALUES } from '../js/config.js';
import { fetchTab } from '../js/data.js';

const DATE_COLS = new Set(['시작일', '마감일', '확인일', '요청일', '날짜']);
const isDate = (s) => /^\d{4}\D+\d{1,2}\D+\d{1,2}/.test(s);

let problems = 0;
const warn = (msg) => { problems++; console.log(`  - ${msg}`); };

const tabs = {};
for (const [key, { gid, name }] of Object.entries(TABS)) {
  tabs[key] = await fetchTab(gid, name);
}
const codes = new Set(tabs.schools.rows.map((s) => s['코드']).filter(Boolean));

for (const [key, { name }] of Object.entries(TABS)) {
  const { header, rows } = tabs[key];
  console.log(`[${name}] ${rows.length}줄`);
  COLUMNS[key].filter((c) => !header.includes(c)).forEach((c) => warn(`머리글 '${c}' 없음`));
  for (const r of rows) {
    for (const [col, allowed] of Object.entries(VALUES[key] || {})) {
      if (r[col] && !allowed.includes(r[col])) warn(`${r._row}행 ${col} '${r[col]}' 은(는) 목록에 없음`);
    }
    for (const col of Object.keys(r)) {
      if (DATE_COLS.has(col) && r[col] && !isDate(r[col])) warn(`${r._row}행 ${col} '${r[col]}' 날짜로 못 읽음`);
    }
    if (key !== 'schools' && key !== 'log' && r['학교']) {
      r['학교'].split(/[,\n]/).map((x) => x.trim()).filter(Boolean)
        .filter((c) => c !== '공통' && !codes.has(c) && key !== 'labs')
        .forEach((c) => warn(`${r._row}행 학교 '${c}' 이(가) 학교 탭 코드에 없음`));
    }
  }
}

console.log(problems ? `\n문제 ${problems}개` : '\n문제 없음');
process.exitCode = problems ? 1 : 0;
