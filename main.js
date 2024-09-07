const gameBoard = (function () {
    const LENGTH = 3;
    const board = [];
    const initializeBoard = (function () {
        for (let row = 0; row < LENGTH; ++row) {
            board[row] = [];
            for (let column = 0; column < LENGTH; ++column) {
                board[row].push(createMarker(row, column));
            }
        }
    })();

    const getBoard = () => board;

    function printBoard() {
        board.forEach(row => {
            let arr = [];
            row.forEach(cell => {
                arr.push(cell.getMarker());
            });
            console.log(arr)
        });
    }

    function addMarker(row, column, marker) {
        // Prevent error incase marker is being added outside the board
        if (row < 0 || row >= LENGTH || column < 0 || column >= LENGTH) {
            return;
        }

        // Prevent adding marker on occupied cells
        if (board[row][column].getMarker() !== "") {
            return;
        }
        board[row][column].setMarker(marker);
        return true; // to singal that the turn is over
    }

    function isBordFull() {
        return board.every(row => row.every(cell => cell.getMarker() !== ""));
    }

    // check all the different ways to win
    const winnigCells = [];
    const getWinningCells = () => winnigCells;

    function checkWiningConditions(row, column, marker) {

        checkRow(row, marker, winnigCells);
        checkColumn(column, marker, winnigCells);
        checkMainDiagnol(row, column, marker, winnigCells);
        checkAntiDiagnol(marker, winnigCells);
        if (winnigCells.length !== 0) {
            return true;
        }
        return false;
    }

    // Check the row that was inserted to
    function checkRow(rowPos, marker, winnigCells) {
        const isRowMatch = board[rowPos].every(cell => cell.getMarker() === marker)
        if (isRowMatch) {
            const winningRow = board[rowPos].map(cell => cell.getPosition());
            winnigCells.push(winningRow);
        }
    }

    // Check the column that was inserted into
    function checkColumn(colPos, marker, winnigCells) {
        const isColMatch = board.every(row => row[colPos].getMarker() === marker);
        if (isColMatch) {
            const winningCol = board.map(row => row[colPos].getPosition());
            winnigCells.push(winningCol);
        }
    }

    // Check the diagnols
    function checkMainDiagnol(rowPos, colPos, marker, winnigCells) {
        if (rowPos === colPos) {
            // row[index] works because the board is a square
            const isDiagnolMatch = board.every((row, index) =>
                row[index].getMarker() === marker);
            if (isDiagnolMatch) {
                const winningDiagnol = board.map((row, index) =>
                    row[index].getPosition());
                winnigCells.push(winningDiagnol);
            }
            console.log("Hello");
        }

    }

    function checkAntiDiagnol(marker, winnigCells) {
        const isDiagnolMatch = board.every((row, index) => {
            const colPosition = row.length - (index + 1);
            return row[colPosition].getMarker() === marker;
        });
        if (isDiagnolMatch) {
            const winningDiagnol = board.map((row, index) =>
                row[row.length - (index + 1)].getPosition());
            winnigCells.push(winningDiagnol);
        }
    }

    return {
        addMarker, getBoard, printBoard, isBordFull, checkWiningConditions,
        getWinningCells
    };

})()

// Used to keep track of each cell position on the board
function Position(row, column) {
    this.row = row;
    this.column = column;
}

Position.prototype.getRow = function () {
    return this.row;
}

Position.prototype.getColumn = function () {
    return this.column;
}

// When the board is initalized, every cell gets a createMarker object. This makes 
// it easy to modify the cell marker, and to get the cell postion on the board.
function createMarker(row, column) {
    let marker = "";
    let position = new Position(row, column);

    const setMarker = (playerMarker) => marker = playerMarker;
    const getMarker = () => marker;
    const getPosition = () => position;
    return { getMarker, setMarker, getPosition };
}

function createPlayer(playerName, playerMarker) {
    const getName = () => playerName;
    const getMarker = () => playerMarker;
    return { getName, getMarker };
}

const gameControl = (function () {
    const p1 = createPlayer("Player 1", "x");
    const p2 = createPlayer("Player 2", "o");
    let activePlayer = p1;
    let winningPlayer = null;
    let gameOver = false;

    const switchActivePlayer = () => activePlayer = activePlayer !== p1 ? p1 : p2;
    const getActivePlayer = () => activePlayer;
    const getWinningPlayer = () => winningPlayer;
    const isGameOver = () => gameOver;

    function playTurn(row, column) {
        let playerMarker = activePlayer.getMarker();

        // Prevents acitve players turn from ending if the move was invalid (outside
        // the board or on occupied cell) or if game is over.
        const isMoveValid = gameBoard.addMarker(row, column, playerMarker);

        if (isMoveValid && !isGameOver()) {
            let haveWinner = gameBoard.checkWiningConditions(row, column, playerMarker);
            if (haveWinner) {
                gameOver = true;
                winningPlayer = activePlayer;
            } else if (gameBoard.isBordFull()) {
                gameOver = true;
            }

            gameBoard.printBoard();
            switchActivePlayer();
        }
    }

    return { getActivePlayer, playTurn, isGameOver, getWinningPlayer };
})()


const screenControl = (function () {
    const messageDiv = document.querySelector("div.message");
    const boardDiv = document.querySelector("div.board");
    const board = gameBoard.getBoard();
    const winnigCells = gameBoard.getWinningCells();
    let activePlayer = gameControl.getActivePlayer().getName();


    // Come back here ____---------------
    function displayMessage(message) {
        messageDiv.textContent = message;
    }

    function createBoard() {
        board.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
                const cellButton = document.createElement("button");
                cellButton.dataset.row = rowIndex;
                cellButton.dataset.column = colIndex;
                cellButton.classList.add("cell");
                cellButton.addEventListener("click", cellClickHandler);
                boardDiv.appendChild(cellButton);
            });
        });
        displayMessage(`${activePlayer}'s Turn`)
    }

    function cellClickHandler(event) {

        if (!gameControl.isGameOver()) {
            const row = +event.target.dataset.row;
            const column = +event.target.dataset.column;

            gameControl.playTurn(row, column);
            updateCellContent(event.target, row, column);
            activePlayer = gameControl.getActivePlayer().getName();
            if (gameControl.isGameOver() && gameControl.getWinningPlayer() !== null) {
                displayMessage(`${gameControl.getWinningPlayer().getName()} Won!`);
                showWinnigCombinations();
            } else if (gameControl.isGameOver()) {
                displayMessage("Tied Game!");
            } else {
                displayMessage(`${activePlayer}'s Turn`);
            }
        }
    }

    function updateCellContent(cell, row, column) {
        cell.textContent = board[row][column].getMarker();
    }

    function showWinnigCombinations() {
        winnigCells.forEach(winningCombination => {
            winningCombination.forEach(cell => {
                let row = cell.getRow();
                let col = cell.getColumn();
                const button = document.querySelector(
                    `button[data-row="${row}"][data-column="${col}"]`);
                button.classList.add("winningButton");
            });
        });
    }

    // Display the initial board
    createBoard();
    // displayMessage(`${activePlayer}'s turn`);
})();

