// 서류: 서류 종류 × 학교 표. 공통 열은 만들어 둔 상태, 학교 열은 그 학교에 냈는지.
import { VALUES } from '../config.js';
import { esc, pill, chip, due, editLink, extLink, empty, pageHead, isDone, rank, splitList, tone } from '../ui.js';

const ORDER = VALUES.docs['상태'];

function cell(rows) {
  if (!rows.length) return '<td class="cell is-none">–</td>';
  const done = rows.filter((r) => isDone(r['상태'])).length;
  // 가장 덜 된 상태를 대표로 보여 준다
  const worst = rows.map((r) => r['상태']).sort((a, b) => rank(ORDER, a) - rank(ORDER, b))[0];
  const status = done === rows.length ? rows[0]['상태'] : worst;
  const count = rows.length > 1 ? ` <span class="mono">${done}/${rows.length}</span>` : '';
  return `<td class="cell tone-${tone(status)}" title="${esc(rows.map((r) => `${r['세부'] || r['서류']}: ${r['상태']}`).join('\n'))}">${esc(status || '–')}${count}</td>`;
}

export default {
  title: '서류',
  render(d) {
    if (!d.docs.length) return `${pageHead('서류', 'docs')}${empty('서류 목록이 비어 있습니다.', 'docs')}`;
    const schoolOrder = d.schools.map((s) => s['코드']);
    const cols = ['공통', ...new Set(d.docs.flatMap((x) => splitList(x['학교'])).filter((c) => c !== '공통'))]
      .sort((a, b) => (a === '공통' ? -1 : b === '공통' ? 1 : rank(schoolOrder, a) - rank(schoolOrder, b)));
    const types = [...new Set(d.docs.map((x) => x['서류']))].sort((a, b) => rank(VALUES.docs['서류'], a) - rank(VALUES.docs['서류'], b));

    const table = `<div class="table-wrap"><table class="matrix">
      <thead><tr><th scope="col">서류</th>${cols.map((c) => `<th scope="col">${esc(c)}</th>`).join('')}</tr></thead>
      <tbody>${types.map((t) => `<tr><th scope="row">${esc(t)}</th>${cols.map((c) => cell(d.docs.filter((x) => x['서류'] === t && splitList(x['학교']).includes(c)))).join('')}</tr>`).join('')}</tbody>
    </table></div>`;

    const lists = cols.map((c) => {
      const rows = d.docs.filter((x) => splitList(x['학교']).includes(c))
        .sort((a, b) => rank(VALUES.docs['서류'], a['서류']) - rank(VALUES.docs['서류'], b['서류']));
      return `<section class="panel"><h2>${chip(c, 'code')}</h2><ul class="rows">${rows.map((x) => `<li class="row${isDone(x['상태']) ? ' is-done' : ''}">
          ${pill(x['상태'])}
          <div class="row-main"><p class="row-title">${esc(x['서류'])}${x['세부'] ? ` <span class="muted">${esc(x['세부'])}</span>` : ''}</p>
            ${x['메모'] || x['링크'] ? `<p class="row-meta">${esc(x['메모'])} ${extLink(x['링크'], '파일')}</p>` : ''}</div>
          ${due(x['마감일'], isDone(x['상태']))}${editLink('docs', x._row)}
        </li>`).join('')}</ul></section>`;
    }).join('');

    return `${pageHead('서류', 'docs', '칸 위에 마우스를 올리면 세부 항목이 보입니다. 여러 개인 칸은 끝난 수/전체 수를 함께 적었습니다.')}
      ${table}
      <div class="panels">${lists}</div>`;
  },
};
