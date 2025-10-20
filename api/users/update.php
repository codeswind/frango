<?php
include '../cors.php';
include '../database.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $id = $input['id'];
    $username = $input['username'];
    $role = $input['role'];

    // Check if username already exists for other users (excluding current user)
    $checkSql = "SELECT id FROM users WHERE username = '$username' AND id != $id AND is_deleted = 0";
    $checkResult = $conn->query($checkSql);

    if ($checkResult->num_rows > 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Username already exists. Please use a different username.'
        ]);
        $conn->close();
        exit;
    }

    $sql = "UPDATE users SET username = '$username', role = '$role' WHERE id = $id AND is_deleted = 0";

    if ($conn->query($sql) === TRUE) {
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
}

$conn->close();
?>