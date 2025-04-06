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
    const hoverPreviewSpan = document.getElementById('hover-preview'); // <<< Reference for hover preview


    // --- Helper Functions ---
    function getRandomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
    function shuffleArray(array) { for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[array[i], array[j]] = [array[j], array[i]]; } return array; }
    function getWordsOfLength(minLength, maxLength) { return ALL_WORDS.filter(word => word.length >= minLength && word.length <= maxLength); }
    function generateJunk(length) { length = Math.max(0, length); let r = ''; for (let i = 0; i < length; i++) { r += JUNK_CHARS[Math.floor(Math.random() * JUNK_CHARS.length)]; } return r; }
    function formatAddress(addressValue) { return `0x${addressValue.toString(16).toUpperCase()}`; }
    function calculateLikeness(guess, correct) { let l = 0; for (let i = 0; i < correct.length; i++) { if (i < guess.length && guess[i] === correct[i]) { l++; } } return l; }


    // --- Game Logic ---
    function startGame(difficultySetting) {
        const difficultyKey = Object.keys(DIFFICULTY_SETTINGS).find(key => DIFFICULTY_SETTINGS[key] === difficultySetting);
        if (!difficultyKey) {
            console.error("Could not determine difficulty key.");
            showOverlay('difficulty');
            return;
        }

        currentDifficulty = difficultySetting;
        attemptsLeft = difficultySetting.attempts;
        maxAttempts = difficultySetting.attempts;
        dudRemoversAvailable = NUM_DUD_REMOVERS;
        attemptResetsAvailable = NUM_ATTEMPT_RESETS;
        isLockedOut = false;
        activeBrackets = [];
        clearInterval(lockoutIntervalId);

        const selectedSet = getRandomWordSet(difficultyKey, DIFFICULTY_SETTINGS);

        if (!selectedSet) {
            displayFeedback(`Error: No valid word sets configured for ${difficultySetting.name} difficulty. Check words.js.`);
            showOverlay('difficulty');
            return;
        }

        potentialPasswords = selectedSet;
        wordLength = potentialPasswords[0].length;
        correctPassword = potentialPasswords[getRandomInt(0, potentialPasswords.length - 1)];
        activePasswords = [...potentialPasswords];

        updateAttemptsDisplay();
        displayFeedback('');
        generateGrid();

        overlay.classList.remove('active');
        hideOverlayMessages();
    }

    function generateGrid() {
        gridContainer.innerHTML = ''; // Clear previous grid
        const targetContentWidth = Math.max(1, CONTENT_WIDTH-1); // Use fixed width for padding logic

        const linesPerColumn = Math.max(Math.ceil(BASE_TOTAL_LINES / 2), Math.ceil((potentialPasswords.length + dudRemoversAvailable + attemptResetsAvailable + 5) / 2));
        const totalLines = linesPerColumn * 2;

        let wordsToPlace = [...potentialPasswords];
        let bracketsToPlace = [];
        for (let i = 0; i < dudRemoversAvailable; i++) bracketsToPlace.push({ type: 'dud' });
        for (let i = 0; i < attemptResetsAvailable; i++) bracketsToPlace.push({ type: 'reset' });
        shuffleArray(bracketsToPlace);

        let currentAddress = START_ADDRESS;
        let placementIndices = shuffleArray([...Array(totalLines).keys()]);
        let itemPlacements = {};

        wordsToPlace.forEach(word => {
            if (placementIndices.length > 0) {
                itemPlacements[placementIndices.pop()] = { type: 'word', value: word };
            }
        });
        bracketsToPlace.forEach(bracketInfo => {
            if (placementIndices.length > 0) {
                itemPlacements[placementIndices.pop()] = { type: 'bracket', value: bracketInfo };
            }
        });

        activeBrackets = [];
        let bracketIdCounter = 0;

        // --- Function to append individual junk character spans ---
        const appendJunkChars = (spanArray, count) => {
            const junkString = generateJunk(count);
            for (let char of junkString) {
                const junkCharSpan = document.createElement('span');
                junkCharSpan.classList.add('junk');
                junkCharSpan.textContent = char;
                spanArray.push(junkCharSpan);
            }
        };
        // --- End helper ---

        // Build line data and DOM structure
        for (let lineIndex = 0; lineIndex < totalLines; lineIndex++) {
            const address = formatAddress(currentAddress);
            const placement = itemPlacements[lineIndex];
            let lineContentSpans = []; // Array of span DOM elements
            let currentLineLength = 0; // Track length of content added

            // Determine primary content (word, bracket, or initial junk)
            if (placement?.type === 'word' && placement.value.length <= targetContentWidth) {
                const word = placement.value;
                const prefixLen = getRandomInt(0, targetContentWidth - word.length);

                if (prefixLen > 0) {
                    appendJunkChars(lineContentSpans, prefixLen); // Use new function
                    currentLineLength += prefixLen;
                }
                lineContentSpans.push(createWordSpan(word)); // Keep createWordSpan
                currentLineLength += word.length;

            } else if (placement?.type === 'bracket') {
                const bracketType = BRACKET_TYPES[getRandomInt(0, BRACKET_TYPES.length - 1)];
                const innerJunkLen = getRandomInt(1, 5);
                const bracketPairLen = 2 + innerJunkLen;

                if (bracketPairLen <= targetContentWidth) {
                    const prefixLen = getRandomInt(0, targetContentWidth - bracketPairLen);
                    const bracketId = `bracket-${bracketIdCounter++}`;
                    const bracketEffect = placement.value.type;
                    const innerJunkString = generateJunk(innerJunkLen); // Generate inner junk once

                    if (prefixLen > 0) {
                        appendJunkChars(lineContentSpans, prefixLen); // Use new function
                        currentLineLength += prefixLen;
                    }

                    // Create a wrapper span for the bracket pair for easier targeting/styling
                    const bracketWrapperSpan = document.createElement('span');
                    bracketWrapperSpan.classList.add('bracket-pair'); // Class on the wrapper
                    bracketWrapperSpan.dataset.bracketId = bracketId;
                    bracketWrapperSpan.dataset.effect = bracketEffect;

                    // Append individual spans inside the wrapper
                    const openBracketSpan = document.createElement('span');
                    openBracketSpan.classList.add('junk'); // Style brackets as junk maybe?
                    openBracketSpan.textContent = bracketType[0];
                    bracketWrapperSpan.appendChild(openBracketSpan);

                    // Append inner junk char by char
                    for (let char of innerJunkString) {
                         const innerJunkCharSpan = document.createElement('span');
                         innerJunkCharSpan.classList.add('junk');
                         innerJunkCharSpan.textContent = char;
                         bracketWrapperSpan.appendChild(innerJunkCharSpan);
                     }

                    const closeBracketSpan = document.createElement('span');
                    closeBracketSpan.classList.add('junk');
                    closeBracketSpan.textContent = bracketType[1];
                    bracketWrapperSpan.appendChild(closeBracketSpan);

                    lineContentSpans.push(bracketWrapperSpan); // Add the wrapper span
                    currentLineLength += bracketPairLen;

                    activeBrackets.push({
                        id: bracketId,
                        type: bracketEffect,
                        element: bracketWrapperSpan // Reference the wrapper
                    });

                } else {
                    // Bracket doesn't fit, fill with junk chars
                    appendJunkChars(lineContentSpans, targetContentWidth);
                    currentLineLength += targetContentWidth;
                }
            } else {
                // No specific item or word/bracket didn't fit. Fill with junk chars.
                 const initialJunkLen = getRandomInt(Math.min(10, targetContentWidth), targetContentWidth);
                 if(initialJunkLen > 0){
                     appendJunkChars(lineContentSpans, initialJunkLen);
                    currentLineLength += initialJunkLen;
                 }
            }

            // ** Pad the rest of the line with junk chars if necessary **
            if (currentLineLength < targetContentWidth) {
                const paddingNeeded = targetContentWidth - currentLineLength;
                 if (paddingNeeded > 0) {
                    appendJunkChars(lineContentSpans, paddingNeeded);
                 }
            }

            // Create the line container and add elements
            const lineDiv = document.createElement('div');
            lineDiv.classList.add('grid-line');

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

    // Keep createWordSpan function
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

        let targetSpan = event.target;
        if (targetSpan.nodeType === Node.TEXT_NODE) {
            targetSpan = targetSpan.parentNode;
        }

        const bracketWrapper = targetSpan.closest('.bracket-pair');

        let elementToHighlight = null;
        let previewText = ''; // Text to show in the preview span

        if (bracketWrapper && !bracketWrapper.classList.contains('bracket-deactivated')) {
            // Hovering inside an active bracket pair
            elementToHighlight = bracketWrapper;
            previewText = bracketWrapper.textContent; // Show full bracket text
        }
        // Else if not inside a bracket, check for word or individual junk
        else if (
            targetSpan && targetSpan.nodeType !== Node.TEXT_NODE && // Ensure it's an element
            (targetSpan.classList.contains('password') || targetSpan.classList.contains('junk')) &&
            !targetSpan.classList.contains('guessed') &&
            !targetSpan.classList.contains('removed-dud') &&
            !targetSpan.classList.contains('bracket-deactivated') && // Redundant check, but safe
            !targetSpan.closest('.bracket-pair') // Make sure it's not junk *inside* a bracket
           )
        {
            // Highlight individual word or junk span
            elementToHighlight = targetSpan;
            previewText = targetSpan.textContent; // Show word or single junk char
        }

        // Apply highlight and update preview text if a valid target was found
        if (elementToHighlight) {
             if (elementToHighlight !== highlightedElement) {
                clearHighlight(); // Clear previous highlight and preview
                elementToHighlight.classList.add('hover-highlight');
                highlightedElement = elementToHighlight;
                hoverPreviewSpan.textContent = previewText; // Update preview text
            }
        } else {
            // Hovering over something non-highlightable, clear any existing highlight and preview
            clearHighlight();
        }
    }

    function handleMouseOut(event) {
        // When moving out of the *entire grid container*, clear the highlight.
        if (isLockedOut) return;
        if (!gridContainer.contains(event.relatedTarget)) {
             clearHighlight();
        }
    }

    function clearHighlight() {
        if (highlightedElement) {
            highlightedElement.classList.remove('hover-highlight');
            highlightedElement = null; // Reset tracker
        }
        hoverPreviewSpan.textContent = ''; // Clear preview text whenever highlight is cleared
    }


    function handleGridClick(event) {
        if (isLockedOut) return;

        let target = event.target;

        // Use highlightedElement if available (more reliable than click target sometimes)
        // Otherwise, determine target from click event
        let targetElement = highlightedElement || (target.nodeType === Node.TEXT_NODE ? target.parentNode : target);


        // 1. Check for Word Click
        if (targetElement && targetElement.classList.contains('password') && !targetElement.classList.contains('guessed') && !targetElement.classList.contains('removed-dud')) {
            const guessedWord = targetElement.dataset.word;
            if (!activePasswords.includes(guessedWord)) {
                displayFeedback(`>>> '${guessedWord}' already tried or removed.`);
                clearHighlight(); // Clear highlight even if invalid
                return;
            }
            activePasswords = activePasswords.filter(w => w !== guessedWord);
            processGuess(guessedWord, targetElement); // Pass the correct element
            // clearHighlight() will be called implicitly by mouse moving off
            return;
        }

        // 2. Check for Bracket Click (Check the wrapper)
        const bracketWrapper = targetElement ? targetElement.closest('.bracket-pair') : null; // Find closest bracket-pair ancestor or self
        if (bracketWrapper && !bracketWrapper.classList.contains('bracket-deactivated')) {
            const bracketId = bracketWrapper.dataset.bracketId;
            const bracketEffect = bracketWrapper.dataset.effect;
            const activeBracketIndex = activeBrackets.findIndex(b => b.id === bracketId);

            if (activeBracketIndex !== -1) {
                if (bracketEffect === 'dud') {
                    triggerDudEffect();
                } else if (bracketEffect === 'reset') {
                    triggerResetEffect();
                }
                // Deactivate wrapper visually and logically
                bracketWrapper.classList.remove('bracket-pair', 'hover-highlight');
                bracketWrapper.classList.add('bracket-deactivated');
                // Replace content of the wrapper with dots
                let currentLength = 0;
                 try { currentLength = bracketWrapper.textContent.length; } catch(e) { currentLength = 5; }
                 bracketWrapper.textContent = '.'.repeat(Math.max(1, currentLength));

                activeBrackets.splice(activeBracketIndex, 1);
                clearHighlight();
            }
            return;
        }
        // Clicked on junk or deactivated item - clear feedback and highlight
         displayFeedback("");
         clearHighlight();
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
        clearHighlight(); // Ensure no highlight remains on success
        showOverlay('success');
    }

    function handleFailure() {
        isLockedOut = true;
        clearHighlight(); // Ensure no highlight remains on failure
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
    playAgainButton.addEventListener('click', () => {
        clearHighlight(); // Clear any lingering state before restart
        showOverlay('difficulty');
    });

    // Use event delegation for hover and click on the grid
    gridContainer.addEventListener('mouseover', handleMouseOver);
    gridContainer.addEventListener('mouseout', handleMouseOut);
    gridContainer.addEventListener('click', handleGridClick);


    // --- Initial Setup ---
    showOverlay('difficulty');

}); // End DOMContentLoaded