<?php
include '../cors.php';
include '../auth.php';

// Debug session information
header('Content-Type: application/json');

echo json_encode([
    'success' => true,
    'session_status' => session_status(),
    'session_id' => session_id(),
    'session_name' => session_name(),
    'session_data' => $_SESSION ?? [],
    'cookies_received' => $_COOKIE ?? [],
    'is_authenticated' => isAuthenticated(),
    'session_info' => getSessionInfo(),
    'headers' => [
        'origin' => $_SERVER['HTTP_ORIGIN'] ?? 'none',
        'cookie' => $_SERVER['HTTP_COOKIE'] ?? 'none',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'none'
    ]
]);
?>
