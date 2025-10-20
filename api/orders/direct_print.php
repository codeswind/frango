<?php
// Direct Print to Thermal Printer (Windows)
include '../cors.php';
include '../database.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $order_id = $input['order_id'];

    // Get printer name from settings (you need to add this to settings table)
    $printer_name = "\\\\localhost\\ThermalPrinter"; // Default thermal printer name

    // Get invoice data (reuse existing logic)
    $settings_sql = "SELECT print_invoice, restaurant_name, address, mobile, email, tax_rate
                     FROM settings ORDER BY id DESC LIMIT 1";
    $settings_result = $conn->query($settings_sql);
    $settings = $settings_result->fetch_assoc();

    if (!$settings || !$settings['print_invoice']) {
        echo json_encode([
            'success' => false,
            'message' => 'Invoice printing is disabled in settings'
        ]);
        exit;
    }

    // Get order details
    $order_sql = "SELECT o.*, c.name as customer_name, c.mobile as customer_mobile,
                         c.address as customer_address, t.table_name, p.payment_method
                  FROM orders o
                  LEFT JOIN customers c ON o.customer_id = c.id
                  LEFT JOIN tables t ON o.table_id = t.id
                  LEFT JOIN payments p ON o.id = p.order_id
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

    // Get order items
    $items_sql = "SELECT oi.*, mi.name as item_name
                  FROM order_items oi
                  JOIN menu_items mi ON oi.menu_item_id = mi.id
                  WHERE oi.order_id = '$order_id'
                  ORDER BY mi.name";
    $items_result = $conn->query($items_sql);

    $items = [];
    $subtotal = 0;
    while ($row = $items_result->fetch_assoc()) {
        $items[] = $row;
        $subtotal += $row['quantity'] * $row['price_per_item'];
    }

    // Calculate tax and total
    $tax_rate = floatval($settings['tax_rate']) / 100;
    $tax_amount = $subtotal * $tax_rate;
    $total_amount = $subtotal + $tax_amount;

    // Generate ESC/POS commands for thermal printer
    $escpos = chr(27) . chr(64); // Initialize printer

    // Header
    $escpos .= chr(27) . chr(97) . chr(1); // Center align
    $escpos .= chr(27) . chr(33) . chr(16); // Double width
    $escpos .= strtoupper($settings['restaurant_name']) . "\n";
    $escpos .= chr(27) . chr(33) . chr(0); // Normal text
    $escpos .= $settings['address'] . "\n";
    $escpos .= "Tel: " . $settings['mobile'] . "\n";
    $escpos .= str_repeat("-", 32) . "\n";

    // Invoice title
    $escpos .= chr(27) . chr(33) . chr(8); // Bold
    $escpos .= "INVOICE\n";
    $escpos .= chr(27) . chr(33) . chr(0); // Normal
    $escpos .= str_repeat("-", 32) . "\n";

    // Order info
    $escpos .= chr(27) . chr(97) . chr(0); // Left align
    $escpos .= "Invoice #: INV-" . $order['id'] . "\n";
    $escpos .= "Date: " . date('d/m/Y H:i', strtotime($order['created_at'])) . "\n";
    $escpos .= "Type: " . $order['order_type'] . "\n";

    if ($order['customer_name']) {
        $escpos .= "Customer: " . $order['customer_name'] . "\n";
    }
    if ($order['customer_mobile']) {
        $escpos .= "Mobile: " . $order['customer_mobile'] . "\n";
    }
    if ($order['table_name']) {
        $escpos .= "Table: " . $order['table_name'] . "\n";
    }

    $escpos .= str_repeat("-", 32) . "\n";

    // Items
    foreach ($items as $item) {
        $item_total = $item['quantity'] * $item['price_per_item'];
        $escpos .= $item['item_name'] . "\n";
        $escpos .= sprintf("  %d x Rs.%.2f%sRs.%.2f\n",
            $item['quantity'],
            $item['price_per_item'],
            str_repeat(" ", 10),
            $item_total
        );
    }

    $escpos .= str_repeat("-", 32) . "\n";

    // Totals
    $escpos .= sprintf("Subtotal:%sRs.%.2f\n", str_repeat(" ", 12), $subtotal);
    $escpos .= sprintf("Tax (%s%%):%sRs.%.2f\n", $settings['tax_rate'], str_repeat(" ", 12), $tax_amount);
    $escpos .= str_repeat("-", 32) . "\n";
    $escpos .= chr(27) . chr(33) . chr(24); // Double height + width
    $escpos .= sprintf("TOTAL:%sRs.%.2f\n", str_repeat(" ", 6), $total_amount);
    $escpos .= chr(27) . chr(33) . chr(0); // Normal
    $escpos .= str_repeat("-", 32) . "\n";

    // Footer
    $escpos .= chr(27) . chr(97) . chr(1); // Center align
    $escpos .= "Thank you for your business!\n";
    $escpos .= "Please visit again\n";
    $escpos .= "\n\n\n";

    // Cut paper
    $escpos .= chr(29) . chr(86) . chr(1);

    // Try to print directly (Windows only)
    if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
        // Save to temp file
        $temp_file = sys_get_temp_dir() . '\\invoice_' . $order_id . '.txt';
        file_put_contents($temp_file, $escpos);

        // Print using Windows print command
        $command = 'print /D:"' . $printer_name . '" "' . $temp_file . '"';
        exec($command, $output, $return_var);

        // Clean up
        unlink($temp_file);

        if ($return_var === 0) {
            echo json_encode([
                'success' => true,
                'message' => 'Invoice printed successfully'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Failed to print. Please check printer configuration.'
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
