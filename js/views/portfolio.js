// 포트폴리오: 상태별 보드
import { VALUES } from '../config.js';
import { esc, chip, editLink, extLink, empty, pageHead } from '../ui.js';

const STEPS = {
  후보: '넣을지 고민 중',
  선정: '넣기로 함',
  글쓰기: '설명 글 쓰는 중',
  자료정리: '이미지·영상 정리 중',
  페이지완성: '웹사이트에 올림',
  제외: '이번에는 뺌',
};

export default {
  title: '포트폴리오',
  render(d) {
    if (!d.portfolio.length) return `${pageHead('포트폴리오', 'portfolio')}${empty('포트폴리오 후보가 없습니다.', 'portfolio')}`;
    const cols = VALUES.portfolio['상태'];
    const extra = [...new Set(d.portfolio.map((p) => p['상태']).filter((s) => s && !cols.includes(s)))];
    const board = [...cols, ...extra].map((s) => {
      const items = d.portfolio.filter((p) => (p['상태'] || '후보') === s);
      return `<section class="lane${s === '제외' ? ' is-out' : ''}">
        <h2>${esc(s)} <span class="mono">${items.length}</span></h2>
        <p class="lane-sub">${esc(STEPS[s] || '')}</p>
        ${items.map((p) => `<article class="card work">
          <header class="card-head"><h3>${esc(p['프로젝트'])}</h3><span class="spacer"></span>${editLink('portfolio', p._row)}</header>
          <p class="card-sub">${[p['연도'], p['매체'], p['내 역할']].filter(Boolean).map(esc).join(' · ')}</p>
          ${p['한줄설명'] ? `<p>${esc(p['한줄설명'])}</p>` : ''}
          ${p['연결 연구실'] ? `<p>${chip(p['연결 연구실'])}</p>` : ''}
          ${p['메모'] ? `<p class="row-note">${esc(p['메모'])}</p>` : ''}
          ${p['링크'] ? `<p>${extLink(p['링크'], '보기')}</p>` : ''}
        </article>`).join('')}
      </section>`;
    }).join('');
    return `${pageHead('포트폴리오', 'portfolio', '포트폴리오 웹사이트에 넣을 작업입니다. 상태를 바꾸면 열이 옮겨집니다.')}
      <div class="board">${board}</div>`;
  },
};
