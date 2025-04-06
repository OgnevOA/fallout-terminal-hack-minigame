// words.js
const ALL_WORDS = [
"CODE", "LOCK", "DATA", "FILE", "USER", "PASS", "GRID", "SCAN", "TEST", "CORE",
"NODE", "LINK", "HACK", "SAFE", "EXIT", "HELP", "READ", "WRITE", "PING", "DISK",
"LIST", "OPEN", "MAIN", "TYPE", "ZONE", "AREA", "SITE", "LOAD", "LOGIN", "ADMIN",
"PROXY", "VIRUS", "CACHE", "DEBUG", "ARRAY", "QUERY", "INDEX", "ALERT", "SHELL",
"TOKEN", "ROUTE", "CRYPT", "GUARD", "POWER", "LASER", "VAULT", "PILOT", "INPUT",
"CYCLE", "STACK", "QUEUE", "PATCH", "ERROR", "RESET", "DRONE", "STATS", "ENTRY",
"SYSTEM", "ACCESS", "SECURE", "SERVER", "KERNEL", "BINARY", "SCRIPT", "PACKET",
"MODULE", "CURSOR", "FOLDER", "DELETE", "UPLOAD", "SIGNAL", "ENERGY", "ROBOTS",
"MUTANT", "RADWAY", "STATUS", "ONLINE", "DIRECT", "OUTPUT", "ACTIVE", "MASTER",
"REMOTE", "SECURE", "DEVICE", "FILTER", "LOCKED", "NETWORK", "FIREWAL", "ENCRYPT",
"DECRYPT", "COMMAND", "PROCESS", "SERVICE", "ACCOUNT", "BACKUP", "RESTORE",
"WARNING", "FAILURE", "DEFENSE", "PROTECT", "REACTOR", "SHELTER", "SURVIVE",
"TURRETS", "OVERSEE", "CONTROL", "MESSAGE", "ARCHIVE", "RECORDS", "PERMITS",
"BLOCKED", "ALLOWED", "REQUEST", "PENDING", "PASSWORD", "PROTOCOL", "DATABASE",
"TERMINAL", "SECURITY", "TRANSFER", "ARCHIVES", "MAINFRAM", "OVERRIDE", "MONITOR",
"USERNAME", "CONTROLS", "INTERNAL", "EXTERNAL", "SHUTDOWN", "SENTRIES", "PHYSICAL",
"CRITICAL", "FUNCTION", "RELIABLE", "RESPONSE", "STANDARD", "ANALYSIS", "ELEVATOR",
"AUTHORIZE", "DIRECTORY", "EXECUTE", "INTERFACE", "LOGISTICS", "CONFIGURE",
"VALIDATE", "REPLICATE", "RESOURCES", "CONTAINER", "PROTECTED", "INITIATE",
"GENERATOR", "AUTOMATON", "OPERATING", "CONNECTED", "DISCOVERY", "CONTAINED",
"PERSONNEL", "INVENTORY", "MAINPOWER", "EMERGENCY", "PROCEDURE", "CONNECTION",
"AUTHENTIC", "PERMISSION", "ENCRYPTION", "FILESYSTEM", "FRAMEWORK", "OPERATIONS",
"PARAMETERS", "DISCONNECT", "INITIALIZE", "OVERLOADED", "CALIBRATE", "RESTRICTED",
"QUARANTINE", "PROCESSING", "ADMINISTER", "TECHNOLOGY", "COMPONENTS", "AUTHORIZED",
"SUBSYSTEMS", "TRANSMISSION", "VERIFICATION", "MAINTENANCE", "DIAGNOSTICS",
"APPLICATION", "REQUIREMENT", "RESTRICTION", "INTERFERENCE", "REACTIVATED",
"INFORMATION", "REGULATIONS", "PERMISSIONS", "ESTABLISHED", "INFILTRATE",
"SPECIALIST", "AUTHENTICATE", "CONFIGURATION", "AUTHORIZATION", "COMMUNICATIONS",
"ACCESSIBILITY", "INFRASTRUCTURE", "SYSTEMACCESS", "BACKUPACCESS", "MANIPULATION",
"REDIRECTION", "SURVEILLANCE", "REQUIREMENTS", "DISTRIBUTION", "NOTIFICATION"
// Add more words if needed
].map(word => word.toUpperCase()); // Ensure uppercase