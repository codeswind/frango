<?php
include '../cors.php';
include '../database.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $order_id = $input['order_id'];
    $status = $input['status']; // 'Hold' or 'Completed'
    $payment_method = isset($input['payment_method']) ? $input['payment_method'] : null;

    // Update order status
    $sql = "UPDATE orders SET status = '$status' WHERE id = '$order_id'";

    if ($conn->query($sql) === TRUE) {
        // If order is completed, add payment record
        if ($status === 'Completed' && $payment_method) {
            // Get order total
            $total_sql = "SELECT total_amount FROM orders WHERE id = '$order_id'";
            $total_result = $conn->query($total_sql);
            $total_row = $total_result->fetch_assoc();
            $amount = $total_row['total_amount'];

            $payment_sql = "INSERT INTO payments (order_id, payment_method, amount)
                           VALUES ('$order_id', '$payment_method', '$amount')";
            $conn->query($payment_sql);
        }

        echo json_encode([
            'success' => true,
            'message' => 'Order status updated successfully'
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