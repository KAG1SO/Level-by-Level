/* Level by Level - app.js
 * Routing, progress tracking, lessons, the adaptive quiz and the results page.
 */
(function (global) {
  'use strict';
  var T = global.Tree, C = global.Content, Q = global.Questions, W = global.Widgets;
  var lessons = C.lessons, concepts = C.concepts;
  var conceptOrder = ['terms', 'rule', 'search', 'insert', 'queue', 'bfs'];
  var app = document.getElementById('app');
  var reduceMotion = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Saved progress (this browser only) ---------- */
  var KEY = 'level-by-level-v1';
  function loadState() {
    try { return JSON.parse(global.localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  var state = Object.assign({ done: {}, mastery: {}, lastQuiz: null, firstQuiz: null, latestFullQuiz: null, challengeDone: false, challengeReflection: '', seen: {}, theme: null }, loadState());
  function save() {
    try { global.localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage blocked: progress lasts for this visit only */ }
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function lessonById(id) { return lessons.filter(function (l) { return l.id === id; })[0]; }
  function lessonIndex(id) { for (var i = 0; i < lessons.length; i++) if (lessons[i].id === id) return i; return -1; }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  /* ---------- Theme ---------- */
  function applyTheme() {
    if (state.theme) document.documentElement.setAttribute('data-theme', state.theme);
    else document.documentElement.removeAttribute('data-theme');
  }
  function currentTheme() {
    if (state.theme) return state.theme;
    return 'light';
  }
  document.getElementById('theme-toggle').addEventListener('click', function () {
    state.theme = currentTheme() === 'dark' ? 'light' : 'dark';
    applyTheme(); save(); updateThemeLabel();
  });
  function updateThemeLabel() {
    var b = document.getElementById('theme-toggle');
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    b.setAttribute('aria-label', 'Switch to ' + next + ' theme');
    b.title = 'Switch to ' + next + ' theme';
  }
  applyTheme(); updateThemeLabel();

  /* ---------- Header progress ---------- */
  function progressCount() {
    var n = lessons.filter(function (l) { return state.done[l.id]; }).length;
    return { done: n + (state.lastQuiz ? 1 : 0), total: lessons.length + 1 };
  }
  function updateHeader(route) {
    var p = progressCount();
    document.getElementById('hdr-progress-text').textContent = p.done + ' of ' + p.total + ' steps done';
    document.getElementById('hdr-progress-bar').style.width = (p.done / p.total * 100) + '%';
    document.querySelectorAll('[data-nav]').forEach(function (a) {
      a.setAttribute('aria-current', a.getAttribute('data-nav') === route ? 'page' : 'false');
    });
  }

  /* ---------- Read aloud (auditory support) ---------- */
  var speaking = false;
  function stopSpeaking() {
    if (global.speechSynthesis) global.speechSynthesis.cancel();
    speaking = false;
    var b = document.getElementById('listen-btn');
    if (b) { b.setAttribute('aria-pressed', 'false'); b.querySelector('span').textContent = 'Listen'; }
  }
  function toggleListen() {
    if (!global.speechSynthesis) return;
    if (speaking) { stopSpeaking(); return; }
    var parts = [];
    app.querySelectorAll('[data-speak]').forEach(function (el) { parts.push(el.innerText); });
    var u = new global.SpeechSynthesisUtterance(parts.join('. '));
    u.lang = 'en-ZA';
    u.rate = 0.98;
    u.onend = stopSpeaking;
    speaking = true;
    var b = document.getElementById('listen-btn');
    b.setAttribute('aria-pressed', 'true'); b.querySelector('span').textContent = 'Stop';
    global.speechSynthesis.speak(u);
  }

  /* ---------- Question rendering (shared by lesson checks and the quiz) ---------- */
  function questionVisual(q) {
    if (q.tree) return T.build(q.tree);
    if (q.spec) return T.fromSpec(q.spec);
    return null;
  }

  function optionsHTML(name, q, order) {
    return '<fieldset class="opts"><legend class="sr-only">Choose one answer</legend>' +
      order.map(function (oi, k) {
        var id = name + '-o' + k;
        return '<label class="opt" for="' + id + '" data-oi="' + oi + '">' +
          '<input type="radio" id="' + id + '" name="' + name + '" value="' + oi + '">' +
          '<span class="opt-key">' + String.fromCharCode(65 + k) + '</span>' +
          '<span class="opt-text">' + esc(q.options[oi]) + '</span></label>';
      }).join('') + '</fieldset>';
  }

  function mountCheck(host, q, idx) {
    var name = 'check-' + idx;
    var order = shuffle(q.options.map(function (_, i) { return i; }));
    var tries = 0, finished = false;
    host.innerHTML =
      '<div class="check">' +
        '<span class="eyebrow">Check yourself</span>' +
        '<p class="q-prompt">' + esc(q.prompt) + '</p>' +
        (questionVisual(q) ? '<div class="tree-host" data-role="tree"></div>' : '') +
        optionsHTML(name, q, order) +
      '<div class="feedback" data-role="fb" aria-live="polite" hidden></div>' +
      '<div class="btn-row"><button type="button" class="btn" data-role="go">Check answer</button></div>' +
      '</div>';
    var root = questionVisual(q);
    if (root) T.render(host.querySelector('[data-role=tree]'), root);
    var fb = host.querySelector('[data-role=fb]');
    var go = host.querySelector('[data-role=go]');
    go.addEventListener('click', function () {
      if (finished) return;
      var picked = host.querySelector('input[name="' + name + '"]:checked');
      if (!picked) { fb.hidden = false; fb.className = 'feedback is-neutral'; fb.textContent = 'Choose an answer first.'; return; }
      var right = Number(picked.value) === q.answer;
      if (right) {
        host.querySelectorAll('.opt').forEach(function (o) {
          var oi = Number(o.getAttribute('data-oi'));
          o.classList.toggle('is-right', oi === q.answer);
          o.querySelector('input').disabled = true;
        });
        finished = true; go.disabled = true;
        fb.hidden = false; fb.className = 'feedback is-good';
        fb.innerHTML = '<strong>' + (tries ? 'Correct on the second try.' : 'Correct.') + '</strong> ' + esc(q.explain);
        return;
      }
      var wrong = picked.closest('.opt');
      wrong.classList.add('is-wrong');
      picked.disabled = true; picked.checked = false;
      if (tries === 0) {
        tries = 1;
        fb.hidden = false; fb.className = 'feedback is-hint';
        fb.innerHTML = '<strong>Not quite. Here is a hint.</strong> ' + esc(q.hint || 'Review the key idea in this lesson and try a different answer.') + ' Try again.';
        go.textContent = 'Try again';
        return;
      }
      host.querySelectorAll('.opt').forEach(function (o) {
        var oi = Number(o.getAttribute('data-oi'));
        if (oi === q.answer) o.classList.add('is-right');
        o.querySelector('input').disabled = true;
      });
      finished = true; go.disabled = true;
      fb.hidden = false; fb.className = 'feedback is-bad';
      fb.innerHTML = '<strong>The answer is: ' + esc(q.options[q.answer]) + '.</strong> ' + esc(q.explain);
    });
  }

  /* ---------- Home ---------- */
  var heroTimer = null;
  function renderHome() {
    var next = lessons.filter(function (l) { return !state.done[l.id]; })[0];
    var hasMastery = Object.keys(state.mastery).length > 0;
    app.innerHTML =
      '<section class="hero">' +
        '<div class="hero-copy">' +
          '<span class="eyebrow">COS212 · Before the lecture</span>' +
          '<h1 class="display" tabindex="-1">Learn trees<br><em>level by level.</em></h1>' +
          '<p class="lede">Five short lessons take you from "what is a tree?" to tracing breadth-first search with a queue. No prior knowledge needed. Then a quiz shows what you have mastered and points you to what to review before class.</p>' +
          '<div class="btn-row">' +
            '<a class="btn btn-primary" href="#' + (next ? next.id : 'quiz') + '">' + (next && next.id !== 'trees' ? 'Continue: ' + esc(next.title) : (next ? 'Start from scratch' : 'Take the quiz')) + '</a>' +
            '<a class="btn" href="#quiz">Take the pre-test first</a>' +
          '</div>' +
        '</div>' +
        '<figure class="hero-tree"><div class="tree-host" id="hero-tree"></div>' +
          '<figcaption><span class="eyebrow" id="hero-cap">Breadth-first: one level at a time</span></figcaption></figure>' +
      '</section>' +
      '<dl class="facts">' +
        '<div><dt>Data structure</dt><dd>Binary search tree</dd></div>' +
        '<div><dt>Algorithm</dt><dd>Breadth-first search</dd></div>' +
        '<div><dt>Time</dt><dd>About 30 minutes</dd></div>' +
        '<div><dt>You need</dt><dd>Nothing yet</dd></div>' +
      '</dl>' +
      (hasMastery ? readinessStrip() : '') +
      '<section class="block">' +
        '<h2 class="h2">The path</h2>' +
        '<ol class="path">' + lessons.map(function (l, i) {
          return '<li><a class="path-item' + (state.done[l.id] ? ' is-done' : '') + '" href="#' + l.id + '">' +
            '<span class="path-num">' + (i + 1) + '</span>' +
            '<span class="path-title">' + esc(l.title) + '</span>' +
            '<span class="path-meta">' + (state.done[l.id] ? 'Done' : l.minutes + ' min') + '</span></a></li>';
        }).join('') +
          '<li><a class="path-item path-quiz' + (state.lastQuiz ? ' is-done' : '') + '" href="#quiz"><span class="path-num">✓</span><span class="path-title">Readiness quiz</span><span class="path-meta">' + (state.lastQuiz ? 'Taken' : '12 questions') + '</span></a></li>' +
          '<li><a class="path-item' + (state.challengeDone ? ' is-done' : '') + '" href="#challenge"><span class="path-num">★</span><span class="path-title">Optional final challenge</span><span class="path-meta">' + (state.challengeDone ? 'Completed' : 'Untimed') + '</span></a></li>' +
        '</ol>' +
      '</section>' +
      '<section class="block">' +
        '<h2 class="h2">After this, you will be able to</h2>' +
        '<ol class="objectives">' + conceptOrder.map(function (k) {
          return '<li><span class="obj-tag">' + esc(concepts[k].label) + '</span>' + esc(concepts[k].objective) + '</li>';
        }).join('') + '</ol>' +
      '</section>' + badgesHTML();
    startHeroTree();
  }

  function badgeList() {
    var allLessons = lessons.every(function (l) { return !!state.done[l.id]; });
    var allReady = conceptOrder.every(function (k) { return state.mastery[k] && state.mastery[k].status === 'ready'; });
    return [
      { name: 'Finished all lessons', unlocked: allLessons, detail: 'Complete every lesson', icon: '<path d="M5 5.5c2.7-.8 5.1-.3 7 1.2v12c-1.9-1.5-4.3-2-7-1.2zM19 5.5c-2.7-.8-5.1-.3-7 1.2v12c1.9-1.5 4.3-2 7-1.2z"/><path d="m8 11 1.6 1.6 2.8-3"/>' },
      { name: 'Ready on every objective', unlocked: allReady, detail: 'Reach Ready on all six objectives', icon: '<path d="m12 3 2.6 5.3 5.9.9-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.2 5.9-.9z"/>' },
      { name: 'Completed the final challenge', unlocked: !!state.challengeDone, detail: 'Build the BST and finish its BFS traversal', icon: '<path d="M12 3v5M12 8 7 13M12 8l5 5M7 13v4M17 13v4M5 18h4M15 18h4"/><circle cx="12" cy="4" r="1.5"/><circle cx="7" cy="13" r="1.5"/><circle cx="17" cy="13" r="1.5"/>' }
    ];
  }
  function badgesHTML() {
    var badges = badgeList();
    var unlocked = badges.filter(function (b) { return b.unlocked; }).length;
    return '<section class="block badges-block"><div class="badges-head"><h2 class="h2">Badges</h2><span class="eyebrow">' + unlocked + ' of ' + badges.length + ' unlocked</span></div>' +
      '<ul class="badges">' + badges.map(function (b) {
        return '<li class="badge-card ' + (b.unlocked ? 'is-earned' : 'is-locked') + '" aria-label="' + esc(b.name + (b.unlocked ? ', unlocked' : ', locked. ' + b.detail)) + '">' +
          '<span class="badge-medal" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false">' + b.icon + '</svg></span>' +
          '<span class="badge-copy"><strong>' + esc(b.name) + '</strong><span>' + (b.unlocked ? 'Unlocked' : esc(b.detail)) + '</span></span>' +
        '</li>';
      }).join('') + '</ul></section>';
  }

  function startHeroTree() {
    var host = document.getElementById('hero-tree');
    var root = T.build([50, 30, 70, 20, 40, 60, 80]);
    var lv = T.levels(root);
    var k = lv.length; // resting frame: everything visited
    function frame() {
      var states = {};
      lv.forEach(function (level, d) {
        level.forEach(function (v) { states[v] = d < k ? 'visited' : d === k ? 'current' : ''; });
      });
      T.render(host, root, { states: states, label: 'Example binary search tree being visited level by level' });
      var cap = document.getElementById('hero-cap');
      if (cap) cap.textContent = k < lv.length ? 'Visiting depth ' + k + ': ' + lv[k].join(', ') : 'Visit order: ' + T.levelOrder(root).join(', ');
    }
    frame();
    if (heroTimer) clearInterval(heroTimer);
    if (reduceMotion) return;
    heroTimer = setInterval(function () {
      if (!document.getElementById('hero-tree')) { clearInterval(heroTimer); heroTimer = null; return; }
      k = (k + 1) % (lv.length + 1);
      frame();
    }, 1400);
  }

  function masteryLabel(m) {
    return m === 'ready' ? 'Ready' : m === 'almost' ? 'Nearly there' : 'Review this';
  }

  function readinessStrip() {
    return '<section class="block"><h2 class="h2">Your readiness</h2><div class="ready-strip">' +
      conceptOrder.map(function (k) {
        var m = state.mastery[k];
        return '<a class="ready-cell ' + (m ? 'm-' + m.status : 'm-none') + '" href="#' + concepts[k].lesson + '">' +
          '<span class="ready-label">' + esc(concepts[k].label) + '</span>' +
          '<span class="pill">' + (m ? masteryLabel(m.status) : 'Not tested') + '</span></a>';
      }).join('') + '</div></section>';
  }

  /* ---------- Lesson ---------- */
  var cleanups = [];
  function renderLesson(id) {
    var L = lessonById(id), idx = lessonIndex(id);
    var prev = lessons[idx - 1], next = lessons[idx + 1];
    var canSpeak = !!global.speechSynthesis;
    var objectives = L.concepts.map(function (k) { return '<li>' + esc(concepts[k].objective) + '</li>'; }).join('');
    app.innerHTML =
      '<div class="lesson-layout">' +
        '<nav class="rail" aria-label="Lessons"><ol>' + lessons.map(function (l, i) {
          return '<li><a href="#' + l.id + '" class="rail-link' + (l.id === id ? ' is-here' : '') + (state.done[l.id] ? ' is-done' : '') + '"' + (l.id === id ? ' aria-current="page"' : '') + '>' +
            '<span class="rail-num">' + (state.done[l.id] ? '✓' : i + 1) + '</span><span>' + esc(l.title) + '</span></a></li>';
        }).join('') +
          '<li><a href="#quiz" class="rail-link' + (state.lastQuiz ? ' is-done' : '') + '"><span class="rail-num">?</span><span>Readiness quiz</span></a></li>' +
        '</ol></nav>' +
        '<article class="lesson">' +
          '<header class="lesson-head">' +
            '<span class="eyebrow">Lesson ' + (idx + 1) + ' of ' + lessons.length + ' · about ' + L.minutes + ' min</span>' +
            '<h1 class="display display-sm" tabindex="-1" data-speak>' + esc(L.title) + '</h1>' +
            '<div class="aims"><span class="eyebrow">By the end you can</span><ul>' + objectives + '</ul></div>' +
            (canSpeak ? '<button type="button" class="btn btn-quiet btn-sm" id="listen-btn" aria-pressed="false">' +
              '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>' +
              '<span>Listen</span></button>' : '') +
          '</header>' +
          '<div class="lesson-body">' + L.sections.map(sectionHTML).join('') + '</div>' +
          '<footer class="lesson-foot">' +
            (prev ? '<a class="btn btn-quiet" href="#' + prev.id + '">← ' + esc(prev.title) + '</a>' : '<a class="btn btn-quiet" href="#home">← Overview</a>') +
            '<button type="button" class="btn btn-primary" id="lesson-next">' + (next ? 'Done. Next: ' + esc(next.title) + ' →' : 'Done. Take the quiz →') + '</button>' +
          '</footer>' +
        '</article>' +
      '</div>';

    var checkIdx = 0;
    app.querySelectorAll('[data-widget]').forEach(function (host) {
      var fn = W[host.getAttribute('data-widget')];
      var c = fn && fn(host);
      if (typeof c === 'function') cleanups.push(c);
    });
    app.querySelectorAll('[data-check]').forEach(function (host) {
      var s = L.sections[Number(host.getAttribute('data-check'))];
      mountCheck(host, s.q, id + '-' + (checkIdx++));
    });
    var lb = document.getElementById('listen-btn');
    if (lb) lb.addEventListener('click', toggleListen);
    document.getElementById('lesson-next').addEventListener('click', function () {
      state.done[id] = true; save();
      location.hash = next ? next.id : 'quiz';
    });
  }

  function sectionHTML(s, i) {
    switch (s.type) {
      case 'prose': return '<div class="prose" data-speak>' + s.html + '</div>';
      case 'terms': return '<dl class="terms" data-speak>' + s.items.map(function (t) {
        return '<div><dt>' + esc(t[0]) + '</dt><dd>' + esc(t[1]) + '</dd></div>';
      }).join('') + '</dl>';
      case 'callout': return '<aside class="callout callout-' + s.tone + '" data-speak><strong class="callout-title">' + esc(s.title) + '</strong>' + s.html + '</aside>';
      case 'code': return '<figure class="code"><figcaption class="eyebrow">' + esc(s.title) + '</figcaption><pre>' +
        s.lines.map(function (l) { return '<span class="pl">' + esc(l) + '</span>'; }).join('\n') + '</pre></figure>';
      case 'widget': return '<section class="widget"><header class="widget-head"><h2 class="widget-title">' + esc(s.title) + '</h2><p class="widget-hint">' + esc(s.hint) + '</p></header>' +
        '<div class="widget-body" data-widget="' + s.widget + '"></div></section>';
      case 'check': return '<div class="check-host" data-check="' + i + '"></div>';
      case 'takeaways': return '<aside class="takeaways" data-speak><h2 class="takeaways-title">Key points</h2><ul>' +
        s.items.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></aside>';
      default: return '';
    }
  }

  /* ---------- Adaptive quiz ---------- */
  var session = null;

  /* Pick questions per concept, preferring ones this student has not seen yet. */
  function buildSession(conceptList, perConcept, mode) {
    var items = [];
    conceptList.forEach(function (c) {
      var pool = Q.bank.filter(function (q) { return q.concept === c; });
      var fresh = shuffle(pool.filter(function (q) { return !state.seen[q.id]; }));
      var old = shuffle(pool.filter(function (q) { return state.seen[q.id]; }));
      fresh.concat(old).slice(0, perConcept).forEach(function (q) {
        items.push({ q: q, order: shuffle(q.options.map(function (_, i) { return i; })), tries: 0, points: null, done: false, eliminated: [] });
      });
    });
    return { mode: mode, items: items, i: 0, concepts: conceptList };
  }

  function renderQuizIntro() {
    var weak = conceptOrder.filter(function (k) { return state.mastery[k] && state.mastery[k].status !== 'ready'; });
    app.innerHTML =
      '<section class="quiz-intro">' +
        '<span class="eyebrow">Readiness quiz</span>' +
        '<h1 class="display display-sm" tabindex="-1">See what you have <em>mastered.</em></h1>' +
        '<p class="lede">12 questions, two for each learning objective. It takes about 10 minutes. This is a quick readiness check based on two questions per objective.</p>' +
        '<ul class="how">' +
          '<li><strong>Wrong first try?</strong> You get a hint and a second chance.</li>' +
          '<li><strong>Wrong again?</strong> You see the answer, why it is right, and which lesson covers it.</li>' +
          '<li><strong>At the end</strong> you get a review plan for anything you have not mastered yet.</li>' +
        '</ul>' +
        '<div class="btn-row">' +
          '<button type="button" class="btn btn-primary" id="quiz-start">' + (state.firstQuiz ? 'Start the quiz' : 'Start pre-test') + '</button>' +
          '<a class="btn btn-quiet" href="#challenge">Optional final challenge</a>' +
          (weak.length ? '<button type="button" class="btn" id="quiz-weak">Practise my weak spots (' + weak.length + ')</button>' : '') +
          (session && !session.finished && session.i > 0 ? '<button type="button" class="btn btn-quiet" id="quiz-resume">Resume question ' + (session.i + 1) + '</button>' : '') +
        '</div>' +
      '</section>';
    document.getElementById('quiz-start').addEventListener('click', function () {
      session = buildSession(conceptOrder, 2, state.firstQuiz ? 'full' : 'pretest'); renderQuestion();
    });
    var wb = document.getElementById('quiz-weak');
    if (wb) wb.addEventListener('click', function () { session = buildSession(weak, 3, 'practice'); renderQuestion(); });
    var rb = document.getElementById('quiz-resume');
    if (rb) rb.addEventListener('click', renderQuestion);
  }

  function renderQuestion() {
    var it = session.items[session.i];
    var q = it.q;
    var total = session.items.length;
    var name = 'quiz-' + session.i;
    var lesson = lessonById(concepts[q.concept].lesson);
    app.innerHTML =
      '<section class="quiz">' +
        '<div class="quiz-top">' +
          '<span class="eyebrow">' + (session.mode === 'practice' ? 'Practice · ' : '') + 'Question ' + (session.i + 1) + ' of ' + total + '</span>' +
          '<span class="pill pill-concept">' + esc(concepts[q.concept].label) + '</span>' +
        '</div>' +
        '<div class="meter" aria-hidden="true"><span style="width:' + (session.i / total * 100) + '%"></span></div>' +
        '<h1 class="q-prompt q-prompt-lg" tabindex="-1">' + esc(q.prompt) + '</h1>' +
        (questionVisual(q) ? '<div class="tree-host" data-role="tree"></div>' : '') +
        optionsHTML(name, q, it.order) +
        '<div class="feedback" data-role="fb" aria-live="polite" hidden></div>' +
        '<div class="btn-row">' +
          '<button type="button" class="btn btn-primary" id="q-check">Check answer</button>' +
          '<button type="button" class="btn btn-primary" id="q-next" hidden>' + (session.i === total - 1 ? 'See my results →' : 'Next question →') + '</button>' +
        '</div>' +
      '</section>';
    var root = questionVisual(q);
    if (root) T.render(app.querySelector('[data-role=tree]'), root);
    var fb = app.querySelector('[data-role=fb]');
    var checkBtn = document.getElementById('q-check');
    var nextBtn = document.getElementById('q-next');

    function lockAll(showRight) {
      app.querySelectorAll('.opt').forEach(function (o) {
        o.querySelector('input').disabled = true;
        if (showRight && Number(o.getAttribute('data-oi')) === q.answer) o.classList.add('is-right');
      });
    }
    function finishItem(points) {
      it.points = points; it.done = true;
      state.seen[q.id] = true; save();
      checkBtn.hidden = true; nextBtn.hidden = false; nextBtn.focus();
    }
    // Restore a question that was already answered (e.g. after visiting a lesson).
    it.eliminated.forEach(function (oi) {
      var o = app.querySelector('.opt[data-oi="' + oi + '"]');
      if (o) { o.classList.add('is-wrong'); o.querySelector('input').disabled = true; }
    });
    if (it.done) {
      lockAll(true);
      fb.hidden = false; fb.className = 'feedback is-neutral'; fb.innerHTML = '<strong>Already answered.</strong> ' + esc(q.explain);
      checkBtn.hidden = true; nextBtn.hidden = false;
    } else if (it.tries === 1) {
      fb.hidden = false; fb.className = 'feedback is-hint'; fb.innerHTML = '<strong>Hint.</strong> ' + esc(q.hint);
    }

    checkBtn.addEventListener('click', function () {
      var picked = app.querySelector('input[name="' + name + '"]:checked');
      if (!picked) { fb.hidden = false; fb.className = 'feedback is-neutral'; fb.textContent = 'Choose an answer first.'; return; }
      var choice = Number(picked.value);
      var label = picked.closest('.opt');
      if (choice === q.answer) {
        label.classList.add('is-right');
        lockAll(false);
        fb.hidden = false; fb.className = 'feedback is-good';
        fb.innerHTML = '<strong>' + (it.tries === 0 ? 'Correct.' : 'Correct on the second try.') + '</strong> ' + esc(q.explain);
        finishItem(it.tries === 0 ? 1 : 0.5);
        return;
      }
      label.classList.add('is-wrong');
      picked.disabled = true; picked.checked = false;
      it.eliminated.push(choice);
      if (it.tries === 0) {
        it.tries = 1;
        fb.hidden = false; fb.className = 'feedback is-hint';
        fb.innerHTML = '<strong>Not quite. Here is a hint.</strong> ' + esc(q.hint) + ' Try again.';
        return;
      }
      it.tries = 2;
      lockAll(true);
      fb.hidden = false; fb.className = 'feedback is-bad';
      fb.innerHTML = '<strong>The answer is: ' + esc(q.options[q.answer]) + '.</strong> ' + esc(q.explain) +
        ' <a class="inline-link" href="#' + lesson.id + '">Revisit "' + esc(lesson.title) + '"</a>, then come back here to carry on.';
      finishItem(0);
    });
    nextBtn.addEventListener('click', function () {
      if (session.i < total - 1) { session.i += 1; renderQuestion(); focusHeading(); global.scrollTo(0, 0); }
      else finishSession();
    });
  }

  function finishSession() {
    var by = {};
    session.items.forEach(function (it) {
      var c = it.q.concept;
      by[c] = by[c] || { earned: 0, max: 0 };
      by[c].earned += it.points || 0; by[c].max += 1;
    });
    Object.keys(by).forEach(function (c) {
      var r = by[c].earned / by[c].max;
      state.mastery[c] = { status: r >= 0.75 ? 'ready' : r >= 0.5 ? 'almost' : 'review', earned: by[c].earned, max: by[c].max };
    });
    var earned = 0, max = 0;
    Object.keys(by).forEach(function (c) { earned += by[c].earned; max += by[c].max; });
    var result = { mode: session.mode, earned: earned, max: max, by: by, at: new Date().toISOString() };
    state.lastQuiz = result;
    if (session.mode === 'pretest' || session.mode === 'full') {
      if (!state.firstQuiz) state.firstQuiz = JSON.parse(JSON.stringify(result));
      state.latestFullQuiz = JSON.parse(JSON.stringify(result));
    }
    session.finished = true;
    save();
    location.hash = 'results';
  }

  /* ---------- Results ---------- */
  function renderResults() {
    if (!state.lastQuiz) { location.hash = 'quiz'; return; }
    var lq = state.lastQuiz;
    var weak = conceptOrder.filter(function (k) { return state.mastery[k] && state.mastery[k].status !== 'ready'; });
    var untested = conceptOrder.filter(function (k) { return !state.mastery[k]; });
    var allReady = !weak.length && !untested.length;
    var head = allReady ? 'You are ready for <em>the lecture.</em>'
      : weak.length <= 2 ? 'Nearly there. <em>A little review to go.</em>'
      : 'Good start. <em>Let\'s close the gaps.</em>';
    function fmt(n) { return (Math.round(n * 10) / 10).toString(); }
    app.innerHTML =
      '<section class="results">' +
        '<span class="eyebrow">' + (lq.mode === 'practice' ? 'Practice result' : lq.mode === 'pretest' ? 'Pre-test result' : 'Quiz result') + ' · ' + fmt(lq.earned) + ' of ' + lq.max + ' points</span>' +
        '<h1 class="display display-sm" tabindex="-1">' + head + '</h1>' +
          '<p class="lede">A first-try answer earns 1 point. An answer after a hint earns half a point. An objective counts as ready at 75% or more. This is a quick readiness check based on two questions per objective.</p>' +
          quizComparisonHTML(fmt) +
        '<div class="mastery">' + conceptOrder.map(function (k) {
          var m = state.mastery[k];
          var pct = m ? m.earned / m.max * 100 : 0;
          return '<div class="m-row ' + (m ? 'm-' + m.status : 'm-none') + '">' +
            '<div class="m-name"><strong>' + esc(concepts[k].label) + '</strong><span>' + esc(concepts[k].objective) + '</span></div>' +
            '<div class="m-bar" aria-hidden="true"><span style="width:' + pct + '%"></span></div>' +
            '<div class="m-score">' + (m ? fmt(m.earned) + '/' + m.max : '–') + '</div>' +
            '<span class="pill">' + (m ? masteryLabel(m.status) : 'Not tested') + '</span>' +
          '</div>';
        }).join('') + '</div>' +
        (weak.length ? '<section class="block"><h2 class="h2">Your review plan</h2><ol class="plan">' + weak.map(function (k) {
          var L = lessonById(concepts[k].lesson);
          return '<li><div><strong>' + esc(concepts[k].label) + '</strong><p>' + esc(concepts[k].tip) + '</p></div>' +
            '<a class="btn btn-sm" href="#' + L.id + '">Open "' + esc(L.title) + '"</a></li>';
        }).join('') + '</ol></section>' : '') +
        '<aside class="callout callout-info"><strong class="callout-title">Before the lecture</strong><p>Write down one thing about BSTs or BFS that still feels unclear. Bring it to class and ask it.</p></aside>' +
        '<div class="btn-row">' +
          (weak.length ? '<button type="button" class="btn btn-primary" id="r-weak">Practise my weak spots</button>' : '') +
          '<button type="button" class="btn' + (weak.length ? '' : ' btn-primary') + '" id="r-full">Retake the full quiz</button>' +
          '<a class="btn" href="#challenge">Try the optional final challenge</a>' +
          '<a class="btn btn-quiet" href="#home">Back to overview</a>' +
        '</div>' + badgesHTML() +
      '</section>';
    var w = document.getElementById('r-weak');
    if (w) w.addEventListener('click', function () { session = buildSession(weak, 3, 'practice'); location.hash = 'quiz'; renderQuestion(); });
    document.getElementById('r-full').addEventListener('click', function () { session = buildSession(conceptOrder, 2, 'full'); location.hash = 'quiz'; renderQuestion(); });
  }

  function quizComparisonHTML(fmt) {
    var first = state.firstQuiz, latest = state.latestFullQuiz;
    if (!first || !latest) return '<p class="muted">Take a full quiz to start your pre-test vs latest comparison.</p>';
    return '<section class="comparison"><h2 class="h2">Pre-test vs latest quiz by objective</h2>' +
      '<div class="comparison-scroll"><table class="comparison-table"><thead><tr><th scope="col">Learning objective</th><th scope="col">Pre-test</th><th scope="col">Latest</th></tr></thead><tbody>' +
      conceptOrder.map(function (k) {
        var a = first.by[k], b = latest.by[k];
        return '<tr><th scope="row">' + esc(concepts[k].label) + '</th><td>' + (a ? fmt(a.earned) + '/' + a.max : '—') + '</td><td>' + (b ? fmt(b.earned) + '/' + b.max : '—') + '</td></tr>';
      }).join('') + '</tbody></table></div></section>';
  }

  function renderChallenge() {
    app.innerHTML =
      '<section class="challenge-page">' +
        '<span class="eyebrow">Optional final challenge · untimed</span>' +
        '<h1 class="display display-sm" tabindex="-1">Build a BST, then traverse it.</h1>' +
        '<p class="lede">Insert each value by choosing an empty child spot. Then trace BFS by clicking the nodes from the front of the queue. The challenge is for practice and is not graded.</p>' +
        '<div class="widget"><div class="widget-body" data-challenge></div></div>' +
        '<div class="btn-row"><a class="btn btn-quiet" href="#results">Back to results</a><a class="btn btn-quiet" href="#home">Overview</a></div>' +
      '</section>';
    W.finalChallenge(app.querySelector('[data-challenge]'), {
      reflection: state.challengeReflection,
      onReflection: function (value) { state.challengeReflection = value; save(); },
      onDone: function (value) { state.challengeReflection = value; state.challengeDone = true; save(); }
    });
  }

  /* ---------- Router ---------- */
  function focusHeading() {
    var hd = app.querySelector('h1[tabindex]');
    if (hd) hd.focus({ preventScroll: true });
  }
  function route() {
    stopSpeaking();
    cleanups.forEach(function (fn) { try { fn(); } catch (e) {} });
    cleanups = [];
    var r = (location.hash || '').replace('#', '') || 'home';
    if (r === 'quiz' && session && !session.finished && app.querySelector('.quiz')) { updateHeader('quiz'); return; }
    if (r === 'home') renderHome();
    else if (lessonById(r)) renderLesson(r);
    else if (r === 'quiz') {
      if (session && !session.finished && session.items.some(function (it) { return it.done || it.tries; })) renderQuestion();
      else renderQuizIntro();
    }
    else if (r === 'results') renderResults();
    else if (r === 'challenge') renderChallenge();
    else { r = 'home'; renderHome(); }
    updateHeader(r === 'results' || r === 'challenge' ? 'quiz' : (lessonById(r) ? 'learn' : r));
    global.scrollTo(0, 0);
    focusHeading();
  }
  global.addEventListener('hashchange', route);
  var skip = document.querySelector('.skip');
  if (skip) skip.addEventListener('click', function (e) { e.preventDefault(); focusHeading(); });
  route();
})(window);
