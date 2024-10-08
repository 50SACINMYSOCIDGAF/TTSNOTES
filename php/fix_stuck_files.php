<?php
// php/fix_stuck_files.php

header('Content-Type: application/json');

function fixStuckFiles($dir) {
    $fixed = 0;
    $errors = [];
    $lecture_folders = [];

    // Recursively find all files
    $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir));
    foreach ($iterator as $file) {
        if ($file->isFile()) {
            $path = $file->getPathname();
            $filename = $file->getFilename();
            $parent_dir = dirname($path);

            // Check if file is older than 1 hour (3600 seconds)
            if (time() - $file->getMTime() > 3600) {
                $lecture_name = strtolower(determineLectureName($filename));
                $lecture_dir = $dir . DIRECTORY_SEPARATOR . $lecture_name;

                // Create lecture directory if it doesn't exist
                if (!file_exists($lecture_dir)) {
                    if (!mkdir($lecture_dir, 0777, true)) {
                        $errors[] = "Failed to create directory: $lecture_dir";
                        continue;
                    }
                }

                $new_path = $lecture_dir . DIRECTORY_SEPARATOR . $filename;
                if ($path !== $new_path && rename($path, $new_path)) {
                    $fixed++;
                } else {
                    $errors[] = "Failed to move file: $filename";
                }

                $lecture_folders[$lecture_name] = $lecture_dir;
            }
        }
    }

    // Merge folders with the same name (ignoring case)
    $lecture_folders = mergeFolders($dir, $lecture_folders);

    // Remove empty folders
    removeEmptyFolders($dir);

    return ['fixed' => $fixed, 'errors' => $errors, 'folders' => array_values($lecture_folders)];
}

function determineLectureName($filename) {
    $parts = explode('_', $filename);
    if (count($parts) >= 2) {
        return $parts[0]; // First part should be the lecture name
    }
    return 'Unknown'; // Default folder for files that don't match the expected format
}

function mergeFolders($dir, $lecture_folders) {
    $merged_folders = [];
    foreach ($lecture_folders as $name => $path) {
        $lower_name = strtolower($name);
        if (!isset($merged_folders[$lower_name])) {
            $merged_folders[$lower_name] = $path;
        } else {
            // Merge this folder into the existing one
            $files = new FilesystemIterator($path);
            foreach ($files as $file) {
                $source = $file->getPathname();
                $destination = $merged_folders[$lower_name] . DIRECTORY_SEPARATOR . $file->getFilename();
                rename($source, $destination);
            }
            // Remove the now-empty folder
            rmdir($path);
        }
    }
    return $merged_folders;
}

function removeEmptyFolders($dir) {
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($dir, RecursiveDirectoryIterator::SKIP_DOTS),
        RecursiveIteratorIterator::CHILD_FIRST
    );

    foreach ($iterator as $path) {
        if ($path->isDir()) {
            $files = new FilesystemIterator($path);
            if (!$files->valid()) {
                rmdir($path);
            }
        }
    }
}

$summaries_dir = __DIR__ . '/../summaries';

try {
    $result = fixStuckFiles($summaries_dir);
    $fixed_count = $result['fixed'];
    $errors = $result['errors'];
    $folders = $result['folders'];

    $message = "Fixed $fixed_count stuck files. Organized into " . count($folders) . " folders.";
    if (!empty($errors)) {
        $message .= " Encountered " . count($errors) . " errors.";
    }

    echo json_encode([
        'success' => true,
        'message' => $message,
        'fixedCount' => $fixed_count,
        'folderCount' => count($folders),
        'errors' => $errors
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error fixing stuck files: ' . $e->getMessage()
    ]);
}
?>