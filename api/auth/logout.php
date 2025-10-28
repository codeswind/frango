<?php
include '../cors.php';
include '../auth.php';
include '../constants.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    // Logout user (destroy session)
    logout();

    echo json_encode([
        'success' => true,
        'message' => 'Logged out successfully'
    ]);
} else {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid request method'
    ]);
}
?>
