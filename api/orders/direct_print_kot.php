<?php
// Direct Print KOT to Thermal Printer (Windows)
include '../cors.php';
include '../database.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $order_id = $input['order_id'];

    // Get thermal printer name from settings
    // UPDATE THIS with your exact thermal printer name from Windows
    // Example: "POS-80", "TM-T20", "XP-80C", etc.
    $thermal_printer_name = "ThermalPrinter"; // UPDATE THIS

    // Check if KOT printing is enabled
    $settings_sql = "SELECT print_kot, restaurant_name FROM settings ORDER BY id DESC LIMIT 1";
    $settings_result = $conn->query($settings_sql);
    $settings = $settings_result->fetch_assoc();

    if (!$settings || !$settings['print_kot']) {
        echo json_encode([
            'success' => false,
            'message' => 'KOT printing is disabled in settings'
        ]);
        exit;
    }

    // Get order details
    $order_sql = "SELECT o.*, c.name as customer_name, t.table_name
                  FROM orders o
                  LEFT JOIN customers c ON o.customer_id = c.id
                  LEFT JOIN tables t ON o.table_id = t.id
                  WHERE o.id = '$order_id'";
    $order_result = $conn->query($order_sql);

    if ($order_result->num_rows == 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Order not found'
        ]);
        exit;
    }

    $order = $order_result->fetch_assoc();

    // Get ONLY items that haven't been printed to kitchen yet
    $items_sql = "SELECT oi.*, mi.name as item_name, c.name as category_name
                  FROM order_items oi
                  JOIN menu_items mi ON oi.menu_item_id = mi.id
                  LEFT JOIN categories c ON mi.category_id = c.id
                  WHERE oi.order_id = '$order_id' AND oi.kot_printed = 0
                  ORDER BY c.name, mi.name";
    $items_result = $conn->query($items_sql);

    if ($items_result->num_rows == 0) {
        echo json_encode([
            'success' => false,
            'message' => 'No new items to print to kitchen'
        ]);
        exit;
    }

    $items = [];
    while ($row = $items_result->fetch_assoc()) {
        $items[] = $row;
    }

    // Generate ESC/POS commands for 80mm thermal printer (48 characters wide)
    $escpos = chr(27) . chr(64); // Initialize printer

    // Header
    $escpos .= chr(27) . chr(97) . chr(1); // Center align
    $escpos .= chr(27) . chr(33) . chr(24); // Double width + height
    $escpos .= "KITCHEN ORDER\n";
    $escpos .= chr(27) . chr(33) . chr(0); // Normal text
    $escpos .= chr(27) . chr(97) . chr(1); // Center align
    $escpos .= $settings['restaurant_name'] . "\n";
    $escpos .= str_repeat("=", 48) . "\n";

    // Order info
    $escpos .= chr(27) . chr(97) . chr(0); // Left align
    $escpos .= chr(27) . chr(33) . chr(8); // Bold text
    $escpos .= "Order #: " . $order['id'] . "\n";
    $escpos .= "Time: " . date('d/m/Y H:i:s') . "\n";
    $escpos .= "Type: " . $order['order_type'] . "\n";

    if ($order['table_name']) {
        $escpos .= "Table: " . $order['table_name'] . "\n";
    }

    if ($order['customer_name']) {
        $escpos .= "Customer: " . $order['customer_name'] . "\n";
    }

    $escpos .= chr(27) . chr(33) . chr(0); // Normal text
    $escpos .= str_repeat("=", 48) . "\n";

    // Group items by category
    $items_by_category = [];
    foreach ($items as $item) {
        $category = $item['category_name'] ?: 'Other';
        if (!isset($items_by_category[$category])) {
            $items_by_category[$category] = [];
        }
        $items_by_category[$category][] = $item;
    }

    // Print items grouped by category
    foreach ($items_by_category as $category => $category_items) {
        $escpos .= chr(27) . chr(33) . chr(8); // Bold
        $escpos .= strtoupper($category) . "\n";
        $escpos .= chr(27) . chr(33) . chr(0); // Normal
        $escpos .= str_repeat("-", 48) . "\n";

        foreach ($category_items as $item) {
            // Item name and quantity
            $escpos .= chr(27) . chr(33) . chr(16); // Double width
            $escpos .= sprintf("x%d  %s\n", $item['quantity'], substr($item['item_name'], 0, 20));
            $escpos .= chr(27) . chr(33) . chr(0); // Normal
            $escpos .= "\n";
        }

        $escpos .= str_repeat("-", 48) . "\n";
    }

    // Footer
    $escpos .= chr(27) . chr(97) . chr(1); // Center align
    $escpos .= chr(27) . chr(33) . chr(8); // Bold
    $escpos .= "PREPARE IMMEDIATELY\n";
    $escpos .= chr(27) . chr(33) . chr(0); // Normal
    $escpos .= "\n\n\n";

    // Cut paper
    $escpos .= chr(29) . chr(86) . chr(1); // Full cut

    // Try to print directly (Windows only)
    if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
        // Save to temp file
        $temp_file = sys_get_temp_dir() . '\\kot_' . $order_id . '_' . time() . '.txt';
        file_put_contents($temp_file, $escpos);

        // Print using Windows print command to thermal printer
        $command = 'print /D:"' . $thermal_printer_name . '" "' . $temp_file . '"';
        exec($command, $output, $return_var);

        // Clean up temp file after a delay
        sleep(1);
        if (file_exists($temp_file)) {
            unlink($temp_file);
        }

        if ($return_var === 0) {
            // Mark items as printed
            $item_ids = array_map(function($item) { return $item['id']; }, $items);
            $item_ids_str = implode(',', $item_ids);

            $update_sql = "UPDATE order_items SET kot_printed = 1
                          WHERE id IN ($item_ids_str)";
            $conn->query($update_sql);

            echo json_encode([
                'success' => true,
                'message' => 'KOT sent to kitchen printer successfully',
                'items_count' => count($items)
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Failed to print KOT. Please check thermal printer configuration.',
                'debug' => [
                    'command' => $command,
                    'return_code' => $return_var,
                    'output' => $output,
                    'printer' => $thermal_printer_name
                ]
            ]);
        }
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Direct printing only supported on Windows'
        ]);
    }
}

$conn->close();
?>
