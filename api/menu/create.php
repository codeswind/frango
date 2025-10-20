<?php
include '../cors.php';
include '../database.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $name = $input['name'];
    $description = $input['description'];
    $price = $input['price'];
    $category_id = $input['category_id'];
    $image_path = isset($input['image_path']) ? $input['image_path'] : '';

    $sql = "INSERT INTO menu_items (name, description, price, category_id, image_path)
            VALUES ('$name', '$description', '$price', '$category_id', '$image_path')";

    if ($conn->query($sql) === TRUE) {
        echo json_encode([
            'success' => true,
            'message' => 'Menu item created successfully',
            'id' => $conn->insert_id
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Error: ' . $conn->error
        ]);
    }
}

$conn->close();
?>