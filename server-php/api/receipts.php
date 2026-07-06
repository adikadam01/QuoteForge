<?php

global $pdo, $path, $method;

// GET /receipts
if ($path === '/receipts' && $method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM receipts ORDER BY created_at DESC");
    $rows = $stmt->fetchAll();
    $receipts = array_map(function($r) {
        $r['amount'] = (float)$r['amount'];
        return $r;
    }, $rows);
    jsonResponse($receipts);
}

// POST /receipts
// POST /receipts
if ($path === '/receipts' && $method === 'POST') {
    $input = getJsonInput();

    // Only insert columns that exist in the receipts table
    $allowedColumns = [
        'id', 'receipt_number', 'invoice_id', 'client_id',
        'payment_date', 'amount', 'currency', 'payment_method',
        'payment_reference', 'notes', 'share_token', 'created_at'
    ];

    // Convert ISO dates to MySQL format
    foreach ($input as $key => $value) {
        if (is_string($value) && preg_match('/^\d{4}-\d{2}-\d{2}T/', $value)) {
            $input[$key] = date('Y-m-d H:i:s', strtotime($value));
        }
    }

    // Filter to only allowed columns
    $input = array_intersect_key($input, array_flip($allowedColumns));

    $columns = array_keys($input);
    $values = array_values($input);
    $placeholders = array_fill(0, count($values), '?');

    $sql = "INSERT INTO receipts (" . implode(', ', $columns) . ") VALUES (" . implode(', ', $placeholders) . ")";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($values);

    if (empty($input['id'])) {
        $input['id'] = $pdo->lastInsertId();
    }

    jsonResponse($input);
}

// DELETE /receipts/:id
if (preg_match('#^/receipts/([\w\-]+)$#', $path, $matches) && $method === 'DELETE') {
    $id = $matches[1];
    $stmt = $pdo->prepare("DELETE FROM receipts WHERE id = ?");
    $stmt->execute([$id]);
    http_response_code(204);
    exit;
}

jsonResponse(['error' => 'Not Found (Receipts)'], 404);
