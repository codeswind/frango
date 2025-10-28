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

    if (!$input || !isset($input['id']) || !isset($input['name']) || !isset($input['price'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid input data'
        ]);
        exit;
    }

    $id = intval($input['id']);
    $name = trim($input['name']);
    $description = isset($input['description']) ? trim($input['description']) : '';
    $price = floatval($input['price']);
    $category_id = isset($input['category_id']) ? intval($input['category_id']) : null;
    $image_path = isset($input['image_path']) ? trim($input['image_path']) : '';

    // Validate data
    if ($id <= 0 || empty($name) || $price < 0 || ($category_id !== null && $category_id <= 0)) {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid input data'
        ]);
        exit;
    }

    // Only update if item is not deleted - use prepared statement for security
    $sql = "UPDATE menu_items SET
            name = ?,
            description = ?,
            price = ?,
            category_id = ?,
            image_path = ?
            WHERE id = ? AND is_deleted = 0";

    $stmt = $conn->prepare($sql);
    if ($stmt === false) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error']);
        $conn->close();
        exit;
    }

    $stmt->bind_param("ssdisi", $name, $description, $price, $category_id, $image_path, $id);

    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            echo json_encode([
                'success' => true,
                'message' => 'Menu item updated successfully'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'No rows affected. Item ID may not exist or item is deleted.'
            ]);
        }
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Error: ' . $conn->error
        ]);
    }

    $stmt->close();
}

$conn->close();
?>