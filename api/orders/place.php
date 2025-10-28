<?php
include '../cors.php';
include '../database.php';
include '../constants.php';
include '../auth.php';

// Require authentication
requireAuthWithTimeout();

// Cashiers can place orders
requireRole(PERM_CREATE_ORDERS);

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $order_id = intval($input['order_id']);
    $status = trim($input['status']); // 'Hold' or 'Completed'
    $payment_method = isset($input['payment_method']) ? trim($input['payment_method']) : null;

    // Validate order_id
    if ($order_id <= 0) {
        http_response_code(HTTP_BAD_REQUEST);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid order ID'
        ]);
        exit;
    }

    // Validate status using constants
    if (!isValidOrderStatus($status)) {
        http_response_code(HTTP_BAD_REQUEST);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid status. Allowed: ' . implode(', ', ALLOWED_ORDER_STATUSES)
        ]);
        exit;
    }

    // Get discount and payment details
    $discount_type = isset($input['discount_type']) ? trim($input['discount_type']) : null;
    $discount_value = isset($input['discount_value']) ? floatval($input['discount_value']) : 0;
    $discount_amount = isset($input['discount_amount']) ? floatval($input['discount_amount']) : 0;
    $final_amount = isset($input['final_amount']) ? floatval($input['final_amount']) : 0;
    $paid_amount = isset($input['paid_amount']) ? floatval($input['paid_amount']) : 0;
    $balance = isset($input['balance']) ? floatval($input['balance']) : 0;

    // Update order status and discount/payment details using prepared statement
    if ($status === 'Completed' && $discount_type) {
        $sql = "UPDATE orders SET
                status = ?,
                discount_type = ?,
                discount_value = ?,
                discount_amount = ?,
                final_amount = ?,
                paid_amount = ?,
                balance = ?
                WHERE id = ?";
        $stmt = $conn->prepare($sql);
        if ($stmt === false) {
            http_response_code(HTTP_INTERNAL_ERROR);
            echo json_encode(['success' => false, 'message' => ERROR_DATABASE_ERROR]);
            $conn->close();
            exit;
        }
        $stmt->bind_param('ssdddddi', $status, $discount_type, $discount_value, $discount_amount, $final_amount, $paid_amount, $balance, $order_id);
    } else {
        $sql = "UPDATE orders SET status = ? WHERE id = ?";
        $stmt = $conn->prepare($sql);
        if ($stmt === false) {
            http_response_code(HTTP_INTERNAL_ERROR);
            echo json_encode(['success' => false, 'message' => ERROR_DATABASE_ERROR]);
            $conn->close();
            exit;
        }
        $stmt->bind_param('si', $status, $order_id);
    }

    if ($stmt->execute()) {
        $stmt->close();

        // If order is completed, add payment record
        if ($status === 'Completed' && $payment_method) {
            // Use final_amount if available, otherwise use total_amount
            $amount = $final_amount > 0 ? $final_amount : 0;

            if ($amount == 0) {
                // Get order total using prepared statement
                $total_sql = "SELECT total_amount FROM orders WHERE id = ?";
                $total_stmt = $conn->prepare($total_sql);
                $total_stmt->bind_param('i', $order_id);
                $total_stmt->execute();
                $total_result = $total_stmt->get_result();
                $total_row = $total_result->fetch_assoc();
                $amount = $total_row['total_amount'];
                $total_stmt->close();
            }

            // Insert payment using prepared statement
            $payment_sql = "INSERT INTO payments (order_id, payment_method, amount) VALUES (?, ?, ?)";
            $payment_stmt = $conn->prepare($payment_sql);
            $payment_stmt->bind_param('isd', $order_id, $payment_method, $amount);
            $payment_stmt->execute();
            $payment_stmt->close();
        }

        echo json_encode([
            'success' => true,
            'message' => 'Order status updated successfully'
        ]);
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