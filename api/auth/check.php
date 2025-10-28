<?php
include '../cors.php';
include '../auth.php';
include '../constants.php';

if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    // Check if session has expired (8 hour timeout)
    if (isSessionExpired(28800)) {
        http_response_code(HTTP_UNAUTHORIZED);
        echo json_encode([
            'success' => false,
            'authenticated' => false,
            'message' => 'Session expired',
            'error_code' => 'SESSION_EXPIRED'
        ]);
        exit;
    }

    // Check authentication
    if (isAuthenticated()) {
        updateActivity();

        $user = getCurrentUser();

        echo json_encode([
            'success' => true,
            'authenticated' => true,
            'user' => $user,
            'session' => getSessionInfo()
        ]);
    } else {
        http_response_code(HTTP_UNAUTHORIZED);
        echo json_encode([
            'success' => false,
            'authenticated' => false,
            'message' => 'Not authenticated',
            'error_code' => 'NOT_AUTHENTICATED'
        ]);
    }
} else {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid request method'
    ]);
}
?>
