<?php
include '../cors.php';
include '../database.php';
include '../auth.php';

// Require authentication
requireAuthWithTimeout();

// All authenticated users can create customers
requireRole(PERM_VIEW_CUSTOMERS);

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    // Validate required fields
    if (!$input || !isset($input['name']) || !isset($input['mobile'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Missing required fields'
        ]);
        exit;
    }

    $name = $conn->real_escape_string(trim($input['name']));
    $mobile = $conn->real_escape_string(trim($input['mobile']));
    $address = isset($input['address']) ? $conn->real_escape_string(trim($input['address'])) : '';

    // Validate data
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

    // Check if mobile number already exists using prepared statement
    $checkSql = "SELECT id FROM customers WHERE mobile = ?";
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->bind_param("s", $mobile);
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

    // Insert new customer using prepared statement
    $sql = "INSERT INTO customers (name, mobile, address) VALUES (?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("sss", $name, $mobile, $address);

    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Customer created successfully',
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