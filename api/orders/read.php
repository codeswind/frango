<?php
include '../cors.php';
include '../database.php';
include '../auth.php';

// Require authentication
requireAuthWithTimeout();

// Check permission to view orders
requireRole(PERM_VIEW_ORDERS);

if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    $status = isset($_GET['status']) ? $_GET['status'] : '';
    $start_date = isset($_GET['start_date']) && !empty($_GET['start_date']) ? $_GET['start_date'] : '';
    $end_date = isset($_GET['end_date']) && !empty($_GET['end_date']) ? $_GET['end_date'] : '';

    // Build the base query
    $sql = "SELECT o.*, c.name as customer_name, c.mobile as customer_mobile, t.table_name, p.payment_method
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.id
            LEFT JOIN tables t ON o.table_id = t.id
            LEFT JOIN payments p ON o.id = p.order_id";

    // Build WHERE clause with placeholders
    $where_conditions = array();
    $params = array();
    $types = '';

    if ($status != '') {
        $where_conditions[] = "o.status = ?";
        $params[] = $status;
        $types .= 's';
    }

    if ($start_date != '' && $end_date != '') {
        $where_conditions[] = "DATE(o.created_at) BETWEEN ? AND ?";
        $params[] = $start_date;
        $params[] = $end_date;
        $types .= 'ss';
    }

    if (count($where_conditions) > 0) {
        $sql .= " WHERE " . implode(' AND ', $where_conditions);
    }

    $sql .= " ORDER BY o.created_at DESC";

    // Prepare and execute the statement
    $stmt = $conn->prepare($sql);

    if ($stmt === false) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error']);
        $conn->close();
        exit;
    }

    // Bind parameters if we have any
    if (count($params) > 0) {
        $stmt->bind_param($types, ...$params);
    }

    $stmt->execute();
    $result = $stmt->get_result();

    $orders = array();
    $order_ids = array();

    if ($result->num_rows > 0) {
        // First pass: collect all orders and their IDs
        while($row = $result->fetch_assoc()) {
            $order_ids[] = $row['id'];
            $row['items'] = array(); // Initialize empty items array
            $orders[] = $row;
        }

        // Fetch all items for all orders in a single query (fixes N+1 problem)
        if (count($order_ids) > 0) {
            // Create placeholders for IN clause
            $placeholders = implode(',', array_fill(0, count($order_ids), '?'));
            $items_sql = "SELECT oi.*, mi.name as item_name
                         FROM order_items oi
                         JOIN menu_items mi ON oi.menu_item_id = mi.id
                         WHERE oi.order_id IN ($placeholders)
                         ORDER BY oi.order_id, oi.id";

            $items_stmt = $conn->prepare($items_sql);

            if ($items_stmt === false) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Database error']);
                $conn->close();
                exit;
            }

            // Bind all order IDs dynamically
            $types = str_repeat('i', count($order_ids));
            $items_stmt->bind_param($types, ...$order_ids);
            $items_stmt->execute();
            $items_result = $items_stmt->get_result();

            // Group items by order_id
            $items_by_order = array();
            while ($item_row = $items_result->fetch_assoc()) {
                $order_id = $item_row['order_id'];
                if (!isset($items_by_order[$order_id])) {
                    $items_by_order[$order_id] = array();
                }
                $items_by_order[$order_id][] = $item_row;
            }
            $items_stmt->close();

            // Attach items to their respective orders
            foreach ($orders as &$order) {
                $order_id = $order['id'];
                if (isset($items_by_order[$order_id])) {
                    $order['items'] = $items_by_order[$order_id];
                }
            }
        }
    }

    $stmt->close();

    echo json_encode([
        'success' => true,
        'data' => $orders
    ]);
}

$conn->close();
?>