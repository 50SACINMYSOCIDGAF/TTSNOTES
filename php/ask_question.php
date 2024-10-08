<?php
// /ask_question.php

header('Content-Type: application/json');

$api_key = '-';

$input = json_decode(file_get_contents('php://input'), true);

if (isset($input['file']) && isset($input['question']) && isset($input['summary'])) {
    $file = $input['file'];
    $question = $input['question'];
    $summary = $input['summary'];

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
            'model' => 'gpt-4o-2024-05-13',
            'messages' => [
                ['role' => 'system', 'content' => 'You are an AI assistant tasked with answering questions about a lecture summary. Provide accurate and concise answers based on the given summary.'],
                ['role' => 'user', 'content' => "You are an advanced AI assistant specializing in answering questions about lecture summaries. Your goal is to provide high-quality, accurate, and insightful responses. Follow these steps to formulate your answer: Carefully read the provided lecture summary and the user's question. Break down the question into its core components and identify the key concepts it's addressing. Analyze the relevant information from the lecture summary that pertains to the question. Use chain-of-thought reasoning to walk through your thought process: Start with the given information Consider any relevant background knowledge Make logical connections between concepts Draw inferences where appropriate Identify any assumptions you're making If the question requires multiple steps to answer, clearly outline each step in your reasoning process. If there are multiple possible interpretations of the question, acknowledge them and provide answers for each interpretation. If the summary doesn't contain enough information to fully answer the question: Clearly state what information is missing Provide the best possible answer based on available information Suggest what additional information would be needed for a complete answer Use analogies or examples to illustrate complex concepts when appropriate. If relevant, mention any limitations or potential biases in your answer. Summarize your answer concisely at the end, ensuring it directly addresses the original question. If appropriate, suggest follow-up questions or areas for further exploration related to the topic. Remember to maintain a confident yet humble tone, acknowledging the limits of your knowledge when necessary. Your response should be clear, well-structured, and easy to understand while demonstrating depth of analysis and critical thinking. $summary\n\nQuestion: $question"]
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
            echo json_encode(['success' => true, 'answer' => $result['choices'][0]['message']['content']]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Failed to generate answer']);
        }
    }
} else {
    echo json_encode(['success' => false, 'error' => 'Invalid request']);
}
?>