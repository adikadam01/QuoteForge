<?php

global $pdo, $path, $method;

ini_set('display_errors', 0);
error_reporting(0);

set_exception_handler(function($e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
    exit;
});

set_error_handler(function($errno, $errstr) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => $errstr, 'errno' => $errno]);
    exit;
});

set_exception_handler(function($e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => $e->getMessage()]);
    exit;
});

function formatInvoice($r) {
    if (!$r) return null;
    $r['subtotal'] = (float)$r['subtotal'];
    $r['total'] = (float)$r['total'];
    $r['amount_paid'] = (float)$r['amount_paid'];
    $r['amount_due'] = (float)$r['amount_due'];
    $r['tax_amount'] = (float)$r['tax_amount'];
    $r['discount'] = (float)$r['discount'];
    
    $r['milestones'] = json_decode($r['milestones_json'] ?? '[]', true);
    $r['quotation_selected_points'] = json_decode($r['quotation_selected_points_json'] ?? 'null', true);
   $r['milestone_index'] = isset($r['milestone_index']) && $r['milestone_index'] !== null ? (int)$r['milestone_index'] : null;
    $r['balance_amount'] = $r['balance_amount'] !== null ? (float)$r['balance_amount'] : null;
    
    return $r;
}

// GET /invoices
if ($path === '/invoices' && $method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM invoices ORDER BY created_at DESC");
    $rows = $stmt->fetchAll();
    $invoices = array_map('formatInvoice', $rows);
    jsonResponse($invoices);
}

// Only allow actual invoice table columns
$allowedColumns = [
    'id',
    'invoice_number',
    'client_id',
    'quotation_id',
    'status',
    'type',
    'date_issued',
    'due_date',
    'currency',
    'subtotal',
    'discount',
    'tax_rate',
    'tax_amount',
    'total',
    'amount_paid',
    'amount_due',
    'notes',
    'invoice_status',
    'sent_at',
    'paid_at',
    'balance_amount',
    'milestones_json',
    'milestone_index',
    'payment_method',
    'payment_reference',
    'payment_received_at',
    'quotation_selected_points_json'
];

// POST /invoices
if ($path === '/invoices' && $method === 'POST') {
    $input = getJsonInput();
    $items = $input['items'] ?? [];
    unset($input['items'], $input['client'], $input['quotation']);
    
    $milestones = $input['milestones'] ?? null;
    $quotation_selected_points = $input['quotation_selected_points'] ?? null;
    unset($input['milestones'], $input['quotation_selected_points']);
    
    if ($milestones !== null) {
        $input['milestones_json'] = json_encode($milestones);
    }
    if ($quotation_selected_points !== null) {
        $input['quotation_selected_points_json'] = json_encode($quotation_selected_points);
    }
    
    foreach ($input as $key => $value) {
        if (is_string($value) && preg_match('/^\d{4}-\d{2}-\d{2}T/', $value)) {
            $input[$key] = date('Y-m-d H:i:s', strtotime($value));
        }
    }
    
    if (empty($input['date_issued'])) $input['date_issued'] = null;
    if (empty($input['due_date'])) $input['due_date'] = null;
    
    try {
        $pdo->beginTransaction();
        
        $input = array_intersect_key(
            $input,
            array_flip($allowedColumns)
        );

// Insert Invoice
$columns = array_keys($input);
$values = array_values($input);
$placeholders = array_fill(0, count($values), '?');
        
        $sql = "INSERT INTO invoices (" . implode(', ', $columns) . ") VALUES (" . implode(', ', $placeholders) . ")";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($values);

        // echo "<pre>";
        // print_r($input);
        // echo "</pre>";
        // exit;

        // Note: Invoice ID usually passed from frontend (UUID) or auto-inc? 
        // Schema suggests varchar(36) UUID for most but let's check input.
        // Assuming ID is PART of the input or we need lastInsertId.
        // If ID is not in input, we get lastInsertId.
        
        if (!empty($input['id'])) {
            $invoiceId = $input['id'];
        } else {
             // If auto inc
             $invoiceId = $pdo->lastInsertId();
             $input['id'] = $invoiceId;
        }

        // Insert Items
        if (!empty($items)) {
            $sqlItems = "INSERT INTO invoice_items (id, invoice_id, name, description, quantity, unit_price, total, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
            $stmtItems = $pdo->prepare($sqlItems);
            
            foreach ($items as $item) {
                // Ensure item has an ID if manual or generate one?
                // Frontend usually sends UUIDs for items too.
                $stmtItems->execute([
                    $item['id'],
                    $invoiceId,
                    $item['name'],
                    $item['description'],
                    $item['quantity'],
                    $item['unit_price'],
                    $item['total'],
                    $item['sort_order'] ?? 0
                ]);
            }
        }
        
        $pdo->commit();
        $formatted = formatInvoice($input);
        $formatted['items'] = $items;
        jsonResponse($formatted);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        jsonResponse(['error' => $e->getMessage()], 500);
    }
}

// PUT /invoices/:id
if (preg_match('#^/invoices/([\w\-]+)$#', $path, $matches) && $method === 'PUT') {
    $id = $matches[1];
    $input = getJsonInput();
    unset($input['items'], $input['client'], $input['quotation']);
    
    $milestones = $input['milestones'] ?? null;
    $quotation_selected_points = $input['quotation_selected_points'] ?? null;
    unset($input['milestones'], $input['quotation_selected_points']);
    
    if ($milestones !== null) {
        $input['milestones_json'] = json_encode($milestones);
    }
    if ($quotation_selected_points !== null) {
        $input['quotation_selected_points_json'] = json_encode($quotation_selected_points);
    }
    
    foreach ($input as $key => $value) {
        if (is_string($value) && preg_match('/^\d{4}-\d{2}-\d{2}T/', $value)) {
            $input[$key] = date('Y-m-d H:i:s', strtotime($value));
        }
    }
    
    $input = array_intersect_key($input, array_flip($allowedColumns));
    
    $sets = [];
    $values = [];
    foreach ($input as $key => $value) {
        $sets[] = "`$key` = ?";
        $values[] = $value;
    }
    $values[] = $id;
    
    $sql = "UPDATE invoices SET " . implode(', ', $sets) . " WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($values);
    
    $input['id'] = $id;
    jsonResponse(formatInvoice($input));
}

// DELETE /invoices/:id
if (preg_match('#^/invoices/([\w\-]+)$#', $path, $matches) && $method === 'DELETE') {
    $id = $matches[1];
    $stmt = $pdo->prepare("DELETE FROM invoices WHERE id = ?");
    $stmt->execute([$id]);
    http_response_code(204);
    exit;
}

// GET /invoices/:id/items
if (preg_match('#^/invoices/([\w\-]+)/items$#', $path, $matches) && $method === 'GET') {
    $id = $matches[1];
    $stmt = $pdo->prepare("SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY sort_order ASC");
    $stmt->execute([$id]);
    $rows = $stmt->fetchAll();
    
    $items = array_map(function($r) {
        $r['quantity'] = (float)$r['quantity'];
        $r['unit_price'] = (float)$r['unit_price'];
        $r['total'] = (float)$r['total'];
        return $r;
    }, $rows);
    
    jsonResponse($items);
}

// PUT /invoices/:id/items (Replace All)
if (preg_match('#^/invoices/([\w\-]+)/items$#', $path, $matches) && $method === 'PUT') {
    $id = $matches[1];
    $items = getJsonInput();
    
    try {
        $pdo->beginTransaction();
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        // Delete existing
        $stmtDel = $pdo->prepare("DELETE FROM invoice_items WHERE invoice_id = ?");
        $stmtDel->execute([$id]);
        
        // Insert new
        if (!empty($items)) {
            // PUT /invoices/:id/items (Replace All)
$sqlItems = "INSERT INTO invoice_items 
  (id, invoice_id, quotation_id, service_id, name, description, 
   pricing_model, quantity, unit_price, total, sort_order, created_at) 
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
$stmtItems = $pdo->prepare($sqlItems);

foreach ($items as $item) {
    $createdAt = $item['created_at'] ?? null;
    if ($createdAt && preg_match('/^\d{4}-\d{2}-\d{2}T/', $createdAt)) {
        $createdAt = date('Y-m-d H:i:s', strtotime($createdAt));
    }
    if (!$createdAt) {
        $createdAt = date('Y-m-d H:i:s');
    }

    $stmtItems->execute([
        $item['id'],
        $id,
        $item['quotation_id'] ?? null,
        $item['service_id'] ?? null,
        $item['name'],
        $item['description'] ?? '',
        $item['pricing_model'] ?? 'fixed',
        $item['quantity'] ?? 1,
        $item['unit_price'],
        $item['total'],
        $item['sort_order'] ?? 0,
        $createdAt,
    ]);
    }
}

        $pdo->commit();
        http_response_code(204);
        exit;
    } catch (Exception $e) {
        $pdo->rollBack();
        jsonResponse(['error' => $e->getMessage()], 500);
    }
}

// GET /invoice-items (All)
if ($path === '/invoice-items' && $method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM invoice_items ORDER BY sort_order ASC");
    $rows = $stmt->fetchAll();
    $items = array_map(function($r) {
        $r['quantity'] = (float)$r['quantity'];
        $r['unit_price'] = (float)$r['unit_price'];
        $r['total'] = (float)$r['total'];
        return $r;
    }, $rows);
    jsonResponse($items);
}

jsonResponse(['error' => 'Not Found (Invoices)'], 404);
