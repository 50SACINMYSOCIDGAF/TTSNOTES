# Lecture Recorder

This application allows you to record lectures, transcribe them, generate summaries, and ask questions about the content. It can be run locally on your machine.

## Requirements

- Local web server with PHP support (e.g., XAMPP, MAMP, or WAMP)
- PHP 7.4 or newer
- Modern web browser
- API key for OpenAI

## Local Setup Instructions

1. Install a local web server stack:
   - Windows: XAMPP (https://www.apachefriends.org/)
   - macOS: MAMP (https://www.mamp.info/)
   - Linux: LAMP stack (Apache, MySQL, PHP)

2. Clone the repository or download and extract the project files to your local web server's document root (e.g., `htdocs` folder for XAMPP).

3. Obtain the necessary API key:
   - OpenAI API: Create an account at https://openai.com/ and get your API key.
   - Top up the balance on your account to around $10, this will last for around a month with 10 hours of recording a week.

4. Insert your API key in the following PHP files:
   - `php/ask_question.php`
   - `php/save_transcript.php`
   - `php/summarize.php`

   In each file, locate the line:
   ```php
   $api_key = '-';
   ```
   Replace the hyphen with your OpenAI API key, keeping it within the quotes.
   **FOR ANY SUBJECTS THAT ARENT COMPUTER SCIENCE/CYBERSECURITY YOU WILL NEED TO UPDATE THE PROMPT IN SUMMARIZE.PHP TO YOUR SUBJECT TO GET A REPLY. IT IS `role => user, content` IN THE API REQUEST.**

6. Start your local web server:
   - For XAMPP: Start Apache from the XAMPP Control Panel
   - For MAMP: Start the servers from the MAMP application

7. Open a web browser and navigate to:
   - XAMPP: `http://localhost/your-project-folder`
   - MAMP: `http://localhost:8888/your-project-folder` (default port is 8888, might be different if you changed it)

## Usage

1. Enter the lecture name in the provided field.
2. Click "Start Recording" to begin.
3. When finished, click "Stop Recording".
4. Wait for the summary to be generated.
5. To ask questions about the lecture, click on the summary and use the Q&A interface.

## Troubleshooting

If you encounter issues:
- Verify that your API key is correctly entered in all three PHP files mentioned above.
- Ensure your local web server is running and PHP is properly configured.
- Check the browser console for any error messages.
- Make sure your project files are in the correct directory of your local web server.

For unresolved issues, please open an issue in the project's repository.

## Contributing

To contribute to the project, fork the repository, make your changes, and submit a pull request.
