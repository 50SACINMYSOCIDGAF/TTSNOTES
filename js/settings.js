// /settings.js
document.addEventListener('DOMContentLoaded', () => {
    const settingsForm = document.getElementById('settingsForm');
    const degreeInput = document.getElementById('degree');
    const lecturesInput = document.getElementById('lectures');
    const saveButton = document.getElementById('saveButton');
    const resetButton = document.getElementById('resetButton');
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';
    settingsForm.appendChild(errorMessage);

    // Load saved settings
    loadSettings();

    saveButton.addEventListener('click', saveSettings);
    resetButton.addEventListener('click', resetSettings);

    function loadSettings() {
        const savedSettings = JSON.parse(localStorage.getItem('userSettings')) || {};
        degreeInput.value = savedSettings.degree || '';
        lecturesInput.value = savedSettings.lectures ? savedSettings.lectures.join('\n') : '';
    }

    function saveSettings() {
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