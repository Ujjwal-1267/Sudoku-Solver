(() => {
  "use strict";

  const SIZE = 9;
  const BOX = 3;
  const STORAGE_KEY = "sudoku-final-state-v1";
  const THEME_KEY = "sudoku-theme";

  const PUZZLES = {
    easy: [
      "530070000600195000098000060800060003400803001700020006060000280000419005000080079",
      "000260701680070090190004500820100040004602900050003028009300074040050036703018000"
    ],
    medium: [
      "000000907000420180000705026100904000050000040000507009920108000034059000507000000",
      "030000080009000500007509200700105008020090030900402001004207100002000800070000090"
    ],
    hard: [
      "000000000000003085001020000000507000004000100090000000500000073002010000000040009",
      "005300000800000020070010500400005300010070006003200080060500009004000030000009700"
    ],
    expert: [
      "000000010400000000020000000000050407008000300001090000300400200050100000000806000",
      "100007090030020008009600500005300900010080002600004000300000010040000007007000300"
    ]
  };

  const $ = (selector) => document.querySelector(selector);
  const boardEl = $("#board");
  const messageEl = $("#message");
  const actionText = $("#actionText");
  const placementCountEl = $("#placementCount");
  const backtrackCountEl = $("#backtrackCount");
  const totalStepCountEl = $("#totalStepCount");
  const executionTimeEl = $("#executionTime");
  const hintCountEl = $("#hintCount");
  const progressBar = $("#progressBar");
  const progressText = $("#progressText");

  const controls = {
    solve: $("#solveBtn"),
    animate: $("#animateBtn"),
    pause: $("#pauseBtn"),
    stop: $("#stopBtn"),
    hint: $("#hintBtn"),
    check: $("#checkBtn"),
    validate: $("#validateBtn"),
    reset: $("#resetBtn"),
    undo: $("#undoBtn"),
    redo: $("#redoBtn"),
    clear: $("#clearBtn"),
    newPuzzle: $("#newPuzzleBtn"),
    import: $("#importBtn"),
    export: $("#exportBtn"),
    share: $("#shareBtn"),
    erase: $("#eraseBtn"),
    theme: $("#themeBtn")
  };

  const difficultySelect = $("#difficultySelect");
  const speedSelect = $("#speedSelect");
  const puzzleStringEl = $("#puzzleString");
  const themeIcon = $("#themeIcon");

  let board = createEmptyBoard();
  let originalBoard = createEmptyBoard();
  let solutionBoard = null;
  let selected = null;
  let hintsUsed = 0;
  let undoStack = [];
  let redoStack = [];
  let animation = {
    running: false,
    paused: false,
    stopped: false,
    steps: [],
    index: 0,
    timer: null,
    original: null,
    finalBoard: null
  };

  function createEmptyBoard() {
    return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  }

  function cloneBoard(grid) {
    return grid.map((row) => [...row]);
  }

  function boardsEqual(a, b) {
    return a.every((row, r) => row.every((value, c) => value === b[r][c]));
  }

  function stringToBoard(value) {
    const cleaned = value.replace(/\s/g, "").replace(/\./g, "0");
    if (!/^[0-9]{81}$/.test(cleaned)) return null;

    return Array.from({ length: SIZE }, (_, r) =>
      Array.from({ length: SIZE }, (_, c) => Number(cleaned[r * SIZE + c]))
    );
  }

  function boardToString(grid) {
    return grid.flat().join("");
  }

  function buildBoard() {
    boardEl.innerHTML = "";

    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const input = document.createElement("input");
        input.className = "cell";
        input.type = "text";
        input.inputMode = "numeric";
        input.maxLength = 1;
        input.dataset.row = r;
        input.dataset.col = c;
        input.setAttribute("role", "gridcell");
        input.setAttribute("aria-label", `Row ${r + 1}, column ${c + 1}`);

        input.addEventListener("focus", () => selectCell(r, c));
        input.addEventListener("click", () => selectCell(r, c));
        input.addEventListener("input", handleCellInput);
        input.addEventListener("keydown", handleCellKeydown);

        boardEl.appendChild(input);
      }
    }
  }

  function getCell(r, c) {
    return boardEl.querySelector(`[data-row="${r}"][data-col="${c}"]`);
  }

  function allCells() {
    return [...boardEl.querySelectorAll(".cell")];
  }

  function selectCell(r, c) {
    selected = { r, c };
    applyHighlights();
  }

  function applyHighlights() {
    allCells().forEach((cell) => {
      cell.classList.remove("selected", "hl-line", "hl-box", "hl-same");
    });

    if (!selected) return;

    const { r: sr, c: sc } = selected;
    const selectedValue = board[sr][sc];
    const boxRow = Math.floor(sr / BOX) * BOX;
    const boxCol = Math.floor(sc / BOX) * BOX;

    allCells().forEach((cell) => {
      const r = Number(cell.dataset.row);
      const c = Number(cell.dataset.col);

      if (r === sr && c === sc) {
        cell.classList.add("selected");
        return;
      }

      if (selectedValue !== 0 && board[r][c] === selectedValue) {
        cell.classList.add("hl-same");
      } else if (
        r >= boxRow && r < boxRow + BOX &&
        c >= boxCol && c < boxCol + BOX
      ) {
        cell.classList.add("hl-box");
      } else if (r === sr || c === sc) {
        cell.classList.add("hl-line");
      }
    });
  }

  function handleCellInput(event) {
    if (animation.running) return;

    const cell = event.target;
    const r = Number(cell.dataset.row);
    const c = Number(cell.dataset.col);

    if (originalBoard[r][c] !== 0) {
      cell.value = originalBoard[r][c];
      return;
    }

    const value = /^[1-9]$/.test(cell.value) ? Number(cell.value) : 0;
    setUserValue(r, c, value);
  }

  function handleCellKeydown(event) {
    const r = Number(event.target.dataset.row);
    const c = Number(event.target.dataset.col);

    const moves = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1]
    };

    if (moves[event.key]) {
      event.preventDefault();
      const [dr, dc] = moves[event.key];
      const nr = Math.max(0, Math.min(8, r + dr));
      const nc = Math.max(0, Math.min(8, c + dc));
      getCell(nr, nc).focus();
      return;
    }

    if (event.key === "Backspace" || event.key === "Delete" || event.key === "0") {
      event.preventDefault();
      setUserValue(r, c, 0);
      return;
    }

    if (/^[1-9]$/.test(event.key)) {
      event.preventDefault();
      setUserValue(r, c, Number(event.key));
    }
  }

  function setUserValue(r, c, value, options = {}) {
    if (animation.running || originalBoard[r][c] !== 0) return;

    const previous = board[r][c];
    if (previous === value) return;

    if (!options.skipHistory) {
      undoStack.push({ r, c, from: previous, to: value });
      redoStack = [];
    }

    board[r][c] = value;
    solutionBoard = null;
    renderBoard();
    updateHistoryButtons();
    autoSave();

    if (!options.silent) {
      clearMessage();
      actionText.textContent = value
        ? `Placed ${value} at row ${r + 1}, column ${c + 1}.`
        : `Cleared row ${r + 1}, column ${c + 1}.`;
    }

    detectManualCompletion();
  }

  function renderBoard(extraClasses = new Map()) {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const cell = getCell(r, c);
        const value = board[r][c];
        const key = `${r},${c}`;

        cell.value = value || "";
        cell.readOnly = originalBoard[r][c] !== 0 || animation.running;
        cell.classList.remove(
          "given", "user", "solved", "hint", "trying",
          "backtracking", "error"
        );

        if (originalBoard[r][c] !== 0) {
          cell.classList.add("given");
        } else if (value !== 0) {
          cell.classList.add("user");
        }

        const classes = extraClasses.get(key) || [];
        classes.forEach((name) => cell.classList.add(name));
      }
    }

    applyHighlights();
  }

  function isValidPlacement(grid, row, col, num) {
    for (let i = 0; i < SIZE; i++) {
      if (grid[row][i] === num || grid[i][col] === num) return false;
    }

    const startRow = Math.floor(row / BOX) * BOX;
    const startCol = Math.floor(col / BOX) * BOX;

    for (let r = startRow; r < startRow + BOX; r++) {
      for (let c = startCol; c < startCol + BOX; c++) {
        if (grid[r][c] === num) return false;
      }
    }

    return true;
  }

  function findConflicts(grid) {
    const conflicts = new Set();

    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const num = grid[r][c];
        if (num === 0) continue;

        grid[r][c] = 0;
        if (!isValidPlacement(grid, r, c, num)) {
          conflicts.add(`${r},${c}`);
        }
        grid[r][c] = num;
      }
    }

    return conflicts;
  }

  function highlightCells(keys, className = "error") {
    keys.forEach((key) => {
      const [r, c] = key.split(",").map(Number);
      getCell(r, c).classList.add(className);
    });
  }

  function getBestEmptyCell(grid) {
    let best = null;
    let bestCandidates = null;

    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (grid[r][c] !== 0) continue;

        const candidates = [];
        for (let n = 1; n <= 9; n++) {
          if (isValidPlacement(grid, r, c, n)) candidates.push(n);
        }

        if (candidates.length === 0) return { r, c, candidates };
        if (!best || candidates.length < bestCandidates.length) {
          best = { r, c };
          bestCandidates = candidates;
          if (candidates.length === 1) {
            return { ...best, candidates: bestCandidates };
          }
        }
      }
    }

    return best ? { ...best, candidates: bestCandidates } : null;
  }

  function solveGrid(inputGrid, recordSteps = false) {
    const grid = cloneBoard(inputGrid);
    const steps = [];
    const stats = { placements: 0, backtracks: 0 };
    const start = performance.now();

    function backtrack() {
      const empty = getBestEmptyCell(grid);
      if (!empty) return true;
      if (empty.candidates.length === 0) return false;

      const { r, c, candidates } = empty;

      for (const num of candidates) {
        grid[r][c] = num;
        stats.placements++;
        if (recordSteps) {
          steps.push({ type: "place", r, c, value: num });
        }

        if (backtrack()) return true;

        grid[r][c] = 0;
        stats.backtracks++;
        if (recordSteps) {
          steps.push({ type: "remove", r, c, value: 0 });
        }
      }

      return false;
    }

    const solved = backtrack();
    const elapsed = performance.now() - start;

    return { solved, grid, steps, stats, elapsed };
  }

  function countSolutions(inputGrid, limit = 2) {
    const grid = cloneBoard(inputGrid);
    let count = 0;

    function search() {
      if (count >= limit) return;

      const empty = getBestEmptyCell(grid);
      if (!empty) {
        count++;
        return;
      }

      if (empty.candidates.length === 0) return;

      for (const num of empty.candidates) {
        grid[empty.r][empty.c] = num;
        search();
        grid[empty.r][empty.c] = 0;
        if (count >= limit) return;
      }
    }

    search();
    return count;
  }

  function preparePuzzleAction() {
    const conflicts = findConflicts(board);
    allCells().forEach((cell) => cell.classList.remove("error"));

    if (board.flat().every((value) => value === 0)) {
      showMessage("Enter a puzzle or load a preset first.", "warning");
      return false;
    }

    if (conflicts.size > 0) {
      highlightCells(conflicts);
      showMessage("Fix the highlighted conflicts first.", "error");
      return false;
    }

    return true;
  }

  function solveInstantly() {
    if (!preparePuzzleAction()) return;

    stopAnimation(false);
    const result = solveGrid(board, true);

    if (!result.solved) {
      showMessage("This puzzle has no solution.", "error");
      actionText.textContent = "The solver reached a dead end for every possible path.";
      return;
    }

    board = cloneBoard(result.grid);
    solutionBoard = cloneBoard(result.grid);
    updateStats(result);
    renderSolvedBoard();
    autoSave();

    const solutionCount = countSolutions(originalBoard);
    const typeText = solutionCount === 1 ? "unique solution" : "multiple solutions";
    showMessage(`Solved successfully. This puzzle has a ${typeText}.`, "success");
    actionText.textContent = "The backtracking algorithm completed the board.";
  }

  function renderSolvedBoard() {
    const classes = new Map();

    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (originalBoard[r][c] === 0 && board[r][c] !== 0) {
          classes.set(`${r},${c}`, ["solved"]);
        }
      }
    }

    renderBoard(classes);
  }

  function startAnimation() {
    if (!preparePuzzleAction()) return;

    stopAnimation(false);
    const result = solveGrid(board, true);

    if (!result.solved) {
      showMessage("This puzzle has no solution.", "error");
      return;
    }

    animation = {
      running: true,
      paused: false,
      stopped: false,
      steps: result.steps,
      index: 0,
      timer: null,
      original: cloneBoard(board),
      finalBoard: cloneBoard(result.grid)
    };

    solutionBoard = cloneBoard(result.grid);
    updateStats(result);
    board = cloneBoard(animation.original);
    setAnimationControls(true);
    updateProgress(0, animation.steps.length);
    showMessage("Backtracking visualization started.", "info");
    actionText.textContent = "The solver is searching for the best empty cell.";
    playNextStep();
  }

  function playNextStep() {
    if (!animation.running || animation.paused || animation.stopped) return;

    if (animation.index >= animation.steps.length) {
      board = cloneBoard(animation.finalBoard);
      animation.running = false;
      setAnimationControls(false);
      renderSolvedBoard();
      updateProgress(animation.steps.length, animation.steps.length);
      showMessage("Visualization completed.", "success");
      actionText.textContent = "The puzzle is solved.";
      autoSave();
      return;
    }

    const step = animation.steps[animation.index];
    const key = `${step.r},${step.c}`;
    const classes = new Map();

    if (step.type === "place") {
      board[step.r][step.c] = step.value;
      classes.set(key, ["trying"]);
      actionText.textContent =
        `Trying ${step.value} at row ${step.r + 1}, column ${step.c + 1}.`;
    } else {
      board[step.r][step.c] = 0;
      classes.set(key, ["backtracking"]);
      actionText.textContent =
        `Dead end found. Backtracking from row ${step.r + 1}, column ${step.c + 1}.`;
    }

    renderBoard(classes);
    animation.index++;
    updateProgress(animation.index, animation.steps.length);

    const delay = Number(speedSelect.value);
    animation.timer = window.setTimeout(playNextStep, delay);
  }

  function togglePause() {
    if (!animation.running) return;

    animation.paused = !animation.paused;
    controls.pause.textContent = animation.paused ? "Resume" : "Pause";

    if (animation.paused) {
      clearTimeout(animation.timer);
      showMessage("Visualization paused.", "info");
      actionText.textContent = "Animation paused.";
    } else {
      showMessage("Visualization resumed.", "info");
      playNextStep();
    }
  }

  function stopAnimation(showNotice = true) {
    if (animation.timer) clearTimeout(animation.timer);

    if (animation.running && animation.original) {
      board = cloneBoard(animation.original);
    }

    animation.running = false;
    animation.paused = false;
    animation.stopped = true;
    animation.timer = null;
    controls.pause.textContent = "Pause";
    setAnimationControls(false);
    renderBoard();
    updateProgress(0, 0);

    if (showNotice) {
      showMessage("Visualization stopped. Original state restored.", "info");
      actionText.textContent = "Animation stopped.";
    }
  }

  function setAnimationControls(running) {
    controls.animate.disabled = running;
    controls.solve.disabled = running;
    controls.hint.disabled = running;
    controls.check.disabled = running;
    controls.validate.disabled = running;
    controls.reset.disabled = running;
    controls.newPuzzle.disabled = running;
    controls.import.disabled = running;
    controls.undo.disabled = running || undoStack.length === 0;
    controls.redo.disabled = running || redoStack.length === 0;
    controls.pause.disabled = !running;
    controls.stop.disabled = !running;

    allCells().forEach((cell) => {
      cell.readOnly = running || originalBoard[Number(cell.dataset.row)][Number(cell.dataset.col)] !== 0;
    });
  }

  function updateProgress(current, total) {
    const percentage = total ? (current / total) * 100 : 0;
    progressBar.style.width = `${percentage}%`;
    progressText.textContent = `${current} / ${total}`;
  }

  function updateStats(result) {
    placementCountEl.textContent = result.stats.placements;
    backtrackCountEl.textContent = result.stats.backtracks;
    totalStepCountEl.textContent = result.steps.length;
    executionTimeEl.textContent = `${result.elapsed.toFixed(2)} ms`;
  }

  function resetStats() {
    placementCountEl.textContent = "—";
    backtrackCountEl.textContent = "—";
    totalStepCountEl.textContent = "—";
    executionTimeEl.textContent = "—";
    updateProgress(0, 0);
  }

  function giveHint() {
    if (!preparePuzzleAction()) return;

    const result = solveGrid(board);
    if (!result.solved) {
      showMessage("No hint is available because the puzzle is unsolvable.", "error");
      return;
    }

    const emptyCells = [];
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (board[r][c] === 0) emptyCells.push({ r, c });
      }
    }

    if (emptyCells.length === 0) {
      showMessage("The board is already complete.", "success");
      return;
    }

    const choice = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const value = result.grid[choice.r][choice.c];

    setUserValue(choice.r, choice.c, value, { silent: true });
    hintsUsed++;
    hintCountEl.textContent = hintsUsed;

    const classes = new Map([[`${choice.r},${choice.c}`, ["hint"]]]);
    renderBoard(classes);
    showMessage(
      `Hint: row ${choice.r + 1}, column ${choice.c + 1} is ${value}.`,
      "info"
    );
    actionText.textContent = "One correct value was revealed.";
    autoSave();
  }

  function checkProgress() {
    if (!preparePuzzleAction()) return;

    const result = solveGrid(originalBoard);
    if (!result.solved) {
      showMessage("The original puzzle is unsolvable.", "error");
      return;
    }

    const wrong = new Set();
    let filled = 0;

    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (board[r][c] !== 0) filled++;
        if (
          originalBoard[r][c] === 0 &&
          board[r][c] !== 0 &&
          board[r][c] !== result.grid[r][c]
        ) {
          wrong.add(`${r},${c}`);
        }
      }
    }

    allCells().forEach((cell) => cell.classList.remove("error"));

    if (wrong.size > 0) {
      highlightCells(wrong);
      showMessage(`${wrong.size} incorrect entr${wrong.size === 1 ? "y" : "ies"} found.`, "error");
    } else {
      showMessage(`All ${filled} filled cells are correct so far.`, "success");
    }
  }

  function validateBoard() {
    if (board.flat().every((value) => value === 0)) {
      showMessage("The board is empty.", "warning");
      return;
    }

    const conflicts = findConflicts(board);
    allCells().forEach((cell) => cell.classList.remove("error"));

    if (conflicts.size > 0) {
      highlightCells(conflicts);
      showMessage(`${conflicts.size} conflicting cell${conflicts.size === 1 ? "" : "s"} found.`, "error");
      return;
    }

    const count = countSolutions(board);
    if (count === 0) {
      showMessage("No direct conflicts, but the puzzle has no solution.", "error");
    } else if (count === 1) {
      showMessage("Valid puzzle with a unique solution.", "success");
    } else {
      showMessage("Valid puzzle, but it has multiple solutions.", "warning");
    }
  }

  function detectManualCompletion() {
    if (board.flat().some((value) => value === 0)) return;
    if (findConflicts(board).size > 0) return;

    const result = solveGrid(originalBoard);
    if (result.solved && boardsEqual(board, result.grid)) {
      showMessage("Excellent — you completed the puzzle correctly!", "success");
      actionText.textContent = "Puzzle completed manually.";
    }
  }

  function loadPuzzle(grid, message = "Puzzle loaded.") {
    stopAnimation(false);
    board = cloneBoard(grid);
    originalBoard = cloneBoard(grid);
    solutionBoard = null;
    selected = null;
    hintsUsed = 0;
    undoStack = [];
    redoStack = [];
    hintCountEl.textContent = "0";
    resetStats();
    renderBoard();
    updateHistoryButtons();
    showMessage(message, "success");
    actionText.textContent = "The puzzle is ready.";
    autoSave();
  }

  function loadRandomPuzzle() {
    const difficulty = difficultySelect.value;
    const choices = PUZZLES[difficulty];
    const puzzle = choices[Math.floor(Math.random() * choices.length)];
    loadPuzzle(stringToBoard(puzzle), `${difficulty[0].toUpperCase() + difficulty.slice(1)} puzzle loaded.`);
  }

  function resetPuzzle() {
    stopAnimation(false);
    board = cloneBoard(originalBoard);
    solutionBoard = null;
    hintsUsed = 0;
    hintCountEl.textContent = "0";
    undoStack = [];
    redoStack = [];
    resetStats();
    renderBoard();
    updateHistoryButtons();
    showMessage("Puzzle reset.", "info");
    actionText.textContent = "Returned to the original clues.";
    autoSave();
  }

  function clearBoard() {
    stopAnimation(false);
    board = createEmptyBoard();
    originalBoard = createEmptyBoard();
    solutionBoard = null;
    selected = null;
    hintsUsed = 0;
    hintCountEl.textContent = "0";
    undoStack = [];
    redoStack = [];
    puzzleStringEl.value = "";
    resetStats();
    renderBoard();
    updateHistoryButtons();
    showMessage("Board cleared.", "info");
    actionText.textContent = "Enter a puzzle or load a preset.";
    autoSave();
  }

  function undo() {
    const move = undoStack.pop();
    if (!move) return;

    redoStack.push(move);
    board[move.r][move.c] = move.from;
    solutionBoard = null;
    renderBoard();
    updateHistoryButtons();
    autoSave();
    actionText.textContent = "Last move undone.";
  }

  function redo() {
    const move = redoStack.pop();
    if (!move) return;

    undoStack.push(move);
    board[move.r][move.c] = move.to;
    solutionBoard = null;
    renderBoard();
    updateHistoryButtons();
    autoSave();
    actionText.textContent = "Move restored.";
  }

  function updateHistoryButtons() {
    controls.undo.disabled = animation.running || undoStack.length === 0;
    controls.redo.disabled = animation.running || redoStack.length === 0;
  }

  function importPuzzle() {
    const grid = stringToBoard(puzzleStringEl.value);

    if (!grid) {
      showMessage("Enter exactly 81 digits using 0 or . for empty cells.", "error");
      return;
    }

    if (findConflicts(grid).size > 0) {
      showMessage("The imported puzzle contains conflicts.", "error");
      return;
    }

    loadPuzzle(grid, "Puzzle imported.");
  }

  async function copyText(text, successMessage) {
    try {
      await navigator.clipboard.writeText(text);
      showMessage(successMessage, "success");
    } catch {
      puzzleStringEl.value = text;
      puzzleStringEl.select();
      document.execCommand("copy");
      showMessage(successMessage, "success");
    }
  }

  function exportPuzzle() {
    const value = boardToString(board);
    puzzleStringEl.value = value;
    copyText(value, "Puzzle string copied.");
  }

  function sharePuzzle() {
    const url = new URL(window.location.href);
    url.searchParams.set("puzzle", boardToString(originalBoard));
    copyText(url.toString(), "Share URL copied.");
  }

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    themeIcon.textContent = theme === "dark" ? "☀" : "☾";
    localStorage.setItem(THEME_KEY, theme);
  }

  function toggleTheme() {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(next);
  }

  function autoSave() {
    const payload = {
      board,
      originalBoard,
      hintsUsed,
      difficulty: difficultySelect.value
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  function restoreSavedState() {
    const urlPuzzle = new URL(window.location.href).searchParams.get("puzzle");
    if (urlPuzzle) {
      const grid = stringToBoard(urlPuzzle);
      if (grid && findConflicts(grid).size === 0) {
        loadPuzzle(grid, "Shared puzzle loaded.");
        return true;
      }
    }

    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!saved?.board || !saved?.originalBoard) return false;

      board = saved.board;
      originalBoard = saved.originalBoard;
      hintsUsed = Number(saved.hintsUsed || 0);
      difficultySelect.value = saved.difficulty || "easy";
      hintCountEl.textContent = hintsUsed;
      renderBoard();
      showMessage("Saved progress restored.", "info");
      actionText.textContent = "Your previous board was restored.";
      return true;
    } catch {
      return false;
    }
  }

  function showMessage(text, type = "info") {
    messageEl.textContent = text;
    messageEl.className = `message ${type}`;

    clearTimeout(showMessage.timer);
    showMessage.timer = setTimeout(() => {
      messageEl.classList.add("hidden");
    }, 4000);
  }

  function clearMessage() {
    messageEl.className = "message hidden";
  }

  controls.solve.addEventListener("click", solveInstantly);
  controls.animate.addEventListener("click", startAnimation);
  controls.pause.addEventListener("click", togglePause);
  controls.stop.addEventListener("click", () => stopAnimation(true));
  controls.hint.addEventListener("click", giveHint);
  controls.check.addEventListener("click", checkProgress);
  controls.validate.addEventListener("click", validateBoard);
  controls.reset.addEventListener("click", resetPuzzle);
  controls.clear.addEventListener("click", clearBoard);
  controls.undo.addEventListener("click", undo);
  controls.redo.addEventListener("click", redo);
  controls.newPuzzle.addEventListener("click", loadRandomPuzzle);
  controls.import.addEventListener("click", importPuzzle);
  controls.export.addEventListener("click", exportPuzzle);
  controls.share.addEventListener("click", sharePuzzle);
  controls.theme.addEventListener("click", toggleTheme);

  controls.erase.addEventListener("click", () => {
    if (selected) setUserValue(selected.r, selected.c, 0);
  });

  document.querySelectorAll("[data-number]").forEach((button) => {
    button.addEventListener("click", () => {
      if (selected) {
        setUserValue(selected.r, selected.c, Number(button.dataset.number));
        getCell(selected.r, selected.c).focus();
      }
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.key.toLowerCase() === "z") {
      event.preventDefault();
      event.shiftKey ? redo() : undo();
    }

    if (event.ctrlKey && event.key.toLowerCase() === "y") {
      event.preventDefault();
      redo();
    }
  });

  window.addEventListener("beforeunload", autoSave);

  function init() {
    buildBoard();
    applyTheme(localStorage.getItem(THEME_KEY) || "dark");
    resetStats();

    if (!restoreSavedState()) {
      loadRandomPuzzle();
    }

    renderBoard();
    updateHistoryButtons();
  }

  init();
})();
