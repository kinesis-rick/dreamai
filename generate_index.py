import os
import json

# 1. Setup paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_FILE = os.path.join(BASE_DIR, 'files.json')

# 2. Configuration
# ADDED: Music extensions
## VALID_EXTENSIONS = ['.html', '.htm', '.mp3', '.wav', '.ogg', '.flac'] //I didn't want to list the music
VALID_EXTENSIONS = ['.html', '.htm']
IGNORE_FOLDERS = ['.git', '__pycache__', 'assets', 'css', 'js', 'icons']
IGNORE_FILES = ['index.html', '404.html', '500.html']

index_data = []

# 3. Walk through directories
for item in os.listdir(BASE_DIR):
    folder_path = os.path.join(BASE_DIR, item)

    if os.path.isdir(folder_path) and item not in IGNORE_FOLDERS and not item.startswith('.'):

        for file in os.listdir(folder_path):
            # Get filename and extension separately
            filename, ext = os.path.splitext(file)

            if ext.lower() in VALID_EXTENSIONS:
                if file in IGNORE_FILES:
                    continue

                # Determine type
                item_type = "tool" # default
                folder_lower = item.lower()

                if "game" in folder_lower:
                    item_type = "game"
                elif "toy" in folder_lower:
                    item_type = "toy"
                elif "music" in folder_lower:
                    item_type = "music"

                index_data.append({
                    "category": item.replace('_', ' ').capitalize(),
                    "name": filename.replace('_', ' ').title(), # Uses the clean filename
                    "path": f"{item}/{file}",
                    "type": item_type
                })

with open(OUTPUT_FILE, 'w') as f:
    json.dump(index_data, f, indent=2)

print(f"Success! Scanned folders including Music. Found {len(index_data)} files.")
