<?php
// php/summarize.php

// Set up API credentials
$api_key = '-';

try {
    // Get the input from the request
    $input = json_decode(file_get_contents('php://input'), true);
    if (!isset($input['lectureName']) || !isset($input['userSettings'])) {
        throw new Exception('Lecture name or user settings are missing from the request');
    }
    $lecture_name = $input['lectureName'];
    $user_settings = $input['userSettings'];

    // Get current date
    $current_date = date('Y-m-d');

    // Read transcript files for the given lecture and current date
    $transcript_files = glob("transcripts/{$lecture_name}_{$current_date}.txt");
    if (empty($transcript_files)) {
        throw new Exception("No transcript files found for lecture '{$lecture_name}' on {$current_date}");
    }

    $full_transcript = "";
    foreach ($transcript_files as $file) {
        if (!is_readable($file)) {
            throw new Exception("Cannot read file: $file");
        }
        $full_transcript .= file_get_contents($file) . "\n";
    }

    // Prepare the custom prompt based on user settings
    $custom_prompt = "You are an expert note-taker and summarizer with deep knowledge in {$user_settings['degree']}. Your task is to create comprehensive, well-structured notes from a lecture transcript. The lecture is part of the following course(s): " . implode(", ", $user_settings['lectures']) . ". Follow these guidelines: Organize the notes using clear headings and subheadings. Use bullet points for key concepts and important details. Include any relevant examples, case studies, or practical applications mentioned. Highlight crucial terminology or technical concepts. If formulas or code snippets are mentioned, include them formatted appropriately. Summarize main ideas concisely while retaining important nuances. Do not change the words used unless it would improve the summary. Always try to keep it as close to the original text while still generating high quality notes. If multiple topics are covered, clearly delineate between them. Include any mentioned resources, tools, or further reading materials. End with a brief summary of the key takeaways. Format the notes for easy readability and quick reference. Use Markdown formatting where appropriate. Some information may be wrong/incorrect due to the nature of how the transcription is generated, use common sense and think through step by step when outputting so that even if something is incorrectly spelled in the transcript you output it properly. Use your knowledge on the subject accordingly to ensure that information is as accurate as possible. When returning notes do not take any shortcuts return the full information that was contained in the transcript for each topic, all topics should have associations of what was said with detailed but shorter notes that are relevant to the topic. Begin your response with: \"Lecture Notes: [Main Topic]\" Now, please summarize the provided transcript into well-structured, comprehensive notes following these guidelines.";
    // Prepare the API request
    $curl = curl_init();
    if ($curl === false) {
        throw new Exception('Failed to initialize cURL');
    }

    $post_fields = json_encode([
        'model' => 'gpt-4o-mini',
        'messages' => [
            ['role' => 'system', 'content' => $custom_prompt],
            ['role' => 'user', 'content' => $full_transcript]
        ],
    ]);

    if ($post_fields === false) {
        throw new Exception('Failed to encode JSON for API request');
    }

    curl_setopt_array($curl, [
        CURLOPT_URL => "https://api.openai.com/v1/chat/completions",
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_ENCODING => "",
        CURLOPT_MAXREDIRS => 10,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
        CURLOPT_CUSTOMREQUEST => "POST",
        CURLOPT_POSTFIELDS => $post_fields,
        CURLOPT_HTTPHEADER => [
            "Content-Type: application/json",
            "Authorization: Bearer $api_key"
        ],
    ]);

    $response = curl_exec($curl);
    if ($response === false) {
        throw new Exception('cURL error: ' . curl_error($curl));
    }

    $http_code = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    if ($http_code !== 200) {
        throw new Exception("API returned non-200 status code: $http_code");
    }

    curl_close($curl);

    $result = json_decode($response, true);
    if ($result === null) {
        throw new Exception('Failed to decode API response');
    }

    if (isset($result['choices'][0]['message']['content'])) {
        echo json_encode(['success' => true, 'summary' => $result['choices'][0]['message']['content']]);
    } else {
        throw new Exception('API response does not contain expected data');
    }

} catch (Exception $e) {
    error_log('Error in summarize.php: ' . $e->getMessage());
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}