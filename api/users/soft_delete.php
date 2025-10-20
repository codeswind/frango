<?php
include '../cors.php';
include '../database.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $id = $input['id'];

    // Check if user exists and is not already soft deleted
    $checkSql = "SELECT id, is_deleted FROM users WHERE id = $id";
    $checkResult = $conn->query($checkSql);

    if ($checkResult->num_rows === 0) {
        echo json_encode([
            'success' => false,
            'message' => 'User not found.'
        ]);
        $conn->close();
        exit;
    }

    $user = $checkResult->fetch_assoc();
    if ($user['is_deleted'] == 1) {
        echo json_encode([
            'success' => false,
            'message' => 'User is already deleted.'
        ]);
        $conn->close();
        exit;
    }

    // Soft delete the user
    $sql = "UPDATE users SET is_deleted = 1, deleted_at = NOW() WHERE id = $id";

    if ($conn->query($sql) === TRUE) {
        echo json_encode([
            'success' => true,
            'message' => 'User soft deleted successfully'
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