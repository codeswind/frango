<?php
include '../cors.php';
include '../database.php';

if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    $category_id = isset($_GET['category_id']) ? $_GET['category_id'] : '';
    $search = isset($_GET['search']) ? $_GET['search'] : '';
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;

    // Calculate offset
    $offset = ($page - 1) * $limit;

    // Build base query for counting total records
    $count_sql = "SELECT COUNT(*) as total FROM menu_items m WHERE m.is_deleted = 0";

    // Build main query
    $sql = "SELECT m.*, c.name as category_name FROM menu_items m
            LEFT JOIN categories c ON m.category_id = c.id
            WHERE m.is_deleted = 0";

    // Add conditions to both queries
    if ($category_id != '') {
        $sql .= " AND m.category_id = '$category_id'";
        $count_sql .= " AND m.category_id = '$category_id'";
    }

    if ($search != '') {
        $sql .= " AND m.name LIKE '%$search%'";
        $count_sql .= " AND m.name LIKE '%$search%'";
    }

    // Get total count
    $count_result = $conn->query($count_sql);
    $total_records = $count_result->fetch_assoc()['total'];
    $total_pages = ceil($total_records / $limit);

    // Add ordering and pagination to main query
    $sql .= " ORDER BY m.name ASC";

    // Only add LIMIT if not showing all (9999)
    if ($limit < 9999) {
        $sql .= " LIMIT $limit OFFSET $offset";
    }

    $result = $conn->query($sql);

    $menu_items = array();
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $menu_items[] = $row;
        }
    }

    echo json_encode([
        'success' => true,
        'data' => $menu_items,
        'pagination' => [
            'current_page' => $page,
            'total_pages' => $total_pages,
            'total_records' => $total_records,
            'limit' => $limit,
            'has_next' => $page < $total_pages,
            'has_prev' => $page > 1
        ]
    ]);
}

$conn->close();
?>