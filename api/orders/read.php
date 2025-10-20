<?php
include '../cors.php';
include '../database.php';

if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    $status = isset($_GET['status']) ? $_GET['status'] : '';

    $sql = "SELECT o.*, c.name as customer_name, c.mobile as customer_mobile, t.table_name, p.payment_method
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.id
            LEFT JOIN tables t ON o.table_id = t.id
            LEFT JOIN payments p ON o.id = p.order_id";

    if ($status != '') {
        $sql .= " WHERE o.status = '$status'";
    }

    $sql .= " ORDER BY o.created_at DESC";

    $result = $conn->query($sql);

    $orders = array();
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            // Get order items
            $order_id = $row['id'];
            $items_sql = "SELECT oi.*, mi.name as item_name
                         FROM order_items oi
                         JOIN menu_items mi ON oi.menu_item_id = mi.id
                         WHERE oi.order_id = '$order_id'";
            $items_result = $conn->query($items_sql);

            $items = array();
            while($item_row = $items_result->fetch_assoc()) {
                $items[] = $item_row;
            }

            $row['items'] = $items;
            $orders[] = $row;
        }
    }

    echo json_encode([
        'success' => true,
        'data' => $orders
    ]);
}

$conn->close();
?>