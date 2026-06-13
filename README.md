# Sudoku Solver & Backtracking Visualizer

A responsive Sudoku application built with **HTML, CSS, and vanilla JavaScript**. It solves puzzles instantly or visualizes recursive backtracking with the active cell, candidate values, recursion depth, and a live step log.

## Live Demo

https://github.com/Ujjwal-1267/Sudoku-Solver
```

## Preview

Add a screenshot at `assets/preview.png`, then uncomment:

```md
![Sudoku Solver Preview](./assets/preview.png)
```

## Features

### Solver and visualization

- Recursive backtracking solver
- Minimum-candidate-cell optimization
- Instant solution mode
- Step-by-step backtracking visualization
- Placement and removal animation
- Pause, resume, and stop controls
- Four animation speed settings
- Live progress bar
- Algorithm execution statistics
- No-solution detection
- Unique versus multiple-solution detection

### Puzzle tools

- Easy, medium, hard, and expert presets
- Random puzzle selection by difficulty
- Manual puzzle entry
- Input validation
- Conflict highlighting
- Check-current-progress feature
- Hint system
- Reset puzzle
- Clear board
- Automatic completion detection
- Undo and redo
- Keyboard navigation
- Mobile number pad

### Persistence

- Automatic progress saving with `localStorage`
- Saved progress restoration after refresh
- Dark and light themes with saved preference

### Backtracking panel

- Current row and column
- Value being attempted
- Valid candidate values
- Current recursion depth
- Live placement and backtrack log
- Placement/backtrack color legend

### Accessibility and interface

- Responsive desktop, tablet, and mobile layout
- ARIA labels for Sudoku cells
- Live status announcements
- Visible keyboard focus states
- Highlight selected row, column, box, and matching digits

## Technologies Used

- HTML5
- CSS3
- JavaScript
- DOM manipulation
- Recursion
- Backtracking
- Local Storage

## Project Structure

```text
Sudoku-Solver/
├── index.html
├── style.css
├── script.js
├── README.md
└── assets/
    └── preview.png
```

## How the Solver Works

The solver uses recursive backtracking:

1. Find an empty cell.
2. Calculate all legal candidates for that cell.
3. Place one candidate.
4. Recursively continue solving.
5. If the board reaches a dead end, remove the last candidate.
6. Try the next candidate.
7. Continue until the board is solved or every possibility fails.

This project improves basic backtracking by choosing the empty cell with the fewest valid candidates. This reduces unnecessary recursive branches.

## Keyboard Controls

- Arrow keys: move between cells
- `1-9`: enter a value
- Backspace, Delete, or `0`: erase a value
- `Ctrl + Z`: undo
- `Ctrl + Y` or `Ctrl + Shift + Z`: redo

## Run Locally

No installation is required.

1. Clone the repository:

```bash
git clone https://github.com/Ujjwal-1267/Sudoku-Solver
```

2. Open the project folder.
3. Open `index.html` in a browser.

For a local development server in VS Code, you can also use the Live Server extension.

This site will be available at:
https://github.com/Ujjwal-1267/Sudoku-Solver


## What I Learned

Through this project, I practised:

- Recursive problem solving
- Backtracking algorithms
- Two-dimensional array manipulation
- DOM state synchronization
- Animation control
- Undo and redo stacks
- Browser storage
- Responsive UI design
- Accessibility fundamentals

## License

This project is available under the MIT License.
