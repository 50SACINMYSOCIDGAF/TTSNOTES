document.addEventListener('DOMContentLoaded', () => {
    const settingsForm = document.getElementById('settingsForm');
    const degreeInput = document.getElementById('degree');
    const lecturesInput = document.getElementById('lectures');
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';
    settingsForm.appendChild(errorMessage);

    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';
    settingsForm.appendChild(buttonContainer);

    // Create Save Settings button
    const saveButton = document.createElement('button');
    saveButton.type = 'submit';
    saveButton.textContent = 'Save Settings';
    saveButton.className = 'save-button';
    buttonContainer.appendChild(saveButton);

    // Create button separator
    const buttonSeparator = document.createElement('div');
    buttonSeparator.className = 'button-separator';
    buttonContainer.appendChild(buttonSeparator);

    // Create Reset to Default button
    const resetButton = document.createElement('button');
    resetButton.type = 'button';
    resetButton.textContent = 'Reset to Default';
    resetButton.className = 'reset-button';
    buttonContainer.appendChild(resetButton);

    // Load saved settings
    loadSettings();

    settingsForm.addEventListener('submit', saveSettings);
    resetButton.addEventListener('click', resetSettings);

    function loadSettings() {
        const savedSettings = JSON.parse(localStorage.getItem('userSettings')) || {};
        degreeInput.value = savedSettings.degree || '';
        lecturesInput.value = savedSettings.lectures ? savedSettings.lectures.join('\n') : '';
    }

    function saveSettings(e) {
        e.preventDefault();

        // Clear previous error messages
        errorMessage.textContent = '';

        const degree = degreeInput.value.trim();
        const lectures = lecturesInput.value.split('\n').map(lecture => lecture.trim()).filter(Boolean);

        // Validate inputs
        if (degree.length < 2) {
            errorMessage.textContent = 'Degree must be at least 2 characters long.';
            return;
        }

        if (lectures.length === 0) {
            errorMessage.textContent = 'Please enter at least one lecture.';
            return;
        }

        const userSettings = { degree, lectures };

        try {
            // Save settings to localStorage
            localStorage.setItem('userSettings', JSON.stringify(userSettings));
            alert('Settings saved successfully!');
        } catch (error) {
            console.error('Error saving settings:', error);
            errorMessage.textContent = 'An error occurred while saving settings. Please try again.';
        }
    }

    function resetSettings() {
        if (confirm('Are you sure you want to reset settings to default?')) {
            localStorage.removeItem('userSettings');
            degreeInput.value = '';
            lecturesInput.value = '';
            errorMessage.textContent = '';
            alert('Settings reset to default.');
        }
    }
});