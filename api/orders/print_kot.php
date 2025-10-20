<?php
include '../cors.php';
include '../database.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $order_id = $input['order_id'];

    // Get order details
    $order_sql = "SELECT o.*, c.name as customer_name, c.mobile, t.table_number
                  FROM orders o
                  LEFT JOIN customers c ON o.customer_id = c.id
                  LEFT JOIN tables t ON o.table_id = t.id
                  WHERE o.id = '$order_id'";
    $order_result = $conn->query($order_sql);
    $order = $order_result->fetch_assoc();

    // Get only items that haven't been printed yet (newly added items)
    $items_sql = "SELECT oi.*, mi.name as item_name, mi.category_id, cat.name as category_name
                  FROM order_items oi
                  JOIN menu_items mi ON oi.menu_item_id = mi.id
                  LEFT JOIN categories cat ON mi.category_id = cat.id
                  WHERE oi.order_id = '$order_id' AND oi.kot_printed = FALSE
                  ORDER BY cat.name, mi.name";
    $items_result = $conn->query($items_sql);

    $new_items = [];
    while ($row = $items_result->fetch_assoc()) {
        $new_items[] = $row;
    }

    if (empty($new_items)) {
        echo json_encode([
            'success' => false,
            'message' => 'No new items to print'
        ]);
        exit;
    }

    // Mark items as printed
    $update_sql = "UPDATE order_items SET kot_printed = TRUE WHERE order_id = '$order_id' AND kot_printed = FALSE";
    $conn->query($update_sql);

    // Return KOT data for printing
    echo json_encode([
        'success' => true,
        'message' => 'KOT data retrieved successfully',
        'data' => [
            'order' => $order,
            'items' => $new_items,
            'kot_number' => 'KOT-' . $order_id . '-' . time()
        ]
    ]);
}

$conn->close();
?>