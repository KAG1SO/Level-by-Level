/* Level by Level - widgets.js
 * Interactive pieces used inside lessons: tree explorer, BST checker, BST playground,
 * queue playground and BFS stepper. Each widget is mounted into a host element.
 */
(function (global) {
  'use strict';
  var T = global.Tree;

  var reduceMotion = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var STEP_MS = reduceMotion ? 150 : 650;

  function h(html) {
    var d = document.createElement('div');
    d.innerHTML = html.trim();
    return d.firstChild;
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* Shared between widgets: the tree a student builds in the playground can be used in the BFS stepper. */
  var shared = { playground: [50, 30, 70, 20, 40, 60, 80] };

  /* ---------- 1. Tree explorer ---------- */
  function treeExplorer(host) {
    var root = T.build([50, 30, 70, 20, 40, 80, 10]);
    var selected = 50;
    host.innerHTML =
      '<div class="wx-split">' +
        '<div class="tree-host" data-role="tree"></div>' +
        '<div class="info-card" aria-live="polite" data-role="info"></div>' +
      '</div>';
    var treeEl = host.querySelector('[data-role=tree]');
    var infoEl = host.querySelector('[data-role=info]');

    function draw() {
      var states = {}; states[selected] = 'selected';
      T.render(treeEl, root, { states: states, onNode: function (v) { selected = v; draw(); } });
      var n = T.find(root, selected);
      var parent = T.parentOf(root, selected);
      var kids = [n.left, n.right].filter(Boolean).map(function (c) { return c.value; });
      var role = n === root ? 'Root' : (kids.length ? 'Internal node' : 'Leaf');
      var roleNote = n === root ? 'It has no parent.' : (kids.length ? 'It has a parent and at least one child.' : 'It has no children.');
      infoEl.innerHTML =
        '<div class="info-head"><span class="eyebrow">Selected node</span><span class="info-value">' + n.value + '</span></div>' +
        '<p class="info-role"><strong>' + role + '.</strong> ' + roleNote + '</p>' +
        '<dl class="kv">' +
          '<div><dt>Parent</dt><dd>' + (parent ? parent.value : 'none') + '</dd></div>' +
          '<div><dt>Children</dt><dd>' + (kids.length ? kids.join(', ') : 'none') + '</dd></div>' +
          '<div><dt>Depth</dt><dd>' + T.depthOf(root, n.value) + '</dd></div>' +
          '<div><dt>Subtree size</dt><dd>' + T.size(n) + ' node' + (T.size(n) === 1 ? '' : 's') + '</dd></div>' +
        '</dl>' +
        '<p class="info-foot">Height of the whole tree: <strong>' + T.height(root) + '</strong> (longest path 50 → 30 → 20 → 10)</p>';
    }
    draw();
  }

  /* ---------- 2. BST checker ---------- */
  var checkerCases = [
    { spec: { v: 50, l: { v: 30, l: { v: 20 }, r: { v: 40 } }, r: { v: 70, l: { v: 60 }, r: { v: 80 } } },
      why: 'Every node passes. Each left subtree holds only smaller values and each right subtree only larger ones.' },
    { spec: { v: 50, l: { v: 30, l: { v: 20 }, r: { v: 60 } }, r: { v: 70 } },
      why: '60 is in 50\'s left subtree, so it must be smaller than 50. It is fine next to 30, but that is not enough.' },
    { spec: { v: 40, l: { v: 20, l: { v: 10 } }, r: { v: 60, l: { v: 30 }, r: { v: 70 } } },
      why: '30 is in 40\'s right subtree, so it must be larger than 40. Being smaller than 60 is not enough.' },
    { spec: { v: 25, l: { v: 15, l: { v: 10 }, r: { v: 20 } }, r: { v: 35, l: { v: 30 } } },
      why: 'Every node passes. 30 is larger than 25 and smaller than 35, so it is in the right place.' }
  ];

  function bstChecker(host) {
    var i = 0, score = 0, answered = false;
    host.innerHTML =
      '<div class="checker">' +
        '<div class="checker-top"><span class="eyebrow" data-role="count"></span><span class="eyebrow" data-role="score"></span></div>' +
        '<div class="tree-host" data-role="tree"></div>' +
        '<div class="btn-row" data-role="choices">' +
          '<button type="button" class="btn" data-ans="valid">Valid BST</button>' +
          '<button type="button" class="btn" data-ans="invalid">Not a BST</button>' +
        '</div>' +
        '<div class="feedback" data-role="fb" aria-live="polite" hidden></div>' +
        '<div class="btn-row"><button type="button" class="btn btn-quiet" data-role="next" hidden>Next tree</button></div>' +
      '</div>';
    var treeEl = host.querySelector('[data-role=tree]');
    var fb = host.querySelector('[data-role=fb]');
    var nextBtn = host.querySelector('[data-role=next]');
    var choices = host.querySelector('[data-role=choices]');

    function draw(states) {
      var c = checkerCases[i];
      host.querySelector('[data-role=count]').textContent = 'Tree ' + (i + 1) + ' of ' + checkerCases.length;
      host.querySelector('[data-role=score]').textContent = score + ' correct';
      T.render(treeEl, T.fromSpec(c.spec), { states: states || {} });
    }

    choices.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-ans]');
      if (!b || answered) return;
      answered = true;
      var c = checkerCases[i];
      var root = T.fromSpec(c.spec);
      var bad = T.firstViolation(root);
      var isValid = !bad;
      var right = (b.getAttribute('data-ans') === 'valid') === isValid;
      if (right) score += 1;
      var states = {};
      if (bad) states[bad.value] = 'bad';
      draw(states);
      choices.querySelectorAll('button').forEach(function (btn) { btn.disabled = true; });
      fb.hidden = false;
      fb.className = 'feedback ' + (right ? 'is-good' : 'is-bad');
      fb.innerHTML = '<strong>' + (right ? 'Correct. ' : 'Not quite. ') + (isValid ? 'This is a valid BST.' : 'This is not a BST.') + '</strong> ' + esc(c.why);
      nextBtn.hidden = false;
      nextBtn.textContent = i === checkerCases.length - 1 ? 'See your result' : 'Next tree';
    });

    nextBtn.addEventListener('click', function () {
      if (i === checkerCases.length - 1 && answered) {
        fb.className = 'feedback is-neutral';
        fb.innerHTML = '<strong>You got ' + score + ' of ' + checkerCases.length + '.</strong> ' +
          (score === checkerCases.length ? 'You can spot rule breakers, including the hidden ones.' : 'Look again at the trees you missed: check each node against all its ancestors, not only its parent.');
        nextBtn.textContent = 'Start again';
        i = checkerCases.length; // marks finished
        return;
      }
      if (i >= checkerCases.length) { i = 0; score = 0; } else { i += 1; }
      answered = false;
      fb.hidden = true;
      nextBtn.hidden = true;
      choices.querySelectorAll('button').forEach(function (btn) { btn.disabled = false; });
      draw();
    });

    draw();
  }

  /* ---------- 3. BST playground ---------- */
  function bstPlayground(host) {
    var values = shared.playground.slice();
    var root = T.build(values);
    var timers = [];
    host.innerHTML =
      '<div class="playground">' +
        '<form class="pg-controls" data-role="form" novalidate>' +
          '<label class="field"><span class="eyebrow">Value (1 to 99)</span>' +
            '<input id="pg-value" type="number" inputmode="numeric" min="1" max="99" value="45" required></label>' +
          '<div class="btn-row">' +
            '<button type="submit" class="btn" data-op="search">Search</button>' +
            '<button type="button" class="btn" data-op="insert">Insert</button>' +
            '<button type="button" class="btn btn-quiet" data-op="random">Random tree</button>' +
            '<button type="button" class="btn btn-quiet" data-op="reset">Reset</button>' +
          '</div>' +
        '</form>' +
        '<div class="tree-host tree-host-lg" data-role="tree"></div>' +
        '<div class="log-wrap"><span class="eyebrow">What happened</span><ol class="log" data-role="log" aria-live="polite"></ol></div>' +
      '</div>';
    var treeEl = host.querySelector('[data-role=tree]');
    var logEl = host.querySelector('[data-role=log]');
    var input = host.querySelector('#pg-value');
    var buttons = host.querySelectorAll('button');

    function clearTimers() { timers.forEach(clearTimeout); timers = []; }
    function busy(on) { buttons.forEach(function (b) { b.disabled = on; }); }
    function draw(states) { T.render(treeEl, root, { states: states || {} }); }
    function log(lines) {
      logEl.innerHTML = '';
      lines.forEach(function (l) { addLog(l); });
    }
    function addLog(text, cls) {
      var li = document.createElement('li');
      if (cls) li.className = cls;
      li.textContent = text;
      logEl.appendChild(li);
    }
    function save() { shared.playground = values.slice(); }

    function readValue() {
      var v = Number(input.value);
      if (!Number.isInteger(v) || v < 1 || v > 99) {
        log([]);
        addLog('Enter a whole number from 1 to 99.', 'is-bad');
        input.focus();
        return null;
      }
      return v;
    }

    /* Walk the path one node at a time, narrating each comparison. */
    function walk(path, x, finish) {
      clearTimers(); busy(true); log([]);
      path.forEach(function (n, idx) {
        timers.push(setTimeout(function () {
          var states = {};
          path.slice(0, idx).forEach(function (p) { states[p.value] = 'path'; });
          states[n.value] = 'current';
          draw(states);
          if (x === n.value) addLog('Compare ' + x + ' with ' + n.value + ': equal.');
          else addLog('Compare ' + x + ' with ' + n.value + ': ' + x + (x < n.value ? ' < ' : ' > ') + n.value + ', go ' + (x < n.value ? 'left' : 'right') + '.');
        }, idx * STEP_MS));
      });
      timers.push(setTimeout(function () { finish(); busy(false); }, path.length * STEP_MS));
    }

    function doSearch() {
      var x = readValue(); if (x === null) return;
      if (!root) { log(['The tree is empty, so ' + x + ' is not in it.']); return; }
      var r = T.search(root, x);
      walk(r.path, x, function () {
        var states = {};
        r.path.forEach(function (p) { states[p.value] = 'path'; });
        if (r.found) {
          states[x] = 'found'; draw(states);
          addLog('Found ' + x + ' after ' + r.path.length + ' comparison' + (r.path.length === 1 ? '' : 's') + '.', 'is-good');
        } else {
          var last = r.path[r.path.length - 1];
          states[last.value] = 'bad'; draw(states);
          addLog(last.value + ' has no ' + r.lastSide + ' child, so ' + x + ' is not in the tree.', 'is-bad');
        }
      });
    }

    function doInsert() {
      var x = readValue(); if (x === null) return;
      if (T.size(root) >= 15) {
        log([]); addLog('The playground holds up to 15 nodes. Press Reset to start again.', 'is-bad'); return;
      }
      if (!root) {
        root = T.build([x]); values = [x]; save();
        var s = {}; s[x] = 'new'; draw(s);
        log(['The tree was empty, so ' + x + ' becomes the root.']);
        return;
      }
      var existing = T.search(root, x);
      if (existing.found) {
        walk(existing.path, x, function () {
          var states = {}; existing.path.forEach(function (p) { states[p.value] = 'path'; }); states[x] = 'found'; draw(states);
          addLog(x + ' is already in the tree. In this app each value appears once, so nothing changes.', 'is-bad');
        });
        return;
      }
      walk(existing.path, x, function () {
        var r = T.insert(root, x);
        values.push(x); save();
        var states = {};
        r.path.forEach(function (p) { states[p.value] = 'path'; });
        states[x] = 'new';
        draw(states);
        addLog(r.parent.value + ' has no ' + r.side + ' child, so ' + x + ' goes there as a new leaf.', 'is-good');
      });
    }

    function randomTree() {
      clearTimers(); busy(false);
      var pool = [];
      while (pool.length < 7) {
        var v = 10 + Math.floor(Math.random() * 86);
        if (pool.indexOf(v) === -1) pool.push(v);
      }
      values = pool; root = T.build(values); save(); draw();
      log(['New tree built by inserting ' + values.join(', ') + ' in that order.']);
    }

    function reset() {
      clearTimers(); busy(false);
      values = [50, 30, 70, 20, 40, 60, 80]; root = T.build(values); save(); draw();
      log(['Tree reset. It was built by inserting 50, 30, 70, 20, 40, 60, 80.']);
    }

    host.querySelector('[data-role=form]').addEventListener('submit', function (e) { e.preventDefault(); doSearch(); });
    host.querySelector('[data-op=insert]').addEventListener('click', doInsert);
    host.querySelector('[data-op=random]').addEventListener('click', randomTree);
    host.querySelector('[data-op=reset]').addEventListener('click', reset);

    draw();
    log(['This tree was built by inserting ' + values.join(', ') + ' in that order.', 'Type a number, then press Search or Insert.']);
    return clearTimers;
  }

  /* ---------- 4. Queue playground ---------- */
  function queuePlayground(host) {
    var start = ['A', 'B', 'C'];
    var q = start.slice();
    var next = 'D';
    host.innerHTML =
      '<div class="queue-pg">' +
        '<div class="queue-lane" data-role="lane" aria-live="polite"></div>' +
        '<p class="queue-msg" data-role="msg">Three people are waiting. A joined first.</p>' +
        '<div class="btn-row">' +
          '<button type="button" class="btn" data-op="enq"></button>' +
          '<button type="button" class="btn" data-op="deq">dequeue()</button>' +
          '<button type="button" class="btn btn-quiet" data-op="reset">Reset</button>' +
        '</div>' +
      '</div>';
    var lane = host.querySelector('[data-role=lane]');
    var msg = host.querySelector('[data-role=msg]');
    var enqBtn = host.querySelector('[data-op=enq]');
    var deqBtn = host.querySelector('[data-op=deq]');

    function draw(added) {
      lane.innerHTML =
        '<span class="lane-end">front</span>' +
        (q.length ? q.map(function (x, i) {
          return '<span class="chip chip-q' + (i === q.length - 1 && added ? ' is-new' : '') + (i === 0 ? ' is-front' : '') + '">' + x + '</span>';
        }).join('') : '<span class="lane-empty">empty</span>') +
        '<span class="lane-end">back</span>';
      enqBtn.textContent = 'enqueue(' + next + ')';
      enqBtn.disabled = q.length >= 8 || next > 'Z';
      deqBtn.disabled = q.length === 0;
    }

    enqBtn.addEventListener('click', function () {
      q.push(next);
      msg.textContent = next + ' joins at the back. ' + q[0] + ' is still at the front.';
      next = String.fromCharCode(next.charCodeAt(0) + 1);
      draw(true);
    });
    deqBtn.addEventListener('click', function () {
      var out = q.shift();
      msg.textContent = 'dequeue() returns ' + out + ', the item that has waited longest. ' + (q.length ? q[0] + ' is now at the front.' : 'The queue is now empty.');
      draw(false);
    });
    host.querySelector('[data-op=reset]').addEventListener('click', function () {
      q = start.slice(); next = 'D';
      msg.textContent = 'Three people are waiting. A joined first.';
      draw(false);
    });
    draw(false);
  }

  /* ---------- 5. BFS stepper ---------- */
  var bfsTrees = {
    balanced: { label: 'Balanced', values: [50, 30, 70, 20, 40, 60, 80] },
    uneven: { label: 'Uneven', values: [40, 20, 60, 10, 70, 65, 90, 85] },
    mine: { label: 'My playground tree', values: null }
  };
  var pseudo = [
    'queue = [root]',
    'while queue is not empty:',
    '  node = dequeue()',
    '  visit(node)',
    '  if node.left:  enqueue(node.left)',
    '  if node.right: enqueue(node.right)'
  ];

  function bfsStepper(host) {
    var which = 'balanced', root, steps, i = 0, timer = null;
    host.innerHTML =
      '<div class="bfs">' +
        '<div class="seg" role="group" aria-label="Choose a tree" data-role="trees"></div>' +
        '<div class="bfs-grid">' +
          '<div class="tree-host tree-host-lg" data-role="tree"></div>' +
          '<div class="bfs-side">' +
            '<div class="bfs-panel"><span class="eyebrow">Queue · front → back</span><div class="chip-row" data-role="queue"></div></div>' +
            '<div class="bfs-panel"><span class="eyebrow">Visited, in order</span><div class="chip-row" data-role="visited"></div></div>' +
            '<pre class="pseudo" data-role="code" aria-hidden="true"></pre>' +
          '</div>' +
        '</div>' +
        '<p class="bfs-note" data-role="note" aria-live="polite"></p>' +
        '<div class="bfs-controls">' +
          '<span class="eyebrow" data-role="count"></span>' +
          '<div class="btn-row">' +
            '<button type="button" class="btn btn-quiet" data-op="back">Back</button>' +
            '<button type="button" class="btn" data-op="step">Step</button>' +
            '<button type="button" class="btn btn-quiet" data-op="play">Play</button>' +
            '<button type="button" class="btn btn-quiet" data-op="reset">Reset</button>' +
          '</div>' +
        '</div>' +
        '<div class="legend"><span><i class="dot is-current"></i>Being visited</span><span><i class="dot is-queued"></i>Waiting in queue</span><span><i class="dot is-visited"></i>Already visited</span></div>' +
      '</div>';
    var treeEl = host.querySelector('[data-role=tree]');
    var qEl = host.querySelector('[data-role=queue]');
    var vEl = host.querySelector('[data-role=visited]');
    var noteEl = host.querySelector('[data-role=note]');
    var codeEl = host.querySelector('[data-role=code]');
    var countEl = host.querySelector('[data-role=count]');
    var playBtn = host.querySelector('[data-op=play]');
    var segEl = host.querySelector('[data-role=trees]');

    function chips(arr, cls, emptyText) {
      return arr.length ? arr.map(function (v) { return '<span class="chip ' + cls + '">' + v + '</span>'; }).join('') : '<span class="chip-empty">' + emptyText + '</span>';
    }

    function load(key) {
      which = key;
      var vals = key === 'mine' ? shared.playground : bfsTrees[key].values;
      root = T.build(vals);
      steps = T.bfsSteps(root);
      i = 0;
      stop();
      segEl.innerHTML = Object.keys(bfsTrees).map(function (k) {
        return '<button type="button" class="seg-btn" aria-pressed="' + (k === which) + '" data-k="' + k + '">' + bfsTrees[k].label + '</button>';
      }).join('');
      draw();
    }

    function draw() {
      var s = steps[i];
      var states = {};
      s.visited.forEach(function (v) { states[v] = 'visited'; });
      s.queue.forEach(function (v) { states[v] = 'queued'; });
      if (s.current !== null) states[s.current] = 'current';
      T.render(treeEl, root, { states: states });
      qEl.innerHTML = chips(s.queue, 'chip-q', s.kind === 'done' ? 'empty' : 'empty');
      vEl.innerHTML = chips(s.visited, 'chip-v', 'nothing yet');
      noteEl.textContent = s.note;
      var hl = s.kind === 'start' ? [0] : s.kind === 'done' ? [1] : [2, 3, 4, 5];
      codeEl.innerHTML = pseudo.map(function (line, idx) {
        return '<span class="pl' + (hl.indexOf(idx) !== -1 ? ' is-hl' : '') + '">' + esc(line) + '</span>';
      }).join('\n');
      countEl.textContent = 'Step ' + (i + 1) + ' of ' + steps.length;
      host.querySelector('[data-op=back]').disabled = i === 0;
      host.querySelector('[data-op=step]').disabled = i === steps.length - 1;
    }

    function stop() { if (timer) { clearInterval(timer); timer = null; } playBtn.textContent = 'Play'; }
    function play() {
      if (timer) { stop(); return; }
      if (i === steps.length - 1) i = 0;
      playBtn.textContent = 'Pause';
      draw();
      timer = setInterval(function () {
        if (i >= steps.length - 1) { stop(); return; }
        i += 1; draw();
        if (i >= steps.length - 1) stop();
      }, reduceMotion ? 900 : 1300);
    }

    segEl.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-k]');
      if (b) load(b.getAttribute('data-k'));
    });
    host.querySelector('[data-op=step]').addEventListener('click', function () { stop(); if (i < steps.length - 1) { i += 1; draw(); } });
    host.querySelector('[data-op=back]').addEventListener('click', function () { stop(); if (i > 0) { i -= 1; draw(); } });
    host.querySelector('[data-op=reset]').addEventListener('click', function () { stop(); i = 0; draw(); });
    playBtn.addEventListener('click', play);

    load('balanced');
    return stop;
  }

  /* ---------- 6. BFS retrieval practice ---------- */
  function bfsTry(host) {
    var trees = global.Content.bfsPracticeTrees;
    var treeIndex = -1, values, root, steps, visit = 0, visited = [];
    host.innerHTML =
      '<div class="bfs-try">' +
        '<div class="tree-host" data-role="tree"></div>' +
        '<p class="bfs-note" data-role="note" aria-live="polite">Choose the node at the front of the queue.</p>' +
        '<div class="bfs-panel"><span class="eyebrow">Queue · front → back</span><div class="chip-row" data-role="queue"></div></div>' +
        '<div class="bfs-panel"><span class="eyebrow">Visited, in order</span><div class="chip-row" data-role="visited"></div></div>' +
        '<div class="btn-row"><button type="button" class="btn btn-quiet" data-op="new-tree">New tree</button></div>' +
      '</div>';
    var treeEl = host.querySelector('[data-role=tree]');
    var note = host.querySelector('[data-role=note]');
    var queueEl = host.querySelector('[data-role=queue]');
    var visitedEl = host.querySelector('[data-role=visited]');
    function chips(arr, cls, empty) {
      return arr.length ? arr.map(function (v) { return '<span class="chip ' + cls + '">' + esc(v) + '</span>'; }).join('') : '<span class="chip-empty">' + empty + '</span>';
    }
    function draw(focusValue) {
      var queue = steps[visit].queue;
      var expected = visit < steps.length - 2 ? steps[visit + 1].current : null;
      var states = {};
      visited.forEach(function (v) { states[v] = 'visited'; });
      queue.forEach(function (v) { if (!states[v]) states[v] = 'queued'; });
      T.render(treeEl, root, { states: states, onNode: choose, label: 'Click each node in breadth-first order. ' + (expected === null ? 'The traversal is complete.' : 'The front of the queue is ' + expected + '.') });
      queueEl.innerHTML = chips(queue, 'chip-q', 'empty');
      visitedEl.innerHTML = chips(visited, 'chip-v', 'nothing yet');
      if (focusValue !== undefined) {
        var nodeEl = treeEl.querySelector('.tnode[data-v="' + focusValue + '"]');
        if (nodeEl) nodeEl.focus();
      }
    }
    function choose(value) {
      if (visit >= steps.length - 2) return;
      var expected = steps[visit + 1].current;
      if (value !== expected) {
        note.textContent = 'Not yet. ' + expected + ' should come next because it is at the front of the queue. Nodes discovered earlier stay ahead of newer children.';
        draw(value);
        return;
      }
      visited.push(value);
      visit += 1;
      if (visit >= steps.length - 2) {
        note.textContent = 'That completes BFS. The queue is empty. Visit order: ' + visited.join(', ') + '.';
      } else {
        note.textContent = value + ' was at the front of the queue. Its children join at the back. Next is ' + steps[visit + 1].current + '.';
      }
      draw(visit < steps.length - 2 ? steps[visit + 1].current : value);
    }
    function newTree() {
      var nextIndex = Math.floor(Math.random() * trees.length);
      if (trees.length > 1 && nextIndex === treeIndex) nextIndex = (nextIndex + 1) % trees.length;
      treeIndex = nextIndex; values = trees[treeIndex].slice(); root = T.build(values); steps = T.bfsSteps(root); visit = 0; visited = [];
      note.textContent = 'New tree. Choose the node at the front of the queue.';
      draw(steps[1].current);
    }
    host.querySelector('[data-op=new-tree]').addEventListener('click', function () { newTree(); });
    newTree();
  }

  /* ---------- 7. Optional BST insertion + BFS challenge ---------- */
  function finalChallenge(host, options) {
    options = options || {};
    var config = global.Content.challenge;
    var values = config.values.slice(), root = null, phase = 'insert', index = 0, visited = [], steps = [], visit = 0;
    host.innerHTML =
      '<div class="final-challenge">' +
        '<p class="eyebrow" data-role="progress">Insertion phase</p>' +
        '<div class="value-sequence" data-role="sequence" aria-label="Values to insert"></div>' +
        '<div class="tree-host tree-host-lg" data-role="tree"></div>' +
        '<p class="feedback is-neutral challenge-feedback" data-role="feedback" aria-live="polite"></p>' +
        '<div class="challenge-reflection" data-role="reflection" hidden>' +
          '<label for="challenge-reflection"><strong>' + esc(config.reflectionPrompt) + '</strong></label>' +
          '<textarea id="challenge-reflection" rows="4" data-role="reflection-input"></textarea>' +
          '<p class="muted">This reflection is for your own thinking and is not graded.</p>' +
          '<button type="button" class="btn btn-primary" data-op="finish">Finish challenge</button>' +
        '</div>' +
      '</div>';
    var treeEl = host.querySelector('[data-role=tree]');
    var progressEl = host.querySelector('[data-role=progress]');
    var sequenceEl = host.querySelector('[data-role=sequence]');
    var feedback = host.querySelector('[data-role=feedback]');
    var reflection = host.querySelector('[data-role=reflection]');
    var reflectionInput = host.querySelector('[data-role=reflection-input]');
    var completed = false;
    reflectionInput.value = options.reflection || '';
    reflectionInput.addEventListener('input', function () { if (options.onReflection) options.onReflection(reflectionInput.value); });

    function draw(focusTarget) {
      if (phase === 'insert') {
        progressEl.textContent = 'Insert value ' + Math.min(index + 1, values.length) + ' of ' + values.length;
        sequenceEl.innerHTML = values.map(function (v, i) { return '<span class="value-chip' + (i < index ? ' is-done' : i === index ? ' is-current' : '') + '">' + esc(v) + '</span>'; }).join('');
        var ghosts = T.insertionSpots(root);
        T.render(treeEl, root, {
          ghosts: ghosts, ghostRoot: !root,
          label: root ? 'Binary search tree. Choose the empty child position where value ' + values[index] + ' belongs.' : 'Empty tree. Choose the root position for value ' + values[index] + '.',
          onGhost: function (parent, side) { chooseSpot(parent, side); }
        });
      } else {
        var expected = visit < steps.length - 2 ? steps[visit + 1].current : null;
        progressEl.textContent = 'BFS phase · node ' + Math.min(visit + 1, values.length) + ' of ' + values.length;
        sequenceEl.innerHTML = '<span class="eyebrow">Insertion order: </span>' + values.map(function (v) { return '<span class="value-chip' + (visited.indexOf(v) !== -1 ? ' is-done' : '') + '">' + esc(v) + '</span>'; }).join('');
        var states = {};
        visited.forEach(function (v) { states[v] = 'visited'; });
        if (expected !== null) states[expected] = 'queued';
        T.render(treeEl, root, {
          states: states,
          label: 'Click nodes in breadth-first order. ' + (expected === null ? 'The traversal is complete.' : 'The front of the queue is ' + expected + '.'),
          onNode: chooseBfs
        });
        if (visit >= steps.length - 2) reflection.hidden = false;
      }
      if (focusTarget) {
        var target = treeEl.querySelector(focusTarget);
        if (target) target.focus();
      }
    }
    function chooseSpot(parent, side) {
      if (phase !== 'insert' || index >= values.length) return;
      var value = values[index];
      var expected = T.insertionTarget(root, value);
      var result = T.insertAt(root, value, parent, side);
      if (!result.inserted) {
        var comparisons = expected.path.map(function (n) { return value + (value < n ? ' < ' : value > n ? ' > ' : ' = ') + n + (value < n ? ' → go left' : value > n ? ' → go right' : ' (already present)'); });
        feedback.className = 'feedback is-hint challenge-feedback';
        feedback.textContent = (comparisons.length ? 'Comparison path: ' + comparisons.join('; ') + '. ' : '') +
          (expected.duplicate ? 'That value is already in the tree.' : 'It belongs at the empty ' + expected.side + ' child of ' + expected.parent + '. Try that dashed spot.');
        draw(side === 'root' ? '.tnode.is-clickable[aria-label="Insert at the root"]' : '.tnode.is-ghost.is-clickable[data-parent="' + parent + '"][data-side="' + side + '"]');
        return;
      }
      root = result.root; index += 1;
      feedback.className = 'feedback is-good challenge-feedback';
      feedback.textContent = value + (side === 'root' ? ' becomes the root.' : ' goes in the empty ' + side + ' child of ' + parent + '.');
      if (index === values.length) {
        phase = 'bfs'; steps = T.bfsSteps(root); visit = 0; visited = [];
        feedback.textContent += ' The tree is complete. Now click its nodes in BFS order.';
        draw('.tnode.is-clickable[data-v="' + steps[1].current + '"]');
      } else {
        draw('.tnode.is-ghost.is-clickable');
      }
    }
    function chooseBfs(value) {
      if (phase !== 'bfs' || visit >= steps.length - 2) return;
      var expected = steps[visit + 1].current;
      if (value !== expected) {
        feedback.className = 'feedback is-hint challenge-feedback';
        feedback.textContent = expected + ' should come next because it is at the front of the queue. Children of nodes you visit join at the back.';
        draw('.tnode.is-clickable[data-v="' + value + '"]');
        return;
      }
      visited.push(value); visit += 1;
      feedback.className = 'feedback is-good challenge-feedback';
      feedback.textContent = visit >= steps.length - 2 ? 'Correct. The queue is empty, so BFS is finished. Write your reflection below.' : 'Correct. ' + steps[visit + 1].current + ' is now at the front of the queue.';
      draw(visit < steps.length - 2 ? '.tnode.is-clickable[data-v="' + steps[visit + 1].current + '"]' : '');
      if (visit >= steps.length - 2) reflectionInput.focus();
    }
    host.querySelector('[data-op=finish]').addEventListener('click', function () {
      if (visit < steps.length - 2 || completed) return;
      completed = true;
      feedback.className = 'feedback is-good challenge-feedback';
      feedback.textContent = 'Final challenge completed. Your reflection is saved on this device.';
      host.querySelector('[data-op=finish]').disabled = true;
      if (options.onDone) options.onDone(reflectionInput.value);
    });
    draw();
  }

  global.Widgets = {
    treeExplorer: treeExplorer,
    bstChecker: bstChecker,
    bstPlayground: bstPlayground,
    queuePlayground: queuePlayground,
    bfsStepper: bfsStepper,
    bfsTry: bfsTry,
    finalChallenge: finalChallenge,
    shared: shared
  };
})(window);
