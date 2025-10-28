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
    if (!$input || !isset($input['description']) || !isset($input['amount']) || !isset($input['date'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Missing required fields'
        ]);
        exit;
    }

    $description = trim($input['description']);
    $amount = floatval($input['amount']);
    $date = trim($input['date']);

    // Validate data
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

    // Use prepared statement for security
    $sql = "INSERT INTO expenses (description, amount, date) VALUES (?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("sds", $description, $amount, $date);

    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Expense created successfully',
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