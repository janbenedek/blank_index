document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const gameBoard = document.getElementById('game-board');
    const numberPad = document.getElementById('number-pad');
    const newGameBtn = document.getElementById('btn-new-game');
    const difficultyButtons = {
        easy: document.getElementById('btn-easy'),
        medium: document.getElementById('btn-medium'),
        hard: document.getElementById('btn-hard'),
    };
    const notesToggle = document.getElementById('notes-toggle');
    const timerDisplay = document.getElementById('timer');

    // --- Game State ---
    let selectedCell = null;
    let difficulty = 'medium'; // Default difficulty
    let timerInterval = null;
    let seconds = 0;

    // 9x9 grid representation
    let board = [];
    // The solution
    let solution = [];

    /**
     * Sets up the initial game board and number pad in the DOM.
     */
    function setupUI() {
        gameBoard.innerHTML = '';
        numberPad.innerHTML = '';

        // Create 81 cells for the game board
        for (let i = 0; i < 81; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.index = i;

            // Add click listener for cell selection
            cell.addEventListener('click', () => handleCellClick(cell));

            gameBoard.appendChild(cell);
        }

        // Create number pad buttons 1-9
        for (let i = 1; i <= 9; i++) {
            const numButton = document.createElement('div');
            numButton.textContent = i;

            // Add click listener for number input
            numButton.addEventListener('click', () => handleNumberClick(i));

            numberPad.appendChild(numButton);
        }

        console.log("UI for board and number pad has been set up.");
    }

    /**
     * Handles clicking on a cell.
     * @param {HTMLElement} cell The cell that was clicked.
     */
    function handleCellClick(cell) {
        // Deselect previous cell
        if (selectedCell) {
            selectedCell.classList.remove('selected');
        }

        // Select new cell
        selectedCell = cell;
        selectedCell.classList.add('selected');
    }

    /**
     * Handles clicking on a number in the number pad.
     */
    function handleNumberClick(num) {
        if (!selectedCell || selectedCell.classList.contains('given')) {
            return;
        }

        const index = parseInt(selectedCell.dataset.index);
        const row = Math.floor(index / 9);
        const col = index % 9;

        if (notesToggle.checked) {
            // --- Notes Mode ---
            // Clear main number from text node and internal board state first
            selectedCell.childNodes[0].nodeValue = '';
            board[row][col] = 0;
            selectedCell.classList.remove('error');

            let notesGrid = selectedCell.querySelector('.notes-grid');
            if (!notesGrid) {
                notesGrid = document.createElement('div');
                notesGrid.classList.add('notes-grid');
                for (let i = 0; i < 9; i++) {
                    const noteCell = document.createElement('div');
                    noteCell.dataset.note = i + 1;
                    notesGrid.appendChild(noteCell);
                }
                selectedCell.appendChild(notesGrid);
            }

            const noteCell = notesGrid.querySelector(`[data-note='${num}']`);
            noteCell.textContent = noteCell.textContent === '' ? num : '';

        } else {
            // --- Normal Input Mode ---
            const notesGrid = selectedCell.querySelector('.notes-grid');
            if (notesGrid) notesGrid.remove();

            selectedCell.textContent = num;
            board[row][col] = num;

            // Validation
            selectedCell.classList.toggle('error', num !== solution[row][col]);

            // Check for win
            if (!selectedCell.classList.contains('error') && checkWinCondition()) {
                stopTimer();
                setTimeout(() => alert(`Gratulujeme! Vyřešili jste Sudoku v čase ${timerDisplay.textContent}!`), 100);
            }
        }
    }

    function checkWinCondition() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0 || board[row][col] !== solution[row][col]) {
                    return false;
                }
            }
        }
        return true;
    }

    // --- Timer Logic ---
    function formatTime(s) {
        const min = Math.floor(s / 60).toString().padStart(2, '0');
        const sec = (s % 60).toString().padStart(2, '0');
        return `${min}:${sec}`;
    }

    function startTimer() {
        if (timerInterval) clearInterval(timerInterval);
        seconds = 0;
        timerDisplay.textContent = formatTime(seconds);
        timerInterval = setInterval(() => {
            seconds++;
            timerDisplay.textContent = formatTime(seconds);
        }, 1000);
    }

    function stopTimer() {
        clearInterval(timerInterval);
    }

    // --- Event Listeners ---
    function setupEventListeners() {
        newGameBtn.addEventListener('click', newGame);

        Object.entries(difficultyButtons).forEach(([level, button]) => {
            button.addEventListener('click', () => {
                if (difficulty === level) return;
                difficulty = level;
                Object.values(difficultyButtons).forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                newGame();
            });
        });
    }

    // --- Sudoku Generation Logic ---

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function isValid(grid, row, col, num) {
        for (let x = 0; x < 9; x++) {
            if (grid[row][x] === num || grid[x][col] === num) {
                return false;
            }
        }
        const startRow = row - row % 3;
        const startCol = col - col % 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (grid[i + startRow][j + startCol] === num) {
                    return false;
                }
            }
        }
        return true;
    }

    function generateSolution(grid) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (grid[row][col] === 0) {
                    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
                    shuffle(numbers);
                    for (const num of numbers) {
                        if (isValid(grid, row, col, num)) {
                            grid[row][col] = num;
                            if (generateSolution(grid)) {
                                return true;
                            }
                            grid[row][col] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }

    function createPuzzle(solvedGrid, level) {
        const puzzle = JSON.parse(JSON.stringify(solvedGrid));
        const difficulties = { easy: 40, medium: 50, hard: 58 };
        const cellsToRemove = difficulties[level] || 50;

        let removed = 0;
        while (removed < cellsToRemove) {
            const row = Math.floor(Math.random() * 9);
            const col = Math.floor(Math.random() * 9);

            if (puzzle[row][col] !== 0) {
                puzzle[row][col] = 0;
                removed++;
            }
        }
        return puzzle;
    }

    function renderBoard(grid) {
        const cells = gameBoard.children;
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const index = row * 9 + col;
                const cell = cells[index];
                const value = grid[row][col];

                // Clear previous state
                cell.textContent = '';
                const notes = cell.querySelector('.notes-grid');
                if(notes) notes.remove();

                cell.textContent = value === 0 ? '' : value;
                cell.classList.remove('given', 'selected', 'error');
                if (value !== 0) {
                    cell.classList.add('given');
                }
            }
        }
    }

    function newGame() {
        console.log(`Starting new game with difficulty: ${difficulty}`);
        startTimer();

        const emptyGrid = Array(9).fill(0).map(() => Array(9).fill(0));
        generateSolution(emptyGrid);
        solution = JSON.parse(JSON.stringify(emptyGrid));
        board = createPuzzle(solution, difficulty);

        if (gameBoard.children.length !== 81) {
            setupUI();
        }
        renderBoard(board);
    }

    // --- Initializer ---
    difficultyButtons[difficulty].classList.add('active');
    setupEventListeners();
    newGame();
});
