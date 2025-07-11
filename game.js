// Constants
const gameBoard = [];
const moveHistory = [];
const submittedWordsHistory = [];

let score = 0;
let isModalOpen = true;

// Date & Puzzle Number Logic
const today = new Date();
const puzzleStartDate = new Date('2025-07-14');
const dayDiff = Math.floor((today - puzzleStartDate) / (1000 * 60 * 60 * 24));
const textPuzzleNumber = (dayDiff + 1).toString();


const textDate = new Date().toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});


const keyboardCycleState = {
  currentKey: null,
  currentIndex: 0,
};

// DOM Elements
const banner = document.getElementById('message-banner');
const wordGuessWrapper = document.getElementById('word-guess-wrapper');
const undoButton = document.getElementById('undo-button');
const submitButton = document.getElementById('submit-button');
const restartButton = document.getElementById('restart-button');
const scoreboard = document.getElementById('scoreboard');
const gameBoardElement = document.getElementById('game-board');
const welcomeModal = document.getElementById('welcome-modal-wrapper');

// ALERT MODAL DOM ELEMENTS
const alertModal = document.getElementById('alert-modal');
const alertModalCloseButton = document.getElementById('alert-modal-close-button');
const alertModalLeftButton = document.getElementById('alert-modal-left-button');
const alertModalRightButton = document.getElementById('alert-modal-right-button');


// MODAL DOM ELEMENTS
const gameOverModal = document.getElementById('game-over-modal');
const gameOverModalCloseButton = document.getElementById('close-modal-button');
const gameOverModalShareButton = document.getElementById('share-button');
const gameOverModalPlayAgainButton = document.getElementById('play-again-button');
const playButton = document.getElementById('play-button');

// WELCOME MODAL ELEMENTS
const dateElement = document.getElementById('date');
const puzzleNumberElement = document.getElementById('puzzle-number');


// === INITIALIZATION === (this listener fires when dom content is loaded, effectively kicking off the game)
document.addEventListener('DOMContentLoaded', async () => {
  setAllButtonStates();

  try {
    // Wait for both word lists: validation + generation
    await Promise.all([
      loadWords(),
      generateWords()
    ]);

    // Generate a fresh board
    const { board, wordsUsed } = generateRandomBoard();

    gameBoard.push(...board); // board is 16 pairs like [['A','B'], ...]
    console.log("Game board generated with words:", wordsUsed);       // Remove this once satisfied with game quality

    setVH();
    addCardsAndGrid();          // Adds cards to the DOM
    initializeEventListeners(); // Adds listeners for clicks
    updateWelcomeModal();
    updateFocusableElements();

  } catch (error) {
    displayMessage('Failed to load word list. Please reload.', 'error', 5000);
    console.error(error);
  }
});

function setVH() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

// This is called within the initial domcontentloaded event listener and adds 16 cells and 32 cards to the gameboard programatically
function addCardsAndGrid() {

  for (let i = 0; i < 16; i++) {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    gameBoardElement.appendChild(cell)
  }

  const cells = document.querySelectorAll('#game-board .cell');

  // Make sure gameBoard and cells length matches
  if (cells.length !== gameBoard.length) {
    console.error('Mismatch between number of cells and gameBoard data!');
    return;
  }

  // Loop over cells and add top and bottom cards
  for (let i = 0; i < cells.length; i++) {
    const [topLetter, bottomLetter] = gameBoard[i];

    // Create top card div
    const topCard = document.createElement('div');
    topCard.classList.add('card', 'top', 'green');
    topCard.innerHTML = `<span>${topLetter}</span>`;

    // Create bottom card div
    const bottomCard = document.createElement('div');
    bottomCard.classList.add('card', 'bottom', 'blue');
    bottomCard.innerHTML = `<span>${bottomLetter}</span>`;

    // Append cards to cell
    cells[i].appendChild(topCard);
    cells[i].appendChild(bottomCard);
  }
}

// This is called within the initial domcontentloaded event listner and then adds click listeners to all top cards that were generated in addcardsandgrid
function initializeEventListeners() {

  window.addEventListener('resize', setVH);

  // Welcome Screen play button listener:
  playButton.addEventListener('click', () => {
    welcomeModal.classList.add('hidden');
    isModalOpen = false;
  });

  // add event listener to game board
  gameBoardElement.addEventListener('click', handleBoardClick);

  // Game Over Modal Event Listeners:
  gameOverModalCloseButton.addEventListener('click', () => {
    gameOverModal.classList.add('hidden');
    updateFocusableElements();
    isModalOpen = false;

  });
  gameOverModalPlayAgainButton.addEventListener('click', () => {
    gameOverModal.classList.add('hidden');
    isModalOpen = false;
    restartPuzzle();
  });
  gameOverModalShareButton.addEventListener('click', shareResults);

  // Alert Modal Event Listeners:
  alertModalCloseButton.addEventListener('click', () => {
    alertModal.classList.add('hidden');
    updateFocusableElements();
    isModalOpen = false;
  });
  alertModalRightButton.addEventListener('click', () => {
    alertModal.classList.add('hidden');
    isModalOpen = false;
    restartPuzzle();
  });
  alertModalLeftButton.addEventListener('click', () => {
    isModalOpen = false;
    updateFocusableElements();
    alertModal.classList.add('hidden');
  });

  // Landscape warning Modal Event Listeners:
  window.addEventListener('load', updateLandscapeWarningModal);
  window.addEventListener('resize', updateLandscapeWarningModal);
  window.addEventListener('orientationchange', updateLandscapeWarningModal);


  // Prevent double tap to zoom
  document.addEventListener('dblclick', (e) => e.preventDefault())

  // add event listeners for clicking the undo, submit and restart buttons
  addBlurredClickListener(undoButton, undoHandler);
  addBlurredClickListener(submitButton, submitWord);
  addBlurredClickListener(restartButton, showConfirmRestartModal);
  wordGuessWrapper.addEventListener('click', handleWordGuessCardClick);
  document.addEventListener('keydown', handleKeyPress);
}

// === KEYBOARD MECHANICS === (event liseners for button presses)
function handleKeyPress(e) {
  if (e.key === 'Escape') {
    if (!document.getElementById('welcome-modal-wrapper').classList.contains('hidden')) {
      document.getElementById('play-button').click();
      return;
    } else if (!document.getElementById('game-over-modal').classList.contains('hidden')) {
      document.querySelector('#close-modal-button').click();
      return;
    } else if (!document.getElementById('alert-modal').classList.contains('hidden')) {
      document.querySelector('#alert-modal-close-button').click();
      return;
    } else {
      restartButton.click();
      return;
    }
  };

  if (e.key === 'Enter' || e.key === 'Return') {
    if (!document.querySelector('#alert-modal').classList.contains('hidden')) {
      document.querySelector('#alert-modal-right-button').click();
      return;
    } else if (!document.getElementById('welcome-modal-wrapper').classList.contains('hidden')) {
      document.getElementById('play-button').click();
      return;
    } else if (document.activeElement && document.activeElement.matches('#button-wrapper button')) {
      const activeButton = document.activeElement;
      activeButton.click();
      if (activeButton.matches('#button-wrapper #undo-button')) {
        setTimeout(() => {
          activeButton.focus();
        }, 0);
      }
      return;
    } else if (document.activeElement && document.activeElement.matches('.card[tabindex="0"]')) {
      document.activeElement.click();
    } else {
      const currentRaised = document.querySelector('.raised');
      resetKeyboardCycleState();

      if (currentRaised) {
        moveCardToGuessArea(currentRaised);
      } else if (!submitButton.disabled) {
        submitWord();
      }
      return;
    }
  }

  if (isModalOpen) return;

  if (e.key === 'Backspace' || e.key === 'Delete') {
    resetKeyboardCycleState();
    undoHandler();
    return;
  }



  const key = e.key.toUpperCase();
  const currentTopCards = document.querySelectorAll('.cell .card.top, .cell .card.solo');

  // Filter to only cards that match the key
  const matchingCards = Array.from(currentTopCards).filter(card =>
    card.innerText.trim().toUpperCase() === key
  );

  // Reset index if the key has changed
  if (keyboardCycleState.currentKey !== key) {
    keyboardCycleState.currentKey = key;
    keyboardCycleState.currentIndex = 0;
  }

  // Remove any currently raised cards
  currentTopCards.forEach(card => card.classList.remove('raised'));

  if (matchingCards.length === 0) return; // no matches found

  // Cycle to the next matching card
  const index = keyboardCycleState.currentIndex % matchingCards.length;
  matchingCards[index].classList.add('raised');
  keyboardCycleState.currentIndex++;
}

function resetKeyboardCycleState() {
  keyboardCycleState.currentKey = null;
  keyboardCycleState.currentIndex = 0;
}


// === GAME MECHANICS === (event liseners for button presses)
function handleBoardClick(e) {
  const clickedCard = e.target.closest('.card.top, .card.solo');

  // Ignore clicks outside cards or not on the board
  if (!clickedCard || !gameBoardElement.contains(clickedCard)) return;

  // Prevent double-moving already moved cards
  if (wordGuessWrapper.contains(clickedCard)) return;

  moveCardToGuessArea(clickedCard); // now passes DOM element, not event
  updateFocusableElements();
}

function moveCardToGuessArea(topCard) {
  if (isModalOpen) return;
  if (topCard.classList.contains('game-over')) return;

  topCard.classList.remove('raised');
  const cell = topCard.parentElement;
  const bottomCard = cell.querySelector('.card.bottom');

  const move = {
    cell,
    promotedCardInfo: null,
    movedCard: topCard,
    movedCardOriginalClasses: Array.from(topCard.classList),
    movedCardOriginalParent: cell,
  };

  // Move top card to guess area
  cell.removeChild(topCard);
  wordGuessWrapper.appendChild(topCard);
  banner.classList.add('hidden');

  // Promote bottom card if exists
  if (bottomCard) {
    move.promotedCardInfo = {
      card: bottomCard,
      originalClasses: Array.from(bottomCard.classList),
    };

    cell.removeChild(bottomCard);
    bottomCard.classList.remove('bottom');
    bottomCard.classList.add('solo');

    cell.appendChild(bottomCard);
  }

  moveHistory.push(move);

  setAllButtonStates();
  updateFocusableElements();
  updateWordGuessWrapperLayout();
  shakeIfTooManyWords();

}

function handleWordGuessCardClick(e) {
  const clickedCard = e.target.closest('.card');
  if (!clickedCard || !wordGuessWrapper.contains(clickedCard)) return;

  const guessCards = Array.from(wordGuessWrapper.children);
  const clickedIndex = guessCards.indexOf(clickedCard);

  if (clickedIndex === -1) return;

  // Undo all cards from the clicked one onward
  const numToUndo = guessCards.length - clickedIndex;
  for (let i = 0; i < numToUndo; i++) {
    undoLastLetterPlaced();
  }
}

function undoLastLetterPlaced() {
  if (moveHistory.length === 0) return;

  const lastMove = moveHistory.pop();

  // Undo moved card
  const movedCard = lastMove.movedCard;
  const originalParent = lastMove.movedCardOriginalParent;
  const originalClasses = lastMove.movedCardOriginalClasses;

  // Remove movedCard from guess area and put back in original cell
  if (movedCard.parentElement === wordGuessWrapper) {
    wordGuessWrapper.removeChild(movedCard);
  }
  originalParent.appendChild(movedCard);

  // Restore classes for movedCard
  movedCard.className = ''; // reset all classes
  originalClasses.forEach(cls => movedCard.classList.add(cls));


  // Undo promotion if any
  if (lastMove.promotedCardInfo) {
    const { card, originalClasses } = lastMove.promotedCardInfo;

    // Remove promoted card from cell
    if (card.parentElement) {
      card.parentElement.removeChild(card);
    }

    // Restore classes 
    card.className = ''; // clear classes
    originalClasses.forEach(cls => card.classList.add(cls));

    // Re-add to original cell
    lastMove.cell.appendChild(card);
  }

  setAllButtonStates();
  updateWordGuessWrapperLayout();
  updateFocusableElements();
}

function submitWord() {
  const cards = Array.from(document.querySelectorAll('#word-guess-wrapper .card'));
  const word = cards.map(card => card.textContent).join('').trim().toUpperCase();

  if (cards.length === 0) {
    displayMessage("Select at least one letter.", 'error');
    return;
  }

  if (!window.VALID_WORDS_BY_LENGTH) {
    displayMessage("Word list not loaded. Please reload the page.", 'error');
    return;
  }

  if (word.length < 2) {
    displayMessage("Too short", 'error');
    return;
  }

  if (word.length > 16) {
    displayMessage("Too long", 'error');
    return;
  }

  const validWords = window.VALID_WORDS_BY_LENGTH[word.length] || [];
  if (!validWords.includes(word)) {
    displayMessage(`Not in word list`, 'error');
    // if the word is incorrect, remove from the word guess area
    clearGuess();
    setAllButtonStates();
    updateFocusableElements();
    updateWordGuessWrapperLayout();
    return;
  }

  if (word.length >= 2 && word.length <= 16) {
    displayMessage(`Nice! +${word.length} points`, 'success');
  }

  const scoreboardRow = document.createElement('div');
  scoreboardRow.classList.add('scoreboard-word');

  cards.forEach(card => {
    wordGuessWrapper.removeChild(card);
    scoreboardRow.appendChild(card);
  });

  scoreboard.appendChild(scoreboardRow);

  // Pull this word's moves from moveHistory
  const currentWordMoves = moveHistory.splice(-cards.length, cards.length)

  // Track in a new per-word stack
  submittedWordsHistory.push({
    word,
    cards,
    moves: currentWordMoves,
    scoreboardRow
  });

  // update scoreboard
  updateScoreAndWordSubmissionCount();
  updateWordGuessWrapperLayout();
  setAllButtonStates();
  updateFocusableElements();

  if (gameIsOver()) {
    showGameOverModal();
    greyOutCards();
  }
}

function unSubmitWord() {
  if (submittedWordsHistory.length === 0) return;

  const lastWord = submittedWordsHistory.pop();
  if (!lastWord || !lastWord.moves || !lastWord.scoreboardRow) return;

  // remove from scoreboard
  if (lastWord.scoreboardRow.parentElement) {
    lastWord.scoreboardRow.parentElement.removeChild(lastWord.scoreboardRow);
  }

  // move cards back into guess area
  for (let card of lastWord.cards) {
    wordGuessWrapper.appendChild(card);
  };

  moveHistory.push(...lastWord.moves);
  banner.classList.add('hidden');


  setAllButtonStates();
  updateWordGuessWrapperLayout();
  updateScoreAndWordSubmissionCount();
  updateFocusableElements();
}

function undoHandler() {

  const guessCards = document.querySelectorAll('#word-guess-wrapper .card');
  if (submittedWordsHistory.length === 0 && guessCards.length === 0) return;

  // Step 1: if there are guess cards, remove last card
  if (guessCards.length > 0) {
    undoLastLetterPlaced();
    return;
  };

  // Step 2: Retrieve last submitted word info
  unSubmitWord();

  // Step 3: Update UI
  setAllButtonStates();
  updateWordGuessWrapperLayout();
  updateScoreAndWordSubmissionCount();
  unGreyOutCards();
  updateFocusableElements();
}

function clearGuess() {
  // Keep undoing until there are no more cards in the guess area
  while (wordGuessWrapper.firstChild) {
    undoLastLetterPlaced();
  }
}

function restartPuzzle() {
  // First, clear any in-progress word
  clearGuess();

  // Then, keep undoing submitted words until none remain
  while (submittedWordsHistory.length > 0 || moveHistory.length > 0) {
    undoHandler();
  }

  setAllButtonStates();
  updateWordGuessWrapperLayout();
  unGreyOutCards();
  updateFocusableElements();

  // Also clear any messages, if desired
  // displayMessage("Puzzle reset.", 'success');
}

// === SCOREBOARD FUNCTIONS
function updateScoreAndWordSubmissionCount() {
  const scoreCounter = document.getElementById('score-counter-text');
  const wordSubmissionCounter = document.getElementById('words-submitted-counter-text');
  const wordSubmissionCount = submittedWordsHistory.length;
  const score = calculateScore();

  scoreCounter.textContent = `Score: ${score}`;
  wordSubmissionCounter.textContent = `Words: ${wordSubmissionCount}/6`
}

function calculateScore() {
  const score = submittedWordsHistory.reduce((sum, word) => sum + word.cards.length, 0);
  return score;
}


// === GAME OVER LOGIC ===
function gameIsOver() {
  // Step 0: the game will not be over after the first turn
  if (submittedWordsHistory.length < 2) return false;

  // Step 1: Check if we have 6 words submitted
  if (submittedWordsHistory.length >= 6) return true;

  // Step 2: Check for a perfect game
  if (score >= 32) return true;


  // Step 3: Check if there are any possible moves left
  const gameBoardLettersToCheck = getCurrentGameBoard();

  for (let i = 2; i <= 16; i++) {
    const iLetterWords = generateAllPossibleWords(gameBoardLettersToCheck, i);
    for (let word of iLetterWords) {
      if (isValidWord(word)) {
        return false;
      }
    }
  }
  return true;
}

function isValidWord(word) {
  const validWords = window.VALID_WORDS_BY_LENGTH[word.length] || [];
  return validWords.includes(word);
}

function getCurrentGameBoard() {
  const cells = document.querySelectorAll('.cell');
  const currentGameBoard = [];

  for (let i = 0; i < cells.length; i++) {
    const topCardLetter = cells[i].querySelector('.top')?.textContent ?? null;
    const bottomCardLetter = cells[i].querySelector('.bottom')?.textContent ?? null;
    const soloCardLetter = cells[i].querySelector('.solo')?.textContent ?? null;

    const lettersInCurrentCell = []

    if (soloCardLetter && !topCardLetter && !bottomCardLetter) {
      lettersInCurrentCell.push(soloCardLetter);
    } else {
      if (topCardLetter) lettersInCurrentCell.push(topCardLetter)
      if (bottomCardLetter) lettersInCurrentCell.push(bottomCardLetter)
    }

    if (lettersInCurrentCell.length > 0) currentGameBoard.push(lettersInCurrentCell);
  }
  return currentGameBoard
}

function generateAllPossibleWords(gameboardLetters, n) {
  const results = [];

  function recursiveWordBuilder(currentWord, availableLetters) {
    if (currentWord.length === n) {
      results.push(currentWord.join(''));
      return;
    }

    for (let i = 0; i < availableLetters.length; i++) {
      if (availableLetters[i].length === 0) continue;

      const availableLettersCopy = availableLetters.map(pairs => [...pairs]);
      const nextLetter = availableLettersCopy[i].shift();

      recursiveWordBuilder([...currentWord, nextLetter], availableLettersCopy);
    }
  }

  recursiveWordBuilder([], gameboardLetters);

  return results;
}


// === HELPER FUNCTIONS === 
async function incorrectShakeElement(el) {
  el.classList.add('incorrect-shake');
  await new Promise(resolve => setTimeout(resolve, 500));
  el.classList.remove('incorrect-shake');
}

function updateWelcomeModal() {
  dateElement.innerText = textDate;
  puzzleNumberElement.innerText = `No. ${textPuzzleNumber}`;
}

function greyOutCards() {
  const leftOverGreenCards = document.querySelectorAll('#game-board .cell .card.green');
  const leftOverBlueCards = document.querySelectorAll('#game-board .cell .card.blue');

  for (let card of leftOverGreenCards) card.classList.add('game-over');
  for (let card of leftOverBlueCards) card.classList.add('game-over');
}

function unGreyOutCards() {
  const leftOverCards = document.querySelectorAll('#game-board .cell .card.game-over');
  if (leftOverCards.length) {
    for (let card of leftOverCards) {
      card.classList.remove('game-over')
    }
  }
}


function displayMessage(text, type = 'error', duration = 2500) {
  banner.textContent = text;
  banner.className = ''; // reset
  banner.classList.add(type === 'error' ? 'error' : 'success');
  banner.classList.remove('hidden');

  if (type === 'success') {
    banner.classList.add('success') // green
  } else {
    banner.classList.add('error'); // red
  }

  // Hide after duration
  setTimeout(() => {
    banner.classList.add('hidden');
  }, duration);
}

// helper function to remove focus after button click:
function addBlurredClickListener(element, handler) {
  element.addEventListener('click', (e) => {
    e.currentTarget.blur();
    handler(e);
  });
}

function setAllButtonStates() {
  // check if there are undo moves and set undo button
  if (moveHistory.length === 0 && submittedWordsHistory.length === 0) {
    restartButton.disabled = true;
    undoButton.disabled = true;
  } else {
    undoButton.disabled = false;
    restartButton.disabled = false;
  }

  // check if the current board is submittable
  if (moveHistory.length < 2 || moveHistory.length > 16) {
    submitButton.disabled = true;
  } else submitButton.disabled = false;
}

function updateWordGuessWrapperLayout() {
  const isOverflowing = wordGuessWrapper.scrollWidth > wordGuessWrapper.clientWidth;

  if (isOverflowing) {
    wordGuessWrapper.classList.add('scroll-mode');
    wordGuessWrapper.scrollLeft = wordGuessWrapper.scrollWidth;
  } else {
    wordGuessWrapper.classList.remove('scroll-mode');
    wordGuessWrapper.scrollLeft = 0;
  }
}

// === LANDSCAPE WARNING MODAL ===

function shouldShowWarning() {
  const height = window.innerHeight;
  const width = window.innerWidth;
  const aspectRatio = width / height;

  return (height <= 650 && aspectRatio > 1.8) || (height < 400 && aspectRatio > 1);
}

function updateLandscapeWarningModal() {
  const landscapeWarningModal = document.getElementById('landscape-warning');

  landscapeWarningModal.classList.toggle('hidden', !shouldShowWarning());
}



// === ALERT MODAL ===

function showConfirmRestartModal() {
  isModalOpen = true;
  const modal = document.getElementById('alert-modal');
  const title = document.getElementById('alert-modal-title');
  const subTitle = document.getElementById('alert-modal-sub-title');
  const text = document.getElementById('alert-modal-text');

  if (title) title.remove();
  if (text) text.remove();
  if (alertModalLeftButton) alertModalLeftButton.remove();
  subTitle.textContent = `Are you sure you want to restart?`;

  modal.classList.remove('hidden');
}


// === GAME OVER MODAL ===

function showGameOverModal() {
  isModalOpen = true;
  const modal = document.getElementById('game-over-modal');
  const title = document.getElementById('game-over-title');
  const subTitle = document.getElementById('game-over-sub-title');
  const stats = document.getElementById('game-over-stats');
  const wordList = document.getElementById('game-over-summary-section');

  const score = calculateScore();
  const lettersLeft = 32 - score;
  const wordsUsed = submittedWordsHistory.length;

  // Title message
  if (lettersLeft >= 1) {
    title.textContent = 'Game Over';
    subTitle.textContent = `Play again to try for a perfect score!`;
  } else if (score >= 32 && wordsUsed === 6) {
    title.textContent = `Perfect in ${wordsUsed}!`;
    subTitle.textContent = `Can you clear the board in 5?`;
  } else if (score >= 32 && wordsUsed <= 5) {
    title.textContent = `Perfect in ${wordsUsed}!`;
    subTitle.textContent = `Well done! See you tomorrow.`;
  }

  stats.textContent = `Score: ${score} / 32 | Words: ${wordsUsed} / 6`;

  wordList.innerHTML = '';

  for (let word of submittedWordsHistory) {
    createWordForGameOverSummarySection(word)
  }
  modal.classList.remove('hidden');
}

function createWordForGameOverSummarySection(historyWordObj) {
  if (historyWordObj.word.length !== historyWordObj.cards.length) {
    console.log('error while generating summary word: word length does not match card length');
    return
  }

  const wordList = document.getElementById('game-over-summary-section');
  const summaryWord = document.createElement('div');
  summaryWord.classList.add('summary-section-word');

  for (let i = 0; i < historyWordObj.word.length; i++) {
    const historyCard = historyWordObj.cards[i];
    const historyLetter = historyWordObj.word[i];

    const summaryLetter = document.createElement('div');

    summaryLetter.classList.add('game-over-card');
    summaryLetter.innerHTML = `<span>${historyLetter}</span>`;

    if (historyCard.classList.contains('green')) summaryLetter.classList.add('green');
    if (historyCard.classList.contains('blue')) summaryLetter.classList.add('blue');

    summaryWord.appendChild(summaryLetter);
  }
  wordList.appendChild(summaryWord)
}

function createEmojiArray() {
  const finalWords = document.querySelectorAll('.summary-section-word');
  const emojiArray = [];

  for (let word of finalWords) {
    const squares = word.querySelectorAll('.game-over-card');
    let emojiWord = ''
    for (let square of squares) {
      if (square.classList.contains('green')) emojiWord += '🟩';
      if (square.classList.contains('blue')) emojiWord += '🟦';
    }
    emojiArray.push(emojiWord);
  }

  return emojiArray;
}

function createShareMessage() {
  const score = calculateScore();
  const numOfWordsUsed = submittedWordsHistory.length;
  const emojiArray = createEmojiArray();
  const emojiLines = emojiArray.join('\n');

  const lines = [
    `Six Words #${textPuzzleNumber}`,
    `I scored ${score} points in ${numOfWordsUsed} words!`,
    emojiLines,
  ]

  return lines.join('\r\n').trim();
}

function createMobileShareMessage() {
  const score = calculateScore();
  const numOfWordsUsed = submittedWordsHistory.length;
  const emojiArray = createEmojiArray();
  const emojiLines = emojiArray.join('\n');

  const lines = [
    `I scored ${score} points in ${numOfWordsUsed} words!`,
    emojiLines,
  ]

  return lines.join('\r\n').trim();
}

function isMobileDevice() {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function shareResults() {
  const message = createShareMessage();
  const mobileMessage = createMobileShareMessage();

  if (isMobileDevice() && navigator.share) {
    navigator.share({
      title: `Six Words #${textPuzzleNumber}`,
      text: mobileMessage,
    }).then(() => {
      console.log("Shared successfully!");
    }).catch((err) => {
      console.error("Sharing was cancelled or failed:", err);
    });
  } else {
    navigator.clipboard.writeText(message)
      .then(() => {
        displayMessage('Copied to clipboard', 'success');
      })
      .catch((err) => {
        console.error("Failed to copy results to clipboard:", err);
      });
  }
}

async function shakeIfTooManyWords() {
  if (moveHistory.length > 16) {
    const currentGuess = document.querySelectorAll('#word-guess-wrapper .card');
    const lastLetter = currentGuess[currentGuess.length - 1];
    await incorrectShakeElement(lastLetter);
    undoLastLetterPlaced();
  }
}

function updateFocusableElements() {
  const topCards = document.querySelectorAll('#game-board .card.top, #game-board .card.solo');
  const guessCards = document.querySelectorAll('#word-guess-wrapper .card');

  const bottomCards = document.querySelectorAll('#game-board .card.bottom');
  const submittedCards = document.querySelectorAll('#scoreboard .card');
  const greyCards = document.querySelectorAll('#game-board .card.game-over')

  for (let card of [...topCards, ...guessCards]) {
    card.setAttribute('tabindex', '0');
  }

  for (let card of [...bottomCards, ...submittedCards, ...greyCards]) {
    card.removeAttribute('tabindex')
  }
}