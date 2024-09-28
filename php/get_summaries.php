<?php
// php/get_summaries.php

header('Content-Type: application/json');

$summary_dir = "../summaries";
$summaries = [];

if (is_dir($summary_dir)) {
    $files = scandir($summary_dir);
    foreach ($files as $file) {
        if (strpos($file, '_summary.txt') !== false) {
            $parts = explode('_', $file);
            $summaries[] = [
                'name' => $parts[0],
                'date' => $parts[1],
                'file' => $file
            ];
        }
    }
}

echo json_encode($summaries);
?>