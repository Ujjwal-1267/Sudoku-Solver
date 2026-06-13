# Sudoku Solver

A clean, fast Sudoku solver built with vanilla HTML, CSS, and JavaScript.

## Features (v2.0)
- **Solve** — instant backtracking solver
- **Animate** — step-by-step solve animation (watch it think!)
- **Hint** — reveals one correct cell at random
- **Load Example** — cycles through built-in puzzles
- **Reset Puzzle** — restores the board to your original input
- **Clear All** — wipes the board completely
- **Validate** — highlights conflicting cells in red
- **Step Counter** — shows how many steps the solver took
- **Execution Time** — shows solve time in milliseconds
- **Row/Column/Box Highlight** — clicking a cell highlights its peers
- **Same Digit Highlight** — highlights matching digits across the board
- **Arrow-key navigation** — move between cells with keyboard

## Planned Features (upcoming commits)
- Dark / Light mode toggle
- Difficulty selection
- Random puzzle generator
- Multiple solutions checker

## How to Run
Open `index.html` in any browser — no build step, no dependencies.

## Algorithm
Uses **backtracking**: finds the first empty cell, tries digits 1–9, checks row/column/box validity, recurses. If stuck, backtracks and tries the next digit.

## Project Structure
```
sudoku-solver/
├── index.html   — grid structure, stats bar, buttons
├── style.css    — dark theme, highlights, animations
├── script.js    — solver, animator, hint, highlight logic
└── README.md
```