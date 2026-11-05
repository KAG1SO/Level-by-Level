/* Level by Level - questions.js
 * Quiz question bank. Every question is tagged to one concept (learning objective).
 * Answers that depend on a tree are computed from the tree itself, so they can't drift out of sync.
 */
(function (global) {
  'use strict';
  var T = global.Tree || (typeof require !== 'undefined' ? require('./tree.js') : null);

  function list(a) { return a.join(', '); }

  function bfsQuestion(id, values, prompt) {
    var root = T.build(values);
    var correct = list(T.levelOrder(root));
    var options = [correct, list(T.preorder(root)), list(T.inorder(root)), list(T.rightToLeftLevels(root))];
    return {
      id: id, concept: 'bfs', prompt: prompt || 'In what order does BFS visit the nodes of this tree?',
      tree: values, options: options, answer: 0,
      hint: 'Work level by level. Finish every node on one level, left to right, before going down.',
      explain: 'Level by level: ' + T.levels(root).map(function (l, i) { return 'depth ' + i + ' is ' + list(l); }).join('; ') + '. So the order is ' + correct + '.'
    };
  }

  function insertQuestion(id, values, x, distractors) {
    var root = T.build(values);
    var r = T.insert(root, x);
    var correct = (r.side === 'left' ? 'Left' : 'Right') + ' child of ' + r.parent.value;
    var walk = r.path.map(function (n) {
      return x + (x < n.value ? ' < ' : ' > ') + n.value + ', go ' + (x < n.value ? 'left' : 'right');
    }).join('. ');
    return {
      id: id, concept: 'insert', prompt: 'You insert ' + x + ' into this BST. Where does it go?',
      tree: values, options: [correct].concat(distractors), answer: 0,
      hint: 'Search for ' + x + ' as if it were already there. Where does the search fall off the tree?',
      explain: walk + '. That spot is empty, so ' + x + ' becomes the ' + correct.toLowerCase() + '.'
    };
  }

  function searchPathQuestion(id, values, x, distractors) {
    var root = T.build(values);
    var r = T.search(root, x);
    var correct = list(r.path.map(function (n) { return n.value; }));
    return {
      id: id, concept: 'search', prompt: 'You search this BST for ' + x + '. Which nodes do you compare with, in order?',
      tree: values, options: [correct].concat(distractors), answer: 0,
      hint: 'Start at the root. Each comparison sends you either left or right, never both.',
      explain: 'Start at ' + r.path[0].value + ' and follow left for smaller and right for larger: ' + correct + '.'
    };
  }

  var bank = [
    /* ---- Tree vocabulary ---- */
    {
      id: 't1', concept: 'terms', prompt: 'How many leaves does this tree have?',
      tree: [50, 30, 70, 20, 40, 60, 80], options: ['4', '3', '7', '2'], answer: 0,
      hint: 'A leaf is a node with no children. Count the nodes with nothing below them.',
      explain: '20, 40, 60 and 80 have no children, so there are 4 leaves.'
    },
    {
      id: 't2', concept: 'terms', prompt: 'What is the parent of 40 in this tree?',
      tree: [50, 30, 70, 20, 40], options: ['30', '50', '20', '70'], answer: 0,
      hint: 'The parent is the node directly above, joined by one edge.',
      explain: '40 hangs directly below 30, so 30 is its parent. 50 is further up: it is 40\'s grandparent.'
    },
    {
      id: 't3', concept: 'terms', prompt: 'What is the height of this tree, counted in edges?',
      tree: [50, 30, 70, 20, 10], options: ['3', '4', '2', '5'], answer: 0,
      hint: 'Find the longest path from the root down to a leaf and count the edges, not the nodes.',
      explain: 'The longest path is 50 → 30 → 20 → 10. That is 4 nodes but 3 edges, so the height is 3.'
    },
    {
      id: 't4', concept: 'terms', prompt: 'Which statement about the root of a tree is true?',
      options: ['It is the only node with no parent.', 'It always holds the smallest value.', 'It is always a leaf.', 'A tree can have several roots.'],
      answer: 0,
      hint: 'Think about where the root sits and what is above it.',
      explain: 'The root is at the top, so nothing is above it. Every other node has exactly one parent.'
    },
    {
      id: 't5', concept: 'terms', prompt: 'What is the depth of 60 in this tree?',
      tree: [50, 30, 70, 60, 80, 65], options: ['2', '1', '3', '0'], answer: 0,
      hint: 'Depth counts the edges from the root down to the node. The root has depth 0.',
      explain: 'The path is 50 → 70 → 60, which is 2 edges, so 60 has depth 2.'
    },

    /* ---- The BST rule ---- */
    {
      id: 'r1', concept: 'rule', prompt: 'Is this a valid binary search tree?',
      spec: { v: 50, l: { v: 30, l: { v: 20 }, r: { v: 60 } }, r: { v: 70 } },
      options: ['No. 60 is in 50\'s left subtree but is larger than 50.', 'Yes. Every node is correctly placed next to its parent.', 'No. 30 is smaller than 50.', 'No. A BST must have the same number of nodes on each side.'],
      answer: 0,
      hint: 'Check every node against all its ancestors, not only its parent.',
      explain: '60 is correctly to the right of 30, but it is inside 50\'s left subtree, where everything must be smaller than 50.'
    },
    {
      id: 'r2', concept: 'rule', prompt: 'In a BST, where are all the values smaller than the root stored?',
      options: ['In the root\'s left subtree', 'In the root\'s right subtree', 'In the leaves only', 'Anywhere, as long as they are below the root'],
      answer: 0,
      hint: 'Smaller goes one way, larger goes the other.',
      explain: 'The BST rule puts every smaller value in the left subtree and every larger value in the right subtree.'
    },
    {
      id: 'r3', concept: 'rule', prompt: 'Which value could replace ? and keep this tree a valid BST?',
      spec: { v: 50, l: { v: 30, l: { v: 20 }, r: { v: '?' } }, r: { v: 70 } },
      options: ['45', '25', '55', '30'], answer: 0,
      hint: '? is the right child of 30 and sits inside 50\'s left subtree. What two conditions must it meet?',
      explain: '? must be larger than 30 (it is 30\'s right child) and smaller than 50 (it is in 50\'s left subtree). Only 45 fits.'
    },
    {
      id: 'r4', concept: 'rule', prompt: 'Is this a valid binary search tree?',
      spec: { v: 40, l: { v: 20, l: { v: 10 }, r: { v: 30 } }, r: { v: 60, l: { v: 50 }, r: { v: 70 } } },
      options: ['Yes', 'No. 50 is smaller than 60.', 'No. 30 is larger than 20.', 'No. 70 is too far from the root.'],
      answer: 0,
      hint: 'For each node, check that everything on its left is smaller and everything on its right is larger.',
      explain: 'Every node passes: 10, 20, 30 are all below 40 on the left; 50, 60, 70 are all above 40 on the right; and each smaller subtree is ordered too.'
    },

    /* ---- Searching ---- */
    searchPathQuestion('s1', [50, 30, 70, 20, 40, 60, 80], 60, ['50, 30, 60', '60', '50, 30, 40, 70, 60']),
    {
      id: 's2', concept: 'search', prompt: 'You search this BST for 45. What happens?',
      tree: [50, 30, 70, 20, 40, 60, 80],
      options: ['Not found, after comparing with 50, 30 and 40', 'Found as the right child of 40', 'Not found, after comparing with every node', 'Not found, after comparing with 50 only'],
      answer: 0,
      hint: 'Follow the comparisons. What happens when the child you need is missing?',
      explain: '45 < 50, go left. 45 > 30, go right. 45 > 40, go right, but 40 has no right child. The search stops: 45 is not in the tree.'
    },
    {
      id: 's3', concept: 'search', prompt: 'While searching a BST, the value you want is larger than the current node. What do you do next?',
      options: ['Move to the right child', 'Move to the left child', 'Go back to the root', 'Check both children'],
      answer: 0,
      hint: 'Where does the BST rule put larger values?',
      explain: 'Larger values are always in the right subtree, so you move right and ignore the whole left subtree.'
    },
    {
      id: 's4', concept: 'search', prompt: 'How many comparisons does it take to find 20 in this BST?',
      tree: [50, 30, 70, 20, 40, 60, 80], options: ['3', '2', '7', '4'], answer: 0,
      hint: 'Count every node you compare 20 with, including the one where you find it.',
      explain: 'Compare with 50 (go left), 30 (go left), then 20 (found). That is 3 comparisons, not 7: the search skips the whole right subtree.'
    },

    /* ---- Inserting ---- */
    insertQuestion('i1', [50, 30, 70, 20, 40], 35, ['Right child of 30', 'Right child of 40', 'Left child of 20']),
    insertQuestion('i2', [50, 30, 70, 60, 80], 75, ['Right child of 70', 'Right child of 80', 'Left child of 60']),
    {
      id: 'i3', concept: 'insert', prompt: 'You insert 40, 20, 60, 10 in that order into an empty BST. Which value is the root?',
      options: ['40', '10', '20', '60'], answer: 0,
      hint: 'The first value inserted into an empty tree has nowhere to go but the top.',
      explain: '40 goes in first and becomes the root. Later values never move it; they are added below as leaves.'
    },
    {
      id: 'i4', concept: 'insert', prompt: 'Where is a new value always added in a BST?',
      options: ['As a new leaf', 'As the new root', 'Between two existing nodes', 'In the next free spot on the lowest level'],
      answer: 0,
      hint: 'Insert follows the search path until it hits an empty spot.',
      explain: 'Insertion walks down until the child it needs is empty, and places the new node there. Nothing moves, so the new node is always a leaf.'
    },

    /* ---- Queues ---- */
    {
      id: 'q1', concept: 'queue', prompt: 'You enqueue A, then B, then C. What does dequeue() return?',
      options: ['A', 'C', 'B', 'A, B and C'], answer: 0,
      hint: 'FIFO: first in, first out.',
      explain: 'A joined first, so it is at the front and leaves first.'
    },
    {
      id: 'q2', concept: 'queue', prompt: 'Start empty. Enqueue 1, enqueue 2, dequeue, enqueue 3, enqueue 4, dequeue. Which value is at the front now?',
      options: ['3', '1', '2', '4'], answer: 0,
      hint: 'Write the queue down after every operation, front on the left.',
      explain: '[1] → [1, 2] → [2] → [2, 3] → [2, 3, 4] → [3, 4]. The front is 3.'
    },
    {
      id: 'q3', concept: 'queue', prompt: 'What does FIFO mean?',
      options: ['First in, first out', 'Fastest in, fastest out', 'First in, final out', 'Front in, front out'],
      answer: 0,
      hint: 'Think about a queue at a taxi rank.',
      explain: 'First in, first out: whoever joined earliest leaves first.'
    },
    {
      id: 'q4', concept: 'queue', prompt: 'Why does BFS use a queue?',
      options: ['It keeps nodes in the order they were found, so each level finishes before the next starts', 'A queue sorts the values automatically', 'A queue uses less memory than any other structure', 'Trees can only store their nodes in queues'],
      answer: 0,
      hint: 'What order does BFS need to visit the nodes it has discovered?',
      explain: 'Nodes are discovered level by level. First in, first out means they are visited in that same order.'
    },

    /* ---- BFS ---- */
    bfsQuestion('b1', [50, 30, 70, 20, 40, 60, 80]),
    bfsQuestion('b2', [40, 20, 60, 10, 30, 70, 65]),
    {
      id: 'b3', concept: 'bfs', prompt: 'BFS has just visited the root 50, whose children are 30 (left) and 70 (right). What is in the queue now, front first?',
      tree: [50, 30, 70, 20, 40], options: ['30, 70', '70, 30', '30', 'Nothing'], answer: 0,
      hint: 'After visiting a node, BFS enqueues its left child, then its right child.',
      explain: 'Visiting 50 enqueues 30 and then 70, so the queue is 30, 70 with 30 at the front.'
    },
    {
      id: 'b4', concept: 'bfs', prompt: 'Which description matches BFS on a tree?',
      options: ['Level by level, left to right', 'In sorted order, smallest to largest', 'Down one branch to a leaf, then back up', 'From the leaves up to the root'],
      answer: 0,
      hint: 'The "breadth" in breadth-first means across a level.',
      explain: 'BFS covers each level fully, left to right, before it goes down to the next level.'
    },
    (function () {
      var values = [8, 4, 12, 2, 6, 10, 14];
      var order = T.levelOrder(T.build(values));
      return {
        id: 'b5', concept: 'bfs', prompt: 'Which node does BFS visit 4th?',
        tree: values, options: [String(order[3]), '6', '12', '10'], answer: 0,
        hint: 'Write out level 0, then level 1 left to right, then start level 2.',
        explain: 'The order starts ' + order.slice(0, 4).join(', ') + ', so the 4th node is ' + order[3] + '.'
      };
    })()
  ];

  var api = { bank: bank };
  global.Questions = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
