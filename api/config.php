<?php
// ============================================
// API CONFIGURATION
// ============================================
// Change these values when deploying to production

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', 'Abdullah2004*');
define('DB_NAME', 'pos_restaurant');

// Frontend URL (for CORS)
define('FRONTEND_URL', 'http://localhost:5173');

// API Base Path (used for file uploads)
define('API_BASE_PATH', '/Afkar New');

// Printer Configuration (for POS terminal)
// Note: \\localhost\ is for local printer sharing, keep as is
define('INVOICE_PRINTER', 'XP-80C');
define('KOT_PRINTER', 'XP-80C (copy 1)');
?>
