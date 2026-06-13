# Sudoku Solver & Backtracking Visualizer

A responsive Sudoku application built with HTML, CSS, and vanilla JavaScript. It can solve puzzles instantly or display the recursive backtracking process step by step, including candidate values, recursion depth, placements, and backtracks.

## Repository

[View the source code](https://github.com/Ujjwal-1267/Sudoku-Solver)

## Live Demo

After enabling GitHub Pages, the project will be available at:

[Open Sudoku Solver](https://Ujjwal-1267.github.io/Sudoku-Solver/)

## Features

### Solver and visualization

- Recursive backtracking solver
- Minimum Remaining Values optimization
- Instant solution mode
- Step-by-step backtracking visualization
- Live placement and backtrack highlighting
- Current cell, attempted value, candidates, and recursion depth
- Recent-step activity log
- Pause, resume, and stop controls
- Slow, medium, fast, and very-fast animation speeds
- Live progress bar
- Placement, backtrack, step, and execution-time statistics
- Unsolvable-puzzle detection
- Unique and multiple-solution detection

### Puzzle tools

- Easy, medium, hard, and expert preset puzzles
- Random selection from the chosen difficulty
- Manual puzzle entry
- Input validation and conflict highlighting
- Check-progress feature
- Hint system
- Undo and redo
- Reset puzzle
- Clear board
- Automatic completion detection
- Keyboard navigation
- Mobile number pad

### Interface and persistence

- Responsive desktop, tablet, and mobile layout
- Light and dark themes
- Saved theme preference
- Automatic progress saving with `localStorage`
- Saved progress restoration after refresh
- Row, column, box, and matching-number highlighting
- ARIA labels and live status announcements
- Visible keyboard focus states

## Technologies Used

- HTML5
- CSS3
- JavaScript
- DOM manipulation
- Recursion and backtracking
- Two-dimensional arrays
- Undo and redo stacks
- Browser `localStorage`

## Project Structure

```text
Sudoku-Solver/
├── index.html
├── style.css
├── script.js
└── README.md
```

## How the Solver Works

The solver uses recursive backtracking:

1. Find an empty cell.
2. Calculate the legal candidates for that cell.
3. Place one candidate.
4. Recursively continue with the next empty cell.
5. If the solver reaches a dead end, remove the previous value.
6. Try the next candidate.
7. Continue until the puzzle is solved or every possibility has failed.

The solver uses the **Minimum Remaining Values** approach: it chooses the empty cell with the fewest legal candidates. This reduces unnecessary recursive branches compared with always selecting the first empty cell.

## Using the Application

### Load a preset puzzle

1. Select Easy, Medium, Hard, or Expert.
2. Click **New puzzle**.
3. Enter values manually, request a hint, solve instantly, or start the visualization.

### Enter a custom puzzle

1. Click **Clear board**.
2. Enter the starting clues.
3. Click **Solve instantly**, **Visualize**, **Hint**, or **Check progress**.

The entered values are then treated as the original clues, allowing **Reset puzzle** to restore the custom puzzle.

### Watch the algorithm

1. Select a visualization speed.
2. Click **Visualize**.
3. Follow the active cell, candidates, attempted value, recursion depth, and recent-step log.
4. Use **Pause**, **Resume**, or **Stop** when needed.

## Keyboard Controls

- Arrow keys: move between cells
- `1-9`: enter a value
- Backspace, Delete, or `0`: erase a value
- `Ctrl + Z`: undo
- `Ctrl + Y` or `Ctrl + Shift + Z`: redo

## Run Locally

No installation or build step is required.

1. Clone the repository:

```bash
git clone https://github.com/Ujjwal-1267/Sudoku-Solver.git
```

2. Open the project folder:

```bash
cd Sudoku-Solver
```

3. Open `index.html` in a browser.

You can also use the **Live Server** extension in VS Code.

## Deploy with GitHub Pages

1. Push the latest files to GitHub.
2. Open the repository on GitHub.
3. Go to **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Choose the `main` branch and `/root` folder.
6. Save the settings.

## What I Learned

Through this project, I practised:

- Recursive problem solving
- Backtracking algorithms
- Candidate-based search optimization
- Two-dimensional array manipulation
- DOM state synchronization
- Step-by-step algorithm animation
- Undo and redo implementation
- Browser storage
- Responsive interface design
- Accessibility fundamentals
