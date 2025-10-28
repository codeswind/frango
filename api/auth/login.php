<?php
include '../cors.php';
include '../database.php';
include '../auth.php';
include '../constants.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    // Validate required fields
    if (!$input || !isset($input['username']) || !isset($input['password'])) {
        http_response_code(HTTP_BAD_REQUEST);
        echo json_encode([
            'success' => false,
            'message' => ERROR_MISSING_FIELDS
        ]);
        exit;
    }

    $username = trim($input['username']);
    $password = trim($input['password']);

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

    // Fetch user with prepared statement - include password hash for verification
    $sql = "SELECT id, username, password, role, is_deleted FROM users WHERE username = ? AND is_deleted = 0";
    $stmt = $conn->prepare($sql);

    if ($stmt === false) {
        http_response_code(HTTP_INTERNAL_ERROR);
        echo json_encode(['success' => false, 'message' => ERROR_DATABASE_ERROR]);
        $conn->close();
        exit;
    }

    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $user = $result->fetch_assoc();

        // Verify password using password_verify
        if (password_verify($password, $user['password'])) {
            // Create session
            login($user['id'], $user['username'], $user['role']);

            // Remove sensitive data from response
            unset($user['password']);
            unset($user['is_deleted']);

            echo json_encode([
                'success' => true,
                'message' => 'Login successful',
                'user' => $user,
                'session' => getSessionInfo()
            ]);
        } else {
            // Invalid password - use same message as invalid username for security
            http_response_code(HTTP_UNAUTHORIZED);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid username or password'
            ]);
        }
    } else {
        // User not found - use same message as invalid password for security
        http_response_code(HTTP_UNAUTHORIZED);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid username or password'
        ]);
    }

    $stmt->close();
} else {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid request method'
    ]);
}

$conn->close();
?>