<?php
/**
 * Authentication Helper Functions
 *
 * Provides session-based authentication for WindPOS API
 *
 * @package WindPOS
 * @company CodesWind
 */

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    // Configure secure session settings
    session_set_cookie_params([
        'lifetime' => 86400, // 1 day (24 hours)
        'path' => '/',
        'domain' => '',
        'secure' => false, // Set to true in production with HTTPS
        'httponly' => true,
        'samesite' => 'Lax' // Lax allows cookies in cross-origin requests from same site
    ]);

    session_name('WINDPOS_SESSION');
    session_start();
}

/**
 * Check if user is authenticated
 *
 * @return bool True if user is logged in
 */
function isAuthenticated() {
    return isset($_SESSION['user_id']) && isset($_SESSION['username']);
}

/**
 * Get current authenticated user
 *
 * @return array|null User data or null if not authenticated
 */
function getCurrentUser() {
    if (!isAuthenticated()) {
        return null;
    }

    return [
        'id' => $_SESSION['user_id'],
        'username' => $_SESSION['username'],
        'role' => $_SESSION['role'] ?? null
    ];
}

/**
 * Get current user's role
 *
 * @return string|null User role or null if not authenticated
 */
function getUserRole() {
    return $_SESSION['role'] ?? null;
}

/**
 * Check if user has required role
 *
 * @param string|array $allowedRoles Single role or array of allowed roles
 * @return bool True if user has required role
 */
function hasRole($allowedRoles) {
    if (!isAuthenticated()) {
        return false;
    }

    $userRole = getUserRole();

    if (is_array($allowedRoles)) {
        return in_array($userRole, $allowedRoles);
    }

    return $userRole === $allowedRoles;
}

/**
 * Require authentication - send 401 if not authenticated
 *
 * @param bool $exitOnFail If true, exit script on failure
 * @return bool True if authenticated
 */
function requireAuth($exitOnFail = true) {
    if (!isAuthenticated()) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Authentication required. Please login.',
            'error_code' => 'AUTH_REQUIRED'
        ]);

        if ($exitOnFail) {
            exit;
        }
        return false;
    }

    return true;
}

/**
 * Require specific role - send 403 if user doesn't have required role
 *
 * @param string|array $allowedRoles Single role or array of allowed roles
 * @param bool $exitOnFail If true, exit script on failure
 * @return bool True if user has required role
 */
function requireRole($allowedRoles, $exitOnFail = true) {
    // First check authentication
    if (!requireAuth($exitOnFail)) {
        return false;
    }

    // Then check role
    if (!hasRole($allowedRoles)) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'message' => 'Insufficient permissions. Required role: ' . (is_array($allowedRoles) ? implode(' or ', $allowedRoles) : $allowedRoles),
            'error_code' => 'INSUFFICIENT_PERMISSIONS'
        ]);

        if ($exitOnFail) {
            exit;
        }
        return false;
    }

    return true;
}

/**
 * Login user - create session
 *
 * @param int $userId User ID
 * @param string $username Username
 * @param string $role User role
 * @return bool True on success
 */
function login($userId, $username, $role) {
    // Regenerate session ID to prevent session fixation
    session_regenerate_id(true);

    $_SESSION['user_id'] = $userId;
    $_SESSION['username'] = $username;
    $_SESSION['role'] = $role;
    $_SESSION['login_time'] = time();
    $_SESSION['last_activity'] = time();

    return true;
}

/**
 * Logout user - destroy session
 *
 * @return bool True on success
 */
function logout() {
    $_SESSION = array();

    // Delete session cookie
    if (isset($_COOKIE[session_name()])) {
        setcookie(session_name(), '', time() - 3600, '/');
    }

    session_destroy();
    return true;
}

/**
 * Update last activity timestamp
 * Prevents session timeout for active users
 */
function updateActivity() {
    if (isAuthenticated()) {
        $_SESSION['last_activity'] = time();
    }
}

/**
 * Check if session has timed out
 *
 * @param int $timeout Timeout in seconds (default: 1 day)
 * @return bool True if session has timed out
 */
function isSessionExpired($timeout = 86400) {
    if (!isAuthenticated()) {
        return true;
    }

    $lastActivity = $_SESSION['last_activity'] ?? 0;

    if (time() - $lastActivity > $timeout) {
        logout();
        return true;
    }

    return false;
}

/**
 * Require authentication and check session timeout
 *
 * @param int $timeout Session timeout in seconds (default: 1 day)
 * @return bool True if authenticated and not expired
 */
function requireAuthWithTimeout($timeout = 86400) {
    if (isSessionExpired($timeout)) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Session expired. Please login again.',
            'error_code' => 'SESSION_EXPIRED'
        ]);
        exit;
    }

    updateActivity();
    return requireAuth();
}

/**
 * Get session info for debugging
 *
 * @return array Session information (without sensitive data)
 */
function getSessionInfo() {
    if (!isAuthenticated()) {
        return [
            'authenticated' => false
        ];
    }

    return [
        'authenticated' => true,
        'user_id' => $_SESSION['user_id'],
        'username' => $_SESSION['username'],
        'role' => $_SESSION['role'],
        'login_time' => $_SESSION['login_time'] ?? null,
        'last_activity' => $_SESSION['last_activity'] ?? null,
        'session_age' => isset($_SESSION['login_time']) ? (time() - $_SESSION['login_time']) : 0
    ];
}

/**
 * Permission constants for common operations
 */
define('PERM_VIEW_ORDERS', ['Super Admin', 'Admin', 'Cashier']);
define('PERM_CREATE_ORDERS', ['Super Admin', 'Admin', 'Cashier']);
define('PERM_EDIT_ORDERS', ['Super Admin', 'Admin']);
define('PERM_DELETE_ORDERS', ['Super Admin', 'Admin']);

define('PERM_VIEW_MENU', ['Super Admin', 'Admin', 'Cashier']);
define('PERM_EDIT_MENU', ['Super Admin', 'Admin']);

define('PERM_VIEW_CUSTOMERS', ['Super Admin', 'Admin', 'Cashier']);
define('PERM_EDIT_CUSTOMERS', ['Super Admin', 'Admin']);

define('PERM_VIEW_REPORTS', ['Super Admin', 'Admin']);
define('PERM_VIEW_EXPENSES', ['Super Admin', 'Admin']);

define('PERM_MANAGE_USERS', ['Super Admin']);
define('PERM_MANAGE_SETTINGS', ['Super Admin', 'Admin']);

?>
