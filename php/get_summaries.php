<?php
// php/get_summaries.php

header('Content-Type: application/json');

$summary_dir = __DIR__ . "/../summaries";
$lectures = [];

if (is_dir($summary_dir)) {
    $lecture_folders = scandir($summary_dir);
    foreach ($lecture_folders as $lecture_folder) {
        if ($lecture_folder != "." && $lecture_folder != ".." && is_dir($summary_dir . "/" . $lecture_folder)) {
            $lecture_summaries = [];
            $files = scandir($summary_dir . "/" . $lecture_folder);
            foreach ($files as $file) {
                if (strpos($file, '.txt') !== false) {
                    $content = file_get_contents($summary_dir . "/" . $lecture_folder . "/" . $file);
                    preg_match('/# Lecture Notes: (.+)/', $content, $matches);
                    $topic = $matches[1] ?? 'Unknown Topic';
                    $date = explode('_', pathinfo($file, PATHINFO_FILENAME))[1] ?? 'Unknown Date';
                    $lecture_summaries[] = [
                        'topic' => $topic,
                        'date' => $date,
                        'file' => $file
                    ];
                }
            }
            $lectures[] = [
                'name' => $lecture_folder,
                'summaries' => $lecture_summaries
            ];
        }
    }
}

usort($lectures, function($a, $b) {
    return strcmp($b['name'], $a['name']);
});

foreach ($lectures as &$lecture) {
    usort($lecture['summaries'], function($a, $b) {
        return strcmp($b['date'], $a['date']);
    });
}

echo json_encode($lectures);
?>