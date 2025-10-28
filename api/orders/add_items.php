<?php
include '../cors.php';
include '../database.php';
include '../auth.php';

// Require authentication
requireAuthWithTimeout();

// Cashiers can add items to orders they create
requireRole(PERM_CREATE_ORDERS);

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $order_id = intval($input['order_id']);
    $items = $input['items'];

    // Validate order_id
    if ($order_id <= 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid order ID'
        ]);
        exit;
    }

    // Get existing items to compare with new items
    $existing_items = [];
    $existing_sql = "SELECT menu_item_id, quantity FROM order_items WHERE order_id = ?";
    $existing_stmt = $conn->prepare($existing_sql);
    $existing_stmt->bind_param('i', $order_id);
    $existing_stmt->execute();
    $existing_result = $existing_stmt->get_result();

    while ($row = $existing_result->fetch_assoc()) {
        $existing_items[$row['menu_item_id']] = $row['quantity'];
    }
    $existing_stmt->close();

    // Clear existing items for this order and replace with current cart
    $delete_sql = "DELETE FROM order_items WHERE order_id = ?";
    $delete_stmt = $conn->prepare($delete_sql);
    $delete_stmt->bind_param('i', $order_id);
    $delete_stmt->execute();
    $delete_stmt->close();

    $total_amount = 0;

    // Prepare statements for inserting items
    $insert_printed_stmt = $conn->prepare("INSERT INTO order_items (order_id, menu_item_id, quantity, price_per_item, notes, kot_printed) VALUES (?, ?, ?, ?, ?, TRUE)");
    $insert_new_stmt = $conn->prepare("INSERT INTO order_items (order_id, menu_item_id, quantity, price_per_item, notes, kot_printed) VALUES (?, ?, ?, ?, ?, FALSE)");

    foreach ($items as $item) {
        $menu_item_id = intval($item['menu_item_id']);
        $quantity = intval($item['quantity']);
        $price_per_item = floatval($item['price_per_item']);
        $notes = isset($item['notes']) ? trim($item['notes']) : '';

        // Validate item data
        if ($menu_item_id <= 0 || $quantity <= 0 || $price_per_item < 0) {
            continue; // Skip invalid items
        }

        $item_total = $quantity * $price_per_item;
        $total_amount += $item_total;

        // Get the existing quantity for this item (default to 0 if new)
        $existing_quantity = isset($existing_items[$menu_item_id]) ? $existing_items[$menu_item_id] : 0;

        // Calculate how many items were already printed (should not print again)
        $already_printed_quantity = $existing_quantity;

        // Calculate new items to print (only the delta)
        $new_quantity = $quantity - $already_printed_quantity;

        if ($already_printed_quantity > 0) {
            // Insert the already printed items first (marked as printed)
            $insert_printed_stmt->bind_param('iiids', $order_id, $menu_item_id, $already_printed_quantity, $price_per_item, $notes);
            $insert_printed_stmt->execute();
        }

        if ($new_quantity > 0) {
            // Insert only the NEW items (marked as not printed)
            $insert_new_stmt->bind_param('iiids', $order_id, $menu_item_id, $new_quantity, $price_per_item, $notes);
            $insert_new_stmt->execute();
        }
    }

    $insert_printed_stmt->close();
    $insert_new_stmt->close();

    // Update total amount in orders table
    $update_sql = "UPDATE orders SET total_amount = ? WHERE id = ?";
    $update_stmt = $conn->prepare($update_sql);
    $update_stmt->bind_param('di', $total_amount, $order_id);
    $update_stmt->execute();
    $update_stmt->close();

    echo json_encode([
        'success' => true,
        'message' => 'Order items updated successfully'
    ]);
}

$conn->close();
?>