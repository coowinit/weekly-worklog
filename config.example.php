<?php
// Copy this file to config.local.php (not tracked by Git).
// Set a private password; do NOT upload it to a public repository.
return [
    'password' => 'CHANGE-THIS-TO-A-STRONG-PRIVATE-PASSWORD',
    // Important: when installed under XAMPP htdocs/weekly-worklog/, this directory is OUTSIDE htdocs.
    // Check your DOCUMENT_ROOT and adjust explicitly if you deploy elsewhere.
    'database_path' => dirname(__DIR__, 2) . '/weekly-worklog-private/weekly-worklog.sqlite',
];
