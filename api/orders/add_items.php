<?php
include '../cors.php';
include '../database.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $order_id = $input['order_id'];
    $items = $input['items'];

    // Get existing items to compare with new items
    $existing_items = [];
    $existing_sql = "SELECT menu_item_id, quantity FROM order_items WHERE order_id = '$order_id'";
    $existing_result = $conn->query($existing_sql);

    while ($row = $existing_result->fetch_assoc()) {
        $existing_items[$row['menu_item_id']] = $row['quantity'];
    }

    // Clear existing items for this order and replace with current cart
    $delete_sql = "DELETE FROM order_items WHERE order_id = '$order_id'";
    $conn->query($delete_sql);

    $total_amount = 0;

    foreach ($items as $item) {
        $menu_item_id = $item['menu_item_id'];
        $quantity = $item['quantity'];
        $price_per_item = $item['price_per_item'];
        $item_total = $quantity * $price_per_item;
        $total_amount += $item_total;

        // Determine if this is a new item or increased quantity
        $is_new_or_increased = false;
        if (!isset($existing_items[$menu_item_id]) || $quantity > $existing_items[$menu_item_id]) {
            $is_new_or_increased = true;
        }

        // Insert item with kot_printed set to false for new/increased items
        $kot_printed = $is_new_or_increased ? 'FALSE' : 'TRUE';
        $sql = "INSERT INTO order_items (order_id, menu_item_id, quantity, price_per_item, kot_printed)
                VALUES ('$order_id', '$menu_item_id', '$quantity', '$price_per_item', $kot_printed)";
        $conn->query($sql);
    }

    // Update total amount in orders table
    $update_sql = "UPDATE orders SET total_amount = '$total_amount' WHERE id = '$order_id'";
    $conn->query($update_sql);

    echo json_encode([
        'success' => true,
        'message' => 'Order items updated successfully'
    ]);
}

$conn->close();
?>