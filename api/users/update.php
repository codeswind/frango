<?php
include '../cors.php';
include '../database.php';
include '../constants.php';
include '../auth.php';

// Require authentication
requireAuthWithTimeout();

// Only Super Admin can manage users
requireRole(PERM_MANAGE_USERS);

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    // Validate required fields
    if (!$input || !isset($input['id']) || !isset($input['username']) || !isset($input['role'])) {
        http_response_code(HTTP_BAD_REQUEST);
        echo json_encode([
            'success' => false,
            'message' => ERROR_MISSING_FIELDS
        ]);
        exit;
    }

    $id = intval($input['id']);
    $username = trim($input['username']);
    $role = trim($input['role']);

    // Validate data
    if ($id <= 0) {
        http_response_code(HTTP_BAD_REQUEST);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid user ID'
        ]);
        exit;
    }

    if (empty($username)) {
        http_response_code(HTTP_BAD_REQUEST);
        echo json_encode([
            'success' => false,
            'message' => 'Username is required'
        ]);
        exit;
    }

    if (empty($role)) {
        http_response_code(HTTP_BAD_REQUEST);
        echo json_encode([
            'success' => false,
            'message' => 'Role is required'
        ]);
        exit;
    }

    // Validate role using constants
    if (!isValidUserRole($role)) {
        http_response_code(HTTP_BAD_REQUEST);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid role selected. Allowed: ' . implode(', ', ALLOWED_USER_ROLES)
        ]);
        exit;
    }

    // Check if username already exists for other users (excluding current user)
    $checkSql = "SELECT id FROM users WHERE username = ? AND id != ? AND is_deleted = 0";
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->bind_param("si", $username, $id);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();

    if ($checkResult->num_rows > 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Username already exists. Please use a different username.'
        ]);
        $checkStmt->close();
        $conn->close();
        exit;
    }
    $checkStmt->close();

    // Update user using prepared statement
    $sql = "UPDATE users SET username = ?, role = ? WHERE id = ? AND is_deleted = 0";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ssi", $username, $role, $id);

    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'User updated successfully'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Error: ' . $conn->error
        ]);
    }

    $stmt->close();
}

$conn->close();
?>