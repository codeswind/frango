<?php
include '../cors.php';
include '../database.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $username = $input['username'];
    $password = $input['password'];
    $role = $input['role'];

    // Check if username already exists
    $checkSql = "SELECT id FROM users WHERE username = '$username' AND is_deleted = 0";
    $checkResult = $conn->query($checkSql);

    if ($checkResult->num_rows > 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Username already exists. Please use a different username.'
        ]);
        $conn->close();
        exit;
    }

    // Hash the password
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    $sql = "INSERT INTO users (username, password, role, is_deleted) VALUES ('$username', '$hashedPassword', '$role', 0)";

    if ($conn->query($sql) === TRUE) {
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
}

$conn->close();
?>