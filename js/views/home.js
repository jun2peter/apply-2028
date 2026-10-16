// 홈: 1순위 학교 D-day, 전체 타임라인, 지금 할 일, 원서 마감, 학교별 서류, 포트폴리오, 영어, 최근 기록
import { TIMELINE, VALUES } from '../config.js';
import {
  esc, parseDate, today, daysUntil, fmtDate, pill, chip, due, editLink, empty, bar, isDone, splitList,
} from '../ui.js';

const activeSchools = (d) => d.schools.filter((s) => !['제외', '불합격'].includes(s['상태']));

function mainSchool(d) {
  const list = activeSchools(d).filter((s) => parseDate(s['마감일']));
  return list.find((s) => s['구분'] === '1순위')
    || list.sort((a, b) => parseDate(a['마감일']) - parseDate(b['마감일']))[0];
}

function hero(d) {
  const main = mainSchool(d);
  const applyStart = parseDate(TIMELINE.applyStart);
  const tasks = d.tasks.filter((t) => t['상태'] !== '보류');
  const doneTasks = tasks.filter((t) => isDone(t['상태'])).length;
  const schools = activeSchools(d);
  const decided = schools.filter((s) => s['상태'] !== '조사중').length;

  let count = `<p class="hero-eyebrow">1순위 학교가 아직 없습니다</p>
    <p class="hero-sub">학교 탭에서 구분을 '1순위'로 정하면 여기에 마감까지 남은 날이 나옵니다.</p>`;
  if (main) {
    const dt = parseDate(main['마감일']);
    const n = daysUntil(dt);
    const sure = main['마감확정'] === '확정';
    count = `<p class="hero-eyebrow">${esc(main['학교'])} ${esc(main['프로그램'])} 원서 마감까지</p>
      <p class="hero-num"><span class="mono">${n >= 0 ? n : 0}</span><small>일</small></p>
      <p class="hero-sub"><span class="mono">${fmtDate(dt)}</span>
        ${sure ? pill('확정') : `${pill('추정')} 지난 해 마감일 기준, 2027년 9월 공지에서 확인`}</p>`;
  }
  const untilApply = daysUntil(applyStart);
  return `<section class="hero">
    <div class="hero-count">${count}</div>
    <dl class="hero-stats">
      <div><dt>원서 시즌 시작</dt><dd><span class="mono">${untilApply > 0 ? `D-${untilApply}` : '진행중'}</span></dd><p>${fmtDate(applyStart)}</p></div>
      <div><dt>할 일 완료</dt><dd><span class="mono">${doneTasks}<small>/${tasks.length}</small></span></dd>${bar(doneTasks, tasks.length)}</div>
      <div><dt>학교</dt><dd><span class="mono">${schools.length}<small>곳</small></span></dd><p>지원 정함 ${decided} · 조사중 ${schools.length - decided}</p></div>
    </dl>
  </section>`;
}

// 2026-10 ~ 2028-09 한 줄 타임라인. 위: 원서 마감, 가운데: 단계, 아래: 할 일 마감 눈금
function timeline(d) {
  const start = parseDate(TIMELINE.start);
  const end = parseDate(TIMELINE.end);
  const pct = (dt) => Math.max(0, Math.min(100, ((dt - start) / (end - start)) * 100));
  const now = today();

  const phases = TIMELINE.phases.map((p) => {
    const a = parseDate(p.start); const b = parseDate(p.end);
    const current = now >= a && now <= b;
    return `<div class="phase${current ? ' is-current' : ''}" style="left:${pct(a)}%;width:${pct(b) - pct(a)}%"><span>${esc(p.label)}</span></div>`;
  }).join('');

  let months = '';
  for (let m = new Date(start); m <= end; m = new Date(m.getFullYear(), m.getMonth() + 1, 1)) {
    const jan = m.getMonth() === 0;
    const quarter = m.getMonth() % 3 === 0;
    months += `<span class="tick${jan ? ' is-year' : ''}${quarter ? '' : ' is-minor'}" style="left:${pct(m)}%">${jan ? m.getFullYear() : `${m.getMonth() + 1}월`}</span>`;
  }

  // 원서 마감 표시. 라벨이 겹치지 않게 줄을 나눈다.
  const laneEnds = [];
  const marks = activeSchools(d)
    .map((s) => ({ s, dt: parseDate(s['마감일']) }))
    .filter((x) => x.dt)
    .sort((a, b) => a.dt - b.dt)
    .map(({ s, dt }) => {
      const p = pct(dt);
      let lane = laneEnds.findIndex((e) => p - e >= 6);
      if (lane < 0) lane = Math.min(laneEnds.length, 3);
      laneEnds[lane] = p;
      const main = s['구분'] === '1순위' ? ' is-main' : '';
      return `<span class="mark${main}" style="left:${p}%;--lane:${lane}" title="${esc(s['학교'])} ${esc(s['프로그램'])} · ${fmtDate(dt)}"><b>${esc(s['코드'] || s['학교'])}</b></span>`;
    }).join('');

  const ticks = d.tasks
    .filter((t) => !isDone(t['상태']) && t['상태'] !== '보류')
    .map((t) => parseDate(t['마감일']))
    .filter(Boolean)
    .map((dt) => `<span class="tt" style="left:${pct(dt)}%"></span>`).join('');

  const lanes = Math.max(1, laneEnds.length);
  return `<section class="timeline" style="--lanes:${lanes}" aria-label="2026년 10월부터 2028년 9월까지 일정">
    <div class="tl-track">
      <div class="tl-marks">${marks}</div>
      <div class="tl-phases">${phases}</div>
      <div class="tl-ticks" title="할 일 마감">${ticks}</div>
      <div class="tl-axis">${months}</div>
      <div class="tl-today" style="left:${pct(now)}%"><span>오늘</span></div>
    </div>
    <p class="tl-legend"><span><i class="lg-mark"></i>원서 마감</span><span><i class="lg-tick"></i>할 일 마감</span><span><i class="lg-today"></i>오늘</span></p>
  </section>`;
}

function nowTasks(d) {
  const horizon = 21;
  const list = d.tasks
    .filter((t) => !isDone(t['상태']) && t['상태'] !== '보류')
    .filter((t) => {
      const end = parseDate(t['마감일']);
      const begin = parseDate(t['시작일']);
      return t['상태'] === '진행중'
        || (end && daysUntil(end) <= horizon)
        || (begin && daysUntil(begin) <= 0);
    })
    .sort((a, b) => (parseDate(a['마감일']) || 9e15) - (parseDate(b['마감일']) || 9e15));
  if (!list.length) return empty('3주 안에 마감되거나 진행 중인 일이 없습니다.', 'tasks');
  return `<ul class="rows">${list.slice(0, 9).map((t) => `<li class="row">
      ${pill(t['상태'])}
      <div class="row-main"><p class="row-title">${esc(t['할일'])}</p>
        <p class="row-meta">${[t['분류'], t['학교']].filter(Boolean).map((x) => esc(x)).join(' · ')}</p></div>
      ${due(t['마감일'])}${editLink('tasks', t._row)}
    </li>`).join('')}</ul>
    ${list.length > 9 ? `<a class="more" href="#tasks">나머지 ${list.length - 9}개 보기</a>` : ''}`;
}

function deadlines(d) {
  const list = activeSchools(d)
    .filter((s) => parseDate(s['마감일']))
    .sort((a, b) => parseDate(a['마감일']) - parseDate(b['마감일']));
  if (!list.length) return empty('마감일이 적힌 학교가 없습니다.', 'schools');
  return `<ul class="rows">${list.map((s) => `<li class="row">
      ${chip(s['코드'], 'code')}
      <div class="row-main"><p class="row-title">${esc(s['학교'])}</p>
        <p class="row-meta">${esc(s['프로그램'])} · <span class="mono">${fmtDate(parseDate(s['마감일']))}</span>${s['마감확정'] === '확정' ? '' : ' · 추정'}</p></div>
      ${due(s['마감일'], s['상태'] === '제출완료')}
    </li>`).join('')}</ul>`;
}

function docProgress(d) {
  const schools = activeSchools(d).filter((s) => s['상태'] !== '조사중');
  const common = d.docs.filter((x) => x['학교'] === '공통');
  const commonDone = common.filter((x) => isDone(x['상태'])).length;
  const rows = schools.map((s) => {
    const mine = d.docs.filter((x) => splitList(x['학교']).includes(s['코드']));
    const done = mine.filter((x) => isDone(x['상태'])).length;
    return `<li class="prog"><span class="prog-label">${chip(s['코드'], 'code')}</span>
      ${mine.length ? bar(done, mine.length) : '<span class="bar is-empty"></span>'}
      <span class="prog-num mono">${mine.length ? `${done}/${mine.length}` : '목록 없음'}</span></li>`;
  }).join('');
  return `<ul class="progs">
      <li class="prog"><span class="prog-label">${chip('공통', 'code')}</span>${bar(commonDone, common.length)}<span class="prog-num mono">${commonDone}/${common.length}</span></li>
      ${rows}
    </ul>
    <p class="note">공통은 만들어 둔 상태, 학교별은 그 학교에 냈는지. 조사중인 학교는 빠집니다.</p>
    <a class="more" href="#docs">서류 표 보기</a>`;
}

function portfolio(d) {
  const order = VALUES.portfolio['상태'].filter((s) => s !== '제외');
  const items = d.portfolio.filter((p) => p['상태'] !== '제외');
  if (!items.length) return empty('포트폴리오 후보가 없습니다.', 'portfolio');
  const counts = order.map((s) => [s, items.filter((p) => p['상태'] === s).length]);
  return `<div class="stack" role="img" aria-label="상태별 작업 수">${counts.filter(([, n]) => n)
    .map(([s, n]) => `<span class="tone-${s === '후보' ? 'idle' : s === '페이지완성' ? 'good' : 'active'}" style="flex:${n}" title="${esc(s)} ${n}"></span>`).join('')}</div>
    <dl class="counts">${counts.map(([s, n]) => `<div><dt>${esc(s)}</dt><dd class="mono">${n}</dd></div>`).join('')}</dl>
    <a class="more" href="#portfolio">작업 보드 보기</a>`;
}

function english(d) {
  if (!d.tests.length) return empty('시험 탭이 비어 있습니다.', 'tests');
  return `<ul class="rows">${d.tests.map((t) => `<li class="row">
      ${pill(t['상태'])}
      <div class="row-main"><p class="row-title">${esc(t['시험'])}</p>
        <p class="row-meta">${t['점수'] ? `점수 ${esc(t['점수'])} · ` : ''}목표 ${esc(t['목표'] || '미정')}</p></div>
      ${t['날짜'] ? due(t['날짜'], isDone(t['상태']) || t['상태'] === '점수나옴') : ''}
    </li>`).join('')}</ul>`;
}

function recentLog(d) {
  const list = [...d.log].sort((a, b) => (parseDate(b['날짜']) || 0) - (parseDate(a['날짜']) || 0) || b._row - a._row).slice(0, 4);
  if (!list.length) return empty('아직 기록이 없습니다.', 'log');
  return `<ul class="log">${list.map((l) => `<li><span class="mono">${esc(l['날짜'])}</span> ${chip(l['누가'])}<p>${esc(l['내용'])}</p></li>`).join('')}</ul>`;
}

const panel = (title, body, cls = '') => `<section class="panel ${cls}"><h2>${title}</h2>${body}</section>`;

export default {
  title: '홈',
  render(d) {
    return `${hero(d)}${timeline(d)}
      <div class="panels">
        ${panel('지금 할 일', nowTasks(d), 'is-wide')}
        ${panel('원서 마감', deadlines(d))}
        ${panel('학교별 서류', docProgress(d))}
        ${panel('포트폴리오', portfolio(d))}
        ${panel('영어 시험', english(d))}
        ${panel('최근 기록', recentLog(d))}
      </div>`;
  },
};
