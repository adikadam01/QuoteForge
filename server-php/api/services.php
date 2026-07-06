<?php

global $pdo, $path, $method;

// GET /services
if ($path === '/services' && $method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM services WHERE is_active = 1 ORDER BY created_at DESC");
    $rows = $stmt->fetchAll();
    
    // Map types
$services = array_map(function($s) {
    $s['base_price'] = (float)$s['base_price'];

    $s['addons'] = json_decode(
        $s['addons_json'] ?? '[]',
        true
    ) ?: [];

    $s['milestone_template'] = json_decode(
        $s['milestone_template'] ?? '[]',
        true
    ) ?: [];

    return $s;
}, $rows);
    
    jsonResponse($services);
}

// // POST /services
// if ($path === '/services' && $method === 'POST') {
//     $input = getJsonInput();

//     if (isset($input['is_active'])) {
//     $input['is_active'] = $input['is_active'] ? 1 : 0;
// }

//     $addons = $input['addons'] ?? [];
//     unset($input['addons']);
    
//     $input['addons_json'] = json_encode($addons);
    
//     // $columns = array_keys($input);
//     // $values = array_values($input);

// $allowedColumns = [
//     'name',
//     'description',
//     'category',
//     'subcategory',
//     'billing_type',
//     'base_price',
//     'currency',
//     'is_active',
//     'scope_of_work',
//     'deliverables',
//     'timeline',
//     'payment_terms',
//     'service_terms',
//     'addons_json',
//     'duration_months',
//     'milestone_template'
// ];

// $input = array_intersect_key(
//     $input,
//     array_flip($allowedColumns)
// );

// $columns = array_keys($input);
// $values = array_values($input);
//     $placeholders = array_fill(0, count($values), '?');
    
//     $sql = "INSERT INTO services (" . implode(', ', $columns) . ") VALUES (" . implode(', ', $placeholders) . ")";
//     $stmt = $pdo->prepare($sql);
//     $stmt->execute($values);
    
//     $input['id'] = $pdo->lastInsertId();
//     $input['addons'] = $addons; // Restore for response
//     unset($input['addons_json']);
    
//     jsonResponse($input);
// }


// POST /services
if ($path === '/services' && $method === 'POST') {
    $input = getJsonInput();

    if (empty($input['id'])) {
    $input['id'] = bin2hex(random_bytes(16));
}

    if (isset($input['milestone_template']) && is_array($input['milestone_template'])) {
        $input['milestone_template'] = json_encode($input['milestone_template']);
    }

    if (isset($input['is_active'])) {
        $input['is_active'] = $input['is_active'] ? 1 : 0;
    }

    $addons = $input['addons'] ?? [];
    unset($input['addons']);

    $input['addons_json'] = json_encode($addons);

    $allowedColumns = [
    'id',
    'name',
    'description',
    'category',
    'subcategory',
    'billing_type',
    'base_price',
    'currency',
    'is_active',
    'scope_of_work',
    'deliverables',
    'timeline',
    'payment_terms',
    'service_terms',
    'addons_json',
    'duration_months',
    'milestone_template'
];
    $input = array_intersect_key(
        $input,
        array_flip($allowedColumns)
    );

    $columns = array_keys($input);
    $values = array_values($input);
    $placeholders = array_fill(0, count($values), '?');

    $sql = "INSERT INTO services (" . implode(', ', $columns) . ")
            VALUES (" . implode(', ', $placeholders) . ")";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($values);

    $input['id'] = $pdo->lastInsertId();
    $input['addons'] = $addons;
    unset($input['addons_json']);

    jsonResponse($input);
}

// PUT /services/:id
if (preg_match('#^/services/([\w\-]+)$#', $path, $matches) && $method === 'PUT') {
    $id = $matches[1];
    $input = getJsonInput();

    if (isset($input['milestone_template']) && is_array($input['milestone_template'])) {
    $input['milestone_template'] = json_encode($input['milestone_template']);
}

    if (isset($input['is_active'])) {
        $input['is_active'] = $input['is_active'] ? 1 : 0;
    }

    $addons = $input['addons'] ?? [];
    unset($input['addons']);

    $input['addons_json'] = json_encode($addons);

    $allowedColumns = [
        'name',
        'description',
        'category',
        'subcategory',
        'billing_type',
        'base_price',
        'currency',
        'is_active',
        'scope_of_work',
        'deliverables',
        'timeline',
        'payment_terms',
        'service_terms',
        'addons_json',
        'duration_months',
        'milestone_template'
    ];

    $input = array_intersect_key(
        $input,
        array_flip($allowedColumns)
    );

    $sets = [];
    $values = [];

    foreach ($input as $key => $value) {
        $sets[] = "$key = ?";
        $values[] = $value;
    }

    $values[] = $id;

    $sql = "UPDATE services SET " . implode(', ', $sets) . " WHERE id = ?";


    $stmt = $pdo->prepare($sql);
    $stmt->execute($values);

    $input['id'] = $id;
    $input['addons'] = $addons;
    unset($input['addons_json']);

    jsonResponse($input);
}

// DELETE /services/:id
if (preg_match('#^/services/([\w\-]+)$#', $path, $matches) && $method === 'DELETE') {
    $id = $matches[1];
    $stmt = $pdo->prepare("DELETE FROM services WHERE id = ?");
    $stmt->execute([$id]);
    http_response_code(204);
    exit;
}
// GET /services/terms-conditions
// if ($path === '/services/terms-conditions' && $method === 'GET') {

//     $stmt = $pdo->query("
//         SELECT *
//         FROM terms_conditions
//         WHERE is_active = 1
//         ORDER BY is_general DESC, category, sort_order
//     ");

//     jsonResponse($stmt->fetchAll());
// }

$stmt = $pdo->query("
    SELECT *
    FROM terms_conditions
    WHERE is_active = 1
    ORDER BY is_general DESC, category, sort_order
");

$data = $stmt->fetchAll(PDO::FETCH_ASSOC);

jsonResponse($data);
exit;