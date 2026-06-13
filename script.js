/* ═══════════════════════════════════════════════════════
   Sudoku Solver — v2.0
   Features:
     ✔ Backtracking solver
     ✔ Solve animation (step-by-step)
     ✔ Execution time + step counter
     ✔ Highlight row, column, box, same digit on focus
     ✔ Hint button (reveals one correct cell)
     ✔ Load Example puzzle
     ✔ Reset Puzzle (back to original input)
     ✔ Clear All
     ✔ Validate
     ✔ Arrow-key navigation
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
let board        = Array.from({ length: 9 }, () => Array(9).fill(0));
let puzzleSnapshot = null;   // saved on "Load Example" / user entry → for Reset
let isSolving    = false;    // lock during animation
let animHandle   = null;     // setTimeout handle for cancel

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
      input.type      = 'text';
      input.inputMode = 'numeric';
      input.maxLength = 1;
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
    if (r === row && c === col) return; // skip self

    const sameBox = r >= boxR && r < boxR+3 && c >= boxC && c < boxC+3;
    const sameRC  = r === row || c === col;
    const sameDigit = focusedVal !== 0 && board[r][c] === focusedVal;

    if (sameDigit)    cell.classList.add('hl-same-digit');
    else if (sameBox) cell.classList.add('hl-box');
    else if (sameRC)  cell.classList.add('hl-rc');
  });
}

function clearHighlights() {
  allCells().forEach(cell =>
    cell.classList.remove('hl-rc', 'hl-box', 'hl-same-digit')
  );
}

// ── Helpers ───────────────────────────────────────────
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

function renderBoardFull(solvedSet) {
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++) {
      const cell = getCell(r, c);
      if (board[r][c] !== 0) {
        cell.value = board[r][c];
        if (solvedSet && solvedSet.has(`${r},${c}`)) {
          cell.classList.remove('given', 'animating');
          cell.classList.add('solved');
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

// ── Backtracking Solver (returns steps log) ───────────
function solveWithSteps(grid) {
  const steps = []; // {r, c, val, backtrack}
  function bt() {
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++)
        if (grid[r][c] === 0) {
          for (let num = 1; num <= 9; num++) {
            if (isValidPlacement(grid, r, c, num)) {
              grid[r][c] = num;
              steps.push({ r, c, val: num, backtrack: false });
              if (bt()) return true;
              steps.push({ r, c, val: 0,   backtrack: true  });
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

// ── Solve (instant) ───────────────────────────────────
solveBtn.addEventListener('click', () => {
  if (isSolving) return;
  readBoardFromDOM();

  const errors = getBoardErrors();
  if (errors.size > 0) {
    highlightErrors(errors);
    showMessage('Fix the highlighted conflicts first.', 'error');
    return;
  }

  const emptyCells = emptySet();
  const gridCopy   = deepCopy(board);

  const t0 = performance.now();
  const { solved, steps } = solveWithSteps(gridCopy);
  const elapsed = (performance.now() - t0).toFixed(2);

  if (solved) {
    board = gridCopy;
    renderBoardFull(emptyCells);
    updateStats(steps.filter(s => !s.backtrack).length, elapsed + ' ms');
    showMessage('Solved!', 'success');
  } else {
    showMessage('No solution exists for this puzzle.', 'error');
  }
});

// ── Solve (animated) ─────────────────────────────────
animateBtn.addEventListener('click', () => {
  if (isSolving) return;
  readBoardFromDOM();

  const errors = getBoardErrors();
  if (errors.size > 0) {
    highlightErrors(errors);
    showMessage('Fix the highlighted conflicts first.', 'error');
    return;
  }

  const emptyCells = emptySet();
  const gridCopy   = deepCopy(board);
  const t0         = performance.now();
  const { solved, steps } = solveWithSteps(gridCopy);

  if (!solved) {
    showMessage('No solution exists for this puzzle.', 'error');
    return;
  }

  isSolving = true;
  setButtonsDisabled(true);
  showMessage('Solving…', 'info');
  updateStats('…', '…');

  let stepsDone = 0;
  const DELAY = 18; // ms per step (lower = faster)

  function playStep(i) {
    if (i >= steps.length) {
      // animation done
      board = gridCopy;
      // clean up animating class → mark as solved
      emptyCells.forEach(key => {
        const [r, c] = key.split(',').map(Number);
        const cell = getCell(r, c);
        cell.classList.remove('animating');
        cell.classList.add('solved');
      });
      const elapsed = (performance.now() - t0).toFixed(2);
      updateStats(steps.filter(s => !s.backtrack).length, elapsed + ' ms');
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
        stepsDone++;
        stepCountEl.textContent = stepsDone;
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

  const errors = getBoardErrors();
  if (errors.size > 0) {
    highlightErrors(errors);
    showMessage('Fix conflicts before asking for a hint.', 'error');
    return;
  }

  const gridCopy = deepCopy(board);
  const { solved } = solveWithSteps(gridCopy);

  if (!solved) {
    showMessage('No solution — can\'t hint on unsolvable puzzle.', 'error');
    return;
  }

  // find all empty cells
  const empties = [];
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++)
      if (board[r][c] === 0) empties.push([r, c]);

  if (empties.length === 0) {
    showMessage('Board is already complete!', 'success');
    return;
  }

  // pick a random empty cell
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

  board = deepCopy(puzzle);
  puzzleSnapshot = deepCopy(puzzle);
  paintBoardFromState(['given']);
  clearMessage();
  resetStats();
});

// ── Reset Puzzle (back to initial state) ──────────────
resetBtn.addEventListener('click', () => {
  if (isSolving) return;
  if (!puzzleSnapshot) {
    // if no snapshot, reset to current user-entered givens
    readBoardFromDOM();
    puzzleSnapshot = deepCopy(board);
  }
  board = deepCopy(puzzleSnapshot);
  paintBoardFromState(['given']);
  clearMessage();
  resetStats();
});

// ── Clear All ─────────────────────────────────────────
clearBtn.addEventListener('click', () => {
  if (isSolving) return;
  if (animHandle) clearTimeout(animHandle);
  isSolving = false;
  setButtonsDisabled(false);
  board = Array.from({ length: 9 }, () => Array(9).fill(0));
  puzzleSnapshot = null;
  allCells().forEach(cell => {
    cell.value = '';
    cell.classList.remove('given','solved','hint','error','animating');
  });
  clearMessage();
  resetStats();
});

// ── Validate ──────────────────────────────────────────
validateBtn.addEventListener('click', () => {
  if (isSolving) return;
  readBoardFromDOM();
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

/** Paint the whole board DOM from the current `board` state.
 *  classNames = array of classes to assign to non-zero cells */
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

function updateStats(steps, time) {
  stepCountEl.textContent = steps;
  execTimeEl.textContent  = time;
}

function resetStats() {
  stepCountEl.textContent = '—';
  execTimeEl.textContent  = '—';
}

function setButtonsDisabled(disabled) {
  [solveBtn, animateBtn, hintBtn, exampleBtn,
   resetBtn, clearBtn, validateBtn].forEach(btn => {
    btn.disabled = disabled;
  });
  if (!disabled) {
    clearBtn.disabled = false; // always keep clear available
  }
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