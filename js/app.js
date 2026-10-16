// 화면 전환(#주소)과 데이터 새로고침
import { loadAll, loadCached, sheetUrl } from './data.js';
import { TABS, GUIDE_GID } from './config.js';
import { esc } from './ui.js';
import home from './views/home.js';
import tasks from './views/tasks.js';
import schools from './views/schools.js';
import docs from './views/docs.js';
import portfolio from './views/portfolio.js';
import labs from './views/labs.js';
import { recommenders, tests } from './views/people.js';

const ROUTES = { home, tasks, schools, docs, portfolio, labs, recommenders, tests };
const SITE = '미디어랩 지원 보드';

const view = document.getElementById('view');
const nav = document.getElementById('nav');
const status = document.getElementById('status');

let data = normalize(loadCached());
let error = '';
let loading = false;

// 캐시가 예전 구조여도 빈 배열로 채워서 화면이 깨지지 않게
function normalize(d) {
  if (!d) return null;
  Object.keys(TABS).forEach((k) => { if (!Array.isArray(d[k])) d[k] = []; });
  return d;
}

const current = () => {
  const key = location.hash.slice(1);
  return ROUTES[key] ? key : 'home';
};

function renderNav() {
  const key = current();
  nav.innerHTML = Object.entries(ROUTES)
    .map(([k, v]) => `<a href="#${k}"${k === key ? ' aria-current="page"' : ''}>${v.title}</a>`).join('');
}

function renderStatus() {
  const when = data?._loadedAt ? new Date(data._loadedAt) : null;
  const time = when ? when.toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
  if (loading) status.textContent = '불러오는 중…';
  else if (error) status.innerHTML = `<span class="err">불러오기 실패</span>`;
  else status.textContent = time ? `${time} 기준` : '';
}

function errorBox() {
  return `<div class="alert" role="alert"><p>${esc(error)}</p>
    <p><a href="${sheetUrl(GUIDE_GID)}" target="_blank" rel="noopener">시트 열기 ↗</a></p></div>`;
}

function render() {
  renderNav();
  renderStatus();
  const key = current();
  document.title = key === 'home' ? SITE : `${ROUTES[key].title} · ${SITE}`;
  if (!data) {
    view.innerHTML = error ? errorBox() : '<p class="loading">시트에서 불러오는 중…</p>';
    return;
  }
  try {
    view.innerHTML = (error ? errorBox() : '') + ROUTES[key].render(data);
    ROUTES[key].mount?.(view, render);
  } catch (e) {
    console.error(e);
    view.innerHTML = `<div class="alert" role="alert"><p>이 화면을 그리다 오류가 났습니다: ${esc(e.message)}</p>
      <p>시트 1행 머리글 이름이 바뀌지 않았는지 확인하세요.</p></div>`;
  }
}

async function refresh() {
  if (loading) return;
  loading = true;
  renderStatus();
  try {
    data = normalize(await loadAll());
    error = '';
  } catch (e) {
    error = e.message || '시트를 불러오지 못했습니다. 인터넷 연결을 확인하세요.';
  }
  loading = false;
  render();
}

window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });
document.getElementById('refresh').addEventListener('click', refresh);
// 시트를 고치고 이 탭으로 돌아오면 30초 이상 지났을 때 다시 읽는다
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  const age = data?._loadedAt ? Date.now() - new Date(data._loadedAt) : Infinity;
  if (age > 30000) refresh();
});
document.getElementById('sheet-link').href = sheetUrl(GUIDE_GID);
document.getElementById('foot-sheet').href = sheetUrl(GUIDE_GID);

render();
refresh();
