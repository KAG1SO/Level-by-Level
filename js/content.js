/* Level by Level - content.js
 * Learning objectives (concepts) and lesson content.
 * Each concept is one learning objective; each quiz question is tagged to one concept,
 * so assessment results map straight back to the objectives and to the lesson that teaches them.
 */
(function (global) {
  'use strict';

  var concepts = {
    terms: {
      label: 'Tree vocabulary',
      lesson: 'trees',
      objective: 'Describe a tree using the terms root, parent, child, leaf, depth and height.',
      tip: 'Click through the nodes in the tree explorer and say each node\'s role out loud before you read it.'
    },
    rule: {
      label: 'The BST rule',
      lesson: 'bst',
      objective: 'Explain the binary search tree ordering rule and decide whether a tree follows it.',
      tip: 'Remember the rule covers the whole subtree, not just a node\'s direct children. Redo the "Valid or not?" trees.'
    },
    search: {
      label: 'Searching a BST',
      lesson: 'search-insert',
      objective: 'Trace a search for a value in a BST, listing the nodes compared.',
      tip: 'In the playground, search for a few values that are in the tree and a few that are not. Watch where each search stops.'
    },
    insert: {
      label: 'Inserting into a BST',
      lesson: 'search-insert',
      objective: 'Insert values into a BST by hand and say where each new node ends up.',
      tip: 'Insertion is a search that fails, then fills the empty spot. Predict the spot before you press Insert.'
    },
    queue: {
      label: 'Queues (FIFO)',
      lesson: 'queues',
      objective: 'Explain how a queue works and predict its contents after enqueue and dequeue operations.',
      tip: 'Think of a taxi rank: people join at the back and leave from the front. Use the queue playground and predict each result first.'
    },
    bfs: {
      label: 'Breadth-first search',
      lesson: 'bfs',
      objective: 'Trace BFS on a binary tree using a queue and give the order the nodes are visited.',
      tip: 'Step through BFS slowly and say what the queue holds after each step before you press Step.'
    }
  };

  var lessons = [
    {
      id: 'trees',
      title: 'What is a tree?',
      minutes: 5,
      concepts: ['terms'],
      sections: [
        { type: 'prose', html:
          '<p>A <strong>tree</strong> stores data as a hierarchy. You already use trees: the folders on your laptop, a family tree, or the way a module is split into chapters and sections.</p>' +
          '<p>Each item in a tree is called a <strong>node</strong>. The lines that join nodes are called <strong>edges</strong>. In computer science we draw trees upside down: the top node is the <strong>root</strong> and the tree grows downward.</p>' +
          '<p>A tree follows three rules:</p>' +
          '<ul><li>There is exactly one root.</li><li>Every other node has exactly one parent, the node directly above it.</li><li>There are no loops. From the root there is exactly one path to any node.</li></ul>' },
        { type: 'terms', items: [
          ['Root', 'The single node at the top. It is the only node with no parent.'],
          ['Parent and child', 'A node directly above another is its parent. The node below is its child.'],
          ['Leaf', 'A node with no children.'],
          ['Internal node', 'A node that has at least one child.'],
          ['Depth (level)', 'The number of edges from the root down to the node. The root has depth 0.'],
          ['Height', 'The number of edges on the longest path from the root down to a leaf.'],
          ['Subtree', 'A node together with everything below it.']
        ] },
        { type: 'widget', widget: 'treeExplorer', title: 'Explore a tree', hint: 'Select any node to see its role, parent, children and depth.' },
        { type: 'check', q: {
          prompt: 'Which nodes in this tree are leaves?',
          tree: [50, 30, 70, 20, 40, 80],
          options: ['20, 40 and 80', '50 and 70', '30, 70 and 80', 'Only 80'],
          answer: 0,
          explain: 'A leaf has no children. 20, 40 and 80 have nothing below them. 70 is not a leaf because it has the child 80.'
        } },
        { type: 'takeaways', items: [
          'A tree has one root, every other node has one parent, and there are no loops.',
          'Leaves have no children.',
          'Depth counts edges from the root down. Height is the depth of the deepest leaf.'
        ] }
      ]
    },
    {
      id: 'bst',
      title: 'Binary search trees',
      minutes: 6,
      concepts: ['rule'],
      sections: [
        { type: 'prose', html:
          '<p>A <strong>binary tree</strong> is a tree where each node has at most two children. We call them the <strong>left child</strong> and the <strong>right child</strong>.</p>' +
          '<p>A <strong>binary search tree (BST)</strong> is a binary tree that keeps its values in order. For <em>every</em> node:</p>' +
          '<div class="rule-card"><div><span class="rule-side">Left subtree</span><span class="rule-val">all smaller</span></div><div class="rule-node">node</div><div><span class="rule-side">Right subtree</span><span class="rule-val">all larger</span></div></div>' +
          '<p>In this app every value in a tree is different, so we don\'t need to decide where duplicates go.</p>' +
          '<p>Why bother? Think of finding a word in a printed dictionary. You open it in the middle, see whether your word comes before or after, and ignore the other half. A BST lets a computer do the same: every comparison rules out a whole subtree.</p>' },
        { type: 'callout', tone: 'warn', title: 'The most common mistake', html:
          '<p>The rule is about whole subtrees, not just a node\'s direct children. If 30 is the left child of 50, then <em>everything</em> under 30 must also be smaller than 50. A 60 hidden under 30 breaks the rule, even though 60 is correctly to the right of 30.</p>' },
        { type: 'widget', widget: 'bstChecker', title: 'Valid or not?', hint: 'Decide whether each tree follows the BST rule.' },
        { type: 'check', q: {
          prompt: 'The root of a valid BST is 50. Which value can NOT appear anywhere in its left subtree?',
          options: ['10', '49', '51', '25'],
          answer: 2,
          explain: 'Everything in the left subtree of 50 must be smaller than 50. 51 is larger, so it must be in the right subtree.'
        } },
        { type: 'takeaways', items: [
          'Binary: at most two children per node, left and right.',
          'BST rule: left subtree all smaller, right subtree all larger, for every node.',
          'The rule applies to whole subtrees, not just to direct children.'
        ] }
      ]
    },
    {
      id: 'search-insert',
      title: 'Search and insert',
      minutes: 7,
      concepts: ['search', 'insert'],
      sections: [
        { type: 'prose', html:
          '<h3>Searching</h3>' +
          '<p>To find a value, start at the root and repeat:</p>' +
          '<ol><li>If the value equals the current node, you have found it.</li><li>If the value is smaller, move to the left child.</li><li>If the value is larger, move to the right child.</li><li>If the child you need is missing, the value is not in the tree.</li></ol>' },
        { type: 'code', title: 'search(node, x)', lines: [
          'while node is not empty:',
          '    if x == node.value: return node      // found',
          '    if x <  node.value: node = node.left',
          '    else:               node = node.right',
          'return not found'
        ] },
        { type: 'prose', html:
          '<h3>Inserting</h3>' +
          '<p>Inserting uses the same walk. Search for the new value. When you reach the empty spot where it would have been, put the new node there. That means a new value is always added as a <strong>leaf</strong>. Nothing already in the tree moves.</p>' +
          '<p>The order you insert values changes the shape of the tree. Inserting 10, 20, 30, 40 in that order gives a tree that leans to one side like a stick, and searching it is no faster than checking a list. You will see how to keep trees balanced later in COS212.</p>' },
        { type: 'widget', widget: 'bstPlayground', title: 'BST playground', hint: 'Try this: search for 60, then search for 45, then insert 45 and search for it again.' },
        { type: 'check', q: {
          prompt: 'You insert 45 into this BST. Where does it go?',
          tree: [50, 30, 70, 20, 40],
          options: ['Right child of 40', 'Left child of 70', 'Right child of 30', 'Left child of 40'],
          answer: 0,
          explain: '45 < 50, so go left to 30. 45 > 30, so go right to 40. 45 > 40, and 40 has no right child, so 45 becomes the right child of 40.'
        } },
        { type: 'takeaways', items: [
          'Search: compare, then go left for smaller or right for larger, until you find it or hit an empty spot.',
          'Insert: search for the value, then put it in the empty spot you reach. It is always a new leaf.',
          'Insertion order decides the shape of the tree.'
        ] }
      ]
    },
    {
      id: 'queues',
      title: 'Queues',
      minutes: 3,
      concepts: ['queue'],
      sections: [
        { type: 'prose', html:
          '<p>Breadth-first search needs one helper structure: a <strong>queue</strong>. A queue works like a taxi rank. People join at the back and the person at the front leaves first. This is called <strong>FIFO</strong>: first in, first out.</p>' +
          '<p>A queue has three main operations:</p>' },
        { type: 'terms', items: [
          ['enqueue(x)', 'Add x to the back of the queue.'],
          ['dequeue()', 'Remove and return the item at the front.'],
          ['isEmpty()', 'True when nothing is waiting.']
        ] },
        { type: 'widget', widget: 'queuePlayground', title: 'Queue playground', hint: 'Predict who leaves before you press Dequeue.' },
        { type: 'check', q: {
          prompt: 'Start with an empty queue. Enqueue 5, enqueue 8, enqueue 2, then dequeue once. Which value is now at the front?',
          options: ['5', '8', '2', 'The queue is empty'],
          answer: 1,
          explain: '5 joined first, so dequeue removes 5. That leaves 8 at the front and 2 behind it.'
        } },
        { type: 'takeaways', items: [
          'A queue is first in, first out (FIFO).',
          'Enqueue adds at the back. Dequeue removes from the front.'
        ] }
      ]
    },
    {
      id: 'bfs',
      title: 'Breadth-first search',
      minutes: 7,
      concepts: ['bfs'],
      sections: [
        { type: 'prose', html:
          '<p><strong>Breadth-first search (BFS)</strong> visits a tree <em>level by level</em>: first the root, then every node at depth 1 from left to right, then every node at depth 2, and so on. On a tree this is also called a <strong>level-order traversal</strong>.</p>' +
          '<p>The difficulty is that nodes on the same level are not connected to each other. When you visit 30, you find its children, but you must not visit them yet, because 70 is still waiting on the current level. A queue solves this: it holds discovered nodes in the order they were found, so a whole level always finishes before the next one starts.</p>' },
        { type: 'code', title: 'bfs(root)', lines: [
          'queue = [root]',
          'while queue is not empty:',
          '    node = queue.dequeue()',
          '    visit(node)',
          '    if node.left:  queue.enqueue(node.left)',
          '    if node.right: queue.enqueue(node.right)'
        ] },
        { type: 'widget', widget: 'bfsStepper', title: 'Step through BFS', hint: 'Before each step, say which node will leave the queue next.' },
        { type: 'prose', html:
          '<h3>Where BFS is used</h3>' +
          '<ul><li>Printing a tree one level per line.</li><li>Finding the node closest to the root that matches a condition.</li><li>Finding the shortest route, counted in edges, between two points in a network.</li></ul>' +
          '<p>BFS also works on general graphs, which you will meet later. Graphs can contain loops, so there you also keep track of nodes you have already seen. Trees have no loops, so this version can skip that.</p>' },
        { type: 'check', q: {
          prompt: 'In what order does BFS visit this tree?',
          tree: [40, 20, 60, 10, 30, 50, 70],
          options: ['40, 20, 60, 10, 30, 50, 70', '40, 20, 10, 30, 60, 50, 70', '10, 20, 30, 40, 50, 60, 70', '40, 60, 20, 70, 50, 30, 10'],
          answer: 0,
          explain: 'Level 0 is 40. Level 1, left to right, is 20 then 60. Level 2 is 10, 30, 50, 70.'
        } },
        { type: 'takeaways', items: [
          'BFS visits nodes level by level, left to right.',
          'A queue keeps discovered nodes waiting in the right order.',
          'Each step: dequeue a node, visit it, enqueue its left child, then its right child.'
        ] }
      ]
    }
  ];

  global.Content = { concepts: concepts, lessons: lessons };
  if (typeof module !== 'undefined' && module.exports) module.exports = global.Content;
})(typeof window !== 'undefined' ? window : globalThis);
