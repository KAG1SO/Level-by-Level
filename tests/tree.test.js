// Run with: node tests/tree.test.js
const assert = require('assert');
const T = require('../js/tree.js');
globalThis.Tree = T;
const Q = require('../js/questions.js');
const C = require('../js/content.js');

// BST basics
const root = T.build([50, 30, 70, 20, 40, 60, 80]);
assert.deepStrictEqual(T.levelOrder(root), [50, 30, 70, 20, 40, 60, 80]);
assert.deepStrictEqual(T.inorder(root), [20, 30, 40, 50, 60, 70, 80]);
assert.deepStrictEqual(T.search(root, 60).path.map(n => n.value), [50, 70, 60]);
assert.strictEqual(T.search(root, 45).found, null);
assert.strictEqual(T.height(root), 2);
assert.strictEqual(T.firstViolation(root), null);
assert.strictEqual(T.firstViolation(T.fromSpec({ v: 50, l: { v: 30, r: { v: 60 } } })).value, 60);
const steps = T.bfsSteps(root);
assert.strictEqual(steps.length, 9);
assert.deepStrictEqual(steps[steps.length - 1].visited, [50, 30, 70, 20, 40, 60, 80]);
assert.deepStrictEqual(steps[1].queue, [30, 70]);
const ins = T.insert(T.build([50, 30, 70, 20, 40]), 45);
assert.strictEqual(ins.parent.value, 40); assert.strictEqual(ins.side, 'right');
assert.strictEqual(T.insert(root, 50).duplicate, true);

// Interactive challenge insertion targets and valid empty spots
const challengeValues = C.challenge.values;
assert.ok(challengeValues.length >= 6 && challengeValues.length <= 8);
let challengeRoot = null;
challengeValues.forEach(value => {
  const target = T.insertionTarget(challengeRoot, value);
  const spots = T.insertionSpots(challengeRoot);
  assert.ok(spots.some(s => s.parent === target.parent && s.side === target.side), 'target is an available empty spot');
  const inserted = T.insertAt(challengeRoot, value, target.parent, target.side);
  assert.strictEqual(inserted.inserted, true);
  challengeRoot = inserted.root;
});
assert.deepStrictEqual(T.inorder(challengeRoot), challengeValues.slice().sort((a, b) => a - b));
const wrongTarget = T.insertionTarget(challengeRoot, 44);
assert.strictEqual(T.insertAt(challengeRoot, 44, wrongTarget.parent, wrongTarget.side === 'left' ? 'right' : 'left').inserted, false);
assert.strictEqual(T.insertAt(challengeRoot, challengeValues[0], null, 'root').duplicate, true);
assert.deepStrictEqual(T.insertionSpots(null), [{ parent: null, side: 'root' }]);

// The challenge traverses the tree it builds, level by level.
assert.deepStrictEqual(T.levelOrder(challengeRoot), T.bfsSteps(challengeRoot).filter(s => s.kind === 'visit').map(s => s.current));
assert.ok(C.bfsPracticeTrees.length >= 2);
assert.ok(C.bfsPracticeTrees.every(values => values.length >= 6));

// Question bank
const conceptKeys = Object.keys(C.concepts);
const per = {};
Q.bank.forEach(q => {
  assert.ok(conceptKeys.includes(q.concept), q.id + ' bad concept');
  assert.strictEqual(new Set(q.options).size, q.options.length, q.id + ' duplicate options: ' + q.options.join(' | '));
  assert.ok(q.answer >= 0 && q.answer < q.options.length, q.id + ' answer index');
  assert.ok(q.hint && q.explain, q.id + ' hint/explain');
  per[q.concept] = (per[q.concept] || 0) + 1;
});
conceptKeys.forEach(k => assert.ok(per[k] >= 3, k + ' needs at least 3 questions, has ' + per[k]));

// Specific answers
const byId = Object.fromEntries(Q.bank.map(q => [q.id, q]));
assert.strictEqual(byId.i1.options[0], 'Left child of 40');
assert.strictEqual(byId.i2.options[0], 'Left child of 80');
assert.strictEqual(byId.b5.options[0], '2');
assert.strictEqual(T.height(T.build(byId.t3.tree)), 3);
assert.strictEqual(T.depthOf(T.build(byId.t5.tree), 60), 2);
assert.strictEqual(T.firstViolation(T.fromSpec(byId.r4.spec)), null);
assert.strictEqual(T.firstViolation(T.fromSpec(byId.r1.spec)).value, 60);

// In-lesson checks
C.lessons.forEach(l => l.sections.filter(s => s.type === 'check').forEach(s => {
  assert.strictEqual(new Set(s.q.options).size, s.q.options.length, l.id + ' check duplicate options');
  assert.ok(s.q.hint, l.id + ' check has a first-attempt hint');
}));
const bfsCheck = C.lessons.find(l => l.id === 'bfs').sections.find(s => s.type === 'check').q;
assert.strictEqual(bfsCheck.options[bfsCheck.answer], T.levelOrder(T.build(bfsCheck.tree)).join(', '));

console.log('All tests passed:', Q.bank.length, 'questions,', JSON.stringify(per));
