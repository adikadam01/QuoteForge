<?php

global $pdo, $path, $method;

// GET /templates/quotation-points
if ($path === '/templates/quotation-points' && $method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM quotation_point_templates ORDER BY sort_order ASC");
    jsonResponse($stmt->fetchAll());
}

// POST /templates/quotation-points
if ($path === '/templates/quotation-points' && $method === 'POST') {
    $input = getJsonInput();
    
    $columns = array_keys($input);
    $values = array_values($input);
    $placeholders = array_fill(0, count($values), '?');
    
    $sql = "INSERT INTO quotation_point_templates (" . implode(', ', $columns) . ") VALUES (" . implode(', ', $placeholders) . ")";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($values);
    
    $input['id'] = $pdo->lastInsertId();
    jsonResponse($input);
}

// PUT /templates/quotation-points/batch
if ($path === '/templates/quotation-points/batch' && $method === 'PUT') {
    $list = getJsonInput(); // Expect array
    
    try {
        $pdo->beginTransaction();
        
        $stmtCheck = $pdo->prepare("SELECT id FROM quotation_point_templates WHERE id = ?");
        $stmtInsert = null; // Prepare lazily
        $stmtUpdate = null;
        
        foreach ($list as $item) {
             $stmtCheck->execute([$item['id']]);
             if ($stmtCheck->fetch()) {
                 // Update
                 $sets = [];
                 $values = [];
                 $id = $item['id'];
                 foreach ($item as $k => $v) {
                     $sets[] = "$k = ?";
                     $values[] = $v;
                 }
                 $values[] = $id;
                 
                 // Dynamic update sql
                 $sql = "UPDATE quotation_point_templates SET " . implode(', ', $sets) . " WHERE id = ?";
                 $pdo->prepare($sql)->execute($values);
                 
             } else {
                 // Insert
                 $columns = array_keys($item);
                 $values = array_values($item);
                 $placeholders = array_fill(0, count($values), '?');
                 
                 $sql = "INSERT INTO quotation_point_templates (" . implode(', ', $columns) . ") VALUES (" . implode(', ', $placeholders) . ")";
                 $pdo->prepare($sql)->execute($values);
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

// PUT /templates/quotation-points/:id
if (preg_match('#^/templates/quotation-points/([\w\-]+)$#', $path, $matches) && $method === 'PUT') {
    $id = $matches[1];
    $input = getJsonInput();
    
    $sets = [];
    $values = [];
    foreach ($input as $key => $value) {
        $sets[] = "$key = ?";
        $values[] = $value;
    }
    $values[] = $id;
    
    $sql = "UPDATE quotation_point_templates SET " . implode(', ', $sets) . " WHERE id = ?";
    $pdo->prepare($sql)->execute($values);
    
    $input['id'] = $id;
    jsonResponse($input);
}

// DELETE /templates/quotation-points/:id
if (preg_match('#^/templates/quotation-points/([\w\-]+)$#', $path, $matches) && $method === 'DELETE') {
    $id = $matches[1];
    $pdo->prepare("DELETE FROM quotation_point_templates WHERE id = ?")->execute([$id]);
    http_response_code(204);
    exit;
}

jsonResponse(['error' => 'Not Found (Templates)'], 404);
