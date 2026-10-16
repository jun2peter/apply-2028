// 연구실: 학교별 관심 연구실·교수
import { VALUES } from '../config.js';
import { esc, pill, chip, editLink, extLink, empty, pageHead, rank, prefs } from '../ui.js';

let onlyInterest = prefs.get('labs.onlyInterest', false);

export default {
  title: '연구실',
  render(d) {
    if (!d.labs.length) return `${pageHead('연구실', 'labs')}${empty('연구실 목록이 비어 있습니다.', 'labs')}`;
    const list = d.labs
      .filter((l) => !onlyInterest || ['높음', '보통'].includes(l['관심도']))
      .sort((a, b) => rank(VALUES.labs['관심도'], a['관심도']) - rank(VALUES.labs['관심도'], b['관심도']));
    const schools = [...new Set(list.map((l) => l['학교']))];
    const groups = schools.map((s) => `<section class="group">
        <h2>${chip(s, 'code')} <span class="mono muted">${list.filter((l) => l['학교'] === s).length}</span></h2>
        <div class="cards">${list.filter((l) => l['학교'] === s).map((l) => `<article class="card lab">
          <header class="card-head">${l['관심도'] ? pill(`관심 ${l['관심도']}`) : '<span class="muted">관심도 미정</span>'}
            <span class="spacer"></span>${l['연락'] && l['연락'] !== '안함' ? pill(l['연락']) : ''}${editLink('labs', l._row)}</header>
          <h3>${esc(l['연구실'])}</h3>
          <p class="card-sub">${esc(l['교수'])}</p>
          <p>${esc(l['주제'])}</p>
          <p class="link-note${l['나와 연결점'] ? '' : ' is-empty'}">${l['나와 연결점'] ? esc(l['나와 연결점']) : '나와 연결점: 아직 비어 있음'}</p>
          ${l['메모'] ? `<p class="row-note">${esc(l['메모'])}</p>` : ''}
          <footer class="card-foot">${extLink(l['링크'], '연구실 페이지')}</footer>
        </article>`).join('')}</div>
      </section>`).join('');
    return `${pageHead('연구실', 'labs', '관심도 높은 순입니다. \'나와 연결점\'이 SOP의 재료가 됩니다.')}
      <div class="filters"><label class="toggle"><input type="checkbox" id="only-interest" ${onlyInterest ? 'checked' : ''}> 관심도 높음·보통만 보기</label></div>
      ${list.length ? groups : empty('관심도를 정한 연구실이 아직 없습니다. 시트에서 관심도 열을 채워 보세요.', 'labs')}`;
  },
  mount(root, rerender) {
    root.querySelector('#only-interest')?.addEventListener('change', (e) => {
      onlyInterest = e.target.checked; prefs.set('labs.onlyInterest', onlyInterest); rerender();
    });
  },
};
