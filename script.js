document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration & State ---
    const DIFFICULTY_SETTINGS = {
        "1": { name: "Novice", length: [4, 5], words: 5, attempts: 4 },
        "2": { name: "Advanced", length: [6, 7], words: 8, attempts: 4 },
        "3": { name: "Expert", length: [8, 9], words: 12, attempts: 4 },
        "4": { name: "Master", length: [10, 12], words: 15, attempts: 4 },
    };
    const JUNK_CHARS = "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~" + "0123456789";
    const START_ADDRESS = 0xF600;
    const ADDRESS_INCREMENT = 0x10;
    const BASE_TOTAL_LINES = 24; // 12 rows per column
    const NUM_DUD_REMOVERS = 2; // How many dud remover brackets to generate
    const NUM_ATTEMPT_RESETS = 1; // How many reset brackets to generate
    const LOCKOUT_TIME_SECONDS = 10;

    // Calculate layout constants based on 80 columns
    const TOTAL_COLUMNS = 80;
    const CONTAINER_PADDING_LR = 2; // 1ch left + 1ch right padding in #terminal
    const GRID_COLUMNS = 2;
    const ADDRESS_WIDTH = 6; // "0xFFFF "
    const SPACE_AFTER_ADDRESS = 1;
    const GRID_AVAILABLE_WIDTH = TOTAL_COLUMNS - CONTAINER_PADDING_LR;
    const WIDTH_PER_COLUMN = Math.floor(GRID_AVAILABLE_WIDTH / GRID_COLUMNS); // = 39
    const CONTENT_WIDTH = WIDTH_PER_COLUMN - ADDRESS_WIDTH - SPACE_AFTER_ADDRESS; // 39 - 6 - 1 = 32
    const BRACKET_TYPES = ["()", "[]", "{}", "<>"];

    // Game State
    let attemptsLeft = 0;
    let maxAttempts = 0;
    let wordLength = 0;
    let potentialPasswords = [];
    let correctPassword = '';
    let activePasswords = []; // Words currently clickable on screen
    let activeBrackets = []; // { id, type ('dud'/'reset'), element } - Stores active bracket info
    let dudRemoversAvailable = NUM_DUD_REMOVERS; // Track generated, not remaining clicks
    let attemptResetsAvailable = NUM_ATTEMPT_RESETS;
    let isLockedOut = false;
    let lockoutIntervalId = null;
    let currentDifficulty = null;
    let highlightedElement = null; // Track currently highlighted span

    // --- DOM Elements ---
    const gridContainer = document.getElementById('grid-container');
    const attemptsLeftText = document.getElementById('attempts-left-text');
    const attemptBlocksContainer = document.getElementById('attempt-blocks');
    const feedbackArea = document.getElementById('feedback-area');
    // Control buttons DOM elements removed
    const overlay = document.getElementById('overlay');
    const difficultySelector = document.getElementById('difficulty-selector');
    const lockoutMessage = document.getElementById('lockout-message');
    const successMessage = document.getElementById('success-message');
    const correctPasswordReveal = document.getElementById('correct-password-reveal');
    const lockoutTimerSpan = document.getElementById('lockout-timer');
    const playAgainButton = document.getElementById('play-again-button');


    // --- Helper Functions ---
    function getRandomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
    function shuffleArray(array) { for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[array[i], array[j]] = [array[j], array[i]]; } return array; }
    function getWordsOfLength(minLength, maxLength) { return ALL_WORDS.filter(word => word.length >= minLength && word.length <= maxLength); }
    function generateJunk(length) { length = Math.max(0, length); let r = ''; for (let i = 0; i < length; i++) { r += JUNK_CHARS[Math.floor(Math.random() * JUNK_CHARS.length)]; } return r; }
    function formatAddress(addressValue) { return `0x${addressValue.toString(16).toUpperCase()}`; }
    function calculateLikeness(guess, correct) { let l = 0; for (let i = 0; i < correct.length; i++) { if (i < guess.length && guess[i] === correct[i]) { l++; } } return l; }


    // --- Game Logic ---
    function startGame(difficultySetting) {
        currentDifficulty = difficultySetting;
        attemptsLeft = difficultySetting.attempts;
        maxAttempts = difficultySetting.attempts;
        wordLength = getRandomInt(difficultySetting.length[0], difficultySetting.length[1]);
        const numWords = difficultySetting.words;
        dudRemoversAvailable = NUM_DUD_REMOVERS;
        attemptResetsAvailable = NUM_ATTEMPT_RESETS;
        isLockedOut = false;
        activeBrackets = []; // Clear active brackets
        clearInterval(lockoutIntervalId);

        const availableWords = getWordsOfLength(wordLength, wordLength);
        if (availableWords.length < numWords) {
            displayFeedback(`Error: Not enough words of length ${wordLength}. Found ${availableWords.length}, need ${numWords}.`);
            showOverlay('difficulty');
            return;
        }

        potentialPasswords = shuffleArray([...availableWords]).slice(0, numWords);
        correctPassword = potentialPasswords[getRandomInt(0, potentialPasswords.length - 1)];
        activePasswords = [...potentialPasswords];

        updateAttemptsDisplay();
        displayFeedback('');
        generateGrid(); // Generate grid, including brackets

        overlay.classList.remove('active');
        hideOverlayMessages();
    }

    function generateGrid() {
        gridContainer.innerHTML = ''; // Clear previous grid
        const safeContentWidth = Math.max(1, CONTENT_WIDTH);
        const linesPerColumn = Math.max(Math.ceil(BASE_TOTAL_LINES / 2), Math.ceil((potentialPasswords.length + dudRemoversAvailable + attemptResetsAvailable + 5) / 2));
        const totalLines = linesPerColumn * 2;

        let wordsToPlace = [...potentialPasswords];
        let bracketsToPlace = [];
        for (let i = 0; i < dudRemoversAvailable; i++) bracketsToPlace.push({ type: 'dud' });
        for (let i = 0; i < attemptResetsAvailable; i++) bracketsToPlace.push({ type: 'reset' });
        shuffleArray(bracketsToPlace);

        let lineData = [];
        let currentAddress = START_ADDRESS;
        let placementIndices = shuffleArray([...Array(totalLines).keys()]);
        let itemPlacements = {}; // index -> { type: 'word'/'bracket', value: word/bracketInfo }

        // Place words first
        wordsToPlace.forEach(word => {
            if (placementIndices.length > 0) {
                itemPlacements[placementIndices.pop()] = { type: 'word', value: word };
            }
        });
        // Place brackets in remaining spots
        bracketsToPlace.forEach(bracketInfo => {
            if (placementIndices.length > 0) {
                itemPlacements[placementIndices.pop()] = { type: 'bracket', value: bracketInfo };
            }
        });

        activeBrackets = []; // Reset bracket tracking for this grid generation
        let bracketIdCounter = 0;

        // Build line data and DOM structure
        for (let lineIndex = 0; lineIndex < totalLines; lineIndex++) {
            const address = formatAddress(currentAddress);
            const placement = itemPlacements[lineIndex];
            let lineContentSpans = []; // Array of span elements for this line

            if (placement?.type === 'word' && placement.value.length <= safeContentWidth) {
                const word = placement.value;
                const prefixLen = getRandomInt(0, safeContentWidth - word.length);
                const suffixLen = safeContentWidth - prefixLen - word.length;

                if (prefixLen > 0) lineContentSpans.push(createJunkSpan(generateJunk(prefixLen)));
                lineContentSpans.push(createWordSpan(word));
                if (suffixLen > 0) lineContentSpans.push(createJunkSpan(generateJunk(suffixLen)));

            } else if (placement?.type === 'bracket') {
                const bracketType = BRACKET_TYPES[getRandomInt(0, BRACKET_TYPES.length - 1)];
                const innerJunkLen = getRandomInt(1, 5); // Junk inside brackets
                const bracketPairLen = 2 + innerJunkLen;

                if (bracketPairLen <= safeContentWidth) {
                    const prefixLen = getRandomInt(0, safeContentWidth - bracketPairLen);
                    const suffixLen = safeContentWidth - prefixLen - bracketPairLen;
                    const bracketId = `bracket-${bracketIdCounter++}`;
                    const bracketEffect = placement.value.type; // 'dud' or 'reset'

                    if (prefixLen > 0) lineContentSpans.push(createJunkSpan(generateJunk(prefixLen)));

                    // Create a single span wrapping the whole bracket pair
                    const bracketSpan = document.createElement('span');
                    bracketSpan.classList.add('bracket-pair');
                    bracketSpan.dataset.bracketId = bracketId;
                    bracketSpan.dataset.effect = bracketEffect;
                    bracketSpan.textContent = bracketType[0] + generateJunk(innerJunkLen) + bracketType[1];
                    lineContentSpans.push(bracketSpan);

                    // Store bracket info for later lookup
                    activeBrackets.push({
                        id: bracketId,
                        type: bracketEffect,
                        element: bracketSpan // Direct reference to the element
                    });

                    if (suffixLen > 0) lineContentSpans.push(createJunkSpan(generateJunk(suffixLen)));

                } else {
                    // Bracket doesn't fit, fill with junk
                    lineContentSpans.push(createJunkSpan(generateJunk(safeContentWidth)));
                }
            } else {
                // No item or word didn't fit, fill line with junk
                lineContentSpans.push(createJunkSpan(generateJunk(safeContentWidth)));
            }

             // Create the line container and add elements
            const lineDiv = document.createElement('div');
            lineDiv.classList.add('grid-line');
            // lineDiv.dataset.lineIndex = lineIndex; // Not strictly needed anymore

            const addressSpan = document.createElement('span');
            addressSpan.classList.add('address');
            addressSpan.textContent = address;
            lineDiv.appendChild(addressSpan);

            const contentSpan = document.createElement('span');
            contentSpan.classList.add('content');
            lineContentSpans.forEach(span => contentSpan.appendChild(span));
            lineDiv.appendChild(contentSpan);

            gridContainer.appendChild(lineDiv);
            currentAddress += ADDRESS_INCREMENT;
        }
    }

    // Helper functions to create specific spans
    function createJunkSpan(text) {
        const span = document.createElement('span');
        span.classList.add('junk');
        span.textContent = text;
        return span;
    }
    function createWordSpan(word) {
        const span = document.createElement('span');
        span.classList.add('password');
        span.textContent = word;
        span.dataset.word = word;
        return span;
    }


    function updateAttemptsDisplay() {
        attemptsLeftText.textContent = attemptsLeft;
        attemptBlocksContainer.innerHTML = '';
        for (let i = 0; i < maxAttempts; i++) {
            const block = document.createElement('span');
            if (i >= attemptsLeft) {
                block.classList.add('empty');
            }
            attemptBlocksContainer.appendChild(block);
        }
    }
    // Removed updateControlCounts as there are no buttons

    function displayFeedback(message) {
        feedbackArea.textContent = message;
    }

    // --- Event Handling ---
function handleMouseOver(event) {
        if (isLockedOut) return;

        // Determine the actual target SPAN (.password, .bracket-pair, .junk)
        let targetSpan = event.target;
        if (targetSpan.nodeType === Node.TEXT_NODE) {
            // If hovering over text, get the parent span
            targetSpan = targetSpan.parentNode;
        }

        // Ensure it's one of the spans we care about AND it's not deactivated
        if (
            targetSpan && // Check if targetSpan is valid
            (targetSpan.classList.contains('password') || targetSpan.classList.contains('bracket-pair') || targetSpan.classList.contains('junk')) &&
            !targetSpan.classList.contains('guessed') &&
            !targetSpan.classList.contains('removed-dud') &&
            !targetSpan.classList.contains('bracket-deactivated')
           )
        {
            // Only add highlight if it's different from the currently highlighted one
            if (targetSpan !== highlightedElement) {
                clearHighlight(); // Clear previous highlight first
                targetSpan.classList.add('hover-highlight');
                highlightedElement = targetSpan; // Track the newly highlighted span
            }
        } else {
            // If hovering over something else (like the gaps, .content, .grid-line), clear any existing highlight
            clearHighlight();
        }
    }

function handleMouseOut(event) {
         // When moving out of the *entire grid container*, clear the highlight.
         // We rely on mouseover onto a *new* element to clear the highlight
         // if moving between valid spans within the grid.
         // However, if the relatedTarget (where the mouse moved TO) is outside
         // the grid container, we definitely need to clear.
        if (isLockedOut) return;

        if (!gridContainer.contains(event.relatedTarget)) {
             clearHighlight();
        }
         // Optimization: We could also check if event.target was the highlightedElement
         // and clear it, but relying on mouseover onto the new target is often sufficient.
    }

    function clearHighlight() {
        if (highlightedElement) {
            highlightedElement.classList.remove('hover-highlight');
            highlightedElement = null; // Reset tracker
        }
        // Fallback cleanup (usually not needed with good tracking)
        // const strayHighlights = gridContainer.querySelectorAll('.hover-highlight');
        // if (strayHighlights.length > 0) {
        //     strayHighlights.forEach(el => el.classList.remove('hover-highlight'));
        // }
    }

    function handleGridClick(event) {
        if (isLockedOut) return;

        let target = event.target;
        if (target.nodeType === Node.TEXT_NODE) {
            target = target.parentNode;
        }

        // 1. Check for Word Click (only if not guessed/removed)
        if (target.classList.contains('password') && !target.classList.contains('guessed') && !target.classList.contains('removed-dud')) {
            const guessedWord = target.dataset.word;
            if (!activePasswords.includes(guessedWord)) {
                displayFeedback(`>>> '${guessedWord}' already tried or removed.`);
                return;
            }
            activePasswords = activePasswords.filter(w => w !== guessedWord);
            processGuess(guessedWord, target);
            clearHighlight(); // Clear highlight after click processing
            return;
        }

        // 2. Check for Bracket Click (only if not deactivated)
        if (target.classList.contains('bracket-pair') && !target.classList.contains('bracket-deactivated')) {
            const bracketId = target.dataset.bracketId;
            const bracketEffect = target.dataset.effect;
            const activeBracketIndex = activeBrackets.findIndex(b => b.id === bracketId);

            if (activeBracketIndex !== -1) {
                if (bracketEffect === 'dud') {
                    triggerDudEffect(); // Don't need target element anymore
                } else if (bracketEffect === 'reset') {
                    triggerResetEffect(); // Don't need target element anymore
                }
                // Deactivate visually and logically
                target.classList.remove('bracket-pair', 'hover-highlight');
                target.classList.add('bracket-deactivated');
                target.textContent = '.'.repeat(target.textContent.length);
                activeBrackets.splice(activeBracketIndex, 1);
                clearHighlight();
            }
            return;
        }
        // Clicked on junk or deactivated item - clear feedback
         displayFeedback("");
    }


    function processGuess(guessedWord, wordSpanElement) {
        if (guessedWord === correctPassword) {
            wordSpanElement.classList.remove('password', 'hover-highlight');
            displayFeedback(`>>> ${guessedWord}\n>>> Exact match!\n>>> Please wait while system is accessed.`);
            handleSuccess();
        } else {
            attemptsLeft--;
            const likeness = calculateLikeness(guessedWord, correctPassword);
            displayFeedback(`>>> ${guessedWord}\n>>> Entry denied.\n>>> Likeness=${likeness}`);
            updateAttemptsDisplay();

            wordSpanElement.classList.remove('password', 'hover-highlight');
            wordSpanElement.classList.add('guessed');
            wordSpanElement.textContent = '_'.repeat(guessedWord.length);

            if (attemptsLeft <= 0) {
                handleFailure();
            }
        }
    }


    function triggerDudEffect() {
        if (activePasswords.length <= 1) {
            displayFeedback(">>> Only the correct password remains!");
            return;
        }
        let duds = activePasswords.filter(w => w !== correctPassword);
        if (duds.length === 0) {
            displayFeedback(">>> Error: No duds found to remove?");
            return;
        }
        const dudToRemove = duds[getRandomInt(0, duds.length - 1)];
        activePasswords = activePasswords.filter(w => w !== dudToRemove);
        displayFeedback(">>> Bracket Pair Activated: Dud Removed.");
        const dudSpan = gridContainer.querySelector(`.password[data-word="${dudToRemove}"]`);
        if (dudSpan) {
            dudSpan.classList.remove('password', 'hover-highlight');
            dudSpan.classList.add('removed-dud');
            dudSpan.textContent = '.'.repeat(dudToRemove.length);
        }
    }

    function triggerResetEffect() {
        attemptsLeft = maxAttempts;
        updateAttemptsDisplay();
        displayFeedback(">>> Bracket Pair Activated: Attempts Replenished!");
    }


    function handleSuccess() {
        isLockedOut = true;
        showOverlay('success');
    }
    function handleFailure() {
        isLockedOut = true;
        correctPasswordReveal.textContent = correctPassword;
        lockoutTimerSpan.textContent = LOCKOUT_TIME_SECONDS;
        showOverlay('lockout');
        let timer = LOCKOUT_TIME_SECONDS;
        lockoutIntervalId = setInterval(() => {
            timer--;
            lockoutTimerSpan.textContent = timer;
            if (timer <= 0) {
                clearInterval(lockoutIntervalId);
                 displayFeedback("Lockout expired. Restarting terminal...");
                 setTimeout(() => startGame(currentDifficulty), 1500);
            }
        }, 1000);
     }

    function showOverlay(type) {
        hideOverlayMessages();
        overlay.classList.add('active');
        if (type === 'difficulty') {
            difficultySelector.style.display = 'block';
        } else if (type === 'lockout') {
            lockoutMessage.style.display = 'block';
        } else if (type === 'success') {
            successMessage.style.display = 'block';
        }
    }
    function hideOverlayMessages() {
        difficultySelector.style.display = 'none';
        lockoutMessage.style.display = 'none';
        successMessage.style.display = 'none';
    }


    // --- Event Listeners ---
    difficultySelector.addEventListener('click', (event) => {
         if (event.target.tagName === 'BUTTON') {
            const difficultyLevel = event.target.dataset.difficulty;
            if (DIFFICULTY_SETTINGS[difficultyLevel]) {
                startGame(DIFFICULTY_SETTINGS[difficultyLevel]);
            }
        }
     });
    playAgainButton.addEventListener('click', () => { showOverlay('difficulty'); });

    // Use event delegation for hover and click on the grid
    gridContainer.addEventListener('mouseover', handleMouseOver);
    gridContainer.addEventListener('mouseout', handleMouseOut);
    gridContainer.addEventListener('click', handleGridClick);


    // --- Initial Setup ---
    showOverlay('difficulty');

}); // End DOMContentLoaded