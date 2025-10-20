<?php
include '../cors.php';
include '../database.php';

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
                  WHERE DATE(created_at) BETWEEN '$start_date' AND '$end_date'";
    $sales_result = $conn->query($sales_sql);
    $sales_summary = $sales_result->fetch_assoc();

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
                 WHERE DATE(created_at) BETWEEN '$start_date' AND '$end_date'
                 GROUP BY order_type";
    $type_result = $conn->query($type_sql);
    $sales_by_type = array();
    while($row = $type_result->fetch_assoc()) {
        $sales_by_type[] = $row;
    }

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
                  WHERE DATE(o.created_at) BETWEEN '$start_date' AND '$end_date'
                  GROUP BY mi.id, mi.name
                  ORDER BY total_quantity DESC
                  LIMIT 10";
    $items_result = $conn->query($items_sql);
    $top_items = array();
    while($row = $items_result->fetch_assoc()) {
        $top_items[] = $row;
    }

    // Order status breakdown
    $status_sql = "SELECT
                     status,
                     COUNT(*) as count,
                     SUM(total_amount) as total_amount
                   FROM orders
                   WHERE DATE(created_at) BETWEEN '$start_date' AND '$end_date'
                   GROUP BY status
                   ORDER BY count DESC";
    $status_result = $conn->query($status_sql);
    $status_breakdown = array();
    while($row = $status_result->fetch_assoc()) {
        $status_breakdown[] = $row;
    }

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