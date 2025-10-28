<?php
include '../cors.php';
include '../config.php';
include '../database.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    // Validate order_id
    if (!$input || !isset($input['order_id'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Missing order ID'
        ]);
        exit;
    }

    $order_id = intval($input['order_id']);

    if ($order_id <= 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid order ID'
        ]);
        exit;
    }

    $settings_sql = "SELECT restaurant_name, address, mobile, email, tax_rate
                     FROM settings ORDER BY id DESC LIMIT 1";
    $settings_result = $conn->query($settings_sql);
    $settings = $settings_result->fetch_assoc();

    $order_sql = "SELECT o.*, c.name as customer_name, c.mobile as customer_mobile,
                         c.address as customer_address, t.table_name, p.payment_method
                  FROM orders o
                  LEFT JOIN customers c ON o.customer_id = c.id
                  LEFT JOIN tables t ON o.table_id = t.id
                  LEFT JOIN payments p ON o.id = p.order_id
                  WHERE o.id = ?";
    $stmt = $conn->prepare($order_sql);
    $stmt->bind_param("i", $order_id);
    $stmt->execute();
    $order_result = $stmt->get_result();

    if ($order_result->num_rows == 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Order not found'
        ]);
        $stmt->close();
        exit;
    }

    $order = $order_result->fetch_assoc();
    $stmt->close();

    $items_sql = "SELECT oi.*, mi.name as item_name
                  FROM order_items oi
                  JOIN menu_items mi ON oi.menu_item_id = mi.id
                  WHERE oi.order_id = ?
                  ORDER BY mi.name";
    $items_stmt = $conn->prepare($items_sql);
    $items_stmt->bind_param("i", $order_id);
    $items_stmt->execute();
    $items_result = $items_stmt->get_result();

    $items = [];
    $subtotal = 0;
    while ($row = $items_result->fetch_assoc()) {
        $items[] = $row;
        $subtotal += $row['quantity'] * $row['price_per_item'];
    }
    $items_stmt->close();

    $tax_rate = floatval($settings['tax_rate']) / 100;
    $tax_amount = $subtotal * $tax_rate;
    $total_amount = $subtotal + $tax_amount;

    // Get discount and payment details
    $discount_amount = floatval($order['discount_amount']) ?? 0;
    $final_amount = floatval($order['final_amount']) ?? $total_amount;
    $paid_amount = floatval($order['paid_amount']) ?? 0;
    $balance = floatval($order['balance']) ?? 0;

    // Generate HTML invoice
    $invoice_html = '
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Invoice #' . htmlspecialchars($order['id']) . '</title>
        <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .invoice-header { text-align: center; margin-bottom: 20px; }
            .invoice-header h1 { margin: 0; font-size: 24px; }
            .invoice-info { margin-bottom: 20px; }
            .invoice-info div { margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .text-right { text-align: right; }
            .total-row { font-weight: bold; background-color: #f9f9f9; }
            @media print {
                body { padding: 0; }
            }
        </style>
    </head>
    <body>
        <div class="invoice-header">
            <h1>' . htmlspecialchars($settings['restaurant_name']) . '</h1>
            <p>' . htmlspecialchars($settings['address']) . '</p>
            <p>Tel: ' . htmlspecialchars($settings['mobile']) . '</p>
            ' . ($settings['email'] ? '<p>Email: ' . htmlspecialchars($settings['email']) . '</p>' : '') . '
        </div>

        <div class="invoice-info">
            <h2>INVOICE</h2>
            <div><strong>Invoice #:</strong> INV-' . str_pad($order['id'], 5, '0', STR_PAD_LEFT) . '</div>
            <div><strong>Date:</strong> ' . date('d/m/Y H:i', strtotime($order['created_at'])) . '</div>
            <div><strong>Order Type:</strong> ' . htmlspecialchars($order['order_type']) . '</div>
            ' . ($order['customer_name'] ? '<div><strong>Customer:</strong> ' . htmlspecialchars($order['customer_name']) . '</div>' : '') . '
            ' . ($order['customer_mobile'] ? '<div><strong>Mobile:</strong> ' . htmlspecialchars($order['customer_mobile']) . '</div>' : '') . '
            ' . ($order['table_name'] ? '<div><strong>Table:</strong> ' . htmlspecialchars($order['table_name']) . '</div>' : '') . '
            ' . ($order['payment_method'] ? '<div><strong>Payment Method:</strong> ' . htmlspecialchars($order['payment_method']) . '</div>' : '') . '
        </div>

        <table>
            <thead>
                <tr>
                    <th>Item</th>
                    <th class="text-right">Qty</th>
                    <th class="text-right">Price</th>
                    <th class="text-right">Total</th>
                </tr>
            </thead>
            <tbody>';

    foreach ($items as $item) {
        $item_total = $item['quantity'] * $item['price_per_item'];
        $invoice_html .= '
                <tr>
                    <td>' . htmlspecialchars($item['item_name']) . '</td>
                    <td class="text-right">' . $item['quantity'] . '</td>
                    <td class="text-right">Rs. ' . number_format($item['price_per_item'], 2) . '</td>
                    <td class="text-right">Rs. ' . number_format($item_total, 2) . '</td>
                </tr>';
    }

    $invoice_html .= '
                <tr>
                    <td colspan="3" class="text-right"><strong>Subtotal:</strong></td>
                    <td class="text-right">Rs. ' . number_format($subtotal, 2) . '</td>
                </tr>
                <tr>
                    <td colspan="3" class="text-right"><strong>Tax (' . $settings['tax_rate'] . '%):</strong></td>
                    <td class="text-right">Rs. ' . number_format($tax_amount, 2) . '</td>
                </tr>';

    if ($discount_amount > 0) {
        $invoice_html .= '
                <tr>
                    <td colspan="3" class="text-right"><strong>Discount:</strong></td>
                    <td class="text-right">Rs. -' . number_format($discount_amount, 2) . '</td>
                </tr>';
    }

    $display_amount = ($discount_amount > 0) ? $final_amount : $total_amount;
    $invoice_html .= '
                <tr class="total-row">
                    <td colspan="3" class="text-right"><strong>TOTAL:</strong></td>
                    <td class="text-right"><strong>Rs. ' . number_format($display_amount, 2) . '</strong></td>
                </tr>';

    if ($paid_amount > 0 && $order['payment_method'] === 'Cash') {
        $invoice_html .= '
                <tr>
                    <td colspan="3" class="text-right"><strong>Paid:</strong></td>
                    <td class="text-right">Rs. ' . number_format($paid_amount, 2) . '</td>
                </tr>
                <tr>
                    <td colspan="3" class="text-right"><strong>Balance:</strong></td>
                    <td class="text-right">Rs. ' . number_format($balance, 2) . '</td>
                </tr>';
    }

    $invoice_html .= '
            </tbody>
        </table>

        <div style="text-align: center; margin-top: 30px;">
            <p>Thank you for your business!</p>
            <p>Please visit again</p>
            <p style="margin-top: 20px; font-size: 12px; color: #666;">WindPOS by CodesWind - www.codeswind.cloud</p>
        </div>
    </body>
    </html>';

    echo json_encode([
        'success' => true,
        'message' => 'Invoice generated successfully',
        'data' => [
            'invoice_html' => $invoice_html
        ]
    ]);
}

$conn->close();
?>
