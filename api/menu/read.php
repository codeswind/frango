<?php
include '../cors.php';
include '../database.php';
include '../auth.php';

// Require authentication
requireAuthWithTimeout();

// All authenticated users can view menu
requireRole(PERM_VIEW_MENU);

if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    // Sanitize and validate inputs
    $category_id = isset($_GET['category_id']) && $_GET['category_id'] !== '' ? intval($_GET['category_id']) : 0;
    $search = isset($_GET['search']) ? trim($_GET['search']) : '';
    $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
    $limit = isset($_GET['limit']) ? max(1, min(9999, intval($_GET['limit']))) : 10;

    // Calculate offset
    $offset = ($page - 1) * $limit;

    // Build base query for counting total records with placeholders
    $count_sql = "SELECT COUNT(*) as total FROM menu_items m WHERE m.is_deleted = 0";
    $count_params = array();
    $count_types = '';

    // Build main query with placeholders
    $sql = "SELECT m.*, c.name as category_name FROM menu_items m
            LEFT JOIN categories c ON m.category_id = c.id
            WHERE m.is_deleted = 0";
    $params = array();
    $types = '';

    // Add conditions to both queries
    if ($category_id > 0) {
        $sql .= " AND m.category_id = ?";
        $count_sql .= " AND m.category_id = ?";
        $params[] = $category_id;
        $count_params[] = $category_id;
        $types .= 'i';
        $count_types .= 'i';
    }

    if ($search != '') {
        $search_param = "%$search%";
        $sql .= " AND m.name LIKE ?";
        $count_sql .= " AND m.name LIKE ?";
        $params[] = $search_param;
        $count_params[] = $search_param;
        $types .= 's';
        $count_types .= 's';
    }

    // Execute count query with prepared statement
    $count_stmt = $conn->prepare($count_sql);
    if ($count_stmt === false) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error']);
        $conn->close();
        exit;
    }

    if (count($count_params) > 0) {
        $count_stmt->bind_param($count_types, ...$count_params);
    }
    $count_stmt->execute();
    $count_result = $count_stmt->get_result();
    $total_records = $count_result->fetch_assoc()['total'];
    $total_pages = ceil($total_records / $limit);
    $count_stmt->close();

    // Add ordering and pagination to main query
    $sql .= " ORDER BY m.name ASC";

    // Only add LIMIT if not showing all (9999)
    if ($limit < 9999) {
        $sql .= " LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
        $types .= 'ii';
    }

    // Execute main query with prepared statement
    $stmt = $conn->prepare($sql);
    if ($stmt === false) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error']);
        $conn->close();
        exit;
    }

    if (count($params) > 0) {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    $result = $stmt->get_result();

    $menu_items = array();
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $menu_items[] = $row;
        }
    }

    $stmt->close();

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