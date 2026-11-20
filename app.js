/* Ôn luyện HSK 1–6 (HSK 3.0). Ứng dụng chạy hoàn toàn trong trình duyệt, dữ liệu lưu trên máy người học (localStorage). */
'use strict';
const LEVEL = window.HSK_LEVEL || 6, FULL = LEVEL === 6;
const V = window.VOCAB || [], G = FULL ? (window.GRAMMAR || []) : [], R = FULL ? (window.READINGS || []) : [], L = FULL ? (window.LISTENING || []) : [];
const PER_DAY = ({ 1: 20, 2: 25 })[LEVEL] || 30, PASS = 80, GOAL = FULL ? 60 : 30;
const WP = (window.PROMPTS && window.PROMPTS.writing) || [], SP = (window.PROMPTS && window.PROMPTS.speaking) || [];
const VBYID = {}; V.forEach((w, i) => { w.idx = i; VBYID[w.id] = w; });
const NEW_DAYS = Math.ceil(V.length / PER_DAY);
const TOTAL_DAYS = FULL ? 60 : NEW_DAYS + 5;
const PARTS = !FULL ? [['vocab', 'Từ vựng', 20], ['test', 'Kiểm tra cuối ngày', 10]] : [
  ['vocab', 'Từ vựng', 15], ['grammar', 'Ngữ pháp', 10], ['reading', 'Đọc hiểu', 10],
  ['listening', 'Luyện nghe', 8], ['writing', 'Luyện viết', 7], ['speaking', 'Luyện nói', 5], ['test', 'Kiểm tra cuối ngày', 5]
];
const POSVI = { n: 'danh từ', v: 'động từ', vn: 'động/danh từ', a: 'tính từ', an: 'tính/danh từ', ad: 'tính/phó từ', d: 'phó từ', b: 'từ khu biệt', g: 'ngữ tố', q: 'lượng từ', qv: 'lượng từ', t: 'thời gian', p: 'giới từ', r: 'đại từ', f: 'phương vị', nz: 'danh từ riêng', c: 'liên từ', cc: 'liên từ', s: 'nơi chốn', nr: 'tên riêng', m: 'số từ', mq: 'số lượng', y: 'trợ từ ngữ khí', u: 'trợ từ', l: 'quán ngữ/thành ngữ', z: 'trạng thái từ', o: 'tượng thanh', h: 'tiền tố', k: 'hậu tố', nt: 'tên tổ chức', tg: 'thời gian' };

/* ---------- Lưu trữ ---------- */
const KEY = FULL ? 'hsk6app.v1' : 'hskapp.L' + LEVEL + '.v1';
const LEVEL_INFO = { 1: 'Nhập môn · 500 từ', 2: 'Sơ cấp · 750 từ', 3: 'Sơ cấp · 950 từ', 4: 'Trung cấp · 970 từ', 5: 'Trung cấp · 1.060 từ', 6: 'Trung cấp cao · 1.100 từ + ngữ pháp, đọc, nghe, viết, nói' };
function setLevel(n) { localStorage.setItem('hskapp.level', n); location.hash = '#/home'; location.reload(); }
function levelButtons() { return `<div class="levels">${[1, 2, 3, 4, 5, 6].map(n => `<button class="lvbtn ${n === LEVEL ? 'on' : ''}" data-level="${n}"><b>HSK ${n}</b><span>${LEVEL_INFO[n]}</span></button>`).join('')}</div>`; }
document.addEventListener('click', e => { const b = e.target.closest('[data-level]'); if (b) { e.preventDefault(); setLevel(+b.dataset.level); } });
let S = load();
function load() {
  let s = null;
  try { s = JSON.parse(localStorage.getItem(KEY)); } catch (e) { }
  s = s || {};
  s.startDate = s.startDate || today();
  s.settings = Object.assign({ rate: 0.9, voice: '' }, s.settings || {});
  s.days = s.days || {}; s.srs = s.srs || {}; s.mistakes = s.mistakes || []; s.tests = s.tests || {}; s.log = s.log || {};
  return s;
}
function save() { localStorage.setItem(KEY, JSON.stringify(S)); }
function day(d) { return S.days[d] = S.days[d] || { parts: {}, minutes: 0 }; }

/* ---------- Tiện ích ---------- */
function today(off = 0) { const d = new Date(); d.setDate(d.getDate() + off); return ymd(d); }
function ymd(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function addDays(s, n) { const d = new Date(s + 'T00:00:00'); d.setDate(d.getDate() + n); return ymd(d); }
function fmtDate(s) { const [y, m, d] = s.split('-'); return d + '/' + m + '/' + y; }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; }
function pick(a, n) { return shuffle(a).slice(0, n); }
function $(s, el = document) { return el.querySelector(s); }
function $$(s, el = document) { return Array.from(el.querySelectorAll(s)); }
function pct(a, b) { return b ? Math.round(a * 100 / b) : 0; }
function phaseOf(d) { if (!FULL) return d <= NEW_DAYS ? 1 : 2; return d <= 15 ? 1 : d <= 30 ? 2 : d <= 45 ? 3 : 4; }
const PHASE = !FULL ? { 1: `Học từ mới HSK ${LEVEL} · ${PER_DAY} từ mỗi ngày`, 2: 'Củng cố · ôn từ khó và làm kiểm tra tổng hợp' } : { 1: 'Giai đoạn 1 · Xây nền tảng từ vựng, ngữ pháp, đọc và nghe', 2: 'Giai đoạn 2 · Mở rộng từ vựng, câu phức, từ gần nghĩa, văn bản dài', 3: 'Giai đoạn 3 · Viết nghị luận, đọc học thuật, nghe và nói', 4: 'Giai đoạn 4 · Luyện đề, tốc độ, sửa lỗi, đánh giá năng lực' };
function posVi(p) { return (p || []).map(x => POSVI[x] || x).filter((v, i, a) => a.indexOf(v) === i).join(', '); }

/* ---------- Lộ trình ---------- */
function wordsOfDay(d) { return d <= NEW_DAYS ? V.slice((d - 1) * PER_DAY, d * PER_DAY) : []; }
function learnedWords(uptoDay) { return V.slice(0, Math.min(V.length, (uptoDay) * PER_DAY)); }
function reviewWordsOfDay(d) { // sau khi học hết từ mới: ôn các từ khó nhất
  const pool = learnedWords(NEW_DAYS);
  const score = w => { const c = S.srs[w.id]; if (!c) return 100; return (c.lapses || 0) * 10 + (3 - c.ease) * 10 - Math.min(c.interval, 30); };
  const seed = d * 7919; return pool.map((w, i) => [w, score(w) + ((i * seed) % 97) / 100]).sort((a, b) => b[1] - a[1]).slice(0, PER_DAY).map(x => x[0]);
}
function grammarOfDay(d) { if (d <= G.length) return [G[d - 1]]; const prev = G.slice(0); const i = (d * 3) % prev.length, j = (d * 7 + 5) % prev.length; return [prev[i], prev[j === i ? (j + 1) % prev.length : j]]; }
function readingOfDay(d) { return R[(d - 1) % R.length]; }
function listeningOfDay(d) { return L[(d - 1) % L.length]; }
function isWeek(d) { return d % 7 === 0; }
function dayDone(d) { return !!(S.days[d] && S.days[d].parts && S.days[d].parts.test); }
function currentDay() { for (let d = 1; d <= TOTAL_DAYS; d++) if (!dayDone(d)) return d; return TOTAL_DAYS; }
function unlocked(d) { return d === 1 || dayDone(d - 1) || d <= currentDay(); }

/* ---------- Ôn tập ngắt quãng (SM-2) ---------- */
function srsAdd(id) { if (!S.srs[id]) S.srs[id] = { reps: 0, ease: 2.5, interval: 0, due: today(1), lapses: 0 }; }
function srsGrade(id, q) { // q: 0 quên, 3 khó, 4 nhớ, 5 dễ
  const c = S.srs[id] || (srsAdd(id), S.srs[id]);
  if (q < 3) { c.reps = 0; c.interval = 1; c.lapses = (c.lapses || 0) + 1; }
  else { c.reps++; c.interval = c.reps === 1 ? 1 : c.reps === 2 ? 3 : Math.round(c.interval * c.ease); if (q === 3) c.interval = Math.max(1, Math.round(c.interval * 0.8)); }
  c.ease = Math.max(1.3, c.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
  c.due = today(c.interval); c.last = today(); save();
}
function dueWords() { const t = today(); return Object.keys(S.srs).filter(id => S.srs[id].due <= t && VBYID[id]).map(id => VBYID[id]); }
function mastered() { return Object.values(S.srs).filter(c => c.interval >= 21).length; }

/* ---------- Phát âm (giọng phổ thông của máy) ---------- */
let VOICES = [];
function loadVoices() { VOICES = (window.speechSynthesis ? speechSynthesis.getVoices() : []).filter(v => /^zh[-_](CN|Hans)/i.test(v.lang) || v.lang === 'zh'); }
if (window.speechSynthesis) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
function voice(i = 0) { if (!VOICES.length) loadVoices(); const pref = VOICES.find(v => v.voiceURI === S.settings.voice); if (i === 0 && pref) return pref; return VOICES[i % Math.max(1, VOICES.length)] || pref || null; }
function speak(text, opt = {}) {
  if (!window.speechSynthesis) { alertBox('Máy không hỗ trợ đọc tiếng Trung.'); return Promise.resolve(); }
  if (!opt.queue) speechSynthesis.cancel();
  return new Promise(res => {
    const u = new SpeechSynthesisUtterance(text); u.lang = 'zh-CN'; u.rate = opt.rate || S.settings.rate;
    const v = voice(opt.voice || 0); if (v) u.voice = v; u.onend = res; u.onerror = res; speechSynthesis.speak(u);
  });
}
async function speakLines(lines, rate) { speechSynthesis.cancel(); const sp = {}; let n = 0; for (const [who, t] of lines) { if (!(who in sp)) sp[who] = n++; await speak(t, { queue: true, rate, voice: sp[who] }); await new Promise(r => setTimeout(r, 350)); } }
document.addEventListener('click', e => { const b = e.target.closest('[data-say]'); if (b) { e.preventDefault(); speak(b.dataset.say); } });
function sayBtn(t) { return `<button class="say" data-say="${esc(t)}" title="Nghe">🔊</button>`; }
function alertBox(m) { const d = document.createElement('div'); d.className = 'note'; d.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:99;max-width:360px'; d.textContent = m; document.body.appendChild(d); setTimeout(() => d.remove(), 4000); }

/* ---------- Đồng hồ học ---------- */
let timerOn = false, tick = null;
function minutesToday() { return S.log[today()] || 0; }
function renderTimer() { const m = minutesToday(); const mm = Math.floor(m), ss = Math.round((m - mm) * 60); $('#timerText').textContent = mm + ':' + String(ss).padStart(2, '0'); $('#timerBtn').textContent = timerOn ? '⏸' : '▶'; $('#timer').style.color = m >= GOAL ? '#8ef0a8' : ''; }
function startTimer() { if (timerOn) return; timerOn = true; tick = setInterval(() => { if (document.hidden) return; S.log[today()] = (S.log[today()] || 0) + 1 / 60; const d = day(currentDay()); d.minutes = (d.minutes || 0) + 1 / 60; if (Math.round(S.log[today()] * 60) % 15 === 0) save(); renderTimer(); if (Math.abs(S.log[today()] - GOAL) < 1 / 120) alertBox('🎉 Bạn đã học đủ ' + GOAL + ' phút hôm nay!'); }, 1000); renderTimer(); }
function stopTimer() { timerOn = false; clearInterval(tick); save(); renderTimer(); }
$('#timerBtn').onclick = () => timerOn ? stopTimer() : startTimer();
window.addEventListener('beforeunload', save);

/* ---------- Bộ câu hỏi ---------- */
function mcq(prompt, correct, distract, extra = {}) {
  const opts = shuffle([correct, ...distract.filter(x => x !== correct).slice(0, 3)]);
  return Object.assign({ prompt, options: opts, answer: opts.indexOf(correct) }, extra);
}
function distractors(w, pool, key) {
  const same = pool.filter(x => x.id !== w.id && x[key] !== w[key] && (x.pos || []).some(p => (w.pos || []).includes(p)));
  const other = pool.filter(x => x.id !== w.id && x[key] !== w[key]);
  const res = pick(same, 3); if (res.length < 3) res.push(...pick(other.filter(x => !res.includes(x)), 3 - res.length));
  return res.map(x => x[key]);
}
function vocabQ(w, type, pool) {
  pool = pool.length > 10 ? pool : V;
  const ref = { ref: w.id, kind: 'Từ vựng', explain: `<span class="hz">${esc(w.w)}</span> <span class="py">${esc(w.p)}</span> — ${esc(w.vi)}` };
  if (type === 'zh2vi') return mcq(`Nghĩa của <span class="hz">${esc(w.w)}</span> là gì?`, w.vi, distractors(w, pool, 'vi'), ref);
  if (type === 'vi2zh') return mcq(`Từ nào có nghĩa “${esc(w.vi)}”?`, w.w, distractors(w, pool, 'w'), ref);
  if (type === 'py') return mcq(`Pinyin đúng của <span class="hz">${esc(w.w)}</span>?`, w.p, distractors(w, pool, 'p'), ref);
  if (type === 'listen') return mcq(`Nghe và chọn từ đúng ${sayBtn(w.w)}`, w.w, distractors(w, pool, 'w'), Object.assign(ref, { audio: w.w }));
  if (type === 'ex' && w.ex) { const blank = w.ex[0].split(w.w).join('＿＿'); if (blank !== w.ex[0]) return mcq(`Điền từ: <span class="zh">${esc(blank)}</span><div class="mut small">${esc(w.ex[2])}</div>`, w.w, distractors(w, pool, 'w'), ref); }
  return vocabQ(w, 'zh2vi', pool);
}
const VTYPES = ['zh2vi', 'vi2zh', 'py', 'listen', 'ex'];
function grammarQs(gs, n) {
  const all = []; gs.forEach(g => (g.ex || []).forEach(x => all.push({ g, x })));
  return pick(all, n).map(({ g, x }) => mcq(`<span class="zh">${esc(x.q)}</span>`, x.o[x.a], x.o.filter((_, i) => i !== x.a), { kind: 'Ngữ pháp · ' + g.title, explain: esc(x.e || '') }));
}
function passageQs(p, n, kind) {
  return pick(p.q, n).map(x => mcq(`<span class="zh">${esc(x.q)}</span>`, x.o[x.a], x.o.filter((_, i) => i !== x.a), { kind: kind + ' · ' + p.title, explain: esc(x.e || '') }));
}

/* Hiển thị một bộ câu hỏi, chấm điểm khi nộp bài */
function quiz(el, qs, onDone, opts = {}) {
  el.innerHTML = qs.map((q, i) => `<div class="q" data-i="${i}"><div class="qt"><b>${i + 1}.</b> ${q.kind ? `<span class="pill">${esc(q.kind)}</span> ` : ''}${q.prompt}</div>
    <div class="opts">${q.options.map((o, j) => `<label class="opt"><input type="radio" name="q${opts.id || ''}${i}" value="${j}"><span class="${/[\u4e00-\u9fff]/.test(o) ? 'zh' : ''}">${esc(o)}</span></label>`).join('')}</div><div class="fb"></div></div>`).join('') +
    `<div class="row" style="margin-top:14px"><button class="btn pri sub">Nộp bài</button><span class="mut small">Đáp án chỉ hiện sau khi bạn nộp bài.</span></div><div class="res"></div>`;
  $('.sub', el).onclick = () => {
    const ans = qs.map((q, i) => { const r = $(`input[name="q${opts.id || ''}${i}"]:checked`, el); return r ? +r.value : -1; });
    if (ans.includes(-1) && !confirm('Còn câu chưa trả lời. Vẫn nộp bài?')) return;
    let ok = 0; const wrong = [];
    qs.forEach((q, i) => {
      const box = $(`.q[data-i="${i}"]`, el), labs = $$('.opt', box);
      labs[q.answer].classList.add('right'); if (ans[i] !== q.answer && ans[i] >= 0) labs[ans[i]].classList.add('wrong');
      $$('input', box).forEach(x => x.disabled = true);
      const good = ans[i] === q.answer; if (good) ok++; else wrong.push({ q, your: ans[i] >= 0 ? q.options[ans[i]] : '(bỏ trống)' });
      $('.fb', box).className = 'fb ' + (good ? 'ok' : 'no');
      $('.fb', box).innerHTML = (good ? '✔ Đúng. ' : '✘ Sai. Đáp án: <b>' + esc(q.options[q.answer]) + '</b>. ') + (q.explain || '');
    });
    $('.sub', el).disabled = true;
    const sc = pct(ok, qs.length);
    $('.res', el).innerHTML = `<div class="score ${sc >= (opts.pass || PASS) ? 'pass' : 'fail'}">Kết quả: ${ok}/${qs.length} câu đúng (${sc}%)</div>`;
    wrong.forEach(({ q, your }) => { S.mistakes.unshift({ date: today(), day: opts.day || null, type: q.kind || '', q: q.prompt.replace(/<button[^]*?<\/button>/g, '').replace(/<[^>]+>/g, ' ').trim(), your, correct: q.options[q.answer], ref: q.ref || null }); if (q.ref && S.srs[q.ref]) srsGrade(q.ref, 0); });
    S.mistakes = S.mistakes.slice(0, 800); save();
    onDone && onDone(sc, ok, qs.length, wrong);
  };
}

/* ---------- Router ---------- */
const routes = { home, lesson, review, tests, progress, mistakes, dict, settings, test: testPage, download };
function go() {
  const [r, a, b] = (location.hash.slice(2) || 'home').split('/');
  $$('#nav a').forEach(x => x.classList.toggle('on', x.getAttribute('href') === '#/' + r));
  speechSynthesis && speechSynthesis.cancel();
  (routes[r] || home)(a, b); window.scrollTo(0, 0);
}
window.addEventListener('hashchange', go);

/* ---------- Trang chủ ---------- */
function home() {
  const d = currentDay(), dd = day(d), m = minutesToday();
  const learned = Object.keys(S.srs).length, due = dueWords().length;
  const done = PARTS.filter(p => dd.parts[p[0]]).length;
  const streak = (() => { let n = 0; for (let i = 0; i < 400; i++) { const k = today(-i); if ((S.log[k] || 0) >= 1 || Object.values(S.days).some(x => x.test && x.test.date === k)) n++; else if (i > 0) break; } return n; })();
  const scores = Object.keys(S.days).filter(k => S.days[k].test).map(k => S.days[k].test.score);
  if (!window.HSK_CHOSEN) { $('#main').innerHTML = `<div class="card"><h1 style="margin-top:0">Chào mừng bạn đến với app ôn luyện HSK 1–6</h1>
    <p>App miễn phí, chạy ngay trên trình duyệt, theo <b>danh sách từ vựng HSK 3.0 chính thức</b> (không lẫn HSK 2.0). Mỗi ngày học một nhóm từ mới có nghĩa tiếng Việt, pinyin, câu ví dụ, phát âm; làm bài kiểm tra cuối ngày đạt ${PASS}% thì mở ngày tiếp theo. Từ đã học được ôn lại theo phương pháp ôn tập ngắt quãng.</p>
    <h2>Chọn cấp độ để bắt đầu</h2>${levelButtons()}
    <p class="mut small">Có thể đổi cấp độ bất cứ lúc nào (ô chọn trên thanh trên cùng). Tiến độ của mỗi cấp được lưu riêng trên máy của bạn. Muốn có toàn bộ từ vựng HSK 1–6 dạng bảng tính? Xem mục <a href="#/download">Tải tài liệu</a>.</p></div>`; return; }
  $('#main').innerHTML = `
  <h1>HSK ${LEVEL} · Hôm nay là <span style="color:var(--red)">Ngày ${d}</span> / ${TOTAL_DAYS}</h1>
  <p class="mut">${PHASE[phaseOf(d)]}. Ngày dự kiến theo lịch: ${fmtDate(addDays(S.startDate, d - 1))}.</p>
  <div class="grid g4">
    <div class="stat"><div class="n">${Math.floor(m)}<span class="small mut"> / ${GOAL} phút</span></div><div class="l">Thời gian học hôm nay</div><div class="bar"><i style="width:${Math.min(100, m / GOAL * 100)}%"></i></div></div>
    <div class="stat"><div class="n">${learned}<span class="small mut"> / ${V.length}</span></div><div class="l">Từ mới đã học</div><div class="bar"><i style="width:${pct(learned, V.length)}%"></i></div></div>
    <div class="stat"><div class="n">${mastered()}</div><div class="l">Từ đã thuộc chắc (khoảng ôn ≥ 21 ngày)</div></div>
    <div class="stat"><div class="n">${due}</div><div class="l">Từ cần ôn hôm nay</div>${due ? '<a class="btn sm" href="#/review">Ôn ngay</a>' : ''}</div>
    <div class="stat"><div class="n">${streak} 🔥</div><div class="l">Chuỗi ngày học liên tiếp</div></div>
    <div class="stat"><div class="n">${scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) + '%' : '–'}</div><div class="l">Điểm kiểm tra trung bình</div></div>
  </div>
  <div class="card" style="margin-top:16px">
    <div class="row" style="justify-content:space-between"><h2 style="margin:0">Kế hoạch ${GOAL} phút hôm nay</h2><a class="btn pri" href="#/lesson/${d}">Bắt đầu học Ngày ${d} →</a></div>
    <ol class="plan">${PARTS.map(p => `<li>${(dd.parts[p[0]]) ? '✅' : '⬜'} <b>${p[1]}</b> <span class="mut">· ${p[2]} phút</span> ${planNote(d, p[0])}</li>`).join('')}</ol>
    <div class="mut small">Đã xong ${done}/${PARTS.length} phần. Bấm ▶ trên thanh trên cùng để bấm giờ. Sau khi làm bài kiểm tra cuối ngày, ngày tiếp theo sẽ mở.</div>
    ${due ? `<div class="note" style="margin-top:10px">Trước khi học bài mới, hãy ôn ${due} từ đến hạn (ôn tập ngắt quãng) để không quên từ cũ.</div>` : ''}
    ${isWeek(d) ? `<div class="note" style="margin-top:10px">📝 Hôm nay có <b>bài kiểm tra tổng hợp tuần ${d / 7}</b>. <a href="#/test/week/${d}">Làm bài</a></div>` : ''}
  </div>
  <div class="card"><h2 style="margin-top:0">Lộ trình ${TOTAL_DAYS} ngày · HSK ${LEVEL}</h2>${calendar(d)}
    <div class="mut small" style="margin-top:8px">Xanh: đã hoàn thành · Viền đỏ: ngày hiện tại · Chữ đậm: có kiểm tra tuần.</div></div>`;
}
function planNote(d, k) {
  if (k === 'vocab') return d <= NEW_DAYS ? `<span class="mut small">(${wordsOfDay(d).length} từ mới)</span>` : `<span class="mut small">(ôn ${PER_DAY} từ khó nhất)</span>`;
  if (k === 'grammar') return `<span class="mut small">(${grammarOfDay(d).map(g => esc(g.title)).join(' · ')})</span>`;
  if (k === 'reading') return `<span class="mut small">(${esc(readingOfDay(d).title)})</span>`;
  if (k === 'listening') return `<span class="mut small">(${esc(listeningOfDay(d).title)})</span>`;
  return '';
}
function calendar(cur) {
  let h = '<div class="cal">';
  for (let d = 1; d <= TOTAL_DAYS; d++) h += `<a href="#/lesson/${d}" class="${dayDone(d) ? 'done' : ''} ${d === cur ? 'cur' : ''} ${isWeek(d) ? 'week' : ''} ${unlocked(d) ? '' : 'lock'}" title="Ngày ${d}${S.days[d] && S.days[d].test ? ' · ' + S.days[d].test.score + '%' : ''}">${d}</a>`;
  return h + '</div>';
}

/* ---------- Bài học ---------- */
function lesson(dArg, partArg) {
  const d = Math.max(1, Math.min(TOTAL_DAYS, +dArg || currentDay()));
  if (!unlocked(d)) { $('#main').innerHTML = `<div class="card"><h2>Ngày ${d} chưa mở</h2><p>Hãy hoàn thành bài kiểm tra cuối ngày của Ngày ${d - 1} trước.</p><a class="btn pri" href="#/lesson/${currentDay()}">Về Ngày ${currentDay()}</a></div>`; return; }
  const dd = day(d), part = partArg || PARTS.find(p => !(dd.parts[p[0]]))?.[0] || 'vocab';
  $('#main').innerHTML = `<div class="row" style="justify-content:space-between"><h1>Ngày ${d} <span class="mut small">· ${PHASE[phaseOf(d)]}</span></h1>
    <div class="row">${d > 1 ? `<a class="btn sm" href="#/lesson/${d - 1}">← Ngày ${d - 1}</a>` : ''}${d < TOTAL_DAYS && unlocked(d + 1) ? `<a class="btn sm" href="#/lesson/${d + 1}">Ngày ${d + 1} →</a>` : ''}</div></div>
    <div class="tabs">${PARTS.map((p, i) => `<a class="tab ${p[0] === part ? 'on' : ''}" href="#/lesson/${d}/${p[0]}">${(dd.parts[p[0]]) ? '<span class="ck">✓</span> ' : ''}${i + 1}. ${p[1]} <span class="mut small">${p[2]}′</span></a>`).join('')}</div>
    <div id="part"></div>`;
  if (!timerOn) startTimer();
  ({ vocab: partVocab, grammar: partGrammar, reading: partReading, listening: partListening, writing: partWriting, speaking: partSpeaking, test: partTest })[part](d, $('#part'));
}
function markPart(d, k, extra) { const dd = day(d); dd.parts[k] = Object.assign({ date: today() }, extra || {}); save(); }
function nextBtn(d, k) { const i = PARTS.findIndex(p => p[0] === k); const n = PARTS[i + 1]; return n ? `<a class="btn pri" href="#/lesson/${d}/${n[0]}">Tiếp: ${n[1]} →</a>` : ''; }
function wordLinks(w) { const q = encodeURIComponent(w); return `<span class="links"><a href="https://hanzii.net/search/word/${q}?hl=vi" target="_blank">Hanzii (Việt)</a><a href="https://www.mdbg.net/chinese/dictionary?page=worddict&wdqb=${q}" target="_blank">MDBG</a><a href="https://www.zdic.net/hans/${q}" target="_blank">汉典</a></span>`; }
function wordRow(w) {
  return `<div class="word"><div><div class="hz">${esc(w.w)}</div><div class="py">${esc(w.p)}</div></div>
    <div><div><span class="pos">${esc(posVi(w.pos))}</span><b>${esc(w.vi)}</b></div><div class="en">EN: ${esc(w.en)}</div>
    ${w.col ? `<div class="small"><b>Kết hợp (搭配):</b> <span class="zh">${esc(w.col)}</span></div>` : ''}
    ${w.ex ? `<div class="ex"><div class="zh">${esc(w.ex[0])} ${sayBtn(w.ex[0])}</div><div class="p">${esc(w.ex[1])}</div><div class="v">${esc(w.ex[2])}</div></div>` : ''}
    ${w.syn ? `<div class="small"><b>Dễ nhầm / gần nghĩa:</b> <span class="zh">${esc(w.syn)}</span></div>` : ''}
    <div>${wordLinks(w.w)}</div></div><div>${sayBtn(w.w)}</div></div>`;
}
function partVocab(d, el) {
  const isNew = d <= NEW_DAYS, words = isNew ? wordsOfDay(d) : reviewWordsOfDay(d);
  el.innerHTML = `<div class="card"><div class="row" style="justify-content:space-between"><h2 style="margin:0">${isNew ? `${words.length} từ mới HSK 3.0 cấp ${LEVEL}` : `${words.length} từ cần củng cố (giai đoạn ôn luyện)`}</h2>
    <div class="row"><button class="btn" id="fcBtn">🃏 Học bằng thẻ</button><button class="btn" id="playAll">🔊 Nghe cả danh sách</button></div></div>
    <p class="mut small">Đọc to từng từ và câu ví dụ, che nghĩa để tự kiểm tra. Bấm các liên kết Hanzii/MDBG/汉典 để xem thêm ví dụ, cách kết hợp và sắc thái nghĩa trên mạng. Thời gian gợi ý: ${PARTS[0][2]} phút.</p>
    <div id="fc" class="hide"></div><div id="wl">${words.map(wordRow).join('')}</div>
    <div class="row" style="margin-top:14px"><button class="btn pri" id="doneV">✓ Đã học xong phần từ vựng</button>${nextBtn(d, 'vocab')}</div></div>`;
  $('#playAll').onclick = async () => { for (const w of words) { await speak(w.w, { queue: true }); await new Promise(r => setTimeout(r, 500)); } };
  $('#fcBtn').onclick = () => { $('#wl').classList.toggle('hide'); $('#fc').classList.toggle('hide'); if (!$('#fc').classList.contains('hide')) flashcards($('#fc'), shuffle(words), null); };
  $('#doneV').onclick = () => { words.forEach(w => srsAdd(w.id)); markPart(d, 'vocab', { words: words.length }); alertBox('Đã lưu. Các từ này được đưa vào lịch ôn tập ngắt quãng.'); lesson(d, PARTS[1][0]); };
}
function flashcards(el, cards, onGrade) {
  let i = 0, shown = false;
  const draw = () => {
    if (i >= cards.length) { el.innerHTML = `<div class="flash"><div class="face"><div style="font-size:40px">🎉</div><p>Xong ${cards.length} thẻ!</p></div></div>`; return; }
    const w = cards[i];
    el.innerHTML = `<div class="flash"><div class="mut small">Thẻ ${i + 1}/${cards.length}</div><div class="face" id="face">
      <div class="big hz">${esc(w.w)}</div>${shown ? `<div class="py" style="font-size:22px">${esc(w.p)}</div><div style="font-size:20px;margin-top:6px">${esc(w.vi)}</div><div class="en">${esc(w.en)}</div>${w.ex ? `<div class="ex" style="text-align:left;margin-top:10px"><div class="zh">${esc(w.ex[0])}</div><div class="p">${esc(w.ex[1])}</div><div class="v">${esc(w.ex[2])}</div></div>` : ''}` : '<div class="mut">Bấm để lật thẻ (hoặc phím Space)</div>'}</div>
      <div class="grades">${shown ? `<button class="btn gr0" data-g="0">Quên (1)</button><button class="btn gr3" data-g="3">Khó (2)</button><button class="btn gr4" data-g="4">Nhớ (3)</button><button class="btn gr5" data-g="5">Dễ (4)</button>` : ''}<button class="btn" data-say="${esc(w.w)}">🔊</button></div></div>`;
    $('#face', el).onclick = () => { shown = true; draw(); speak(w.w); };
    $$('[data-g]', el).forEach(b => b.onclick = () => grade(+b.dataset.g));
  };
  const grade = g => { const w = cards[i]; if (onGrade) onGrade(w, g); else { srsAdd(w.id); srsGrade(w.id, g); } i++; shown = false; draw(); };
  const key = e => { if (!document.body.contains(el) || el.classList.contains('hide')) return document.removeEventListener('keydown', key); if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return; if (e.code === 'Space') { e.preventDefault(); if (!shown) { shown = true; draw(); speak(cards[i].w); } } else if (shown && '1234'.includes(e.key)) grade([0, 3, 4, 5][+e.key - 1]); };
  document.addEventListener('keydown', key); draw();
}
function grammarCard(g) {
  return `<div class="card gp"><h3>${esc(g.title)}</h3>
    <div class="formula zh">${esc(g.formula)}</div>
    <p><b>Ý nghĩa:</b> ${esc(g.meaning)}</p>
    <p><b>Cách dùng:</b> ${esc(g.usage)}</p>
    <p><b>Vị trí trong câu:</b> ${esc(g.position)}</p>
    <div><b>Ví dụ thực tế:</b>${g.examples.map(e => `<div class="ex"><div class="zh">${esc(e[0])} ${sayBtn(e[0])}</div><div class="p">${esc(e[2] || '')}</div><div class="v">${esc(e[1])}</div></div>`).join('')}</div>
    <p><b>So sánh với cấu trúc gần nghĩa:</b> ${esc(g.compare)}</p>
    <p><b>Lỗi người Việt hay mắc:</b> ${esc(g.errors)}</p></div>`;
}
function partGrammar(d, el) {
  const gs = grammarOfDay(d), review = d > G.length;
  el.innerHTML = `${review ? '<div class="note">Giai đoạn luyện đề: ôn lại 2 cấu trúc đã học.</div>' : ''}${gs.map(grammarCard).join('')}
    <div class="card"><h2 style="margin-top:0">Bài tập (${gs.reduce((a, g) => a + g.ex.length, 0)} câu)</h2><div id="gq"></div><div class="row" style="margin-top:10px">${nextBtn(d, 'grammar')}</div></div>`;
  const qs = []; gs.forEach(g => g.ex.forEach(x => qs.push(mcq(`<span class="zh">${esc(x.q)}</span>`, x.o[x.a], x.o.filter((_, i) => i !== x.a), { kind: g.title, explain: esc(x.e || '') }))));
  quiz($('#gq'), qs, sc => markPart(d, 'grammar', { score: sc }), { day: d, id: 'g', pass: 60 });
}
function sentenceSpans(text, pys) {
  const ss = text.match(/[^。！？；\n]+[。！？；]?|\n/g) || [text];
  let k = 0; return ss.map(s => s === '\n' ? '\n' : `<span class="s" data-say="${esc(s)}">${esc(s)}<span class="pyline hide">${esc((pys && pys[k++]) || '')}</span></span>`).join('');
}
function partReading(d, el) {
  const r = readingOfDay(d), dd = day(d);
  el.innerHTML = `<div class="card"><div class="row" style="justify-content:space-between"><h2 style="margin:0">阅读：${esc(r.title)}</h2><div class="row"><label class="small"><input type="checkbox" id="pyT"> Hiện pinyin</label><span class="mut small">${r.text.length} chữ · gợi ý 10 phút</span></div></div>
    <p class="mut small">Đọc không tra từ trước. Bấm vào một câu để nghe câu đó. Bản dịch và đáp án chỉ hiện sau khi bạn nộp bài.</p>
    <div class="passage zh">${sentenceSpans(r.text, r.py)}</div></div>
    <div class="card"><h3 style="margin-top:0">Nhiệm vụ trước khi làm câu hỏi</h3>
      <ol><li>Tìm 5 từ khóa của bài (gợi ý: các từ lặp lại hoặc thuộc chủ đề chính).</li><li>Chọn 1 câu dài nhất, chỉ ra chủ ngữ – vị ngữ – tân ngữ và liên từ.</li><li>Tóm tắt bài bằng tiếng Trung trong 2–3 câu.</li></ol>
      <textarea id="rsum" placeholder="Từ khóa: ...&#10;Phân tích câu: ...&#10;Tóm tắt (tiếng Trung): ...">${esc(dd.readNote || '')}</textarea></div>
    <div class="card"><h3 style="margin-top:0">5 câu hỏi đọc hiểu</h3><div id="rq"></div></div>
    <div class="card hide" id="rans"><h3 style="margin-top:0">Đáp án tham khảo</h3><p><b>Từ khóa:</b> <span class="zh">${esc((r.keywords || []).join('、'))}</span></p><p><b>Bản dịch tiếng Việt:</b></p><p>${esc(r.vi)}</p><div class="row">${nextBtn(d, 'reading')}</div></div>
    <div class="card"><b>Đọc thêm trên mạng:</b> <span class="links"><a href="https://www.people.com.cn/" target="_blank">人民网</a><a href="https://www.bbc.com/zhongwen/simp" target="_blank">BBC 中文</a><a href="https://cn.chinadaily.com.cn/" target="_blank">中国日报</a><a href="https://www.thepaper.cn/" target="_blank">澎湃新闻</a></span></div>`;
  $('#pyT').onchange = e => $$('.pyline').forEach(x => x.classList.toggle('hide', !e.target.checked));
  $('#rsum').oninput = e => { dd.readNote = e.target.value; save(); };
  quiz($('#rq'), r.q.map(x => mcq(`<span class="zh">${esc(x.q)}</span>`, x.o[x.a], x.o.filter((_, i) => i !== x.a), { explain: esc(x.e || '') })), sc => { markPart(d, 'reading', { score: sc }); $('#rans').classList.remove('hide'); }, { day: d, id: 'r', pass: 60 });
}
function partListening(d, el) {
  const l = listeningOfDay(d);
  const lines = l.lines;
  el.innerHTML = `<div class="card"><h2 style="margin-top:0">听力：${esc(l.title)} <span class="pill">${esc(l.type)}</span></h2>
    <div class="note">Âm thanh được đọc bằng giọng phổ thông Trung Quốc có sẵn trên máy tính (giọng máy, không phải băng thu của người thật). Nghe <b>trước</b>, chưa xem lời thoại. Nghe tối đa 2 lần rồi trả lời.</div>
    <div class="row" style="margin:12px 0"><button class="btn pri" id="play">▶ Nghe</button><button class="btn" id="stop">■ Dừng</button>
      <label class="small">Tốc độ <select id="rate"><option value="0.75">Chậm</option><option value="0.9" selected>Vừa</option><option value="1.05">Tự nhiên</option></select></label><span class="mut small" id="cnt">Đã nghe 0 lần</span></div>
    ${VOICES.length ? '' : '<p class="note">Không tìm thấy giọng đọc tiếng Trung trên máy. Trên Mac: Cài đặt hệ thống → Trợ năng → Nội dung được đọc → Giọng hệ thống → Quản lý giọng → thêm giọng Trung Quốc (Tingting). Nếu vẫn không có, hãy đọc lời thoại bên dưới.</p>'}</div>
    <div class="card"><h3 style="margin-top:0">Câu hỏi</h3><div id="lq"></div></div>
    <div class="card hide" id="ltr"><h3 style="margin-top:0">Lời thoại (transcript)</h3><div class="zh" style="font-size:18px;line-height:1.9">${lines.map(([who, t], i) => `<div>${who ? `<b>${esc(who)}：</b>` : ''}<span class="s" data-say="${esc(t)}">${esc(t)}</span><div class="pyline">${esc((l.py || [])[i] || '')}</div></div>`).join('')}</div>
      <h3>Từ mới</h3><table>${(l.words || []).map(w => `<tr><td class="zh" style="font-size:18px">${esc(w[0])}</td><td class="py">${esc(w[1])}</td><td>${esc(w[2])}</td></tr>`).join('')}</table>
      ${l.hard ? `<h3>Câu khó</h3><p>${esc(l.hard)}</p>` : ''}
      <h3>Dịch nghĩa</h3><p>${esc(l.vi)}</p>
      <h3>Nhiệm vụ: tóm tắt nội dung bằng tiếng Trung (2–3 câu)</h3><textarea id="lsum">${esc(day(d).listenNote || '')}</textarea>
      <div class="row" style="margin-top:10px">${nextBtn(d, 'listening')}</div></div>
    <div class="card"><b>Nghe thêm trên mạng:</b> <span class="links"><a href="https://www.youtube.com/results?search_query=HSK6+%E5%90%AC%E5%8A%9B" target="_blank">YouTube: HSK6 听力</a><a href="https://tv.cctv.com/lm/xwlb/" target="_blank">CCTV 新闻联播</a><a href="https://www.ximalaya.com/" target="_blank">喜马拉雅</a></span></div>`;
  let n = 0;
  $('#play').onclick = () => { n++; $('#cnt').textContent = 'Đã nghe ' + n + ' lần'; speakLines(lines, +$('#rate').value); };
  $('#stop').onclick = () => speechSynthesis.cancel();
  quiz($('#lq'), l.q.map(x => mcq(`<span class="zh">${esc(x.q)}</span>`, x.o[x.a], x.o.filter((_, i) => i !== x.a), { explain: esc(x.e || '') })), sc => { markPart(d, 'listening', { score: sc }); $('#ltr').classList.remove('hide'); $('#lsum').oninput = e => { day(d).listenNote = e.target.value; save(); }; }, { day: d, id: 'l', pass: 60 });
}
function claudePrompt(kind, topic, text) {
  if (kind === 'writing') return `Bạn là giáo viên luyện thi HSK 6. Hãy chấm bài viết tiếng Trung của tôi.\nĐề bài: ${topic}\nBài của tôi:\n${text}\n\nYêu cầu: 1) Sửa từng lỗi ngữ pháp; 2) Sửa cách dùng từ; 3) Đưa ra cách diễn đạt tự nhiên hơn; 4) Giải thích nguyên nhân sai bằng tiếng Việt; 5) Viết lại phiên bản hoàn chỉnh đạt trình độ HSK 6 (kèm pinyin cho từ khó); 6) Chấm điểm /100 và đánh giá.`;
  return `Bạn là giáo viên luyện thi HSK 6. Đây là phần nói của tôi (chuyển thành chữ bằng nhận dạng giọng nói, có thể sai vài chữ).\nChủ đề: ${topic}\nNội dung:\n${text}\n\nHãy đánh giá bằng tiếng Việt: từ vựng, ngữ pháp, tính logic, độ tự nhiên; sửa lỗi và gợi ý cách nói hay hơn đạt trình độ HSK 6.`;
}
function copyText(t) { (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => alertBox('Đã sao chép. Dán vào Claude để được chấm chi tiết.'), () => { const a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); document.execCommand('copy'); a.remove(); alertBox('Đã sao chép.'); }); }
function partWriting(d, el) {
  const p = d <= WP.length ? WP[d - 1] : { t: `缩写（HSK 6 写作题型）：把阅读文章《${readingOfDay(d).title}》缩写成400字左右的短文，不加入自己的观点。`, vi: 'Đọc lại bài đọc hôm nay trong 10 phút, gấp lại rồi tóm lược bằng lời của mình, giữ đủ ý chính. Đây là dạng bài viết trong đề thi HSK 6.', hint: 'Giữ trình tự: bối cảnh → vấn đề → nguyên nhân/giải pháp → kết luận.' }, dd = day(d), min = d <= 15 ? 150 : d <= 30 ? 250 : 400;
  el.innerHTML = `<div class="card"><h2 style="margin-top:0">写作 · Đề bài ngày ${d}</h2>
    <p class="zh" style="font-size:19px">${esc(p.t)}</p><p class="mut">${esc(p.vi)}</p>
    <p class="small"><b>Yêu cầu:</b> khoảng ${min} chữ trở lên · dùng ít nhất 5 từ mới hôm nay và cấu trúc ngữ pháp vừa học.${p.hint ? ' Gợi ý: ' + esc(p.hint) : ''}</p>
    <div class="small mut">Từ mới hôm nay: <span class="zh">${(d <= NEW_DAYS ? wordsOfDay(d) : reviewWordsOfDay(d)).slice(0, 12).map(w => esc(w.w)).join('、')}</span></div>
    <textarea id="wt" placeholder="Viết bài bằng tiếng Trung ở đây...">${esc(dd.writing || '')}</textarea>
    <div class="row"><span id="wc" class="mut small"></span></div>
    <h3>Tự kiểm tra trước khi nộp</h3>
    <div class="small">${['Có mở bài nêu quan điểm rõ ràng', 'Mỗi đoạn có một ý chính và ví dụ', 'Dùng liên từ nối ý (首先、其次、此外、因此、总之…)', 'Không lẫn trật tự từ kiểu tiếng Việt (định ngữ, trạng ngữ đặt trước động từ)', 'Đã dùng đủ 5 từ mới và cấu trúc hôm nay', 'Có kết bài tóm lại quan điểm'].map((c, i) => `<label style="display:block"><input type="checkbox" class="wck" data-i="${i}" ${(dd.wck || [])[i] ? 'checked' : ''}> ${c}</label>`).join('')}</div>
    <div class="row" style="margin-top:12px"><button class="btn pri" id="wsave">Lưu bài viết</button><button class="btn" id="wcopy">📋 Sao chép để nhờ Claude chấm</button>${nextBtn(d, 'writing')}</div>
    <p class="mut small">App không tự chấm được bài viết tự do. Bấm “Sao chép” rồi dán vào cuộc trò chuyện với Claude để được sửa từng lỗi, viết lại bản HSK 6 và chấm điểm.</p></div>`;
  const cnt = () => $('#wc').textContent = ($('#wt').value.match(/[\u4e00-\u9fff]/g) || []).length + ' chữ Hán';
  cnt(); $('#wt').oninput = () => { cnt(); dd.writing = $('#wt').value; save(); };
  $$('.wck').forEach(c => c.onchange = () => { dd.wck = $$('.wck').map(x => x.checked); save(); });
  $('#wsave').onclick = () => { dd.writing = $('#wt').value; markPart(d, 'writing', { chars: ($('#wt').value.match(/[\u4e00-\u9fff]/g) || []).length }); alertBox('Đã lưu bài viết.'); };
  $('#wcopy').onclick = () => copyText(claudePrompt('writing', p.t, $('#wt').value));
}
function partSpeaking(d, el) {
  const p = d <= SP.length ? SP[d - 1] : { t: `复述：用自己的话复述听力材料《${listeningOfDay(d).title}》，然后谈谈你的看法。`, vi: 'Kể lại nội dung bài nghe hôm nay bằng lời của bạn (1–2 phút), sau đó nêu quan điểm (1 phút).', hints: '主要内容→细节→我的看法' }, dd = day(d);
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  el.innerHTML = `<div class="card"><h2 style="margin-top:0">口语 · Chủ đề ngày ${d}</h2>
    <p class="zh" style="font-size:20px">${esc(p.t)}</p><p class="mut">${esc(p.vi)}</p>
    ${p.hints ? `<p class="small"><b>Dàn ý gợi ý:</b> <span class="zh">${esc(p.hints)}</span></p>` : ''}
    <p class="small">Chuẩn bị 1 phút, sau đó nói liên tục <b>2–3 phút</b>. Bấm ghi âm để nghe lại phát âm và thanh điệu của mình.</p>
    <div class="row"><button class="btn pri" id="rec">🎙 Bắt đầu ghi âm</button><span id="rtime" class="mut" style="font-variant-numeric:tabular-nums">0:00</span></div>
    <audio id="aud" controls class="hide" style="margin-top:10px;width:100%"></audio>
    <h3>Văn bản nhận dạng ${SR ? '(tự động khi ghi âm)' : ''}</h3>
    ${SR ? '' : '<p class="note small">Trình duyệt này không có nhận dạng giọng nói. Dùng Google Chrome để có tính năng chuyển lời nói thành chữ, hoặc tự gõ lại ý chính.</p>'}
    <textarea id="stxt" placeholder="Nội dung bạn đã nói...">${esc(dd.speech || '')}</textarea>
    <h3>Tự đánh giá (1–5)</h3>
    <table>${['Phát âm', 'Thanh điệu', 'Từ vựng', 'Ngữ pháp', 'Tính logic', 'Độ tự nhiên'].map((c, i) => `<tr><td>${c}</td><td>${[1, 2, 3, 4, 5].map(v => `<label style="margin-right:10px"><input type="radio" name="se${i}" value="${v}" ${((dd.selfEval || [])[i] == v) ? 'checked' : ''}> ${v}</label>`).join('')}</td></tr>`).join('')}</table>
    <div class="row" style="margin-top:12px"><button class="btn pri" id="ssave">Lưu phần nói</button><button class="btn" id="scopy">📋 Sao chép để nhờ Claude nhận xét</button>${nextBtn(d, 'speaking')}</div></div>`;
  let mr = null, chunks = [], t0 = 0, iv = null, rec = null;
  $('#rec').onclick = async () => {
    if (mr) { mr.stop(); rec && rec.stop(); return; }
    try {
      const st = await navigator.mediaDevices.getUserMedia({ audio: true });
      mr = new MediaRecorder(st); chunks = []; mr.ondataavailable = e => chunks.push(e.data);
      mr.onstop = () => { st.getTracks().forEach(t => t.stop()); const a = $('#aud'); a.src = URL.createObjectURL(new Blob(chunks, { type: mr.mimeType })); a.classList.remove('hide'); mr = null; clearInterval(iv); $('#rec').textContent = '🎙 Ghi âm lại'; };
      mr.start(); t0 = Date.now(); $('#rec').textContent = '■ Dừng ghi âm';
      iv = setInterval(() => { const s = Math.floor((Date.now() - t0) / 1000); $('#rtime').textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0') + (s >= 120 ? ' ✓ đạt 2 phút' : ''); if (s >= 200 && mr) { mr.stop(); rec && rec.stop(); } }, 500);
      if (SR) { rec = new SR(); rec.lang = 'zh-CN'; rec.continuous = true; rec.interimResults = false; const base = $('#stxt').value; let acc = ''; rec.onresult = e => { for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) acc += e.results[i][0].transcript + '，'; $('#stxt').value = (base ? base + '\n' : '') + acc; dd.speech = $('#stxt').value; save(); }; rec.onend = () => { if (mr) try { rec.start(); } catch (e) { } }; try { rec.start(); } catch (e) { } }
    } catch (e) { alertBox('Không truy cập được micro. Hãy cho phép trình duyệt dùng micro.'); }
  };
  $('#stxt').oninput = e => { dd.speech = e.target.value; save(); };
  $('#ssave').onclick = () => { dd.selfEval = [0, 1, 2, 3, 4, 5].map(i => +(($(`input[name="se${i}"]:checked`) || {}).value || 0)); markPart(d, 'speaking', { eval: dd.selfEval }); alertBox('Đã lưu phần luyện nói.'); };
  $('#scopy').onclick = () => copyText(claudePrompt('speaking', p.t, $('#stxt').value));
}

/* ---------- Kiểm tra cuối ngày ---------- */
function dailyQuestions(d) {
  const news = d <= NEW_DAYS ? wordsOfDay(d) : reviewWordsOfDay(d);
  const pool = learnedWords(Math.min(d, NEW_DAYS));
  const olds = (() => { const due = dueWords().filter(w => !news.includes(w)); const prev = learnedWords(Math.min(d - 1, NEW_DAYS)).filter(w => !news.includes(w)); return pick(due.length >= 5 ? due : due.concat(pick(prev.filter(w => !due.includes(w)), 5)), 5); })();
  const qs = [];
  pick(news, 10).forEach((w, i) => qs.push(vocabQ(w, VTYPES[i % VTYPES.length], pool)));
  olds.forEach((w, i) => { const q = vocabQ(w, VTYPES[(i + 2) % VTYPES.length], pool); q.kind = 'Từ cũ'; qs.push(q); });
  if (olds.length < 5) pick(news, 5 - olds.length).forEach((w, i) => qs.push(vocabQ(w, VTYPES[(i + 3) % VTYPES.length], pool)));
  if (!FULL) { const more = pick(news.filter(w => !qs.some(q => q.ref === w.id)), 5); more.forEach((w, i) => qs.push(vocabQ(w, VTYPES[(i + 1) % VTYPES.length], pool))); return qs; }
  const gs = G.slice(0, Math.min(d, G.length)); const todayG = grammarOfDay(d); const prevG = gs.filter(g => !todayG.includes(g));
  qs.push(...grammarQs(todayG, prevG.length ? 3 : 5), ...(prevG.length ? grammarQs(prevG, 2) : []));
  qs.push(...passageQs(readingOfDay(d), 2, 'Đọc hiểu'));
  return qs;
}
function partTest(d, el) {
  const dd = day(d);
  el.innerHTML = `<div class="card"><h2 style="margin-top:0">Kiểm tra cuối ngày ${d}</h2>
    <p class="mut">${FULL ? '10 từ mới · 5 từ cũ · 5 câu ngữ pháp · 2 câu đọc hiểu' : '15 câu về từ mới hôm nay · 5 câu ôn từ cũ (nghĩa, pinyin, nghe, điền từ vào câu)'}. Đạt từ ${PASS}% trở lên để hoàn thành ngày. Câu sai được ghi vào Sổ lỗi sai và từ sai sẽ được ôn lại sớm hơn.</p>
    ${dd.test ? `<div class="score ${dd.test.score >= PASS ? 'pass' : 'fail'}">Lần gần nhất: ${dd.test.score}% (${fmtDate(dd.test.date)}) · Lần làm: ${dd.test.tries || 1}</div>` : ''}
    <div id="tq"></div><div id="tsum"></div></div>`;
  quiz($('#tq'), dailyQuestions(d), (sc, ok, n, wrong) => {
    const best = Math.max(sc, (dd.test && dd.test.score) || 0);
    dd.test = { score: best, last: sc, date: today(), tries: ((dd.test && dd.test.tries) || 0) + 1 };
    if (sc >= PASS) markPart(d, 'test', { score: sc }); else save();
    const errTypes = {}; wrong.forEach(w => { const k = (w.q.kind || '').split(' · ')[0]; errTypes[k] = (errTypes[k] || 0) + 1; });
    $('#tsum').innerHTML = `<div class="card" style="background:#fbf7ee"><h3 style="margin-top:0">Tổng kết ngày ${d}</h3>
      ${sc >= PASS ? `<p>✅ Bạn đã hoàn thành Ngày ${d}. ${d < TOTAL_DAYS ? `Ngày ${d + 1} đã mở.` : `Bạn đã hoàn thành cả lộ trình ${TOTAL_DAYS} ngày HSK ${LEVEL}!`}</p>` : `<p>❌ Chưa đạt ${PASS}%. Hãy xem lại các câu sai bên trên, ôn lại từ và ngữ pháp, rồi <a href="#/lesson/${d}/test" onclick="setTimeout(()=>lesson(${d},'test'),0)">làm lại bài</a>.</p>`}
      <p><b>Lỗi thường gặp hôm nay:</b> ${Object.keys(errTypes).length ? Object.entries(errTypes).map(([k, v]) => `${esc(k)}: ${v} câu`).join(' · ') : 'Không có lỗi 👏'}</p>
      <p><b>Nhiệm vụ ôn tập cho ngày mai:</b></p><ul>
        <li>Ôn ${dueCountOn(today(1))} từ đến hạn trong mục <a href="#/review">Ôn tập</a> (ôn ngắt quãng).</li>
        ${wrong.filter(w => w.q.ref).length ? `<li>Viết lại 3 lần và đặt câu với các từ sai: <span class="zh">${wrong.filter(w => w.q.ref).map(w => esc(VBYID[w.q.ref].w)).join('、')}</span></li>` : ''}
        <li>Đọc to lại bài đọc hôm nay một lần, chú ý thanh điệu.</li>
        ${isWeek(d + 1) ? `<li>Ngày mai (Ngày ${d + 1}) có <b>kiểm tra tổng hợp tuần</b> – hãy ôn toàn bộ từ của tuần.</li>` : ''}
      </ul>${d < TOTAL_DAYS && sc >= PASS ? `<a class="btn pri" href="#/lesson/${d + 1}">Sang Ngày ${d + 1} →</a>` : ''}
      ${isWeek(d) ? ` <a class="btn" href="#/test/week/${d}">📝 Làm kiểm tra tuần ${d / 7}</a>` : ''}</div>`;
  }, { day: d, id: 't' });
}
function dueCountOn(date) { return Object.values(S.srs).filter(c => c.due <= date).length; }

/* ---------- Kiểm tra tuần & thi thử ---------- */
function tests() {
  const cur = currentDay();
  const weeks = []; for (let d = 7; d <= TOTAL_DAYS; d += 7) weeks.push(d);
  $('#main').innerHTML = `<h1>Kiểm tra định kỳ</h1>
    <div class="card"><h2 style="margin-top:0">Kiểm tra tổng hợp mỗi 7 ngày</h2><p class="mut">${FULL ? '40 câu: 25 câu từ vựng của 7 ngày gần nhất, 10 câu ngữ pháp, 5 câu đọc hiểu.' : '40 câu từ vựng của 7 ngày gần nhất.'}</p>
    <table><tr><th>Bài</th><th>Phạm vi</th><th>Kết quả</th><th></th></tr>${weeks.map(d => `<tr><td>Tuần ${d / 7}</td><td>Ngày ${d - 6}–${d}</td><td>${S.tests['week' + d] ? `<span class="pill ${S.tests['week' + d].score >= PASS ? 'ok' : 'no'}">${S.tests['week' + d].score}%</span> ${fmtDate(S.tests['week' + d].date)}` : '–'}</td><td>${cur >= d - 1 ? `<a class="btn sm" href="#/test/week/${d}">Làm bài</a>` : '<span class="mut small">Chưa tới</span>'}</td></tr>`).join('')}</table></div>
    <div class="card"><h2 style="margin-top:0">Thi thử tổng hợp${FULL ? ' (giai đoạn 4)' : ''}</h2><p class="mut">${FULL ? '60 câu, có tính giờ 30 phút: từ vựng toàn bộ phạm vi đã học, ngữ pháp, đọc hiểu và nghe hiểu. Nên làm từ ngày 46 trở đi, mỗi 3–4 ngày một lần.' : `50 câu từ vựng trong toàn bộ phạm vi đã học, có tính giờ 25 phút. Nên làm khi đã học xong từ mới (từ Ngày ${NEW_DAYS + 1}).`}</p>
    <a class="btn pri" href="#/test/mock/${Date.now() % 100000}">Bắt đầu thi thử</a>
    <table style="margin-top:12px"><tr><th>Ngày làm</th><th>Kết quả</th></tr>${Object.entries(S.tests).filter(([k]) => k.startsWith('mock')).map(([k, v]) => `<tr><td>${fmtDate(v.date)}</td><td>${v.score}%</td></tr>`).join('') || '<tr><td colspan="2" class="mut">Chưa làm</td></tr>'}</table></div>
    <div class="card"><b>Đề thi thật HSK 3.0:</b> định dạng đề và đề mẫu chính thức ở trang <a href="https://www.chinesetest.cn/" target="_blank">chinesetest.cn</a> (Trung tâm Khảo thí Hán ngữ quốc tế).</div>`;
}
function testPage(kind, arg) {
  const el = $('#main');
  if (kind === 'week') {
    const d = +arg, from = Math.max(1, d - 6);
    let words = []; for (let i = from; i <= d; i++) words.push(...(i <= NEW_DAYS ? wordsOfDay(i) : reviewWordsOfDay(i)));
    const pool = learnedWords(Math.min(d, NEW_DAYS));
    const gs = []; for (let i = from; i <= d; i++) gs.push(...grammarOfDay(i));
    const qs = pick(words, FULL ? 25 : 40).map((w, i) => vocabQ(w, VTYPES[i % 5], pool)).concat(FULL ? grammarQs(gs, 10) : []);
    const rs = []; for (let i = from; i <= d; i++) rs.push(readingOfDay(i));
    if (FULL) pick(rs, 5).forEach(r => qs.push(...passageQs(r, 1, 'Đọc hiểu')));
    el.innerHTML = `<h1>Kiểm tra tổng hợp tuần ${d / 7} <span class="mut small">(Ngày ${from}–${d})</span></h1><div class="card"><div id="wq"></div></div>`;
    quiz($('#wq'), qs, sc => { S.tests['week' + d] = { score: sc, date: today() }; save(); }, { id: 'w' });
  } else {
    const d = currentDay(), pool = learnedWords(Math.min(d, NEW_DAYS)).length >= 40 ? learnedWords(Math.min(d, NEW_DAYS)) : V.slice(0, 60);
    const qs = pick(pool, FULL ? 30 : 50).map((w, i) => vocabQ(w, VTYPES[i % 5], pool));
    if (FULL) { qs.push(...grammarQs(G.slice(0, Math.max(3, Math.min(d, G.length))), 15)); pick(R, 3).forEach(r => qs.push(...passageQs(r, 3, 'Đọc hiểu'))); pick(L, 3).forEach(l => qs.push(...passageQs({ title: l.title, q: l.q }, 2, 'Nghe (đọc transcript)'))); }
    let s = FULL ? 1800 : 1500;
    el.innerHTML = `<h1>Thi thử tổng hợp HSK ${LEVEL}</h1><div class="note">Thời gian: <b id="mt">${s / 60}:00</b>.${FULL ? ' Phần nghe trong thi thử dùng câu hỏi của bài nghe đã học (dựa trên nội dung đã nghe).' : ''}</div><div class="card"><div id="mq"></div></div>`; const iv = setInterval(() => { if (!document.body.contains($('#mt'))) return clearInterval(iv); s--; $('#mt').textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); if (s <= 0) { clearInterval(iv); alertBox('Hết giờ!'); } }, 1000);
    quiz($('#mq'), qs, sc => { clearInterval(iv); S.tests['mock' + Date.now()] = { score: sc, date: today() }; save(); }, { id: 'm' });
  }
}

/* ---------- Ôn tập ---------- */
function review() {
  const due = dueWords();
  $('#main').innerHTML = `<h1>Ôn tập ngắt quãng</h1>
    <div class="card"><p>Hôm nay có <b>${due.length}</b> từ đến hạn ôn. Tự đánh giá sau khi lật thẻ: <b>Quên</b> (ôn lại ngày mai), <b>Khó</b>, <b>Nhớ</b>, <b>Dễ</b> (khoảng ôn dài hơn). Phím tắt: Space lật thẻ, 1–4 chấm.</p>
    <div class="row"><button class="btn pri" id="go" ${due.length ? '' : 'disabled'}>Ôn ${Math.min(due.length, 100)} từ</button><button class="btn" id="quizR" ${Object.keys(S.srs).length >= 8 ? '' : 'disabled'}>Câu hỏi ngẫu nhiên 15 từ cũ</button><button class="btn" id="hard">Ôn 20 từ hay sai</button></div></div>
    <div id="rv"></div>`;
  $('#go').onclick = () => flashcards($('#rv'), shuffle(due).slice(0, 100), null);
  $('#quizR').onclick = () => { const ws = Object.keys(S.srs).map(id => VBYID[id]).filter(Boolean); const box = document.createElement('div'); box.className = 'card'; $('#rv').innerHTML = ''; $('#rv').appendChild(box); quiz(box, pick(ws, 15).map((w, i) => vocabQ(w, VTYPES[i % 5], ws)), (sc, ok, n, wrong) => { }, { id: 'rv' }); };
  $('#hard').onclick = () => { const ws = Object.entries(S.srs).filter(([, c]) => c.lapses).sort((a, b) => b[1].lapses - a[1].lapses).slice(0, 20).map(([id]) => VBYID[id]).filter(Boolean); if (!ws.length) return alertBox('Chưa có từ nào bị sai. Tuyệt vời!'); flashcards($('#rv'), ws, null); };
}

/* ---------- Tiến độ ---------- */
function progress() {
  const rows = []; let totalMin = 0;
  for (let d = 1; d <= TOTAL_DAYS; d++) { const x = S.days[d]; if (!x) continue; totalMin += x.minutes || 0; rows.push([d, x]); }
  const pts = rows.filter(([, x]) => x.test).map(([d, x]) => [d, x.test.score]);
  const W = 680, H = 160, chart = pts.length ? `<svg viewBox="0 0 ${W + 20} ${H + 24}" width="100%"><line x1="30" y1="${H - H * PASS / 100}" x2="${W}" y2="${H - H * PASS / 100}" stroke="#1e8e3e" stroke-dasharray="4"/><text x="0" y="${H - H * PASS / 100 + 4}">${PASS}%</text>
    <polyline fill="none" stroke="#c0392b" stroke-width="2" points="${pts.map(([d, s]) => `${30 + (d - 1) * (W - 40) / (TOTAL_DAYS - 1)},${H - H * s / 100}`).join(' ')}"/>${pts.map(([d, s]) => `<circle cx="${30 + (d - 1) * (W - 40) / (TOTAL_DAYS - 1)}" cy="${H - H * s / 100}" r="3" fill="#c0392b"><title>Ngày ${d}: ${s}%</title></circle>`).join('')}
    ${[1, Math.round(TOTAL_DAYS / 4), Math.round(TOTAL_DAYS / 2), Math.round(TOTAL_DAYS * 3 / 4), TOTAL_DAYS].map(d => `<text x="${30 + (d - 1) * (W - 40) / (TOTAL_DAYS - 1) - 8}" y="${H + 18}">N${d}</text>`).join('')}</svg>` : '<p class="mut">Chưa có bài kiểm tra nào.</p>';
  const gDone = rows.filter(([, x]) => x.parts && x.parts.grammar).length;
  const wDone = rows.filter(([, x]) => x.parts && x.parts.writing).length, sDone = rows.filter(([, x]) => x.parts && x.parts.speaking).length;
  $('#main').innerHTML = `<h1>Bảng theo dõi tiến độ</h1>
    <div class="grid g4">
      <div class="stat"><div class="n">${Object.keys(S.srs).length}</div><div class="l">Số từ mới đã học (/${V.length})</div></div>
      <div class="stat"><div class="n">${mastered()}</div><div class="l">Số từ đã thuộc chắc</div></div>
      ${FULL ? `<div class="stat"><div class="n">${Math.min(gDone, G.length)}</div><div class="l">Cấu trúc ngữ pháp đã học (/${G.length})</div></div>` : ''}
      <div class="stat"><div class="n">${Object.values(S.days).filter(x => x.parts && x.parts.test).length}</div><div class="l">Ngày đã hoàn thành (/${TOTAL_DAYS})</div></div>
      <div class="stat"><div class="n">${Math.round(totalMin)}</div><div class="l">Tổng số phút đã học</div></div>
      ${FULL ? `<div class="stat"><div class="n">${wDone} / ${sDone}</div><div class="l">Bài viết / bài nói đã làm</div></div>` : ''}
      <div class="stat"><div class="n">${S.mistakes.length}</div><div class="l">Lỗi sai đã ghi lại</div></div>
    </div>
    <div class="card" style="margin-top:16px"><h2 style="margin-top:0">Điểm kiểm tra cuối ngày</h2>${chart}</div>
    <div class="card"><h2 style="margin-top:0">Chi tiết từng ngày</h2><table><tr><th>Ngày</th><th>Phút học</th><th>Phần đã xong</th>${FULL ? '<th>Ngữ pháp</th><th>Đọc</th><th>Nghe</th>' : ''}<th>Kiểm tra</th></tr>
      ${rows.map(([d, x]) => `<tr><td><a href="#/lesson/${d}">Ngày ${d}</a></td><td>${Math.round(x.minutes || 0)}</td><td>${PARTS.filter(p => x.parts[p[0]]).length}/${PARTS.length}</td>${FULL ? `<td>${x.parts.grammar ? x.parts.grammar.score + '%' : '–'}</td><td>${x.parts.reading ? x.parts.reading.score + '%' : '–'}</td><td>${x.parts.listening ? x.parts.listening.score + '%' : '–'}</td>` : ''}<td>${x.test ? `<span class="pill ${x.test.score >= PASS ? 'ok' : 'no'}">${x.test.score}%</span>` : '–'}</td></tr>`).join('') || '<tr><td colspan="7" class="mut">Chưa có dữ liệu</td></tr>'}</table></div>
    <div class="card"><h2 style="margin-top:0">Thời gian học theo ngày (lịch)</h2><table><tr><th>Ngày</th><th>Phút</th><th></th></tr>${Object.entries(S.log).sort().reverse().slice(0, 30).map(([k, m]) => `<tr><td>${fmtDate(k)}</td><td>${Math.round(m)}</td><td style="width:60%"><div class="bar"><i style="width:${Math.min(100, m / GOAL * 100)}%"></i></div></td></tr>`).join('')}</table></div>`;
}

/* ---------- Sổ lỗi sai ---------- */
function mistakes() {
  const types = {}; S.mistakes.forEach(m => { const k = (m.type || 'Khác').split(' · ')[0]; types[k] = (types[k] || 0) + 1; });
  $('#main').innerHTML = `<h1>Sổ lỗi sai</h1><div class="card"><p>Tổng ${S.mistakes.length} lỗi. ${Object.entries(types).map(([k, v]) => `<span class="pill">${esc(k)}: ${v}</span>`).join(' ')}</p>
    <table><tr><th>Ngày</th><th>Loại</th><th>Câu hỏi</th><th>Bạn chọn</th><th>Đáp án đúng</th></tr>${S.mistakes.slice(0, 300).map(m => `<tr><td>${fmtDate(m.date)}${m.day ? '<br><span class="mut small">N' + m.day + '</span>' : ''}</td><td class="small">${esc(m.type)}</td><td class="zh">${esc(m.q)}</td><td class="zh" style="color:var(--bad)">${esc(m.your)}</td><td class="zh" style="color:var(--ok)">${esc(m.correct)}</td></tr>`).join('')}</table></div>`;
}

/* ---------- Từ điển ---------- */
function dict() {
  $('#main').innerHTML = `<h1>Từ điển HSK 3.0 cấp ${LEVEL} <span class="mut small">(${V.length} từ)</span></h1>
    <div class="card"><div class="row"><input type="text" id="qq" placeholder="Tìm chữ Hán, pinyin (không dấu cũng được) hoặc nghĩa tiếng Việt" style="flex:1"><select id="qf"><option value="all">Tất cả</option><option value="learned">Đã học</option><option value="new">Chưa học</option></select></div><div id="dl" style="margin-top:10px"></div></div>`;
  const strip = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/\s+/g, '').toLowerCase();
  const draw = () => {
    const q = strip($('#qq').value), f = $('#qf').value;
    const res = V.filter(w => (f === 'all' || (f === 'learned') === !!S.srs[w.id]) && (!q || strip(w.w + '|' + w.p + '|' + w.vi).includes(q))).slice(0, 80);
    $('#dl').innerHTML = res.map(w => wordRow(w).replace('<div class="word">', `<div class="word"><!--N${Math.floor(w.idx / PER_DAY) + 1}-->`)).join('') + (res.length === 80 ? '<p class="mut small">Chỉ hiện 80 kết quả đầu.</p>' : '');
  };
  $('#qq').oninput = draw; $('#qf').onchange = draw; draw();
}

/* ---------- Cài đặt ---------- */
function settings() {
  loadVoices();
  $('#main').innerHTML = `<h1>Cài đặt</h1>
    <div class="card"><h3 style="margin-top:0">Cấp độ đang học: HSK ${LEVEL}</h3>${levelButtons()}<p class="mut small">Mỗi cấp có tiến độ riêng; đổi cấp không làm mất tiến độ của cấp khác.</p></div>
    <div class="card"><h3 style="margin-top:0">Lịch học</h3><label>Ngày bắt đầu: <input type="date" id="sd" value="${S.startDate}"></label></div>
    <div class="card"><h3 style="margin-top:0">Giọng đọc tiếng Trung</h3>
      ${VOICES.length ? `<select id="vc">${VOICES.map(v => `<option value="${esc(v.voiceURI)}" ${v.voiceURI === S.settings.voice ? 'selected' : ''}>${esc(v.name)} (${esc(v.lang)})</option>`).join('')}</select>` : '<p class="note">Chưa tìm thấy giọng tiếng Trung. Trên Mac: Cài đặt hệ thống → Trợ năng → Nội dung được đọc → Giọng hệ thống → Quản lý giọng… → chọn Tiếng Trung (Trung Quốc đại lục), ví dụ “Tingting”. Trên Windows: Cài đặt → Thời gian & ngôn ngữ → Giọng nói → Thêm giọng → Tiếng Trung (giản thể).</p>'}
      <label style="margin-left:10px">Tốc độ mặc định <input type="number" id="rt" min="0.5" max="1.5" step="0.05" value="${S.settings.rate}"></label> <button class="btn sm" data-say="你好，欢迎你来学习汉语。">Thử giọng</button></div>
    <div class="card"><h3 style="margin-top:0">Sao lưu dữ liệu</h3><p class="mut small">Tiến độ được lưu trong trình duyệt trên máy này. Hãy sao lưu định kỳ (ví dụ mỗi tuần), nhất là trước khi xóa dữ liệu trình duyệt hoặc đổi máy.</p>
      <div class="row"><button class="btn" id="exp">⬇ Tải file sao lưu</button><label class="btn">⬆ Khôi phục từ file<input type="file" id="imp" accept=".json" class="hide"></label><button class="btn" id="rst" style="color:var(--bad)">Xóa toàn bộ tiến độ</button></div></div>
    <div class="card"><h3 style="margin-top:0">Về nội dung</h3><p class="small">• Từ vựng: ${V.length} từ thuộc cấp ${LEVEL} trong danh sách HSK 3.0 (chỉ các từ mới của cấp ${LEVEL}, không gồm từ của các cấp khác và không lẫn HSK 2.0). Nguồn: dự án mở <a href="https://github.com/drkameleon/complete-hsk-vocabulary" target="_blank">complete-hsk-vocabulary</a> (MIT), nghĩa tiếng Anh theo CC-CEDICT, nghĩa tiếng Việt do Claude biên dịch – nên đối chiếu với Hanzii khi gặp từ nhiều nghĩa.<br>
      • App dạy ${PER_DAY} từ/ngày từ Ngày 1 đến Ngày ${NEW_DAYS}, các ngày sau (đến Ngày ${TOTAL_DAYS}) dùng để củng cố từ khó và làm kiểm tra tổng hợp.<br>
      ${FULL ? '• Bài đọc, bài nghe, ngữ pháp, đề viết và nói được soạn riêng cho app theo trình độ HSK 6; phần nghe dùng giọng đọc của máy tính.' : '• Cấp 1–5 tập trung vào từ vựng (nghĩa, pinyin, phát âm, câu ví dụ, kết hợp từ). Nghĩa tiếng Việt, câu ví dụ và kết hợp từ do Claude biên soạn; pinyin câu ví dụ được tạo tự động, có thể sai thanh điệu ở vài chữ đa âm.'}<br>
      • Toàn bộ từ vựng HSK 1–6 có thể tải về ở mục <a href="#/download">Tải tài liệu</a>.</p></div>`;
  $('#sd').onchange = e => { S.startDate = e.target.value; save(); };
  if ($('#vc')) $('#vc').onchange = e => { S.settings.voice = e.target.value; save(); };
  $('#rt').onchange = e => { S.settings.rate = +e.target.value || 0.9; save(); };
  $('#exp').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(S)], { type: 'application/json' })); a.download = 'hsk' + LEVEL + '-sao-luu-' + today() + '.json'; a.click(); };
  $('#imp').onchange = e => { const f = e.target.files[0]; if (!f) return; f.text().then(t => { try { const x = JSON.parse(t); if (!x.days) throw 0; localStorage.setItem(KEY, t); S = load(); alertBox('Đã khôi phục dữ liệu.'); go(); } catch (err) { alertBox('File không hợp lệ.'); } }); };
  $('#rst').onclick = () => { if (confirm('Xóa toàn bộ tiến độ học? Không thể hoàn tác.') && confirm('Bạn chắc chắn chứ?')) { localStorage.removeItem(KEY); S = load(); go(); } };
}

/* ---------- Tải tài liệu ---------- */
function download() {
  const f = (n, t) => `<a class="btn sm" href="files/${n}" download>${t}</a>`;
  $('#main').innerHTML = `<h1>Tải tài liệu từ vựng HSK 1–6 (HSK 3.0)</h1>
    <div class="card"><p>Bộ từ vựng đầy đủ 6 cấp theo <b>danh sách HSK 3.0</b> (5.363 từ; mỗi từ chỉ thuộc một cấp, không lẫn HSK 2.0). Mỗi từ có: cấp, chữ Hán, pinyin, từ loại, nghĩa tiếng Việt, nghĩa tiếng Anh, kết hợp từ thường gặp, câu ví dụ kèm pinyin và bản dịch. Miễn phí, được tự do chia sẻ.</p>
    <div class="row">${f('HSK1-6-tu-vung-day-du.xlsx', '⬇ Excel (.xlsx) · mỗi cấp một trang')}${f('HSK1-6-tu-vung-day-du.csv', '⬇ CSV (một bảng, mở bằng Excel/Google Sheets)')}</div>
    <h3>Từng cấp riêng (CSV)</h3><div class="row">${[1, 2, 3, 4, 5, 6].map(n => f('HSK' + n + '.csv', 'HSK ' + n)).join('')}</div>
    <p class="mut small">Nguồn danh sách từ: dự án mở <a href="https://github.com/drkameleon/complete-hsk-vocabulary" target="_blank">complete-hsk-vocabulary</a> (giấy phép MIT). Nghĩa tiếng Anh: CC-CEDICT (giấy phép CC BY-SA 4.0). Nghĩa tiếng Việt, kết hợp từ và câu ví dụ do Claude biên soạn; pinyin câu ví dụ được tạo tự động. Khi dùng lại vui lòng ghi nguồn như trên. Nếu phát hiện lỗi, hãy đối chiếu với từ điển Hanzii hoặc MDBG.</p></div>`;
}

document.title = `Ôn luyện HSK ${LEVEL} – HSK 3.0`;
$('#brand').innerHTML = `汉语 <b>HSK</b> <select id="lvSel" title="Chọn cấp độ">${[1, 2, 3, 4, 5, 6].map(n => `<option value="${n}" ${n === LEVEL ? 'selected' : ''}>Cấp ${n}</option>`).join('')}</select>`;
$('#lvSel').onchange = e => setLevel(+e.target.value);
$('#tgoal').textContent = '/ ' + GOAL + ':00'; $('#timer').title = 'Đồng hồ học hôm nay (mục tiêu ' + GOAL + ' phút)';
$('#footText').innerHTML = `Từ vựng: danh sách HSK 3.0 cấp ${LEVEL} (dự án mở <i>complete-hsk-vocabulary</i>, MIT; nghĩa tiếng Anh từ CC-CEDICT, CC BY-SA 4.0). Tiến độ học chỉ lưu trên máy của bạn. · <a href="#/download">Tải bộ từ vựng HSK 1–6</a>`;
renderTimer(); go();
