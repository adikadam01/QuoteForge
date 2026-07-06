<?php

global $pdo, $path, $method;

// GET /brand-kit
if ($path === '/brand-kit' && $method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM brand_kit LIMIT 1");
    $row = $stmt->fetch();
    jsonResponse($row ?: null);
}

// POST /brand-kit
if ($path === '/brand-kit' && $method === 'POST') {
    $input = getJsonInput();

    unset($input['created_at']);
    unset($input['updated_at']);

    
    // Check if exists
    $stmt = $pdo->query("SELECT id FROM brand_kit LIMIT 1");
    $row = $stmt->fetch();
    
    if ($row) {
        // Update
        $sets = [];
        $values = [];
        foreach ($input as $key => $value) {
            $sets[] = "$key = ?";
            $values[] = $value;
        }
        $values[] = $row['id'];
        
        $sql = "UPDATE brand_kit SET " . implode(', ', $sets) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($values);
    } else {
        // Insert
        $columns = array_keys($input);
        $values = array_values($input);
        $placeholders = array_fill(0, count($values), '?');
        
        $sql = "INSERT INTO brand_kit (" . implode(', ', $columns) . ") VALUES (" . implode(', ', $placeholders) . ")";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($values);
    }
    
    jsonResponse($input);
}

jsonResponse(['error' => 'Not Found (Brand Kit)'], 404);
