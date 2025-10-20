<?php
include '../cors.php';
include '../database.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $order_id = $input['order_id'];

    // Check if invoice printing is enabled in settings
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

    // Get order details - Allow printing for all order statuses
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

    // Generate invoice HTML for printing
    $invoice_html = generateInvoiceHTML($settings, $order, $items, $subtotal, $tax_amount, $total_amount);

    // Return invoice data for printing
    echo json_encode([
        'success' => true,
        'message' => 'Invoice generated successfully',
        'data' => [
            'order_id' => $order_id,
            'invoice_html' => $invoice_html,
            'total_amount' => $total_amount
        ]
    ]);
}

function generateInvoiceHTML($settings, $order, $items, $subtotal, $tax_amount, $total_amount) {
    $invoice_html = '
    <html>
    <head>
        <title>Invoice #' . $order['id'] . '</title>
        <meta charset="UTF-8">
        <style>
            @page {
                size: 80mm auto;
                margin: 0;
            }
            @media print {
                body { margin: 0; padding: 0; }
            }
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: "Courier New", monospace;
                font-size: 11px;
                width: 80mm;
                padding: 5mm;
                background: white;
                color: black;
            }
            .header {
                text-align: center;
                border-bottom: 1px dashed #000;
                padding-bottom: 8px;
                margin-bottom: 10px;
            }
            .restaurant-name {
                font-size: 16px;
                font-weight: bold;
                margin-bottom: 3px;
                text-transform: uppercase;
            }
            .restaurant-details {
                font-size: 9px;
                line-height: 1.3;
            }
            .invoice-title {
                font-size: 14px;
                font-weight: bold;
                margin: 8px 0;
                text-align: center;
                border-top: 1px dashed #000;
                border-bottom: 1px dashed #000;
                padding: 5px 0;
            }
            .order-info {
                margin-bottom: 10px;
                font-size: 10px;
            }
            .order-info-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 3px;
            }
            .items-section {
                border-top: 1px dashed #000;
                border-bottom: 1px dashed #000;
                padding: 8px 0;
                margin-bottom: 8px;
            }
            .item {
                margin-bottom: 8px;
            }
            .item-name {
                font-weight: bold;
                margin-bottom: 2px;
            }
            .item-details {
                display: flex;
                justify-content: space-between;
                font-size: 10px;
            }
            .totals {
                margin-top: 8px;
                padding-top: 8px;
                border-top: 1px dashed #000;
            }
            .total-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 3px;
                font-size: 10px;
            }
            .total-row.grand-total {
                font-size: 12px;
                font-weight: bold;
                border-top: 1px solid #000;
                border-bottom: 1px solid #000;
                padding: 5px 0;
                margin-top: 5px;
            }
            .footer {
                text-align: center;
                margin-top: 10px;
                padding-top: 8px;
                border-top: 1px dashed #000;
                font-size: 9px;
                line-height: 1.4;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="restaurant-name">' . htmlspecialchars($settings['restaurant_name']) . '</div>
            <div class="restaurant-details">
                ' . htmlspecialchars($settings['address']) . '<br>
                Tel: ' . htmlspecialchars($settings['mobile']) . '<br>
                Email: ' . htmlspecialchars($settings['email']) . '
            </div>
        </div>

        <div class="invoice-title">INVOICE</div>

        <div class="order-info">
            <div class="order-info-row">
                <span><strong>Invoice #:</strong></span>
                <span>INV-' . $order['id'] . '</span>
            </div>
            <div class="order-info-row">
                <span><strong>Date:</strong></span>
                <span>' . date('d/m/Y H:i', strtotime($order['created_at'])) . '</span>
            </div>
            <div class="order-info-row">
                <span><strong>Type:</strong></span>
                <span>' . htmlspecialchars($order['order_type']) . '</span>
            </div>';

    if ($order['customer_name']) {
        $invoice_html .= '
            <div class="order-info-row">
                <span><strong>Customer:</strong></span>
                <span>' . htmlspecialchars($order['customer_name']) . '</span>
            </div>';
    }

    if ($order['customer_mobile']) {
        $invoice_html .= '
            <div class="order-info-row">
                <span><strong>Mobile:</strong></span>
                <span>' . htmlspecialchars($order['customer_mobile']) . '</span>
            </div>';
    }

    if ($order['table_name']) {
        $invoice_html .= '
            <div class="order-info-row">
                <span><strong>Table:</strong></span>
                <span>' . htmlspecialchars($order['table_name']) . '</span>
            </div>';
    }

    if ($order['external_order_id']) {
        $invoice_html .= '
            <div class="order-info-row">
                <span><strong>Order ID:</strong></span>
                <span>' . htmlspecialchars($order['external_order_id']) . '</span>
            </div>';
    }

    $invoice_html .= '
        </div>

        <div class="items-section">';

    foreach ($items as $item) {
        $item_total = $item['quantity'] * $item['price_per_item'];
        $invoice_html .= '
            <div class="item">
                <div class="item-name">' . htmlspecialchars($item['item_name']) . '</div>
                <div class="item-details">
                    <span>' . $item['quantity'] . ' x Rs. ' . number_format($item['price_per_item'], 2) . '</span>
                    <span><strong>Rs. ' . number_format($item_total, 2) . '</strong></span>
                </div>
            </div>';
    }

    $invoice_html .= '
        </div>

        <div class="totals">
            <div class="total-row">
                <span>Subtotal:</span>
                <span>Rs. ' . number_format($subtotal, 2) . '</span>
            </div>
            <div class="total-row">
                <span>Tax (' . $settings['tax_rate'] . '%):</span>
                <span>Rs. ' . number_format($tax_amount, 2) . '</span>
            </div>
            <div class="total-row grand-total">
                <span>TOTAL:</span>
                <span>Rs. ' . number_format($total_amount, 2) . '</span>
            </div>
        </div>

        <div class="footer">
            Thank you for your business!<br>
            Please visit again
        </div>

        <script>
            window.onload = function() {
                window.print();
            };
        </script>
    </body>
    </html>';

    return $invoice_html;
}

$conn->close();
?>