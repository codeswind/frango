<?php
include '../cors.php';
include '../database.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    // Validate required field
    if (!$input || !isset($input['id'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Missing required field: id'
        ]);
        exit;
    }

    $id = intval($input['id']);

    // Validate ID
    if ($id <= 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid user ID'
        ]);
        exit;
    }

    // Check if user exists and is not already soft deleted using prepared statement
    $checkSql = "SELECT id, is_deleted FROM users WHERE id = ?";
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->bind_param("i", $id);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();

    if ($checkResult->num_rows === 0) {
        echo json_encode([
            'success' => false,
            'message' => 'User not found.'
        ]);
        $checkStmt->close();
        $conn->close();
        exit;
    }

    $user = $checkResult->fetch_assoc();
    $checkStmt->close();

    if ($user['is_deleted'] == 1) {
        echo json_encode([
            'success' => false,
            'message' => 'User is already deleted.'
        ]);
        $conn->close();
        exit;
    }

    // Soft delete the user using prepared statement
    $sql = "UPDATE users SET is_deleted = 1, deleted_at = NOW() WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $id);

    if ($stmt->execute()) {
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

    $stmt->close();
}

$conn->close();
?>