<?php
// Direct Print Invoice to Default Printer (Windows)
include '../cors.php';
include '../database.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $order_id = $input['order_id'];

    // Get printer name from settings or use default
    // Invoice printer name
    $printer_name = "XP-80C";

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

    // Generate Invoice HTML for printing (optimized for default printer)
    $invoice_html = '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @page {
            size: A4;
            margin: 20mm;
        }
        body {
            font-family: Arial, sans-serif;
            font-size: 12pt;
            margin: 0;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
        }
        .header h1 {
            margin: 0;
            font-size: 24pt;
            text-transform: uppercase;
        }
        .header p {
            margin: 5px 0;
            font-size: 11pt;
        }
        .invoice-title {
            text-align: center;
            font-size: 18pt;
            font-weight: bold;
            margin: 20px 0;
        }
        .invoice-info {
            margin-bottom: 20px;
        }
        .invoice-info table {
            width: 100%;
        }
        .invoice-info td {
            padding: 5px;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        .items-table th, .items-table td {
            border: 1px solid #333;
            padding: 10px;
            text-align: left;
        }
        .items-table th {
            background-color: #f0f0f0;
            font-weight: bold;
        }
        .items-table td.quantity {
            text-align: center;
            width: 80px;
        }
        .items-table td.price, .items-table td.total {
            text-align: right;
            width: 120px;
        }
        .totals {
            float: right;
            width: 300px;
            margin-top: 20px;
        }
        .totals table {
            width: 100%;
            border-collapse: collapse;
        }
        .totals td {
            padding: 8px;
            border-top: 1px solid #ccc;
        }
        .totals td.label {
            text-align: left;
        }
        .totals td.amount {
            text-align: right;
            font-weight: bold;
        }
        .totals tr.grand-total {
            border-top: 2px solid #333;
            font-size: 14pt;
        }
        .footer {
            clear: both;
            text-align: center;
            margin-top: 60px;
            padding-top: 20px;
            border-top: 1px solid #ccc;
        }
        @media print {
            body { padding: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>' . htmlspecialchars($settings['restaurant_name']) . '</h1>
        <p>' . htmlspecialchars($settings['address']) . '</p>
        <p>Tel: ' . htmlspecialchars($settings['mobile']) . ' | Email: ' . htmlspecialchars($settings['email']) . '</p>
    </div>

    <div class="invoice-title">INVOICE</div>

    <div class="invoice-info">
        <table>
            <tr>
                <td><strong>Invoice #:</strong> INV-' . $order['id'] . '</td>
                <td style="text-align: right;"><strong>Date:</strong> ' . date('d/m/Y H:i', strtotime($order['created_at'])) . '</td>
            </tr>
            <tr>
                <td><strong>Order Type:</strong> ' . htmlspecialchars($order['order_type']) . '</td>
                <td style="text-align: right;"><strong>Status:</strong> ' . htmlspecialchars($order['status']) . '</td>
            </tr>';

    if ($order['customer_name']) {
        $invoice_html .= '
            <tr>
                <td><strong>Customer:</strong> ' . htmlspecialchars($order['customer_name']) . '</td>
                <td style="text-align: right;"><strong>Mobile:</strong> ' . htmlspecialchars($order['customer_mobile']) . '</td>
            </tr>';
    }

    if ($order['table_name']) {
        $invoice_html .= '
            <tr>
                <td><strong>Table:</strong> ' . htmlspecialchars($order['table_name']) . '</td>
                <td></td>
            </tr>';
    }

    if ($order['payment_method']) {
        $invoice_html .= '
            <tr>
                <td><strong>Payment Method:</strong> ' . htmlspecialchars($order['payment_method']) . '</td>
                <td></td>
            </tr>';
    }

    $invoice_html .= '
        </table>
    </div>

    <table class="items-table">
        <thead>
            <tr>
                <th>Item</th>
                <th class="quantity">Qty</th>
                <th class="price">Price</th>
                <th class="total">Total</th>
            </tr>
        </thead>
        <tbody>';

    foreach ($items as $item) {
        $item_total = $item['quantity'] * $item['price_per_item'];
        $invoice_html .= '
            <tr>
                <td>' . htmlspecialchars($item['item_name']) . '</td>
                <td class="quantity">' . $item['quantity'] . '</td>
                <td class="price">Rs. ' . number_format($item['price_per_item'], 2) . '</td>
                <td class="total">Rs. ' . number_format($item_total, 2) . '</td>
            </tr>';
    }

    $invoice_html .= '
        </tbody>
    </table>

    <div class="totals">
        <table>
            <tr>
                <td class="label">Subtotal:</td>
                <td class="amount">Rs. ' . number_format($subtotal, 2) . '</td>
            </tr>
            <tr>
                <td class="label">Tax (' . $settings['tax_rate'] . '%):</td>
                <td class="amount">Rs. ' . number_format($tax_amount, 2) . '</td>
            </tr>
            <tr class="grand-total">
                <td class="label">TOTAL:</td>
                <td class="amount">Rs. ' . number_format($total_amount, 2) . '</td>
            </tr>
        </table>
    </div>

    <div class="footer">
        <p><strong>Thank you for your business!</strong></p>
        <p>Please visit again</p>
    </div>
</body>
</html>';

    // Try to print directly (Windows only)
    if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
        // Save HTML to temp file
        $temp_file = sys_get_temp_dir() . '\\invoice_' . $order_id . '.html';
        file_put_contents($temp_file, $invoice_html);

        $success = false;
        $method = '';

        // Method 1: Try using mshta.exe to print HTML (more reliable for HTML)
        $command1 = 'mshta.exe "javascript:document.write(\'' . addslashes($invoice_html) . '\');document.execCommand(\'print\',false,null);window.close();"';
        exec($command1 . ' 2>&1', $output1, $return_var1);

        if ($return_var1 === 0) {
            $success = true;
            $method = 'mshta';
        }

        // Method 2: Try Windows print command
        if (!$success) {
            $command2 = 'print /D:"' . $printer_name . '" "' . $temp_file . '"';
            exec($command2 . ' 2>&1', $output2, $return_var2);

            if ($return_var2 === 0) {
                $success = true;
                $method = 'print command';
            }
        }

        // Method 3: Try using Internet Explorer for printing (fallback)
        if (!$success) {
            $command3 = 'start /min iexplore.exe -p "' . $temp_file . '"';
            exec($command3 . ' 2>&1', $output3, $return_var3);

            if ($return_var3 === 0) {
                $success = true;
                $method = 'internet explorer';
            }
        }

        // Clean up temp file after a delay (allow time for printing)
        sleep(2);
        if (file_exists($temp_file)) {
            @unlink($temp_file);
        }

        if ($success) {
            echo json_encode([
                'success' => true,
                'message' => 'Invoice sent to printer successfully',
                'method' => $method
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Failed to print invoice. All methods failed.',
                'debug' => [
                    'printer' => $printer_name,
                    'method1' => ['return' => $return_var1 ?? null, 'output' => $output1 ?? []],
                    'method2' => ['command' => $command2 ?? '', 'return' => $return_var2 ?? null, 'output' => $output2 ?? []],
                    'method3' => ['return' => $return_var3 ?? null]
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
