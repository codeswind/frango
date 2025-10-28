<?php
include '../cors.php';
include '../database.php';
include '../auth.php';

// Require authentication
requireAuthWithTimeout();

// Only Admin can manage expenses
requireRole(PERM_VIEW_EXPENSES);

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    // Validate required fields
    if (!$input || !isset($input['id']) || !isset($input['description']) || !isset($input['amount']) || !isset($input['date'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Missing required fields'
        ]);
        exit;
    }

    $id = intval($input['id']);
    $description = trim($input['description']);
    $amount = floatval($input['amount']);
    $date = trim($input['date']);

    // Validate data
    if ($id <= 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid expense ID'
        ]);
        exit;
    }

    if (empty($description)) {
        echo json_encode([
            'success' => false,
            'message' => 'Description is required'
        ]);
        exit;
    }

    if ($amount < 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Amount must be positive'
        ]);
        exit;
    }

    $sql = "UPDATE expenses SET description = ?, amount = ?, date = ? WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("sdsi", $description, $amount, $date, $id);

    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Expense updated successfully'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Error updating expense'
        ]);
    }

    $stmt->close();
}

$conn->close();
?>