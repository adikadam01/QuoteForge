<?php
require_once 'config.php';

try {
    $stmt = $pdo->query("SELECT * FROM quotations LIMIT 1");
    $quotation = $stmt->fetch();
    if (!$quotation) {
        echo "No quotations in database to test.\n";
        exit;
    }

    echo "Testing invoice generation for quotation ID: {$quotation['id']}\n";
    
    // Simulate POST /api/invoices
    $invoiceId = bin2hex(random_bytes(16));
    $invoiceData = [
        'id' => $invoiceId,
        'invoice_number' => 'INV-TEST-' . time(),
        'quotation_id' => $quotation['id'],
        'client_id' => $quotation['client_id'],
        'currency' => $quotation['currency'],
        'subtotal' => (float)$quotation['subtotal'],
        'discount' => (float)$quotation['discount'],
        'tax_amount' => (float)$quotation['tax_amount'],
        'total' => (float)$quotation['total'],
        'amount_paid' => 0.0,
        'amount_due' => (float)$quotation['total'],
        'status' => 'draft',
        'invoice_status' => 'draft',
        'type' => 'full'
    ];
    
    $allowedColumns = [
        'id', 'invoice_number', 'client_id', 'quotation_id', 'status', 'type',
        'date_issued', 'due_date', 'currency', 'subtotal', 'discount', 'tax_rate',
        'tax_amount', 'total', 'amount_paid', 'amount_due', 'notes', 'invoice_status',
        'sent_at', 'paid_at', 'balance_amount', 'milestones_json', 'milestone_index',
        'payment_method', 'payment_reference', 'payment_received_at', 'quotation_selected_points_json'
    ];
    
    $input = array_intersect_key($invoiceData, array_flip($allowedColumns));
    
    $columns = array_keys($input);
    $values = array_values($input);
    $placeholders = array_fill(0, count($values), '?');
    
    $sql = "INSERT INTO invoices (" . implode(', ', $columns) . ") VALUES (" . implode(', ', $placeholders) . ")";
    echo "Inserting invoice SQL: $sql\n";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($values);
    echo "Invoice created successfully!\n";
    
    // FORCE at least one service block
    $service_blocks = [
        [
            'service_id' => 'some-service-id',
            'service_name' => 'Mock Service',
            'description' => 'A mock service',
            'price' => 5000
        ]
    ];
    echo "Service blocks: " . count($service_blocks) . "\n";
    
    $items = [];
    foreach ($service_blocks as $idx => $s) {
        $items[] = [
            'id' => bin2hex(random_bytes(16)),
            'invoice_id' => $invoiceId,
            'quotation_id' => $quotation['id'],
            'service_id' => $s['service_id'] ?? null,
            'name' => $s['service_name'] ?? 'Service',
            'description' => $s['description'] ?? '',
            'pricing_model' => 'fixed',
            'quantity' => 1,
            'unit_price' => (float)($s['price'] ?? 0),
            'total' => (float)($s['price'] ?? 0),
            'sort_order' => $idx,
            'created_at' => date('Y-m-d H:i:s')
        ];
    }
    
    if (!empty($items)) {
        // PUT /invoices/:id/items (Replace All)
        $sqlItems = "INSERT INTO invoice_items 
          (id, invoice_id, quotation_id, service_id, name, description, 
           pricing_model, quantity, unit_price, total, sort_order, created_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmtItems = $pdo->prepare($sqlItems);
        
        foreach ($items as $item) {
            $stmtItems->execute([
                $item['id'],
                $invoiceId,
                $item['quotation_id'],
                $item['service_id'],
                $item['name'],
                $item['description'],
                $item['pricing_model'],
                $item['quantity'],
                $item['unit_price'],
                $item['total'],
                $item['sort_order'],
                $item['created_at']
            ]);
        }
        echo "Invoice items inserted successfully!\n";
    }

} catch (Exception $e) {
    echo "ERROR during generation:\n";
    echo $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
