<?php
// Direct Print Invoice to Thermal Printer XP-80C (80mm)
include '../cors.php';
include '../database.php';

// Function to send raw data directly to printer (same as KOT)
function printToThermal($printer_name, $data) {
    if (strtoupper(substr(PHP_OS, 0, 3)) !== 'WIN') {
        return ['success' => false, 'message' => 'Only Windows is supported'];
    }

    // Method 1: Try using COPY command with /B flag
    $temp_file = sys_get_temp_dir() . '\\invoice_' . time() . '.prn';
    file_put_contents($temp_file, $data);

    $command = 'copy /B "' . $temp_file . '" "\\\\localhost\\' . $printer_name . '"';
    exec($command . ' 2>&1', $output, $return_var);

    sleep(2);
    if (file_exists($temp_file)) {
        @unlink($temp_file);
    }

    if ($return_var === 0 && (!isset($output[0]) || stripos($output[0], 'copied') !== false)) {
        return ['success' => true, 'message' => 'Printed via copy command', 'method' => 'copy'];
    }

    // Method 2: Try direct file write to printer share
    try {
        $printer_path = "\\\\localhost\\" . $printer_name;
        $handle = @fopen($printer_path, 'wb');

        if ($handle) {
            fwrite($handle, $data);
            fflush($handle);
            usleep(500000);
            fclose($handle);
            sleep(1);
            return ['success' => true, 'message' => 'Printed via direct file access', 'method' => 'direct'];
        }
    } catch (Exception $e) {
        // Continue to next method
    }

    return [
        'success' => false,
        'message' => 'Printing failed. Check printer sharing.',
        'debug' => [
            'printer' => $printer_name,
            'method1' => ['command' => $command, 'return' => $return_var, 'output' => $output]
        ]
    ];
}

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $order_id = $input['order_id'];

    // Invoice printer name
    $invoice_printer_name = "XP-80C";

    // Get settings
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

    // Generate ESC/POS commands for 80mm thermal printer (48 characters wide)
    $escpos = chr(27) . chr(64); // Initialize printer

    // Header
    $escpos .= chr(27) . chr(97) . chr(1); // Center align
    $escpos .= chr(27) . chr(33) . chr(24); // Double width + height
    $escpos .= strtoupper($settings['restaurant_name']) . "\n";
    $escpos .= chr(27) . chr(33) . chr(0); // Normal text
    $escpos .= $settings['address'] . "\n";
    $escpos .= "Tel: " . $settings['mobile'] . "\n";
    if ($settings['email']) {
        $escpos .= "Email: " . $settings['email'] . "\n";
    }
    $escpos .= str_repeat("=", 48) . "\n";

    // Invoice title
    $escpos .= chr(27) . chr(97) . chr(1); // Center align
    $escpos .= chr(27) . chr(33) . chr(8); // Bold
    $escpos .= "INVOICE\n";
    $escpos .= chr(27) . chr(33) . chr(0); // Normal
    $escpos .= str_repeat("=", 48) . "\n";

    // Order info
    $escpos .= chr(27) . chr(97) . chr(0); // Left align
    $escpos .= "Invoice #: INV-" . str_pad($order['id'], 5, '0', STR_PAD_LEFT) . "\n";
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
    if ($order['payment_method']) {
        $escpos .= "Payment: " . $order['payment_method'] . "\n";
    }

    $escpos .= str_repeat("-", 48) . "\n";

    // Items header
    $escpos .= chr(27) . chr(33) . chr(8); // Bold
    $escpos .= sprintf("%-24s %4s %8s %10s\n", "Item", "Qty", "Price", "Total");
    $escpos .= chr(27) . chr(33) . chr(0); // Normal
    $escpos .= str_repeat("-", 48) . "\n";

    // Items
    foreach ($items as $item) {
        $item_total = $item['quantity'] * $item['price_per_item'];

        // Item name (truncate if too long)
        $item_name = substr($item['item_name'], 0, 24);
        $escpos .= sprintf("%-24s\n", $item_name);

        // Quantity, price, total on next line
        $escpos .= sprintf("%28s %4d %8.2f %10.2f\n",
            "",
            $item['quantity'],
            $item['price_per_item'],
            $item_total
        );
    }

    $escpos .= str_repeat("-", 48) . "\n";

    // Totals
    $escpos .= sprintf("%38s %10.2f\n", "Subtotal:", $subtotal);
    $escpos .= sprintf("%38s %10.2f\n", "Tax (" . $settings['tax_rate'] . "%):", $tax_amount);
    $escpos .= str_repeat("=", 48) . "\n";

    // Grand total - larger
    $escpos .= chr(27) . chr(33) . chr(24); // Double size
    $escpos .= chr(27) . chr(97) . chr(2); // Right align
    $escpos .= "TOTAL: Rs." . number_format($total_amount, 2) . "\n";
    $escpos .= chr(27) . chr(33) . chr(0); // Normal
    $escpos .= chr(27) . chr(97) . chr(0); // Left align
    $escpos .= str_repeat("=", 48) . "\n";

    // Footer
    $escpos .= chr(27) . chr(97) . chr(1); // Center align
    $escpos .= "\n";
    $escpos .= "Thank you for your business!\n";
    $escpos .= "Please visit again\n";
    $escpos .= "\n\n\n\n\n\n"; // Extra blank lines

    // Cut paper
    $escpos .= chr(29) . chr(86) . chr(66) . chr(0); // Partial cut

    // Send to printer
    $print_result = printToThermal($invoice_printer_name, $escpos);

    if ($print_result['success']) {
        echo json_encode([
            'success' => true,
            'message' => 'Invoice sent to printer successfully',
            'print_method' => $print_result['method']
        ]);
    } else {
        echo json_encode($print_result);
    }
}

$conn->close();
?>
