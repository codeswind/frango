<?php
include '../cors.php';
include '../database.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input || !isset($input['id']) || !isset($input['name']) || !isset($input['price'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid input data'
        ]);
        exit;
    }

    $id = (int)$input['id'];
    $name = $input['name'];
    $description = isset($input['description']) ? $input['description'] : '';
    $price = (float)$input['price'];
    $category_id = isset($input['category_id']) ? (int)$input['category_id'] : null;
    $image_path = isset($input['image_path']) ? $input['image_path'] : '';

    // Only update if item is not deleted
    $sql = "UPDATE menu_items SET
            name = ?,
            description = ?,
            price = ?,
            category_id = ?,
            image_path = ?
            WHERE id = ? AND is_deleted = 0";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("sssdsi", $name, $description, $price, $category_id, $image_path, $id);

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