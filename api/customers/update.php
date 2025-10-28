<?php
include '../cors.php';
include '../database.php';
include '../auth.php';

// Require authentication
requireAuthWithTimeout();

// Admin can edit customers
requireRole(PERM_EDIT_CUSTOMERS);

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    // Validate required fields
    if (!$input || !isset($input['id']) || !isset($input['name']) || !isset($input['mobile'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Missing required fields'
        ]);
        exit;
    }

    $id = intval($input['id']);
    $name = trim($input['name']);
    $mobile = trim($input['mobile']);
    $address = isset($input['address']) ? trim($input['address']) : '';

    // Validate data
    if ($id <= 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid customer ID'
        ]);
        exit;
    }

    if (empty($name)) {
        echo json_encode([
            'success' => false,
            'message' => 'Customer name is required'
        ]);
        exit;
    }

    if (empty($mobile)) {
        echo json_encode([
            'success' => false,
            'message' => 'Mobile number is required'
        ]);
        exit;
    }

    // Check if mobile number already exists for other customers (excluding current customer)
    $checkSql = "SELECT id FROM customers WHERE mobile = ? AND id != ?";
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->bind_param("si", $mobile, $id);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();

    if ($checkResult->num_rows > 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Mobile number already exists. Please use a different mobile number.'
        ]);
        $checkStmt->close();
        $conn->close();
        exit;
    }
    $checkStmt->close();

    // Update customer using prepared statement
    $sql = "UPDATE customers SET name = ?, mobile = ?, address = ? WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("sssi", $name, $mobile, $address, $id);

    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Customer updated successfully'
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