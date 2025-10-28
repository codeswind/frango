<?php
include '../cors.php';
include '../database.php';
include '../auth.php';

// Require authentication
requireAuthWithTimeout();

// Only Admin can edit menu
requireRole(PERM_EDIT_MENU);

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    // Validate required fields
    if (!$input || !isset($input['name']) || !isset($input['price']) || !isset($input['category_id'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Missing required fields'
        ]);
        exit;
    }

    $name = trim($input['name']);
    $description = isset($input['description']) ? trim($input['description']) : '';
    $price = floatval($input['price']);
    $category_id = intval($input['category_id']);
    $image_path = isset($input['image_path']) ? trim($input['image_path']) : '';

    // Validate data
    if (empty($name) || $price < 0 || $category_id <= 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid input data'
        ]);
        exit;
    }

    // Use prepared statement for security
    $sql = "INSERT INTO menu_items (name, description, price, category_id, image_path)
            VALUES (?, ?, ?, ?, ?)";

    $stmt = $conn->prepare($sql);
    if ($stmt === false) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error']);
        $conn->close();
        exit;
    }

    $stmt->bind_param('ssdis', $name, $description, $price, $category_id, $image_path);

    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Menu item created successfully',
            'id' => $stmt->insert_id
        ]);
        $stmt->close();
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Error: ' . $stmt->error
        ]);
        $stmt->close();
    }
}

$conn->close();
?>