// 학교: 후보와 지원 학교를 카드로 비교
import { VALUES } from '../config.js';
import {
  esc, parseDate, fmtDate, pill, chip, due, editLink, extLink, empty, pageHead, bar, isDone, rank, splitList, prefs,
} from '../ui.js';

let showOut = prefs.get('schools.showOut', false);

function card(s, d) {
  const docs = d.docs.filter((x) => splitList(x['학교']).includes(s['코드']));
  const done = docs.filter((x) => isDone(x['상태'])).length;
  const dt = parseDate(s['마감일']);
  const facts = [['원서비', s['원서비']], ['영어', s['영어']], ['추천서', s['추천서']], ['포트폴리오', s['포트폴리오']]]
    .map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v || '–')}</dd></div>`).join('');
  return `<article class="card school${s['상태'] === '제외' ? ' is-out' : ''}">
    <header class="card-head">
      ${chip(s['코드'], 'code')} ${s['구분'] ? chip(s['구분'], s['구분'] === '1순위' ? 'main' : '') : ''}
      <span class="spacer"></span>${pill(s['상태'])}${editLink('schools', s._row)}
    </header>
    <h2>${esc(s['학교'])}</h2>
    <p class="card-sub">${[s['프로그램'], s['학위'], s['나라']].filter(Boolean).map(esc).join(' · ')}</p>
    <p class="deadline">${dt ? `<span class="mono">${fmtDate(dt)}</span> ${due(s['마감일'], s['상태'] === '제출완료')} ${pill(s['마감확정'] || '추정')}` : '<span class="muted">마감일 미정</span>'}</p>
    <dl class="facts">${facts}</dl>
    <div class="prog"><span class="prog-label">서류</span>${docs.length ? bar(done, docs.length) : '<span class="bar is-empty"></span>'}<span class="prog-num mono">${docs.length ? `${done}/${docs.length}` : '목록 없음'}</span></div>
    ${s['맞는 이유'] ? `<p class="why">${esc(s['맞는 이유'])}</p>` : ''}
    ${s['메모'] ? `<p class="row-note">${esc(s['메모'])}</p>` : ''}
    <footer class="card-foot">${extLink(s['링크'], '공식 페이지')}<span class="muted">${s['확인일'] ? `확인 ${esc(s['확인일'])}` : '확인일 없음'}</span></footer>
  </article>`;
}

export default {
  title: '학교',
  render(d) {
    const out = d.schools.filter((s) => s['상태'] === '제외').length;
    const list = d.schools
      .filter((s) => showOut || s['상태'] !== '제외')
      .sort((a, b) => rank(VALUES.schools['구분'], a['구분']) - rank(VALUES.schools['구분'], b['구분'])
        || (parseDate(a['마감일']) || 9e15) - (parseDate(b['마감일']) || 9e15));
    return `${pageHead('학교', 'schools', '구분(1순위·상향·적정·안정) 순, 같은 구분 안에서는 마감이 빠른 순입니다. 마감일 옆 \'추정\'은 지난 해 날짜라는 뜻입니다.')}
      <div class="filters"><label class="toggle"><input type="checkbox" id="show-out" ${showOut ? 'checked' : ''}> 제외한 학교도 보기 (${out})</label></div>
      ${list.length ? `<div class="cards">${list.map((s) => card(s, d)).join('')}</div>` : empty('학교가 없습니다.', 'schools')}`;
  },
  mount(root, rerender) {
    root.querySelector('#show-out')?.addEventListener('change', (e) => {
      showOut = e.target.checked; prefs.set('schools.showOut', showOut); rerender();
    });
  },
};
