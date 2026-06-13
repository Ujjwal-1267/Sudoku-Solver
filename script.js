/* ═══════════════════════════════════════════════════════
   Sudoku Solver — v2.1  (Bug Fix Release)
   Fixes:
     #1  Reset Puzzle now snapshots BEFORE solving, not after
     #2  Editing any cell after solve invalidates the snapshot
     #3  Clear All cancels animation even while it is running
     #4  Solve / Animate reject a completely empty board
     #5  Validate distinguishes an empty board from a valid one
     #6  Animated solve shows algorithm time, not animation time
     #7  Stats label renamed "Placements" (forward-placements only)
     #8  renderBoardFull resets every cell before writing values
     #9  aria-label added to every cell for screen readers
   ═══════════════════════════════════════════════════════ */

// ── DOM Refs ──────────────────────────────────────────
const boardEl     = document.getElementById('board');
const solveBtn    = document.getElementById('solveBtn');
const animateBtn  = document.getElementById('animateBtn');
const hintBtn     = document.getElementById('hintBtn');
const exampleBtn  = document.getElementById('exampleBtn');
const resetBtn    = document.getElementById('resetBtn');
const clearBtn    = document.getElementById('clearBtn');
const validateBtn = document.getElementById('validateBtn');
const messageEl   = document.getElementById('message');
const stepCountEl = document.getElementById('stepCount');
const execTimeEl  = document.getElementById('execTime');

// ── State ─────────────────────────────────────────────
let board          = Array.from({ length: 9 }, () => Array(9).fill(0));
// FIX #1 + #2: snapshot is taken at the moment Solve/Animate is pressed
// (before the algorithm runs), and is cleared whenever the user edits a cell
// after a solve so that old snapshots never outlive the current puzzle.
let puzzleSnapshot = null;   // captured just before solving
let snapshotStale  = false;  // true once the user edits after a solve
let isSolving      = false;  // lock during animation
let animHandle     = null;   // setTimeout handle — needed for FIX #3

// ── Example Puzzles ───────────────────────────────────
const EXAMPLES = [
  // Easy
  [
    [5,3,0, 0,7,0, 0,0,0],
    [6,0,0, 1,9,5, 0,0,0],
    [0,9,8, 0,0,0, 0,6,0],
    [8,0,0, 0,6,0, 0,0,3],
    [4,0,0, 8,0,3, 0,0,1],
    [7,0,0, 0,2,0, 0,0,6],
    [0,6,0, 0,0,0, 2,8,0],
    [0,0,0, 4,1,9, 0,0,5],
    [0,0,0, 0,8,0, 0,7,9],
  ],
  // Medium
  [
    [0,0,0, 2,6,0, 7,0,1],
    [6,8,0, 0,7,0, 0,9,0],
    [1,9,0, 0,0,4, 5,0,0],
    [8,2,0, 1,0,0, 0,4,0],
    [0,0,4, 6,0,2, 9,0,0],
    [0,5,0, 0,0,3, 0,2,8],
    [0,0,9, 3,0,0, 0,7,4],
    [0,4,0, 0,5,0, 0,3,6],
    [7,0,3, 0,1,8, 0,0,0],
  ],
];

let exampleIndex = 0;

// ── Build Grid DOM ────────────────────────────────────
function buildBoard() {
  boardEl.innerHTML = '';
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const input = document.createElement('input');
      input.type        = 'text';
      input.inputMode   = 'numeric';
      input.maxLength   = 1;
      // FIX #9: descriptive aria-label for screen readers
      input.setAttribute('aria-label', `Row ${r + 1}, Column ${c + 1}`);
      input.classList.add('cell');
      input.dataset.row = r;
      input.dataset.col = c;

      input.addEventListener('input',   onCellInput);
      input.addEventListener('keydown', onCellKeydown);
      input.addEventListener('focus',   onCellFocus);
      input.addEventListener('blur',    onCellBlur);

      boardEl.appendChild(input);
    }
  }
}

// ── Cell Input ────────────────────────────────────────
function onCellInput(e) {
  if (isSolving) return;
  const input = e.target;
  const val   = input.value;
  const r     = +input.dataset.row;
  const c     = +input.dataset.col;

  if (/^[1-9]$/.test(val)) {
    board[r][c] = +val;
    input.classList.remove('error', 'solved', 'hint', 'animating');
    input.classList.add('given');
  } else {
    input.value = '';
    board[r][c] = 0;
    input.classList.remove('given', 'error', 'solved', 'hint', 'animating');
  }

  // FIX #2: editing after a solve means the old snapshot is now wrong;
  // mark it stale so the next Solve press captures a fresh snapshot.
  snapshotStale = true;

  clearMessage();
  resetStats();
}

// ── Arrow Key Navigation ──────────────────────────────
function onCellKeydown(e) {
  if (isSolving) { e.preventDefault(); return; }
  const r = +e.target.dataset.row;
  const c = +e.target.dataset.col;
  let nr = r, nc = c;

  if      (e.key === 'ArrowUp')    nr = r - 1;
  else if (e.key === 'ArrowDown')  nr = r + 1;
  else if (e.key === 'ArrowLeft')  nc = c - 1;
  else if (e.key === 'ArrowRight') nc = c + 1;
  else if (e.key === 'Backspace' || e.key === 'Delete') {
    e.target.value = '';
    board[r][c] = 0;
    e.target.classList.remove('given', 'solved', 'hint', 'error', 'animating');
    // FIX #2: deletion also counts as editing
    snapshotStale = true;
    clearMessage();
    resetStats();
    return;
  } else { return; }

  nr = Math.max(0, Math.min(8, nr));
  nc = Math.max(0, Math.min(8, nc));
  e.preventDefault();
  getCell(nr, nc).focus();
}

// ── Focus / Blur → Highlight ──────────────────────────
function onCellFocus(e) {
  clearMessage();
  applyHighlights(+e.target.dataset.row, +e.target.dataset.col);
}

function onCellBlur() {
  clearHighlights();
}

function applyHighlights(row, col) {
  clearHighlights();
  const focusedVal = board[row][col];
  const boxR = Math.floor(row / 3) * 3;
  const boxC = Math.floor(col / 3) * 3;

  allCells().forEach(cell => {
    const r = +cell.dataset.row;
    const c = +cell.dataset.col;
    if (r === row && c === col) return;

    const sameBox   = r >= boxR && r < boxR+3 && c >= boxC && c < boxC+3;
    const sameRC    = r === row || c === col;
    const sameDigit = focusedVal !== 0 && board[r][c] === focusedVal;

    if      (sameDigit) cell.classList.add('hl-same-digit');
    else if (sameBox)   cell.classList.add('hl-box');
    else if (sameRC)    cell.classList.add('hl-rc');
  });
}

function clearHighlights() {
  allCells().forEach(cell =>
    cell.classList.remove('hl-rc', 'hl-box', 'hl-same-digit')
  );
}

// ── DOM / Board Helpers ───────────────────────────────
function getCell(r, c) {
  return boardEl.querySelector(`[data-row="${r}"][data-col="${c}"]`);
}

function allCells() {
  return boardEl.querySelectorAll('.cell');
}

function readBoardFromDOM() {
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++) {
      const val = getCell(r, c).value;
      board[r][c] = /^[1-9]$/.test(val) ? +val : 0;
    }
}

// FIX #8: reset every cell first, then write values — no leftover state.
function renderBoardFull(solvedSet) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const cell = getCell(r, c);
      const val  = board[r][c];

      // Always reset display state before applying new one
      cell.classList.remove('solved', 'animating', 'error', 'hint');

      if (val !== 0) {
        cell.value = val;
        if (solvedSet && solvedSet.has(`${r},${c}`)) {
          cell.classList.remove('given');
          cell.classList.add('solved');
        }
        // cells not in solvedSet keep their existing 'given' class
      } else {
        // explicitly clear any cells that became empty (shouldn't happen
        // in normal flow, but makes the function safe to call anytime)
        cell.value = '';
        cell.classList.remove('given');
      }
    }
  }
}

// ── Validation ────────────────────────────────────────
function isValidPlacement(grid, row, col, num) {
  for (let c = 0; c < 9; c++) if (grid[row][c] === num) return false;
  for (let r = 0; r < 9; r++) if (grid[r][col] === num) return false;
  const br = Math.floor(row/3)*3, bc = Math.floor(col/3)*3;
  for (let r = br; r < br+3; r++)
    for (let c = bc; c < bc+3; c++)
      if (grid[r][c] === num) return false;
  return true;
}

function getBoardErrors() {
  const errors = new Set();
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++) {
      const num = board[r][c];
      if (num === 0) continue;
      board[r][c] = 0;
      if (!isValidPlacement(board, r, c, num)) errors.add(`${r},${c}`);
      board[r][c] = num;
    }
  return errors;
}

function highlightErrors(errorSet) {
  allCells().forEach(cell => {
    const key = `${cell.dataset.row},${cell.dataset.col}`;
    errorSet.has(key) ? cell.classList.add('error') : cell.classList.remove('error');
  });
}

// FIX #4: returns true if the board has no filled cells at all
function isBoardEmpty() {
  return board.every(row => row.every(v => v === 0));
}

// ── Backtracking Solver ───────────────────────────────
function solveWithSteps(grid) {
  const steps = [];
  function bt() {
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++)
        if (grid[r][c] === 0) {
          for (let num = 1; num <= 9; num++) {
            if (isValidPlacement(grid, r, c, num)) {
              grid[r][c] = num;
              steps.push({ r, c, val: num, backtrack: false });
              if (bt()) return true;
              steps.push({ r, c, val: 0, backtrack: true });
              grid[r][c] = 0;
            }
          }
          return false;
        }
    return true;
  }
  const solved = bt();
  return { solved, steps };
}

// ── Snapshot helper ───────────────────────────────────
// FIX #1: always capture snapshot immediately before solving,
// using the current board state (not after the algorithm mutates it).
function captureSnapshot() {
  puzzleSnapshot = deepCopy(board);
  snapshotStale  = false;
}

// ── Solve (instant) ───────────────────────────────────
solveBtn.addEventListener('click', () => {
  if (isSolving) return;
  readBoardFromDOM();

  // FIX #4: reject empty board
  if (isBoardEmpty()) {
    showMessage('Enter some numbers first.', 'info');
    return;
  }

  const errors = getBoardErrors();
  if (errors.size > 0) {
    highlightErrors(errors);
    showMessage('Fix the highlighted conflicts first.', 'error');
    return;
  }

  // FIX #1 + #2: take snapshot now, before mutating board
  if (!puzzleSnapshot || snapshotStale) captureSnapshot();

  const emptyCells = emptySet();
  const gridCopy   = deepCopy(board);

  // FIX #6: measure only algorithm time, not UI time
  const t0 = performance.now();
  const { solved, steps } = solveWithSteps(gridCopy);
  const algoMs = (performance.now() - t0).toFixed(2);

  if (solved) {
    board = gridCopy;
    renderBoardFull(emptyCells);
    // FIX #7: label is "Placements" in HTML; count only forward placements
    updateStats(steps.filter(s => !s.backtrack).length, algoMs + ' ms');
    showMessage('Solved!', 'success');
  } else {
    showMessage('No solution exists for this puzzle.', 'error');
  }
});

// ── Solve (animated) ─────────────────────────────────
animateBtn.addEventListener('click', () => {
  if (isSolving) return;
  readBoardFromDOM();

  // FIX #4: reject empty board
  if (isBoardEmpty()) {
    showMessage('Enter some numbers first.', 'info');
    return;
  }

  const errors = getBoardErrors();
  if (errors.size > 0) {
    highlightErrors(errors);
    showMessage('Fix the highlighted conflicts first.', 'error');
    return;
  }

  // FIX #1 + #2: snapshot before solving
  if (!puzzleSnapshot || snapshotStale) captureSnapshot();

  const emptyCells = emptySet();
  const gridCopy   = deepCopy(board);

  // FIX #6: run algorithm synchronously first to measure pure algorithm time;
  // the animation is just replaying the recorded steps — it is UI, not compute.
  const t0 = performance.now();
  const { solved, steps } = solveWithSteps(gridCopy);
  const algoMs = (performance.now() - t0).toFixed(2);

  if (!solved) {
    showMessage('No solution exists for this puzzle.', 'error');
    return;
  }

  isSolving = true;
  // FIX #3: keep Clear enabled during animation by NOT disabling it
  setButtonsDisabled(true);
  clearBtn.disabled = false;   // always interruptible

  showMessage('Solving…', 'info');
  // FIX #6: show real algorithm time immediately, before animation starts
  // FIX #7: show placement count immediately too
  updateStats(steps.filter(s => !s.backtrack).length, algoMs + ' ms');

  let placementsDone = 0;
  const DELAY = 18;

  function playStep(i) {
    if (i >= steps.length) {
      board = gridCopy;
      emptyCells.forEach(key => {
        const [r, c] = key.split(',').map(Number);
        const cell = getCell(r, c);
        cell.classList.remove('animating');
        cell.classList.add('solved');
      });
      showMessage('Solved!', 'success');
      isSolving = false;
      setButtonsDisabled(false);
      return;
    }

    const { r, c, val, backtrack } = steps[i];
    const cell = getCell(r, c);

    if (emptyCells.has(`${r},${c}`)) {
      if (backtrack) {
        cell.value = '';
        cell.classList.remove('animating');
      } else {
        cell.value = val;
        cell.classList.add('animating');
        placementsDone++;
        stepCountEl.textContent = placementsDone;
      }
    }

    animHandle = setTimeout(() => playStep(i + 1), DELAY);
  }

  playStep(0);
});

// ── Hint ──────────────────────────────────────────────
hintBtn.addEventListener('click', () => {
  if (isSolving) return;
  readBoardFromDOM();

  if (isBoardEmpty()) {
    showMessage('Enter some numbers first.', 'info');
    return;
  }

  const errors = getBoardErrors();
  if (errors.size > 0) {
    highlightErrors(errors);
    showMessage('Fix conflicts before asking for a hint.', 'error');
    return;
  }

  const gridCopy = deepCopy(board);
  const { solved } = solveWithSteps(gridCopy);

  if (!solved) {
    showMessage("No solution — can't hint on an unsolvable puzzle.", 'error');
    return;
  }

  const empties = [];
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++)
      if (board[r][c] === 0) empties.push([r, c]);

  if (empties.length === 0) {
    showMessage('Board is already complete!', 'success');
    return;
  }

  const [r, c] = empties[Math.floor(Math.random() * empties.length)];
  board[r][c] = gridCopy[r][c];

  const cell = getCell(r, c);
  cell.value = gridCopy[r][c];
  cell.classList.remove('error', 'solved', 'animating');
  cell.classList.add('hint');

  showMessage(`Hint: row ${r+1}, col ${c+1} = ${gridCopy[r][c]}`, 'hint');
});

// ── Load Example ──────────────────────────────────────
exampleBtn.addEventListener('click', () => {
  if (isSolving) return;
  const puzzle = EXAMPLES[exampleIndex % EXAMPLES.length];
  exampleIndex++;

  board          = deepCopy(puzzle);
  puzzleSnapshot = deepCopy(puzzle);
  snapshotStale  = false;
  paintBoardFromState(['given']);
  clearMessage();
  resetStats();
});

// ── Reset Puzzle ──────────────────────────────────────
// FIX #1: snapshot is always taken before solving now, so this is
// always accurate — no longer needs a fallback that saves solved state.
resetBtn.addEventListener('click', () => {
  if (isSolving) return;
  if (!puzzleSnapshot) {
    showMessage('Nothing to reset — solve a puzzle first.', 'info');
    return;
  }
  board         = deepCopy(puzzleSnapshot);
  snapshotStale = false;
  paintBoardFromState(['given']);
  clearMessage();
  resetStats();
});

// ── Clear All ─────────────────────────────────────────
// FIX #3: cancel animation unconditionally — no guard on isSolving.
clearBtn.addEventListener('click', () => {
  // Stop any running animation immediately
  if (animHandle !== null) {
    clearTimeout(animHandle);
    animHandle = null;
  }
  isSolving = false;
  setButtonsDisabled(false);

  board          = Array.from({ length: 9 }, () => Array(9).fill(0));
  puzzleSnapshot = null;
  snapshotStale  = false;

  allCells().forEach(cell => {
    cell.value = '';
    cell.classList.remove('given','solved','hint','error','animating',
                          'hl-rc','hl-box','hl-same-digit');
  });

  clearMessage();
  resetStats();
});

// ── Validate ──────────────────────────────────────────
// FIX #5: explicitly detect and report an empty board.
validateBtn.addEventListener('click', () => {
  if (isSolving) return;
  readBoardFromDOM();

  if (isBoardEmpty()) {
    showMessage('Board is empty — enter some numbers first.', 'info');
    return;
  }

  const errors = getBoardErrors();
  allCells().forEach(c => c.classList.remove('error'));

  if (errors.size === 0) {
    showMessage('No conflicts found — looks good!', 'success');
  } else {
    highlightErrors(errors);
    showMessage(`${errors.size} conflict${errors.size > 1 ? 's' : ''} found.`, 'error');
  }
});

// ── Utility ───────────────────────────────────────────
function deepCopy(grid) {
  return grid.map(row => [...row]);
}

function emptySet() {
  const s = new Set();
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++)
      if (board[r][c] === 0) s.add(`${r},${c}`);
  return s;
}

/** Repaint the entire board DOM from `board`.
 *  classNames: CSS classes applied to every non-zero cell. */
function paintBoardFromState(classNames) {
  allCells().forEach(cell => {
    const r = +cell.dataset.row, c = +cell.dataset.col;
    cell.classList.remove('given','solved','hint','error','animating',
                          'hl-rc','hl-box','hl-same-digit');
    if (board[r][c] !== 0) {
      cell.value = board[r][c];
      classNames.forEach(cn => cell.classList.add(cn));
    } else {
      cell.value = '';
    }
  });
}

function updateStats(placements, time) {
  stepCountEl.textContent = placements;
  execTimeEl.textContent  = time;
}

function resetStats() {
  stepCountEl.textContent = '—';
  execTimeEl.textContent  = '—';
}

function setButtonsDisabled(disabled) {
  [solveBtn, animateBtn, hintBtn, exampleBtn,
   resetBtn, validateBtn].forEach(btn => {
    btn.disabled = disabled;
  });
  // clearBtn is intentionally excluded — it stays enabled always
}

function showMessage(text, type = 'info') {
  messageEl.textContent = text;
  messageEl.className   = `message ${type}`;
}

function clearMessage() {
  messageEl.className = 'message hidden';
}

// ── Init ──────────────────────────────────────────────
buildBoard();