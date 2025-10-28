<?php
include '../cors.php';
include '../database.php';
include '../constants.php';
include '../auth.php';

// Require authentication
requireAuthWithTimeout();

// Check permission to edit orders
requireRole(PERM_EDIT_ORDERS);

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    // Validate required fields
    if (!isset($input['order_id']) || !isset($input['status'])) {
        http_response_code(HTTP_BAD_REQUEST);
        echo json_encode(['success' => false, 'message' => ERROR_MISSING_FIELDS]);
        $conn->close();
        exit;
    }

    $order_id = intval($input['order_id']);
    $status = trim($input['status']);

    // Validate status against allowed values from constants
    if (!isValidOrderStatus($status)) {
        http_response_code(HTTP_BAD_REQUEST);
        echo json_encode(['success' => false, 'message' => 'Invalid status value. Allowed: ' . implode(', ', ALLOWED_ORDER_STATUSES)]);
        $conn->close();
        exit;
    }

    // Use prepared statement for security
    $sql = "UPDATE orders SET status = ? WHERE id = ?";
    $stmt = $conn->prepare($sql);

    if ($stmt === false) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error']);
        $conn->close();
        exit;
    }

    $stmt->bind_param('si', $status, $order_id);

    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Order status updated successfully'
        ]);
        $stmt->close();
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Error: ' . $stmt->error
        ]);
        $stmt->close();
    }
}

$conn->close();
?>