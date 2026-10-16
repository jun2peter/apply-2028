// 할 일: 마감 달별로 묶어서 보여 주고, 분류·완료 여부로 거른다
import { VALUES } from '../config.js';
import { esc, parseDate, pill, chip, due, editLink, empty, pageHead, isDone, prefs } from '../ui.js';

let filter = prefs.get('tasks.filter', '전체');
let hideDone = prefs.get('tasks.hideDone', true);

function monthKey(t) {
  const d = parseDate(t['마감일']);
  return d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` : '날짜 없음';
}

function monthLabel(key) {
  if (key === '날짜 없음') return key;
  const [y, m] = key.split('-');
  return `${y}년 ${+m}월`;
}

export default {
  title: '할 일',
  render(d) {
    const cats = VALUES.tasks['분류'].filter((c) => d.tasks.some((t) => t['분류'] === c));
    const doneCount = d.tasks.filter((t) => isDone(t['상태'])).length;
    const list = d.tasks
      .filter((t) => filter === '전체' || t['분류'] === filter)
      .filter((t) => !hideDone || !isDone(t['상태']))
      .sort((a, b) => (parseDate(a['마감일']) || 9e15) - (parseDate(b['마감일']) || 9e15));

    const groups = new Map();
    list.forEach((t) => {
      const k = monthKey(t);
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(t);
    });

    const body = list.length
      ? [...groups].map(([k, items]) => `<section class="month">
          <h2 class="month-head">${monthLabel(k)}<span class="mono">${items.length}</span></h2>
          <ul class="rows">${items.map((t) => `<li class="row${isDone(t['상태']) ? ' is-done' : ''}">
            ${pill(t['상태'])}
            <div class="row-main">
              <p class="row-title">${t['중요'] === '높음' ? '<span class="flag" title="중요">●</span>' : ''}${esc(t['할일'])}</p>
              <p class="row-meta">${[chip(t['분류']), t['학교'] ? chip(t['학교'], 'code') : '',
                t['시작일'] ? `<span class="mono">${esc(t['시작일'])} ~ ${esc(t['마감일'])}</span>` : ''].filter(Boolean).join(' ')}</p>
              ${t['메모'] ? `<p class="row-note">${esc(t['메모'])}</p>` : ''}
            </div>
            ${due(t['마감일'], isDone(t['상태']))}${editLink('tasks', t._row)}
          </li>`).join('')}</ul>
        </section>`).join('')
      : empty('조건에 맞는 할 일이 없습니다.', 'tasks');

    return `${pageHead('할 일', 'tasks', '마감일이 있는 달별로 묶었습니다. ↗를 누르면 시트의 그 줄이 열립니다.')}
      <div class="filters" role="toolbar" aria-label="할 일 거르기">
        ${['전체', ...cats].map((c) => `<button type="button" class="fchip${c === filter ? ' is-on' : ''}" data-cat="${esc(c)}" aria-pressed="${c === filter}">${esc(c)}</button>`).join('')}
        <label class="toggle"><input type="checkbox" id="hide-done" ${hideDone ? 'checked' : ''}> 끝난 일 숨기기 (${doneCount})</label>
      </div>
      ${body}`;
  },
  mount(root, rerender) {
    root.querySelectorAll('[data-cat]').forEach((b) => b.addEventListener('click', () => {
      filter = b.dataset.cat; prefs.set('tasks.filter', filter); rerender();
    }));
    root.querySelector('#hide-done')?.addEventListener('change', (e) => {
      hideDone = e.target.checked; prefs.set('tasks.hideDone', hideDone); rerender();
    });
  },
};
