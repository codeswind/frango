<?php
// ============================================
// API CONFIGURATION
// ============================================
// Configuration is now loaded from .env file for security

// Load environment variables from .env file
$envFile = __DIR__ . '/.env';

if (!file_exists($envFile)) {
    die('ERROR: .env file not found. Please create .env file with your configuration.');
}

$env = parse_ini_file($envFile);

if ($env === false) {
    die('ERROR: Failed to parse .env file. Please check the file format.');
}

// Database Configuration
define('DB_HOST', $env['DB_HOST'] ?? 'localhost');
define('DB_USER', $env['DB_USER'] ?? 'root');
define('DB_PASS', $env['DB_PASS'] ?? '');
define('DB_NAME', $env['DB_NAME'] ?? 'pos_restaurant');

// Frontend URL (for CORS)
define('FRONTEND_URL', $env['FRONTEND_URL'] ?? 'http://localhost:5173');

// API Base Path (used for file uploads)
define('API_BASE_PATH', $env['API_BASE_PATH'] ?? '/Afkar New');

// Printer Configuration (for POS terminal)
// Note: \\localhost\ is for local printer sharing, keep as is
define('INVOICE_PRINTER', $env['INVOICE_PRINTER'] ?? 'XP-80C');
define('KOT_PRINTER', $env['KOT_PRINTER'] ?? 'XP-80C (copy 1)');
?>
