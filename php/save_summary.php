<?php
// php/save_summary.php

header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);

if (isset($input['lectureName']) && isset($input['summary'])) {
    $lecture_name = $input['lectureName'];
    $summary = $input['summary'];

    // Extract topic from summary
    preg_match('/# Lecture Notes: (.+)/', $summary, $matches);
    $topic = $matches[1] ?? 'Unknown Topic';

    // Generate file name
    $date = date('Y-m-d_H-i-s');
    $summary_dir = __DIR__ . "/../summaries/{$lecture_name}";  // Create lecture-specific folder
    $summary_file = "{$summary_dir}/{$topic}_{$date}.txt";

    // Create lecture directory if it doesn't exist
    if (!file_exists($summary_dir)) {
        if (!mkdir($summary_dir, 0777, true)) {
            echo json_encode(['success' => false, 'message' => 'Failed to create lecture directory']);
            exit;
        }
    }

    // Save summary to file
    if (file_put_contents($summary_file, $summary)) {
        echo json_encode(['success' => true, 'message' => 'Summary saved successfully', 'file' => $summary_file]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to save summary']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
}
?>