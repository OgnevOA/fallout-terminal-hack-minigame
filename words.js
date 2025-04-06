// words.js

// Word sets organized by difficulty level key from DIFFICULTY_SETTINGS
const WORD_SETS = {
    // Novice (Difficulty "1"): 5 words, 4-5 letters
    "1": [
        // Set 1.1 (Files/Data - 4 letters)
        ["FILE", "FILL", "FAIL", "FALL", "FOIL"],
        // Set 1.2 (Actions - 4 letters)
        ["LOCK", "LOAD", "LOOK", "LOOP", "LOOT"],
        // Set 1.3 (Basic Concepts - 5 letters)
        ["CODES", "NODES", "MODES", "CORES", "ROPES"],
        // Set 1.4 (Places/Things - 5 letters)
        ["VAULT", "FAULT", "VALVE", "VALUE", "VAPOR"],
        // Set 1.5 (Actions - 4 letters) - Note: Original comment mentioned 5, but words are 4 letters.
        ["SCAN", "SCAM", "SEAM", "SLAM", "SLAG"],
        // Set 1.6 (Security - 5 letters)
        ["GUARD", "GUIDE", "GUILD", "GRADE", "GRAVE"],
        // Set 1.7 (Time - 4 letters) - Added Option
        ["DATE", "LATE", "RATE", "GATE", "FATE"],
        // Set 1.8 (States - 5 letters) - Added Option
        ["STATE", "STALE", "STARE", "STAVE", "STAGE"],
        // Set 1.9 (Simple Objects - 4 letters) - Added Option
        ["DISK", "DESK", "RISK", "DUSK", "MASK"],
    ],

    // Advanced (Difficulty "2"): 8 words, 6-7 letters
    "2": [
        // Set 2.1 (System Actions - 6 letters)
        ["ACCESS", "ASSESS", "ACCEPT", "ASPECT", "ASSETS", "ARREST", "ACTION", "ACTIVE"],
        // Set 2.2 (Security/Control - 6 letters)
        ["SECURE", "SECRET", "SECTOR", "SELECT", "SERVER", "SENSOR", "SENTRY", "SENIOR"],
        // Set 2.3 (Data/Processing - 7 letters)
        ["COMMAND", "COMMENT", "COMPUTE", "CONNECT", "CONTENT", "CONTACT", "CONVERT", "CONFIRM"],
        // Set 2.4 (Power/Energy - 7 letters)
        ["REACTOR", "ROUTERS", "REPORTS", "REPAIRS", "READERS", "REASONS", "RECORDS", "RESTORE"],
        // Set 2.5 (Files/Storage - 7 letters)
        ["STORAGE", "STATION", "STATICS", "STAGING", "STRAINS", "STRANDS", "STRANGE", "STREAMS"],
        // Set 2.6 (Networking/Signals - 6 letters) - Added Option
        ["SIGNAL", "SINGLE", "SIMPLE", "SILENT", "SILVER", "SISTER", "SIGNUP", "SIGNED"],
        // Set 2.7 (Memory/Location - 7 letters) - Added Option
        ["POINTER", "PAINTER", "PRINTER", "POTTERS", "POSTERS", "PORTALS", "PONDERS", "POINTED"], // Adjusted some for consistency
        // Set 2.8 (Interface/Control - 7 letters) - Added Option
        ["CONTROL", "CONSOLE", "CONTOUR", "CONVOYS", "CONVOKE", "CONSORT", "CONTORT", "CONDONE"],
    ],

    // Expert (Difficulty "3"): 12 words, 8-9 letters
    "3": [
        // Set 3.1 (Security/Protocols - 8 letters)
        ["PASSWORD", "PASSPORT", "PASSCODE", "PASSAGES", "PASTIMES", "PAYLOADS", "PAYMENTS", "PATIENTS", "PATROLS", "PATTERNS", "PARAMOUR", "PARAGONS"], // Corrected PATROL to PATROLS
        // Set 3.2 (System Internals - 8 letters)
        // Note: TERRITOR likely intended as TERRITORY? Keeping as is.
        ["TERMINAL", "TERRITOR", "TUTORIAL", "TENSIONS", "TEXTURES", "TESTINGS", "THREATEN", "THRUSTED", "TRAINING", "TRANSFER", "TRANSMIT", "TRAPPING"],
         // Set 3.3 (Advanced Actions - 9 letters)
        ["CONFIGURE", "CONFIRMED", "CONSTRUCT", "CONTAINED", "CONNECTED", "CONTESTED", "CONTINUED", "CORRECTED", "CORRUPTED", "COMPLETED", "COMPUTERS", "COMPARING"],
        // Set 3.4 (Data Management - 9 letters)
        ["DATABASE", "DATAPOINT", "DECRYPTS", "DEFAULTS", "DELIVERY", "DEPLOYED", "DETECTED", "DEVICES", "DIRECTOR", "DISABLED", "DISASTER", "DISPOSAL"],
        // Set 3.5 (Execution/Process - 9 letters) - Added Option
        ["EXECUTION", "EXECUTING", "EXECUTIVE", "EXECUTORS", "EXCLUSION", "EXCURSION", "EXEMPTION", "EXERTIONS", "EXHAUSTED", "EXISTENCE", "EXPEDIENT", "EXPLICIT"], // Adjusted slightly
        // Set 3.6 (Compilation/Building - 9 letters) - Added Option
        ["COMPILING", "COMPLETED", "COMPLIANT", "COMPONENT", "COMPOSING", "COMPOSITE", "COMPOUNDS", "COMPRISED", "COMPRESS", "COMPUTING", "CONCEIVED", "CONCERNS"],
        // Set 3.7 (Analysis - 8 letters) - Added Option
        ["ANALYSIS", "ANALYZE", "ANALYST", "ANALOGUE", "ANALOGY", "ANGULAR", "ANIMALS", "ANIMATE", "ANNOUNCED", "ANNUALLY", "ANOMALY", "ANTENNAE"] // Similarity varies but fits length/count
    ],

    // Master (Difficulty "4"): 15 words, 10-12 letters
    "4": [
        // Set 4.1 (High Level Security - 10 letters)
        ["AUTHORIZED", "AUTHENTIC", "AUTOMATION", "ACTIVATION", "ALLOCATION", "ALTERATION", "ASSESSMENT", "ASSIGNMENT", "ATTACHMENT", "ATTEMPTING", "ATTRIBUTES", "ABERRATION", "ABANDONING", "ABSOLUTION", "ACCELERATE"],
        // Set 4.2 (System Operations - 11 letters)
        // Note: MODULETION likely intended as MODULATION? Keeping as is.
        ["MAINTENANCE", "MANIPULATE", "MANUFACTURE", "MASTERMINDS", "MEASUREMENT", "MECHANISMS", "MEMORANDUMS", "MESSAGING", "METHODOLOGY", "MINIMIZING", "MODERATORS", "MODIFICATION", "MODULETION", "MONITORING", "MOTIVATIONS"],
        // Set 4.3 (Complex States - 12 letters)
        ["CONFIGURATION", "COMMUNICATIONS", "COMPARTMENTS", "COMPLETENESS", "COMPREHENSION", "CONCENTRATION", "CONDENSATION", "CONDITIONING", "CONFIDENTIAL", "CONFRONTATION", "CONSTRUCTION", "CONTAMINATION", "CONTEMPLATION", "CONTINUATION", "CONTRIBUTIONS"],
         // Set 4.4 (Infrastructure/Control - 12 letters)
        // Note: ISOLATIONIST might be outlier thematically/structurally? Keeping as is.
        ["INFRASTRUCTURE", "INFILTRATION", "INITIATING", "INSTRUCTIONS", "INTELLIGENCE", "INTERCEPTION", "INTERFERENCE", "INTERROGATION", "INTERVENTION", "INTRODUCTION", "INVESTIGATOR", "IRRADIATION", "ISOLATIONIST", "JURISDICTION", "JUSTIFICATION"],
        // Set 4.5 (Processes/Actions - Mostly 11 letters) - Added Option
        ["GENERATION", "PENETRATION", "PERFORATION", "PERMUTATION", "PRESENTATION", "PRESERVATION", "PROCLAMATION", "PROCUREMENT", "PROPAGATION", "PROSECUTION", "PROTECTION", "PROVOCATION", "PUBLICATION", "PURIFICATION", "QUALIFICATION"], // Uses -ATION ending for similarity
        // Set 4.6 (Countermeasures/Defense - 11-13 letters) - Added Option
        ["COUNTERACTION", "COUNTERATTACK", "COUNTERMEASURE", "COUNTERBALANCE", "COUNTERFEITS", "COUNTERPARTS", "COUNTERPOINT", "COUNTERSIGNS", "DEACTIVATING", "DECONTAMINATE", "DEFLECTION", "DESTRUCTION", "DETERRENCE", "DISABLING", "DISINTEGRATE"], // Thematic, variable similarity
        // Set 4.7 (Abstract Concepts/States - 10-12 letters) - Added Option
        ["PERCEPTION", "PERSPECTIVE", "PERFORMANCE", "PERMISSION", "PERSONALITY", "PHILOSOPHY", "POTENTIALITY", "PRECONDITION", "PREDILECTION", "PREPARATION", "PRESCRIPTION", "PRESUMPTION", "PROBABILITY", "PROFICIENCY", "PROPORTION"] // High level concepts
    ]
};

// Function to get a random word set for a given difficulty key
// Ensures the set matches the expected number of words
function getRandomWordSet(difficultyKey, settings) {
    if (!WORD_SETS[difficultyKey] || WORD_SETS[difficultyKey].length === 0) {
        console.error(`No word sets found for difficulty key: ${difficultyKey}`);
        return null; // No sets available for this difficulty
    }

    const requiredWordCount = settings[difficultyKey]?.words;
    if (!requiredWordCount) {
         console.error(`Could not find settings for difficulty key: ${difficultyKey}`);
         return null;
    }

    // Filter sets to only those that have the EXACT required number of words
    const validSets = WORD_SETS[difficultyKey].filter(set => set.length === requiredWordCount);

    if (validSets.length === 0) {
        console.warn(`No word sets found for difficulty key ${difficultyKey} with exactly ${requiredWordCount} words. Check words.js.`);
        // Fallback: Return the first set available for the difficulty, even if count is wrong? Or null?
        // Let's return null to indicate an issue.
        return null;
    }

    const randomIndex = Math.floor(Math.random() * validSets.length);
    return [...validSets[randomIndex]]; // Return a copy of the chosen set
}