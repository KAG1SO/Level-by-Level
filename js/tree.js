/* Level by Level - tree.js
 * Binary search tree logic, BFS step generation and SVG rendering.
 * Pure functions where possible so they can be unit-tested (see tests/tree.test.js).
 */
(function (global) {
  'use strict';

  function makeNode(value) {
    return { value: value, left: null, right: null };
  }

  /* Insert a value. Returns the walk taken so the UI can animate it. */
  function insert(root, value) {
    if (!root) {
      var n = makeNode(value);
      return { root: n, path: [], parent: null, side: null, duplicate: false, node: n };
    }
    var path = [];
    var cur = root, parent = null, side = null;
    while (cur) {
      path.push(cur);
      if (value === cur.value) {
        return { root: root, path: path, parent: cur, side: null, duplicate: true, node: cur };
      }
      parent = cur;
      side = value < cur.value ? 'left' : 'right';
      cur = cur[side];
    }
    var created = makeNode(value);
    parent[side] = created;
    return { root: root, path: path, parent: parent, side: side, duplicate: false, node: created };
  }

  /* Search for a value. Returns every node compared, and the node if found. */
  function search(root, value) {
    var path = [];
    var cur = root;
    var lastSide = null;
    while (cur) {
      path.push(cur);
      if (value === cur.value) return { path: path, found: cur, lastSide: null };
      lastSide = value < cur.value ? 'left' : 'right';
      cur = cur[lastSide];
    }
    return { path: path, found: null, lastSide: lastSide };
  }

  function build(values) {
    var root = null;
    values.forEach(function (v) { root = insert(root, v).root; });
    return root;
  }

  /* Build a tree from a nested spec {v, l, r}. Used for trees that break the BST rule on purpose. */
  function fromSpec(spec) {
    if (!spec) return null;
    var n = makeNode(spec.v);
    n.left = fromSpec(spec.l);
    n.right = fromSpec(spec.r);
    return n;
  }

  function levelOrder(root) {
    var out = [];
    var q = root ? [root] : [];
    while (q.length) {
      var n = q.shift();
      out.push(n.value);
      if (n.left) q.push(n.left);
      if (n.right) q.push(n.right);
    }
    return out;
  }

  function inorder(root, out) {
    out = out || [];
    if (root) { inorder(root.left, out); out.push(root.value); inorder(root.right, out); }
    return out;
  }

  function preorder(root, out) {
    out = out || [];
    if (root) { out.push(root.value); preorder(root.left, out); preorder(root.right, out); }
    return out;
  }

  function levels(root) {
    var out = [];
    (function walk(n, d) {
      if (!n) return;
      (out[d] = out[d] || []).push(n.value);
      walk(n.left, d + 1); walk(n.right, d + 1);
    })(root, 0);
    return out;
  }

  /* Levels listed right-to-left: a common wrong answer for BFS order. */
  function rightToLeftLevels(root) {
    var out = [];
    levels(root).forEach(function (lvl) { out = out.concat(lvl.slice().reverse()); });
    return out;
  }

  function height(root) {
    if (!root) return -1;
    return 1 + Math.max(height(root.left), height(root.right));
  }

  function size(root) {
    return root ? 1 + size(root.left) + size(root.right) : 0;
  }

  function find(root, value) {
    if (!root) return null;
    if (root.value === value) return root;
    return find(root.left, value) || find(root.right, value);
  }

  function parentOf(root, value) {
    if (!root) return null;
    if ((root.left && root.left.value === value) || (root.right && root.right.value === value)) return root;
    return parentOf(root.left, value) || parentOf(root.right, value);
  }

  function depthOf(root, value, d) {
    d = d || 0;
    if (!root) return -1;
    if (root.value === value) return d;
    var l = depthOf(root.left, value, d + 1);
    return l !== -1 ? l : depthOf(root.right, value, d + 1);
  }

  /* Checks the full BST rule (whole subtrees, not only direct children).
   * Returns null when valid, or the first node that breaks the rule. */
  function firstViolation(root) {
    var bad = null;
    (function walk(n, lo, hi) {
      if (!n || bad) return;
      if ((lo !== null && n.value <= lo) || (hi !== null && n.value >= hi)) { bad = n; return; }
      walk(n.left, lo, n.value);
      walk(n.right, n.value, hi);
    })(root, null, null);
    return bad;
  }

  /* BFS as a list of snapshots, one per visit, for the step-through visualiser. */
  function bfsSteps(root) {
    if (!root) return [];
    var steps = [];
    steps.push({
      kind: 'start', current: null, queue: [root.value], visited: [], enqueued: [root.value],
      note: 'Start by putting the root, ' + root.value + ', into the queue.'
    });
    var q = [root];
    var visited = [];
    while (q.length) {
      var n = q.shift();
      visited.push(n.value);
      var added = [];
      if (n.left) { q.push(n.left); added.push(n.left.value); }
      if (n.right) { q.push(n.right); added.push(n.right.value); }
      var note = 'Dequeue ' + n.value + ' from the front and visit it. ';
      if (added.length === 2) note += 'Enqueue its children, ' + added[0] + ' then ' + added[1] + ', at the back.';
      else if (added.length === 1) note += 'Enqueue its only child, ' + added[0] + ', at the back.';
      else note += 'It is a leaf, so nothing new joins the queue.';
      steps.push({
        kind: 'visit', current: n.value, queue: q.map(function (x) { return x.value; }),
        visited: visited.slice(), enqueued: added, note: note
      });
    }
    steps.push({
      kind: 'done', current: null, queue: [], visited: visited.slice(), enqueued: [],
      note: 'The queue is empty, so BFS is finished. Visit order: ' + visited.join(', ') + '.'
    });
    return steps;
  }

  /* ---------- Rendering ---------- */

  var GAP_X = 52, GAP_Y = 66, PAD = 30, R = 19;

  function layout(root) {
    var pos = new Map();
    var i = 0, maxDepth = 0;
    (function walk(n, d) {
      if (!n) return;
      walk(n.left, d + 1);
      pos.set(n, { x: PAD + R + i * GAP_X, y: PAD + R - 6 + d * GAP_Y, depth: d });
      i += 1;
      if (d > maxDepth) maxDepth = d;
      walk(n.right, d + 1);
    })(root, 0);
    return { pos: pos, count: i, depth: maxDepth };
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* render(host, root, opts)
   * opts.states   : { value: 'path' | 'current' | 'found' | 'visited' | 'queued' | 'bad' | 'new' | 'selected' }
   * opts.onNode   : function(value) - makes nodes clickable
   * opts.label    : accessible description of the whole tree
   * opts.ghost    : { parent: value, side: 'left'|'right' } - dashed empty spot
   */
  function render(host, root, opts) {
    opts = opts || {};
    var states = opts.states || {};
    if (!root) {
      host.innerHTML = '<div class="tree-empty">The tree is empty. Insert a value to create the root.</div>';
      return;
    }
    var L = layout(root);
    var width = Math.max(240, PAD * 2 + R * 2 + (L.count - 1) * GAP_X);
    var height = PAD * 2 + R * 2 - 12 + L.depth * GAP_Y + (opts.ghost ? GAP_Y * 0.0 : 0);
    var ghostPos = null;
    if (opts.ghost) {
      var gp = find(root, opts.ghost.parent);
      if (gp) {
        var p = L.pos.get(gp);
        ghostPos = { x: p.x + (opts.ghost.side === 'left' ? -GAP_X * 0.6 : GAP_X * 0.6), y: p.y + GAP_Y, px: p.x, py: p.y };
        width = Math.max(width, ghostPos.x + R + PAD);
        if (ghostPos.x - R < 0) { ghostPos.x = R + 4; }
        height = Math.max(height, ghostPos.y + R + PAD - 6);
      }
    }
    var edges = [], nodes = [];
    L.pos.forEach(function (p, n) {
      [n.left, n.right].forEach(function (c) {
        if (!c) return;
        var cp = L.pos.get(c);
        var st = states[c.value];
        var cls = 'tedge' + ((st === 'path' || st === 'current' || st === 'found' || st === 'new') && states[n.value] ? ' is-path' : '');
        edges.push('<line class="' + cls + '" x1="' + p.x + '" y1="' + p.y + '" x2="' + cp.x + '" y2="' + cp.y + '"/>');
      });
      var s = states[n.value];
      var clickable = typeof opts.onNode === 'function';
      var label = 'Node ' + n.value + (s ? ', ' + s : '');
      nodes.push(
        '<g class="tnode' + (s ? ' is-' + s : '') + (clickable ? ' is-clickable' : '') + '" data-v="' + esc(n.value) + '"' +
        (clickable ? ' tabindex="0" role="button" aria-label="' + esc(label) + '"' : '') + '>' +
        '<circle cx="' + p.x + '" cy="' + p.y + '" r="' + R + '"/>' +
        '<text x="' + p.x + '" y="' + (p.y + 0.5) + '">' + esc(n.value) + '</text></g>'
      );
    });
    if (ghostPos) {
      edges.push('<line class="tedge is-ghost" x1="' + ghostPos.px + '" y1="' + ghostPos.py + '" x2="' + ghostPos.x + '" y2="' + ghostPos.y + '"/>');
      nodes.push('<g class="tnode is-ghost"><circle cx="' + ghostPos.x + '" cy="' + ghostPos.y + '" r="' + R + '"/><text x="' + ghostPos.x + '" y="' + (ghostPos.y + 0.5) + '">?</text></g>');
    }
    var aria = opts.label || ('Binary tree with ' + L.count + ' nodes. Level order: ' + levelOrder(root).join(', ') + '.');
    host.innerHTML =
      '<svg class="tree-svg" viewBox="0 0 ' + width + ' ' + height + '" width="' + width + '" role="img" aria-label="' + esc(aria) + '">' +
      edges.join('') + nodes.join('') + '</svg>';
    if (typeof opts.onNode === 'function') {
      host.querySelectorAll('.tnode.is-clickable').forEach(function (g) {
        var raw = g.getAttribute('data-v');
        var v = isNaN(Number(raw)) ? raw : Number(raw);
        g.addEventListener('click', function () { opts.onNode(v); });
        g.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); opts.onNode(v); }
        });
      });
    }
  }

  var api = {
    makeNode: makeNode, insert: insert, search: search, build: build, fromSpec: fromSpec,
    levelOrder: levelOrder, inorder: inorder, preorder: preorder, levels: levels,
    rightToLeftLevels: rightToLeftLevels, height: height, size: size, find: find,
    parentOf: parentOf, depthOf: depthOf, firstViolation: firstViolation, bfsSteps: bfsSteps,
    layout: layout, render: render
  };

  global.Tree = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
