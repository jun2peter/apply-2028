// 추천인과 시험 화면
import { esc, parseDate, pill, chip, due, editLink, empty, pageHead, splitList, isDone } from '../ui.js';

export const recommenders = {
  title: '추천인',
  render(d) {
    const body = d.recommenders.length
      ? `<div class="cards">${d.recommenders.map((r) => `<article class="card person">
          <header class="card-head">${pill(r['상태'])}<span class="spacer"></span>${editLink('recommenders', r._row)}</header>
          <h2>${esc(r['이름'])}</h2>
          <p class="card-sub">${esc(r['관계'])}</p>
          <p>${splitList(r['학교']).map((s) => chip(s, 'code')).join(' ') || '<span class="muted">학교 미정</span>'}</p>
          <dl class="facts"><div><dt>요청일</dt><dd class="mono">${esc(r['요청일'] || '–')}</dd></div><div><dt>보낸 자료</dt><dd>${esc(r['보낸자료'] || '–')}</dd></div></dl>
          ${r['메모'] ? `<p class="row-note">${esc(r['메모'])}</p>` : ''}
        </article>`).join('')}</div>`
      : empty('추천인을 아직 적지 않았습니다. 지도교수, 함께 일한 사람처럼 내 작업을 구체적으로 말해 줄 수 있는 사람 3~4명을 후보로 적어 두세요. 연락처는 시트에 적지 않는 것을 권합니다.', 'recommenders');
    return `${pageHead('추천인', 'recommenders', '보통 마감 2~3달 전에 정식으로 부탁하고, CV·SOP 초안·포트폴리오 링크·학교별 마감을 한 번에 보냅니다.')}${body}`;
  },
};

export const tests = {
  title: '시험',
  render(d) {
    const rows = d.tests.length
      ? `<ul class="rows">${d.tests.map((t) => `<li class="row">
          ${pill(t['상태'])}
          <div class="row-main"><p class="row-title">${esc(t['시험'])}${t['날짜'] ? ` <span class="mono muted">${esc(t['날짜'])}</span>` : ''}</p>
            <p class="row-meta">점수 ${esc(t['점수'] || '–')} · 목표 ${esc(t['목표'] || '–')}${t['보낸곳'] ? ` · 보낸 곳 ${esc(t['보낸곳'])}` : ''}</p>
            ${t['메모'] ? `<p class="row-note">${esc(t['메모'])}</p>` : ''}</div>
          ${t['날짜'] && parseDate(t['날짜']) ? due(t['날짜'], isDone(t['상태']) || t['상태'] === '점수나옴') : ''}${editLink('tests', t._row)}
        </li>`).join('')}</ul>`
      : empty('시험 일정이 없습니다.', 'tests');
    const req = d.schools.filter((s) => s['상태'] !== '제외' && s['영어']);
    const reqTable = req.length ? `<section class="panel"><h2>학교별 영어 기준</h2><div class="table-wrap"><table class="plain">
        <thead><tr><th>학교</th><th>기준</th></tr></thead>
        <tbody>${req.map((s) => `<tr><td>${chip(s['코드'], 'code')} ${esc(s['학교'])}</td><td>${esc(s['영어'])}</td></tr>`).join('')}</tbody>
      </table></div></section>` : '';
    return `${pageHead('시험', 'tests', '점수는 보통 응시일부터 2년간 유효합니다. 학교마다 받는 시험과 최소 점수가 다르니 아래 표를 같이 보세요.')}
      <div class="panels">${`<section class="panel is-wide"><h2>일정과 점수</h2>${rows}</section>`}${reqTable}</div>`;
  },
};
