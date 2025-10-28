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
    if (!$input || !isset($input['username']) || !isset($input['password']) || !isset($input['role'])) {
        http_response_code(HTTP_BAD_REQUEST);
        echo json_encode([
            'success' => false,
            'message' => ERROR_MISSING_FIELDS
        ]);
        exit;
    }

    $username = trim($input['username']);
    $password = trim($input['password']);
    $role = trim($input['role']);

    // Validate data
    if (empty($username)) {
        http_response_code(HTTP_BAD_REQUEST);
        echo json_encode([
            'success' => false,
            'message' => 'Username is required'
        ]);
        exit;
    }

    if (empty($password)) {
        http_response_code(HTTP_BAD_REQUEST);
        echo json_encode([
            'success' => false,
            'message' => 'Password is required'
        ]);
        exit;
    }

    if (strlen($password) < PASSWORD_MIN_LENGTH) {
        http_response_code(HTTP_BAD_REQUEST);
        echo json_encode([
            'success' => false,
            'message' => 'Password must be at least ' . PASSWORD_MIN_LENGTH . ' characters'
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

    // Check if username already exists using prepared statement
    $checkSql = "SELECT id FROM users WHERE username = ? AND is_deleted = 0";
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->bind_param("s", $username);
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

    // Hash the password
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // Insert new user using prepared statement
    $sql = "INSERT INTO users (username, password, role, is_deleted) VALUES (?, ?, ?, 0)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("sss", $username, $hashedPassword, $role);

    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'User created successfully',
            'id' => $conn->insert_id
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