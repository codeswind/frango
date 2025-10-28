<?php
include '../cors.php';
include '../database.php';
include '../auth.php';

// Require authentication
requireAuthWithTimeout();

// Check permission to view orders
requireRole(PERM_VIEW_ORDERS);

if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    $order_id = isset($_GET['order_id']) ? intval($_GET['order_id']) : 0;

    if ($order_id <= 0) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Valid Order ID is required'
        ]);
        exit;
    }

    // Get order details with customer, table, and payment information using prepared statement
    $sql = "SELECT o.*, c.name as customer_name, c.mobile as customer_mobile, c.address as customer_address, t.table_name, p.payment_method, p.amount as payment_amount
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.id
            LEFT JOIN tables t ON o.table_id = t.id
            LEFT JOIN payments p ON o.id = p.order_id
            WHERE o.id = ?";

    $stmt = $conn->prepare($sql);
    if ($stmt === false) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error']);
        $conn->close();
        exit;
    }

    $stmt->bind_param('i', $order_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $order = $result->fetch_assoc();
        $stmt->close();

        // Get order items with menu item details using prepared statement
        $items_sql = "SELECT oi.*, mi.name as item_name, mi.description, mi.category_id
                     FROM order_items oi
                     LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
                     WHERE oi.order_id = ?
                     ORDER BY oi.id";

        $items_stmt = $conn->prepare($items_sql);
        if ($items_stmt === false) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Database error']);
            $conn->close();
            exit;
        }

        $items_stmt->bind_param('i', $order_id);
        $items_stmt->execute();
        $items_result = $items_stmt->get_result();

        $items = array();
        while($item_row = $items_result->fetch_assoc()) {
            $items[] = $item_row;
        }
        $items_stmt->close();

        echo json_encode([
            'success' => true,
            'data' => [
                'order' => $order,
                'items' => $items
            ]
        ]);
    } else {
        $stmt->close();
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Order not found'
        ]);
    }
} else {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid request method'
    ]);
}

$conn->close();
?>