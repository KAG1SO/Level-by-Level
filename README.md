# Level by Level

A pre-lecture tutor for **COS212 Data Structures and Algorithms** at the University of Pretoria.
Students who know nothing about trees work through five short lessons on **binary search trees (BSTs)** and **breadth-first search (BFS)**, then take an adaptive readiness quiz that tells them what to review before the lecture.

Built as the COS750 Educational Software Development prototype.

## What's in it

| Part | What the student does |
|---|---|
| 1. What is a tree? | Learns root, parent, child, leaf, depth, height. Clicks nodes in a tree explorer. |
| 2. Binary search trees | Learns the BST rule. Judges four trees in "Valid or not?" (includes the whole-subtree trap). |
| 3. Search and insert | Reads the algorithm and pseudocode, then searches and inserts in an animated BST playground. |
| 4. Queues | Learns FIFO with an enqueue/dequeue playground. |
| 5. Breadth-first search | Steps through BFS with the queue, visit order and pseudocode line highlighted at each step. |
| Now you try | Clicks nodes in BFS order, with queue-front feedback and a fresh tree button. |
| Readiness quiz | 12 questions, 2 per learning objective, with adaptive scaffolding and a review plan. |
| Optional final challenge | Inserts eight values by choosing dashed BST positions, then traces BFS and writes an ungraded reflection. |

Every lesson also has a "Check yourself" question with instant feedback, key points, and a **Listen** button that reads the lesson aloud (browser text-to-speech).

### Learning objectives

After using the app, a student should be able to:

1. Describe a tree using the terms root, parent, child, leaf, depth and height.
2. Explain the BST ordering rule and decide whether a tree follows it.
3. Trace a search for a value in a BST, listing the nodes compared.
4. Insert values into a BST by hand and say where each new node ends up.
5. Explain how a queue works and predict its contents after enqueue and dequeue.
6. Trace BFS on a binary tree using a queue and give the visit order.

Each objective is a `concept` in `js/content.js`. Every quiz question is tagged with one concept, so quiz results map straight back to the objectives and to the lesson that teaches them.

### How the assessment scaffolds

- **Wrong on the first try:** the student gets a targeted hint and a second attempt (worth half a point).
- **Wrong again:** the app shows the right answer, explains it, and links to the lesson that covers it.
- **Results:** each objective is marked *Ready* (75%+), *Nearly there* (50%+) or *Review this*. Weak objectives get a review plan with a specific tip and a link to the lesson.
- **Practise my weak spots:** a new quiz drawn only from weak objectives, preferring questions the student has not seen yet.
- **Pre-test vs latest quiz:** the first full quiz is saved as a pre-test and compared with the latest full quiz for each objective.
- **Quick readiness check:** quiz results are based on two questions per objective and are a guide for review, not a definitive measure of mastery.
- Students who already know some of the work can take the pre-test first and skip straight to what they need.
- Lesson checks give a targeted hint after the first wrong answer and reveal the correct answer after a second wrong answer.
- Badges appear on the home and results pages for finishing all lessons, readiness across all objectives, and completing the final challenge.

## Run it

No build step and no dependencies. Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Progress (completed lessons, quiz results) is saved in the browser's localStorage. Nothing leaves the student's machine.

## Deploy on GitHub Pages

1. Push this folder to a GitHub repository.
2. Go to **Settings → Pages**, choose **Deploy from a branch**, pick `main` and `/ (root)`.
3. The app goes live at `https://<username>.github.io/<repo>/`.

## Tests

The tree logic and the question bank are tested with plain Node (no packages needed):

```bash
node tests/tree.test.js
```

The tests check BST insert/search, valid insertion spots, BFS steps and challenge order, the BST-rule checker, and quiz/lesson questions (valid concepts, hints, no duplicate options, answers that match the tree drawn).

## Project structure

```
index.html          App shell: header, main view, footer
css/styles.css      Design tokens (dark and light themes), layout, components
js/tree.js          BST logic, BFS step generation, SVG tree rendering (pure functions)
js/content.js       Learning objectives and lesson content
js/questions.js     Quiz question bank, tagged by objective
js/widgets.js       Interactive lesson widgets
js/app.js           Routing, progress, adaptive quiz, results
tests/tree.test.js  Logic and content tests
```

Content is separate from code: to change a lesson or add questions, edit `content.js` or `questions.js` only.

## Accessibility

- Light theme by default with a dark theme toggle.
- Keyboard support throughout, including selecting tree nodes with Enter.
- Animations respect the "reduce motion" setting.
- Trees have text descriptions for screen readers. Feedback regions are announced with `aria-live`.
- Works at phone width.

## Acknowledgement

Parts of this prototype were built with the help of generative AI (Claude, by Anthropic). The prompts and the tool used are listed in the ID document, as the COS750 specification requires.
