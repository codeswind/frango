<?php
include '../cors.php';
include '../database.php';
include '../auth.php';

// Require authentication
requireAuthWithTimeout();

// Only Admin and Super Admin can view reports
requireRole(PERM_VIEW_REPORTS);

if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    $start_date = isset($_GET['start_date']) && !empty($_GET['start_date']) ? $_GET['start_date'] : date('Y-m-01');
    $end_date = isset($_GET['end_date']) && !empty($_GET['end_date']) ? $_GET['end_date'] : date('Y-m-d');

    // Sales summary - include all order statuses
    $sales_sql = "SELECT
                    COUNT(*) as total_orders,
                    SUM(total_amount) as total_sales,
                    AVG(total_amount) as average_order_value,
                    SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed_orders,
                    SUM(CASE WHEN status = 'Hold' THEN 1 ELSE 0 END) as hold_orders,
                    SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END) as cancelled_orders
                  FROM orders
                  WHERE DATE(created_at) BETWEEN ? AND ?";
    $sales_stmt = $conn->prepare($sales_sql);
    if ($sales_stmt === false) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error']);
        $conn->close();
        exit;
    }
    $sales_stmt->bind_param('ss', $start_date, $end_date);
    $sales_stmt->execute();
    $sales_result = $sales_stmt->get_result();
    $sales_summary = $sales_result->fetch_assoc();
    $sales_stmt->close();

    // Sales by order type - include all statuses with breakdown
    $type_sql = "SELECT
                   order_type,
                   COUNT(*) as count,
                   SUM(total_amount) as total,
                   SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed_count,
                   SUM(CASE WHEN status = 'Hold' THEN 1 ELSE 0 END) as hold_count,
                   SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END) as cancelled_count,
                   SUM(CASE WHEN status = 'Completed' THEN total_amount ELSE 0 END) as completed_total
                 FROM orders
                 WHERE DATE(created_at) BETWEEN ? AND ?
                 GROUP BY order_type";
    $type_stmt = $conn->prepare($type_sql);
    if ($type_stmt === false) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error']);
        $conn->close();
        exit;
    }
    $type_stmt->bind_param('ss', $start_date, $end_date);
    $type_stmt->execute();
    $type_result = $type_stmt->get_result();
    $sales_by_type = array();
    while($row = $type_result->fetch_assoc()) {
        $sales_by_type[] = $row;
    }
    $type_stmt->close();

    // Top selling items - include all orders but show breakdown by status
    $items_sql = "SELECT
                    mi.name,
                    SUM(oi.quantity) as total_quantity,
                    SUM(oi.quantity * oi.price_per_item) as total_revenue,
                    SUM(CASE WHEN o.status = 'Completed' THEN oi.quantity ELSE 0 END) as completed_quantity,
                    SUM(CASE WHEN o.status = 'Hold' THEN oi.quantity ELSE 0 END) as hold_quantity,
                    SUM(CASE WHEN o.status = 'Cancelled' THEN oi.quantity ELSE 0 END) as cancelled_quantity
                  FROM order_items oi
                  JOIN menu_items mi ON oi.menu_item_id = mi.id
                  JOIN orders o ON oi.order_id = o.id
                  WHERE DATE(o.created_at) BETWEEN ? AND ?
                  GROUP BY mi.id, mi.name
                  ORDER BY total_quantity DESC
                  LIMIT 10";
    $items_stmt = $conn->prepare($items_sql);
    if ($items_stmt === false) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error']);
        $conn->close();
        exit;
    }
    $items_stmt->bind_param('ss', $start_date, $end_date);
    $items_stmt->execute();
    $items_result = $items_stmt->get_result();
    $top_items = array();
    while($row = $items_result->fetch_assoc()) {
        $top_items[] = $row;
    }
    $items_stmt->close();

    // Order status breakdown
    $status_sql = "SELECT
                     status,
                     COUNT(*) as count,
                     SUM(total_amount) as total_amount
                   FROM orders
                   WHERE DATE(created_at) BETWEEN ? AND ?
                   GROUP BY status
                   ORDER BY count DESC";
    $status_stmt = $conn->prepare($status_sql);
    if ($status_stmt === false) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error']);
        $conn->close();
        exit;
    }
    $status_stmt->bind_param('ss', $start_date, $end_date);
    $status_stmt->execute();
    $status_result = $status_stmt->get_result();
    $status_breakdown = array();
    while($row = $status_result->fetch_assoc()) {
        $status_breakdown[] = $row;
    }
    $status_stmt->close();

    echo json_encode([
        'success' => true,
        'data' => [
            'summary' => $sales_summary,
            'by_type' => $sales_by_type,
            'top_items' => $top_items,
            'status_breakdown' => $status_breakdown
        ]
    ]);
}

$conn->close();
?>