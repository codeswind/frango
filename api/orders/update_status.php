<?php
include '../cors.php';
include '../database.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $order_id = $input['order_id'];
    $status = $input['status'];

    $sql = "UPDATE orders SET status = '$status' WHERE id = '$order_id'";

    if ($conn->query($sql) === TRUE) {
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