<?php
// php/summarize.php

// Set up API credentials
$api_key = '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';

// Get the input from the request
$input = json_decode(file_get_contents('php://input'), true);
$lecture_name = $input['lectureName'];

// Read all transcript files for the given lecture
$transcript_files = glob("transcripts/{$lecture_name}_*.txt");
$full_transcript = "";

foreach ($transcript_files as $file) {
    $full_transcript .= file_get_contents($file) . "\n";
}

// Prepare the API request
$curl = curl_init();
curl_setopt_array($curl, [
    CURLOPT_URL => "https://api.openai.com/v1/chat/completions",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_ENCODING => "",
    CURLOPT_MAXREDIRS => 10,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
    CURLOPT_CUSTOMREQUEST => "POST",
    CURLOPT_POSTFIELDS => json_encode([
        'model' => 'gpt-4o-mini',
        'messages' => [
            ['role' => 'system', 'content' => 'You are a helpful assistant that summarizes lectures.'],
            ['role' => 'user', 'content' => "Summarize the following lecture transcript, focusing on the core important information and removing unnecessary details:\n\n$full_transcript"]
        ],
    ]),
    CURLOPT_HTTPHEADER => [
        "Content-Type: application/json",
        "Authorization: Bearer $api_key"
    ],
]);

$response = curl_exec($curl);
$err = curl_error($curl);

curl_close($curl);

if ($err) {
    echo json_encode(['success' => false, 'error' => $err]);
} else {
    $result = json_decode($response, true);
    if (isset($result['choices'][0]['message']['content'])) {
        echo json_encode(['success' => true, 'summary' => $result['choices'][0]['message']['content']]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Failed to generate summary']);
    }
}
?>