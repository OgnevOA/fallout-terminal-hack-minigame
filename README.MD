# Fallout Terminal Hacking Emulator (Web Version)

This project is a web-based simulation of the iconic terminal hacking minigame found in the Fallout series (specifically resembling Fallout 3, New Vegas, 4, and 76). It's built purely with HTML, CSS, and vanilla JavaScript.

## Features

*   **Authentic Gameplay:** Simulates the core mechanics of guessing passwords based on "Likeness" feedback.
*   **Clickable Interface:** Interact with potential passwords and bracket pairs directly using your mouse.
*   **Bracket Mechanics:** Clickable bracket pairs `()`, `[]`, `{}`, `<>` randomly hidden in the junk data can remove dud passwords or replenish attempts.
*   **Difficulty Levels:** Choose from Novice, Advanced, Expert, and Master difficulties, affecting password length and the number of potential words.
*   **Visual Styling:** Mimics the retro monochrome terminal look with an 80-column layout.
*   **CRT Effect:** Includes optional scanlines, flicker, and glow effects for added aesthetic realism (CSS).
*   **Temporary Lockout:** Failing too many times results in a temporary lockout, just like in Fallout 4/76.
*   **No Dependencies:** Runs directly in any modern web browser with no external libraries needed.

## Tech Stack

*   HTML5
*   CSS3
*   JavaScript (ES6+)

## Getting Started / Running Locally

1.  **Clone or Download:** Get the project files onto your local machine.
    ```bash
    # If using git
    git clone <your-repository-url>
    cd <repository-folder>
    ```
    Or, simply download the ZIP and extract it.
2.  **Open `index.html`:** Navigate to the project folder and open the `index.html` file directly in your web browser (e.g., Chrome, Firefox, Edge, Safari).

That's it! No build steps or servers are required.

## How to Play

1.  **Select Difficulty:** Choose a difficulty level from the initial overlay.
2.  **Goal:** Find the correct password hidden among the words of the same length on the screen within the allowed number of attempts.
3.  **Attempts:** You have a limited number of guesses (usually 4), shown at the top.
4.  **Guessing:** Click on any word of the correct length displayed within the grid.
    *   **Correct:** You win and gain access!
    *   **Incorrect:** You lose an attempt, and the terminal displays `Likeness=X`. `X` is the number of letters in your guess that are in the exact same position as the letters in the correct password. The guessed word will be replaced with underscores `_`.
5.  **Bracket Pairs:** Scattered within the junk characters are bracket pairs like `(...)`, `[...]`, `{...}`, `<...>`.
    *   Hovering over them will highlight the entire bracket sequence.
    *   Clicking on an *active* bracket pair might trigger one of two effects:
        *   **Dud Removed:** An incorrect password option is removed from play (its text on screen will be replaced with dots `.`).
        *   **Attempts Replenished:** Your remaining attempts are reset to the maximum for the current difficulty.
    *   Once clicked, a bracket pair is deactivated and cannot be used again.
6.  **Winning:** Guess the correct password before running out of attempts.
7.  **Losing:** Run out of attempts. The terminal will lock you out temporarily, reveal the correct password, and then restart after a short delay.

## Project Structure
/
├── index.html # Main HTML structure
├── style.css # All CSS styling, including CRT effects
├── script.js # Core game logic and DOM manipulation
└── words.js # Contains the list of possible words (ALL_WORDS array)


## Customization

*   **Word List:** Add or remove words by editing the `ALL_WORDS` array in `words.js`. Ensure words are uppercase. More words, especially across various lengths (4-12+), improve variety.
*   **Visuals:** Modify `style.css` to change colors, fonts, layout, or the intensity/look of the CRT effects. Key variables and CRT styles are commented.
*   **Game Settings:** Constants like `NUM_DUD_REMOVERS`, `NUM_ATTEMPT_RESETS`, `LOCKOUT_TIME_SECONDS`, and `DIFFICULTY_SETTINGS` can be adjusted directly at the top of `script.js`.

## Deployment

This is a fully static website. You can easily deploy it to any static hosting service like:

*   [Netlify](https://www.netlify.com/) (Drag & Drop or Git integration)
*   [Vercel](https://vercel.com/)
*   [GitHub Pages](https://pages.github.com/)
*   Cloudflare Pages
*   etc.

Simply upload the four files (`index.html`, `style.css`, `script.js`, `words.js`) to your host.

## Future Improvements (Ideas)

*   Add optional keyboard navigation/selection.
*   Implement sound effects for typing, selection, success, failure, etc.
*   Integrate actual lore snippets from Fallout that could be displayed upon successful hacks.
*   Improve mobile responsiveness (though terminals are inherently desktop-like).
*   Refactor code for potentially better performance on very complex grids (though current vanilla JS should be fine).

## License

This project is likely intended for personal use/demonstration. If distributing, consider adding an open-source license like MIT:

**MIT License**

Copyright (c) [2025] [Oleg]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.