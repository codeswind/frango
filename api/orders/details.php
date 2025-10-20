<?php
include '../cors.php';
include '../database.php';

if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    $order_id = isset($_GET['order_id']) ? $_GET['order_id'] : '';

    if (empty($order_id)) {
        echo json_encode([
            'success' => false,
            'message' => 'Order ID is required'
        ]);
        exit;
    }

    // Get order details with customer, table, and payment information
    $sql = "SELECT o.*, c.name as customer_name, c.mobile as customer_mobile, c.address as customer_address, t.table_name, p.payment_method, p.amount as payment_amount
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.id
            LEFT JOIN tables t ON o.table_id = t.id
            LEFT JOIN payments p ON o.id = p.order_id
            WHERE o.id = '$order_id'";

    $result = $conn->query($sql);

    if ($result->num_rows > 0) {
        $order = $result->fetch_assoc();

        // Get order items with menu item details
        $items_sql = "SELECT oi.*, mi.name as item_name, mi.description, mi.category_id
                     FROM order_items oi
                     LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
                     WHERE oi.order_id = '$order_id'
                     ORDER BY oi.id";

        $items_result = $conn->query($items_sql);

        $items = array();
        while($item_row = $items_result->fetch_assoc()) {
            $items[] = $item_row;
        }

        echo json_encode([
            'success' => true,
            'data' => [
                'order' => $order,
                'items' => $items
            ]
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Order not found'
        ]);
    }
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid request method'
    ]);
}

$conn->close();
?>