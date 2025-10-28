<?php
include '../cors.php';
include '../config.php';
include '../database.php';

function printToThermal($printer_name, $data) {
    if (strtoupper(substr(PHP_OS, 0, 3)) !== 'WIN') {
        return ['success' => false, 'message' => 'Only Windows is supported'];
    }

    $temp_file = sys_get_temp_dir() . '\\kot_' . time() . '.prn';
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
    }

    $temp_file2 = sys_get_temp_dir() . '\\kot_net_' . time() . '.prn';
    file_put_contents($temp_file2, $data);

    $command2 = 'type "' . $temp_file2 . '" > "\\\\localhost\\' . $printer_name . '"';
    exec($command2 . ' 2>&1', $output2, $return_var2);

    sleep(1);
    if (file_exists($temp_file2)) {
        @unlink($temp_file2);
    }

    if ($return_var2 === 0) {
        return ['success' => true, 'message' => 'Printed via type command', 'method' => 'type'];
    }

    return [
        'success' => false,
        'message' => 'All printing methods failed. Make sure printer is shared.',
        'debug' => [
            'printer' => $printer_name,
            'method1' => ['command' => $command, 'return' => $return_var, 'output' => $output],
            'method2' => 'Direct fopen failed',
            'method3' => ['command' => $command2, 'return' => $return_var2, 'output' => $output2]
        ]
    ];
}

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $order_id = intval($input['order_id']);

    // Validate order_id
    if ($order_id <= 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid order ID'
        ]);
        exit;
    }

    $thermal_printer_name = KOT_PRINTER;

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

    $order_sql = "SELECT o.*, c.name as customer_name, t.table_name
                  FROM orders o
                  LEFT JOIN customers c ON o.customer_id = c.id
                  LEFT JOIN tables t ON o.table_id = t.id
                  WHERE o.id = $order_id";
    $order_result = $conn->query($order_sql);

    if ($order_result->num_rows == 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Order not found'
        ]);
        exit;
    }

    $order = $order_result->fetch_assoc();

    $items_sql = "SELECT oi.*, mi.name as item_name, c.name as category_name
                  FROM order_items oi
                  JOIN menu_items mi ON oi.menu_item_id = mi.id
                  LEFT JOIN categories c ON mi.category_id = c.id
                  WHERE oi.order_id = $order_id AND oi.kot_printed = 0
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

    $escpos = chr(27) . chr(64);
    $escpos .= chr(27) . chr(97) . chr(1);
    $escpos .= chr(27) . chr(33) . chr(24);
    $escpos .= "KITCHEN ORDER\n";
    $escpos .= chr(27) . chr(33) . chr(0);
    $escpos .= chr(27) . chr(97) . chr(1);
    $escpos .= $settings['restaurant_name'] . "\n";
    $escpos .= str_repeat("=", 48) . "\n";

    $escpos .= chr(27) . chr(97) . chr(0);
    $escpos .= chr(27) . chr(33) . chr(8);
    $escpos .= "Order #: " . $order['id'] . "\n";
    $escpos .= "Time: " . date('d/m/Y H:i:s') . "\n";
    $escpos .= "Type: " . $order['order_type'] . "\n";

    if ($order['external_order_id']) {
        $escpos .= chr(27) . chr(33) . chr(16);
        $escpos .= $order['order_type'] . " ID: " . $order['external_order_id'] . "\n";
        $escpos .= chr(27) . chr(33) . chr(8);
    }

    if ($order['table_name']) {
        $escpos .= "Table: " . $order['table_name'] . "\n";
    }

    if ($order['customer_name']) {
        $escpos .= "Customer: " . $order['customer_name'] . "\n";
    }

    $escpos .= chr(27) . chr(33) . chr(0);
    $escpos .= str_repeat("=", 48) . "\n";

    $items_by_category = [];
    foreach ($items as $item) {
        $category = $item['category_name'] ?: 'Other';
        if (!isset($items_by_category[$category])) {
            $items_by_category[$category] = [];
        }
        $items_by_category[$category][] = $item;
    }

    foreach ($items_by_category as $category => $category_items) {
        $escpos .= chr(27) . chr(33) . chr(8);
        $escpos .= strtoupper($category) . "\n";
        $escpos .= chr(27) . chr(33) . chr(0);
        $escpos .= str_repeat("-", 48) . "\n";

        foreach ($category_items as $item) {
            $escpos .= chr(27) . chr(33) . chr(16);
            $escpos .= sprintf("x%d  %s\n", $item['quantity'], substr($item['item_name'], 0, 20));
            $escpos .= chr(27) . chr(33) . chr(0);

            if (!empty($item['notes'])) {
                $escpos .= chr(27) . chr(33) . chr(8);
                $escpos .= "    Note: " . $item['notes'] . "\n";
                $escpos .= chr(27) . chr(33) . chr(0);
            }

            $escpos .= "\n";
        }

        $escpos .= str_repeat("-", 48) . "\n";
    }

    $escpos .= chr(27) . chr(97) . chr(1);
    $escpos .= chr(27) . chr(33) . chr(8);
    $escpos .= "PREPARE IMMEDIATELY\n";
    $escpos .= chr(27) . chr(33) . chr(0);
    $escpos .= "\n";
    $escpos .= str_repeat("-", 48) . "\n";
    $escpos .= chr(27) . chr(33) . chr(8);
    $escpos .= "WindPOS for restaurants\n";
    $escpos .= chr(27) . chr(33) . chr(0);
    $escpos .= "Powered by CodesWind\n";
    $escpos .= "www.codeswind.cloud | 0722440666\n";
    $escpos .= "\n\n\n\n\n\n";
    $escpos .= chr(29) . chr(86) . chr(66) . chr(0);

    $print_result = printToThermal($thermal_printer_name, $escpos);

    if ($print_result['success']) {
        $item_ids = array_map(function($item) { return intval($item['id']); }, $items);
        $item_ids_str = implode(',', $item_ids);

        if (!empty($item_ids_str)) {
            $update_sql = "UPDATE order_items SET kot_printed = 1 WHERE id IN ($item_ids_str)";
            $conn->query($update_sql);
        }

        echo json_encode([
            'success' => true,
            'message' => 'KOT sent to kitchen printer successfully',
            'items_count' => count($items),
            'print_method' => $print_result['method']
        ]);
    } else {
        echo json_encode($print_result);
    }
}

$conn->close();
?>
