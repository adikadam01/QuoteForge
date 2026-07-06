
<?php

// Variable $pdo, $path, $method are available from index.php
global $pdo, $path, $method;

global $pdo, $path, $method;
ini_set('display_errors', 0);
error_reporting(E_ERROR);

// GET /clients/options
if ($path === '/clients/options' && $method === 'GET') {
    $stmt = $pdo->prepare("SELECT setting_value FROM app_settings WHERE setting_key = ?");
    $stmt->execute(['client_options']);
    $row = $stmt->fetch();
    if ($row) {
        jsonResponse(json_decode($row['setting_value'], true));
    } else {
        jsonResponse(null);
    }
}

// POST /clients/options
if ($path === '/clients/options' && $method === 'POST') {
    $input = getJsonInput();

    $json = json_encode($input);
    
    // Check if exists
    $stmt = $pdo->prepare("SELECT setting_key FROM app_settings WHERE setting_key = ?");
    $stmt->execute(['client_options']);
    if ($stmt->fetch()) {
        $stmt = $pdo->prepare("UPDATE app_settings SET setting_value = ? WHERE setting_key = ?");
        $stmt->execute([$json, 'client_options']);
    } else {
        $stmt = $pdo->prepare("INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?)");
        $stmt->execute(['client_options', $json]);
    }
    jsonResponse($input);
}

// GET /clients
if ($path === '/clients' && $method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM clients WHERE is_deleted = 0 ORDER BY created_at DESC");
    jsonResponse($stmt->fetchAll());
}

// POST /clients
// POST /clients
if ($path === '/clients' && $method === 'POST') {

    $input = getJsonInput();

    unset($input['created_at']);
    unset($input['deleted_at']);
    unset($input['updated_at']);
    unset($input['is_deleted']);

    // Debug logging
    // error_log("CLIENT INPUT: " . json_encode($input));

    // Only allow columns that actually exist in the clients table
    $allowedColumns = [
    'id',
    'name',
    'business_name',
    'email',
    'phone',
    'address',
    'location',
    'gst_number',
    'business_type',
    'industry',
    'size',
    'custom_industry',
    'source',
    'website',
    'notes',
    'created_at',
    'updated_at',
    'is_deleted',
    'deleted_at'
];

    // Remove frontend-only fields
    $input = array_intersect_key(
        $input,
        array_flip($allowedColumns)
    );

    $columns = array_keys($input);
    $values = array_values($input);

    // error_log("CLIENT COLUMNS: " . implode(', ', $columns));

    $placeholders = array_fill(0, count($values), '?');

    $sql = "INSERT INTO clients (" .
        implode(', ', $columns) .
        ") VALUES (" .
        implode(', ', $placeholders) .
        ")";

    // error_log("CLIENT SQL: " . $sql);

    try {

        $stmt = $pdo->prepare($sql);
        $stmt->execute($values);

        // error_log("CLIENT CREATED SUCCESSFULLY: " . $input['id']);

        // Keep the UUID sent from frontend
        jsonResponse($input);

    } catch (PDOException $e) {

        // error_log("=================================");
        // error_log("CLIENT INSERT FAILED");
        // error_log("SQL ERROR: " . $e->getMessage());
        // error_log("SQL STATE: " . $e->getCode());
        // error_log("INPUT DATA: " . json_encode($input));
        // error_log("=================================");

        jsonResponse([
            'error' => 'Database insert failed',
            'message' => $e->getMessage()
        ], 500);
    }
}

// // PUT /clients/:id
// if (preg_match('#^/clients/([\w\-]+)$#', $path, $matches) && $method === 'PUT') {
//     $id = $matches[1];
//     $input = getJsonInput();
//     /*
// |--------------------------------------------------------------------------
// | Convert React ISO dates to MySQL DATETIME
// |--------------------------------------------------------------------------
// */
// foreach ($input as $key => $value) {

//     if (
//         is_string($value) &&
//         preg_match('/^\d{4}-\d{2}-\d{2}T/', $value)
//     ) {

//         $input[$key] =
//             date('Y-m-d H:i:s', strtotime($value));
//     }
// }

// /*
// |--------------------------------------------------------------------------
// | Let MySQL manage these
// |--------------------------------------------------------------------------
// */
// unset($input['created_at']);
// unset($input['updated_at']);

//     if (!empty($input['deleted_at'])) {
//     $input['deleted_at'] =
//         date('Y-m-d H:i:s', strtotime($input['deleted_at']));
// }

// unset($input['created_at']);
// unset($input['updated_at']);
    
//     $sets = [];
//     $values = [];
//     foreach ($input as $key => $value) {
//         $sets[] = "$key = ?";
//         $values[] = $value;
//     }
//     $values[] = $id;
    
//     $sql = "UPDATE clients SET " . implode(', ', $sets) . " WHERE id = ?";
//     $stmt = $pdo->prepare($sql);
//     $stmt->execute($values);
    
//     $input['id'] = $id; // Ensure ID is in response
//     jsonResponse($input);
// }


// PUT /clients/:id
if (preg_match('#^/clients/([\w\-]+)$#', $path, $matches) && $method === 'PUT') {

    $id = $matches[1];
    $input = getJsonInput();

    /*
    |--------------------------------------------------------------------------
    | Convert React ISO dates to MySQL DATETIME
    |--------------------------------------------------------------------------
    */
    foreach ($input as $key => $value) {

        if (
            is_string($value) &&
            preg_match('/^\d{4}-\d{2}-\d{2}T/', $value)
        ) {

            $input[$key] =
                date('Y-m-d H:i:s', strtotime($value));
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Let MySQL manage these
    |--------------------------------------------------------------------------
    */
    unset($input['created_at']);
    unset($input['updated_at']);

    unset($input['created_at']);
unset($input['updated_at']);

$allowedColumns = [
    'id', 'name', 'business_name', 'email', 'phone', 'address',
    'location', 'gst_number', 'business_type', 'industry', 'size',
    'custom_industry', 'source', 'website', 'notes', 'is_deleted', 'deleted_at'
];
$input = array_intersect_key($input, array_flip($allowedColumns));

$sets = [];
$values = [];

    foreach ($input as $key => $value) {
        $sets[] = "$key = ?";
        $values[] = $value;
    }

    $values[] = $id;

    $sql = "UPDATE clients SET " . implode(', ', $sets) . " WHERE id = ?";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($values);

    $input['id'] = $id;

    jsonResponse($input);
}

// DELETE /clients/:id
// if (preg_match('#^/clients/([\w\-]+)$#', $path, $matches) && $method === 'DELETE') {
//     $id = $matches[1];
//     $stmt = $pdo->prepare("UPDATE clients SET is_deleted = 1, deleted_at = NOW() WHERE id = ?");
//     $stmt->execute([$id]);
//     http_response_code(204);
//     exit;
// }


if (preg_match('#^/clients/([\w\-]+)$#', $path, $matches) && $method === 'DELETE') {

    $id = $matches[1];

    try {

        $stmt = $pdo->prepare(
            "UPDATE clients
             SET is_deleted = 1,
                 deleted_at = NOW()
             WHERE id = ?"
        );

        $stmt->execute([$id]);

        jsonResponse([
            'success' => true,
            'id' => $id
        ]);

    } catch (PDOException $e) {

        jsonResponse([
            'error' => 'DELETE FAILED',
            'message' => $e->getMessage()
        ], 500);

    }
}
// 404 for other clients routes
jsonResponse(['error' => 'Not Found (Clients)'], 404);
