import os
import json
import urllib.parse

# Configuration
OUTPUT_FILE = 'music_list.json'
EXTENSIONS = ('.mp3', '.wav', '.ogg')

def generate_playlist():
    # Get current directory
    current_dir = os.path.dirname(os.path.abspath(__file__))

    playlist = []

    # Scan directory
    try:
        files = [f for f in os.listdir(current_dir) if f.lower().endswith(EXTENSIONS)]

        # Sort files alphabetically
        files.sort()

        print(f"Scanning {current_dir}...")

        for filename in files:
            # Create a clean title (remove extension and underscores)
            title = os.path.splitext(filename)[0].replace('_', ' ')

            # URL encode the filename so browsers handle spaces/symbols correctly
            url = urllib.parse.quote(filename)

            playlist.append({
                "title": title,
                "url": url
            })

        # Write to JSON file
        with open(os.path.join(current_dir, OUTPUT_FILE), 'w') as f:
            json.dump(playlist, f, indent=4)

        print(f"Success! Found {len(playlist)} tracks.")
        print(f"Playlist written to {OUTPUT_FILE}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    generate_playlist()
