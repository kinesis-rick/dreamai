import os
import json
import re
from html.parser import HTMLParser

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_FILE = os.path.join(BASE_DIR, 'files.json')
INDEX_HTML = os.path.join(BASE_DIR, 'index.html')

VALID_EXTENSIONS = ['.html', '.htm']
IGNORE_FOLDERS = ['.git', '__pycache__', 'assets', 'css', 'js', 'icons', 'scratch']
IGNORE_FILES = ['index.html', '404.html', '500.html']

class TitleParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_title = False
        self.in_desc = False
        self.title = ""
        self.description = ""

    def handle_starttag(self, tag, attrs):
        if tag.lower() == 'title':
            self.in_title = True
        elif tag.lower() == 'meta':
            attr_dict = dict(attrs)
            if attr_dict.get('name', '').lower() == 'description':
                self.description = attr_dict.get('content', '')

    def handle_endtag(self, tag):
        if tag.lower() == 'title':
            self.in_title = False

    def handle_data(self, data):
        if self.in_title:
            self.title += data

def get_file_metadata(filepath, filename, category_dir):
    parser = TitleParser()
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read(15000)
            parser.feed(content)
    except Exception:
        pass

    raw_title = parser.title.strip()
    if raw_title:
        clean_title = re.sub(r'(\s*-\s*Slow Start|\s*,\s*by\s+.*|\s*\(Stability Fix.*?\))', '', raw_title, flags=re.IGNORECASE)
    else:
        clean_name = os.path.splitext(filename)[0].replace('_', ' ').replace('-', ' ')
        clean_title = re.sub(r'([a-z])([A-Z])', r'\1 \2', clean_name).title()

    description = parser.description.strip()
    path_lower = filename.lower()
    cat_lower = category_dir.lower()

    icon = "fa-compass"
    if cat_lower == "games":
        if "starfall" in path_lower:
            icon = "fa-rocket"
            if not description: description = "Epic space combat & strategy arcade game."
        elif "alpine" in path_lower:
            icon = "fa-mountain"
            if not description: description = "Alpine adventure & climbing challenge game."
        elif "ninja" in path_lower:
            icon = "fa-user-ninja"
            if not description: description = "Slice emojis & test your reaction speeds."
        elif "monkee" in path_lower:
            icon = "fa-frog"
            if not description: description = "Physics-based arcade bonking action."
        elif "typing" in path_lower or "siege" in path_lower:
            icon = "fa-keyboard"
            if not description: description = "Defend your base with fast typing skills."
        elif "wheel" in path_lower or "motor" in path_lower:
            icon = "fa-car-side"
            if not description: description = "High-speed open wheel motorsports racing."
        else:
            icon = "fa-gamepad"
            if not description: description = "Interactive web game experience."

    elif cat_lower == "tools":
        if "steam" in path_lower:
            icon = "fa-list-check"
            if not description: description = "Organize and tier list your Steam gaming year."
        elif "idle" in path_lower:
            icon = "fa-calculator"
            if not description: description = "Optimize profits & incremental stats solver."
        elif "pomodoro" in path_lower or "timer" in path_lower:
            icon = "fa-hourglass-half"
            if not description: description = "Zen glass sand timer for focused work sessions."
        elif "studio" in path_lower or "html" in path_lower:
            icon = "fa-code"
            if not description: description = "Live in-browser HTML & CSS code playground."
        else:
            icon = "fa-wrench"
            if not description: description = "Utility tool for productivity."

    elif cat_lower == "toys":
        if "hellman" in path_lower or "security" in path_lower:
            icon = "fa-shield-halved"
            if not description: description = "Visual demonstration of Diffie-Hellman key exchange."
        elif "slap" in path_lower:
            icon = "fa-hand"
            if not description: description = "Hilarious slap physics and sound machine."
        elif "snowball" in path_lower:
            icon = "fa-snowflake"
            if not description: description = "Playful winter snowball simulator."
        elif "fireworks" in path_lower:
            icon = "fa-wand-magic-sparkles"
            if not description: description = "Interactive particle fireworks city sky."
        else:
            icon = "fa-puzzle-piece"
            if not description: description = "Fun interactive canvas toy."

    elif cat_lower == "music":
        icon = "fa-compact-disc"
        if not description: description = "Sleek music player & dynamic visualizer."

    return {
        "category": category_dir.capitalize(),
        "name": clean_title,
        "path": f"{category_dir}/{filename}",
        "type": category_dir.lower().rstrip('s') if category_dir.lower().endswith('s') else category_dir.lower(),
        "icon": icon,
        "description": description
    }

index_data = []

for item in sorted(os.listdir(BASE_DIR)):
    folder_path = os.path.join(BASE_DIR, item)

    if os.path.isdir(folder_path) and item not in IGNORE_FOLDERS and not item.startswith('.'):
        for file in sorted(os.listdir(folder_path)):
            filename, ext = os.path.splitext(file)
            if ext.lower() in VALID_EXTENSIONS and file not in IGNORE_FILES:
                filepath = os.path.join(folder_path, file)
                meta = get_file_metadata(filepath, file, item)
                index_data.append(meta)

# Write files.json
with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
    json.dump(index_data, f, indent=2)

print(f"Success! Generated metadata for {len(index_data)} files into files.json.")

# Also update embedded dataset in index.html for zero-fail fallback
if os.path.exists(INDEX_HTML):
    try:
        with open(INDEX_HTML, 'r', encoding='utf-8') as f:
            html_content = f.read()
        
        json_js = f'<script id="portal-data">window.PORTAL_FILES = {json.dumps(index_data, indent=2)};</script>'
        
        if '<script id="portal-data">' in html_content:
            html_content = re.sub(r'<script id="portal-data">.*?</script>', json_js, html_content, flags=re.DOTALL)
        else:
            html_content = html_content.replace('</head>', f'    {json_js}\n</head>')
            
        with open(INDEX_HTML, 'w', encoding='utf-8') as f:
            f.write(html_content)
        print("Updated inline PORTAL_FILES dataset in index.html!")
    except Exception as e:
        print(f"Warning: Could not update index.html inline data: {e}")
