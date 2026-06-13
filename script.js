/* ═══════════════════════════════════════════════
   Sudoku Solver — v1.0  (Base Features)
   Features: render board, input validation,
             backtracking solver, clear, validate
   ═══════════════════════════════════════════════ */

// ── DOM refs ──────────────────────────────────────
const boardEl   = document.getElementById('board');
const solveBtn  = document.getElementById('solveBtn');
const clearBtn  = document.getElementById('clearBtn');
const validateBtn = document.getElementById('validateBtn');
const messageEl = document.getElementById('message');

// ── State ─────────────────────────────────────────
// 9×9 grid; 0 = empty
let board = Array.from({ length: 9 }, () => Array(9).fill(0));

// ── Build the grid DOM ────────────────────────────
function buildBoard() {
  boardEl.innerHTML = '';
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const input = document.createElement('input');
      input.type = 'text';
      input.inputMode = 'numeric';
      input.maxLength = 1;
      input.classList.add('cell');
      input.dataset.row = r;
      input.dataset.col = c;

      input.addEventListener('input',   onCellInput);
      input.addEventListener('keydown', onCellKeydown);
      input.addEventListener('focus',   onCellFocus);

      boardEl.appendChild(input);
    }
  }
}

// ── Cell input handler ────────────────────────────
function onCellInput(e) {
  const input = e.target;
  const val   = input.value;
  const r     = +input.dataset.row;
  const c     = +input.dataset.col;

  // allow only 1-9
  if (/^[1-9]$/.test(val)) {
    board[r][c] = +val;
    input.classList.remove('error', 'solved');
    input.classList.add('given');
  } else {
    input.value = '';
    board[r][c] = 0;
    input.classList.remove('given', 'error', 'solved');
  }

  clearMessage();
}

// ── Arrow-key navigation ──────────────────────────
function onCellKeydown(e) {
  const r = +e.target.dataset.row;
  const c = +e.target.dataset.col;
  let nr = r, nc = c;

  if      (e.key === 'ArrowUp')    { nr = r - 1; }
  else if (e.key === 'ArrowDown')  { nr = r + 1; }
  else if (e.key === 'ArrowLeft')  { nc = c - 1; }
  else if (e.key === 'ArrowRight') { nc = c + 1; }
  else if (e.key === 'Backspace' || e.key === 'Delete') {
    e.target.value = '';
    board[r][c] = 0;
    e.target.classList.remove('given', 'solved', 'error');
    clearMessage();
    return;
  } else { return; }

  // clamp
  nr = Math.max(0, Math.min(8, nr));
  nc = Math.max(0, Math.min(8, nc));
  e.preventDefault();
  getCell(nr, nc).focus();
}

function onCellFocus() {
  clearMessage();
}

// ── Helpers ───────────────────────────────────────
function getCell(r, c) {
  return boardEl.querySelector(`[data-row="${r}"][data-col="${c}"]`);
}

function readBoardFromDOM() {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const val = getCell(r, c).value;
      board[r][c] = /^[1-9]$/.test(val) ? +val : 0;
    }
  }
}

function renderBoard(solvedCells) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const cell = getCell(r, c);
      if (board[r][c] !== 0) {
        cell.value = board[r][c];
        if (solvedCells && solvedCells.has(`${r},${c}`)) {
          cell.classList.remove('given');
          cell.classList.add('solved');
        }
      }
    }
  }
}

// ── Validation ────────────────────────────────────
function isValidPlacement(grid, row, col, num) {
  // row check
  for (let c = 0; c < 9; c++) {
    if (grid[row][c] === num) return false;
  }
  // column check
  for (let r = 0; r < 9; r++) {
    if (grid[r][col] === num) return false;
  }
  // 3×3 box check
  const br = Math.floor(row / 3) * 3;
  const bc = Math.floor(col / 3) * 3;
  for (let r = br; r < br + 3; r++) {
    for (let c = bc; c < bc + 3; c++) {
      if (grid[r][c] === num) return false;
    }
  }
  return true;
}

function getBoardErrors() {
  const errors = new Set();
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const num = board[r][c];
      if (num === 0) continue;

      // temporarily clear the cell, then check
      board[r][c] = 0;
      if (!isValidPlacement(board, r, c, num)) {
        errors.add(`${r},${c}`);
      }
      board[r][c] = num;
    }
  }
  return errors;
}

// ── Backtracking Solver ───────────────────────────
function solve(grid) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0) {
        for (let num = 1; num <= 9; num++) {
          if (isValidPlacement(grid, r, c, num)) {
            grid[r][c] = num;
            if (solve(grid)) return true;
            grid[r][c] = 0;
          }
        }
        return false; // no valid number found → backtrack
      }
    }
  }
  return true; // no empty cell → solved!
}

// ── Button handlers ───────────────────────────────
solveBtn.addEventListener('click', () => {
  readBoardFromDOM();

  // check for pre-existing errors
  const errors = getBoardErrors();
  if (errors.size > 0) {
    highlightErrors(errors);
    showMessage('Fix the highlighted conflicts first.', 'error');
    return;
  }

  // track which cells were empty before solving
  const emptyCells = new Set();
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++)
      if (board[r][c] === 0) emptyCells.add(`${r},${c}`);

  // deep copy for solver
  const gridCopy = board.map(row => [...row]);
  const solved   = solve(gridCopy);

  if (solved) {
    board = gridCopy;
    renderBoard(emptyCells);
    showMessage('Solved!', 'success');
  } else {
    showMessage('No solution exists for this puzzle.', 'error');
  }
});

clearBtn.addEventListener('click', () => {
  board = Array.from({ length: 9 }, () => Array(9).fill(0));
  boardEl.querySelectorAll('.cell').forEach(cell => {
    cell.value = '';
    cell.classList.remove('given', 'solved', 'error');
  });
  clearMessage();
});

validateBtn.addEventListener('click', () => {
  readBoardFromDOM();
  const errors = getBoardErrors();

  // reset all error highlights first
  boardEl.querySelectorAll('.cell').forEach(c => c.classList.remove('error'));

  if (errors.size === 0) {
    showMessage('No conflicts found — looks good!', 'success');
  } else {
    highlightErrors(errors);
    showMessage(`${errors.size} conflict${errors.size > 1 ? 's' : ''} found.`, 'error');
  }
});

// ── UI helpers ────────────────────────────────────
function highlightErrors(errorSet) {
  boardEl.querySelectorAll('.cell').forEach(cell => {
    const key = `${cell.dataset.row},${cell.dataset.col}`;
    if (errorSet.has(key)) {
      cell.classList.add('error');
    } else {
      cell.classList.remove('error');
    }
  });
}

function showMessage(text, type = 'info') {
  messageEl.textContent = text;
  messageEl.className   = `message ${type}`;
}

function clearMessage() {
  messageEl.className = 'message hidden';
}

// ── Init ──────────────────────────────────────────
buildBoard();