# Lecture Recorder

This application allows you to record lectures, transcribe them, generate summaries, and ask questions about the content.

## Requirements

- Web server with PHP support (e.g., XAMPP, MAMP)
- PHP 7.4 or newer
- Modern web browser
- API keys for OpenAI

## Setup Instructions

1. Clone the repository or download and extract the project files to your web server's directory.

2. Obtain the necessary API key:
   - OpenAI API: Create an account at https://openai.com/ and get your API key.

3. Insert your API key in the following PHP files:
   - `php/ask_question.php`
   - `php/save_transcript.php`
   - `php/summarize.php`

   In each file, locate the line:
   ```php
   $api_key = '-';
   ```
   Replace the hyphen with your OpenAI API key, keeping it within the quotes.

4. Start your web server and open the project in your browser.

## Usage

1. Enter the lecture name in the provided field.
2. Click "Start Recording" to begin.
3. When finished, click "Stop Recording".
4. Wait for the summary to be generated.
5. To ask questions about the lecture, click on the summary and use the Q&A interface.

## Troubleshooting

If you encounter issues:
- Verify that your API key is correctly entered in all three PHP files mentioned above.
- Ensure your web server is running and PHP is properly configured.
- Check the browser console for any error messages.

For unresolved issues, please open an issue in the project's repository.

## Contributing

To contribute to the project, fork the repository, make your changes, and submit a pull request.
