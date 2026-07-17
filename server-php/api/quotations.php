<?php
// error_log("QUOTATIONS FILE LOADED");
global $pdo, $path, $method;

function formatQuotation($q) {
    if (!$q) return null;
    // $q['service_blocks'] = json_decode($q['service_blocks_json'] ?? '[]', true);
    // $q['section_toggles'] = json_decode($q['section_toggles_json'] ?? '{}', true);
    // $q['selected_points'] = json_decode($q['selected_points_json'] ?? '{}', true);
    // $q['quotation_sections'] = json_decode($q['quotation_sections_json'] ?? '{}', true);
    
    $q['service_blocks'] = is_string($q['service_blocks_json'] ?? null)
    ? json_decode($q['service_blocks_json'], true)
    : ($q['service_blocks_json'] ?? []);

$q['section_toggles'] = is_string($q['section_toggles_json'] ?? null)
    ? json_decode($q['section_toggles_json'], true)
    : ($q['section_toggles_json'] ?? []);

$q['selected_points'] = is_string($q['selected_points_json'] ?? null)
    ? json_decode($q['selected_points_json'], true)
    : ($q['selected_points_json'] ?? []);

$q['quotation_sections'] = is_string($q['quotation_sections_json'] ?? null)
    ? json_decode($q['quotation_sections_json'], true)
    : ($q['quotation_sections_json'] ?? []);


    // Numbers
    $q['subtotal'] = (float)$q['subtotal'];
    $q['total'] = (float)$q['total'];
    $q['tax_amount'] = (float)$q['tax_amount'];
    $q['discount'] = (float)$q['discount'];
    
    return $q;
}

// GET /quotations
// if ($path === '/quotations' && $method === 'GET') {
//     $stmt = $pdo->query("SELECT * FROM quotations ORDER BY created_at DESC");
//     $rows = $stmt->fetchAll();
//     $quotations = array_map('formatQuotation', $rows);
//     jsonResponse($quotations);
// }


if ($path === '/quotations' && $method === 'GET') {

    try {

        $stmt = $pdo->query("SELECT * FROM quotations ORDER BY created_at DESC");
        $rows = $stmt->fetchAll();
        $formatted = array_map('formatQuotation', $rows);

        jsonResponse($formatted);

    } catch (PDOException $e) {

        jsonResponse([
            'error' => 'QUOTATIONS QUERY FAILED',
            'message' => $e->getMessage(),
            'code' => $e->getCode()
        ], 500);

    }
}

// GET /quotations/:id
if (preg_match('#^/quotations/([\w\-]+)$#', $path, $matches) && $method === 'GET') {

    $id = $matches[1];

    $stmt = $pdo->prepare("
        SELECT *
        FROM quotations
        WHERE id = ?
    ");

    $stmt->execute([$id]);

    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        jsonResponse(["error" => "Not found"], 404);
    }

    $quotation = formatQuotation($row);

    // --------------------------------------------------
    // Attach client object
    // --------------------------------------------------

    if (!empty($quotation["client_id"])) {

        $clientStmt = $pdo->prepare("
            SELECT *
            FROM clients
            WHERE id = ?
            LIMIT 1
        ");

        $clientStmt->execute([$quotation["client_id"]]);

        $quotation["client"] = $clientStmt->fetch(PDO::FETCH_ASSOC);

    } else {

        $quotation["client"] = null;

    }

    jsonResponse($quotation);
}

// POST /quotations
if ($path === '/quotations' && $method === 'POST') {
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

    $input['is_template'] = !empty($input['is_template']) ? true : false;
    
    // Extract JSON fields
    $service_blocks = $input['service_blocks'] ?? [];
    $section_toggles = $input['section_toggles'] ?? [];
    $selected_points = $input['selected_points'] ?? [];
    $quotation_sections = $input['quotation_sections'] ?? [];
    
    // Remove complex fields from input to prepare for insertion
    unset($input['service_blocks'], $input['section_toggles'], $input['selected_points'], $input['quotation_sections']);
    // Removed unused fields if present in input but not DB columns
    
    // unset($input['services'], $input['client']);
    unset(
    $input['services'],
    $input['client'],

    $input['scope_of_work'],
    $input['discount_type'],
    $input['template_name'],
    $input['share_token'],
    $input['wizard_step']
);

    if (empty($input['quote_date'])) {
        $input['quote_date'] = date('Y-m-d H:i:s');
    }

    $input['service_blocks_json'] = json_encode($service_blocks);
    $input['section_toggles_json'] = json_encode($section_toggles);
    $input['selected_points_json'] = json_encode($selected_points);
    $input['quotation_sections_json'] = json_encode($quotation_sections);

    unset($input['created_at']);
    unset($input['updated_at']);

    // Null out empty date fields so DB doesn't store stale/empty strings
$nullableDates = ['sent_at', 'accepted_at', 'invoiced_at', 'valid_until'];
foreach ($nullableDates as $field) {
    if (array_key_exists($field, $input) && empty($input[$field])) {
        $input[$field] = null;
    }
}

    if (!empty($input['created_at'])) {
    $input['created_at'] =
        date('Y-m-d H:i:s', strtotime($input['created_at']));
}

if (!empty($input['updated_at'])) {
    $input['updated_at'] =
        date('Y-m-d H:i:s', strtotime($input['updated_at']));
}
    
    // $columns = array_keys($input);
    // $values = array_values($input);
    // $placeholders = array_fill(0, count($values), '?');

    $columns = array_keys($input);
$values = array_values($input);

/*
|--------------------------------------------------------------------------
| PostgreSQL boolean fix
|--------------------------------------------------------------------------
*/

$isTemplateIndex = array_search('is_template', $columns);

if ($isTemplateIndex !== false) {
    $values[$isTemplateIndex] = $input['is_template'] ? 'true' : 'false';
}

$placeholders = array_fill(0, count($values), '?');


    $sql = "INSERT INTO quotations (" . implode(', ', $columns) . ") VALUES (" . implode(', ', $placeholders) . ")";
    $stmt = $pdo->prepare($sql);
    try {

    $stmt->execute($values);

} catch (PDOException $e) {

    jsonResponse([
        "success" => false,
        "message" => $e->getMessage(),
        "sql" => $sql,
        "input" => $input
    ],500);

}
    
    // Reconstruct full object for response
    $input['service_blocks'] = $service_blocks;
    $input['section_toggles'] = $section_toggles;
    $input['selected_points'] = $selected_points;
    $input['quotation_sections'] = $quotation_sections;
    // ... clean up json fields from response if desired, logic keeps them usually or ignores
    
    jsonResponse($input);
}

// PUT /quotations/:id

// if (preg_match('#^/quotations/([\w\-]+)$#', $path, $matches) && $method === 'PUT') {
//     $id = $matches[1];
//     $input = getJsonInput();
//     if (isset($input['is_template'])) {
//         $input['is_template'] = !empty($input['is_template']) ? 1 : 0;
// }

//     unset($input['created_at']);
//     unset($input['updated_at']);
    
// PUT /quotations/:id
if (preg_match('#^/quotations/([\w\-]+)$#', $path, $matches) && $method === 'PUT') {

    $id = $matches[1];
$input = getJsonInput();

// Never update the primary key
unset($input['id']);

    if (isset($input['is_template'])) {
        $input['is_template'] = !empty($input['is_template']) ? true : false;
    }

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

    // Similar to POST
    $service_blocks = $input['service_blocks'] ?? null;
    $section_toggles = $input['section_toggles'] ?? null;
    $selected_points = $input['selected_points'] ?? null;
    $quotation_sections = $input['quotation_sections'] ?? null;

    unset(
        $input['service_blocks'],
        $input['section_toggles'],
        $input['selected_points'],
        $input['quotation_sections']
    );

    unset(
        $input['services'],
        $input['client'],
        $input['created_at'],
        $input['updated_at'],
        $input['scope_of_work'],
        $input['discount_type'],
        $input['template_name'],
        $input['share_token'],
        $input['wizard_step']
    );

    // Null out empty date fields so DB doesn't store stale/empty strings
$nullableDates = ['sent_at', 'accepted_at', 'invoiced_at', 'valid_until'];
foreach ($nullableDates as $field) {
    if (array_key_exists($field, $input) && empty($input[$field])) {
        $input[$field] = null;
    }
}

if ($service_blocks !== null) {
    $input['service_blocks_json'] = json_encode($service_blocks);
    // Don't overwrite existing service_blocks with empty array from initial draft
}

    if ($section_toggles !== null) {
        $input['section_toggles_json'] = json_encode($section_toggles);
    }

    if ($selected_points !== null) {
        $input['selected_points_json'] = json_encode($selected_points);
    }

    if ($quotation_sections !== null) {
        $input['quotation_sections_json'] = json_encode($quotation_sections);
    }

    // $sets = [];
    // $values = [];

    // foreach ($input as $key => $value) {
    //     $sets[] = "$key = ?";
    //     $values[] = $value;
    // }

    // $values[] = $id;

    // $sql = "UPDATE quotations SET " . implode(', ', $sets) . " WHERE id = ?";

    $sets = [];
$values = [];
$columns = [];

foreach ($input as $key => $value) {

    $columns[] = $key;
    $sets[] = "$key = ?";
    $values[] = $value;
}

/*
|--------------------------------------------------------------------------
| PostgreSQL boolean fix
|--------------------------------------------------------------------------
*/

$isTemplateIndex = array_search('is_template', $columns);

if ($isTemplateIndex !== false) {
    $values[$isTemplateIndex] =
        $input['is_template'] ? 'true' : 'false';
}

$values[] = $id;

$sql = "UPDATE quotations SET " . implode(', ', $sets) . " WHERE id = ?";

    
$stmt = $pdo->prepare($sql);

try {

    $stmt->execute($values);

} catch (PDOException $e) {

    jsonResponse([
        "success" => false,
        "message" => $e->getMessage(),
        "sql" => $sql,
        "input" => $input,
        "values" => $values
    ], 500);

}

$input['id'] = $id;

jsonResponse($input);

}

// DELETE /quotations/:id
if (preg_match('#^/quotations/([\w\-]+)$#', $path, $matches) && $method === 'DELETE') {
    $id = $matches[1];
    $stmt = $pdo->prepare("DELETE FROM quotations WHERE id = ?");
    $stmt->execute([$id]);
    http_response_code(204);
    exit;
}

jsonResponse(['error' => 'Not Found (Quotations)'], 404);
