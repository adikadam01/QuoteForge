<?php

global $pdo, $path, $method;

// GET /backup/export
if ($path === '/backup/export' && $method === 'GET') {

    try {

        $tables = [
            'clients',
            'services',
            'quotations',
            'invoices',
            'invoice_items',
            'receipts',
            'brand_kit',
            'terms_conditions',
            'quotation_point_templates',
        ];

        $snapshot = [];

        foreach ($tables as $table) {
            $stmt = $pdo->query("SELECT * FROM $table");
            $snapshot[$table] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }

        jsonResponse($snapshot);

    } catch (PDOException $e) {

        jsonResponse([
            'error' => 'EXPORT FAILED',
            'message' => $e->getMessage()
        ], 500);

    }
}

// POST /backup/import
if ($path === '/backup/import' && $method === 'POST') {

    $input = getJsonInput();

    try {

        $pdo->beginTransaction();

        foreach ($input as $table => $rows) {

            if (!is_array($rows) || empty($rows)) continue;

            foreach ($rows as $row) {
                if (!isset($row['id'])) continue;

                $columns = array_keys($row);
                $values = array_values($row);
                $placeholders = array_fill(0, count($values), '?');

                $updateClause = implode(', ', array_map(fn($c) => "$c = EXCLUDED.$c", $columns));

                $sql = "INSERT INTO $table (" . implode(', ', $columns) . ")
                        VALUES (" . implode(', ', $placeholders) . ")
                        ON CONFLICT (id) DO UPDATE SET $updateClause";

                $stmt = $pdo->prepare($sql);
                $stmt->execute($values);
            }
        }

        $pdo->commit();

        jsonResponse(['success' => true]);

    } catch (PDOException $e) {

        $pdo->rollBack();

        jsonResponse([
            'error' => 'IMPORT FAILED',
            'message' => $e->getMessage()
        ], 500);

    }
}

// POST /nuke
if ($path === '/nuke' && $method === 'POST') {

    try {

        $tables = [
            'invoice_items',
            'receipts',
            'invoices',
            'quotations',
            'services',
            'clients',
            'terms_conditions',
            'quotation_point_templates',
            'brand_kit',
        ];

        foreach ($tables as $table) {
            $pdo->exec("DELETE FROM $table");
        }

        jsonResponse(['success' => true]);

    } catch (PDOException $e) {

        jsonResponse([
            'error' => 'CLEAR FAILED',
            'message' => $e->getMessage()
        ], 500);

    }
}

jsonResponse(['error' => 'Not Found (Backup)'], 404);