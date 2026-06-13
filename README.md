# Sudoku Solver & Backtracking Visualizer

A responsive, feature-rich Sudoku application built with **HTML, CSS, and vanilla JavaScript**. It can solve Sudoku puzzles instantly, visualize recursive backtracking step by step, validate boards, reveal hints, detect multiple solutions, and save progress locally.

## Live Demo

Add your GitHub Pages link here:

```text
https://YOUR-USERNAME.github.io/Sudoku-Solver/
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

### Persistence and sharing

- Automatic progress saving with `localStorage`
- Saved progress restoration after refresh
- Import an 81-character puzzle string
- Export the current puzzle as a string
- Share puzzles through a URL query parameter
- Dark and light themes with saved preference

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
- Clipboard API
- URL Search Parameters

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

## Puzzle String Format

The import field accepts exactly 81 characters.

- Use digits `1-9` for filled cells.
- Use `0` or `.` for empty cells.

Example:

```text
530070000600195000098000060800060003400803001700020006060000280000419005000080079
```

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
git clone https://github.com/YOUR-USERNAME/Sudoku-Solver.git
```

2. Open the project folder.
3. Open `index.html` in a browser.

For a local development server in VS Code, you can also use the Live Server extension.

## Deploy with GitHub Pages

1. Push the project to GitHub.
2. Open the repository.
3. Go to **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the `main` branch and `/root`.
6. Save.

Your site will be available at:

```text
https://YOUR-USERNAME.github.io/Sudoku-Solver/
```

## Future Improvements

- Generate completely new Sudoku boards dynamically
- Pencil-mark candidate mode
- Daily puzzle system
- Player timer and scoring
- Additional solving strategies such as naked singles and hidden singles

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
