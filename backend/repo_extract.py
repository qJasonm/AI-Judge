import os
import json
import mimetypes

DEFAULT_EXCLUDES = {'.git', '__pycache__', 'node_modules', '.venv', '.idea', '.vscode'}

# Mapping by file extension
EXT_TYPE_MAP = {
    '.py': 'source',
    '.ipynb': 'source',
    '.js': 'source',
    '.ts': 'source',
    '.java': 'source',
    '.cpp': 'source',
    '.c': 'source',
    '.md': 'documentation',
    '.txt': 'documentation',
    '.rst': 'documentation',
    '.json': 'data',
    '.csv': 'data',
    '.yml': 'config',
    '.yaml': 'config',
    '.toml': 'config',
}

def detect_file_type(filename):
    ext = os.path.splitext(filename)[1].lower()
    return EXT_TYPE_MAP.get(ext, 'other')

def extract_imports(file_content, language):
    if language != 'source':
        return []
    imports = []
    for line in file_content.splitlines():
        line = line.strip()
        if line.startswith('import '):
            imports.append(line.split()[1].split('.')[0])
        elif line.startswith('from '):
            imports.append(line.split()[1].split('.')[0])
    return list(set(imports))

def read_file_safe(path):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()
    except (UnicodeDecodeError, PermissionError):
        return None

def codebase_to_json(root_dir, output_name='project_data.json', exclude_dirs=None):
    if exclude_dirs is None:
        exclude_dirs = DEFAULT_EXCLUDES

    output_file = os.path.join(root_dir, output_name)
    all_files = []

    for root, dirs, files in os.walk(root_dir):
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        for file in files:
            if file == output_name:
                continue

            path = os.path.join(root, file)
            rel_path = os.path.relpath(path, root_dir)

            content = read_file_safe(path)
            if content is None:
                print(f"Skipped unreadable file: {rel_path}")
                continue

            file_type = detect_file_type(file)
            imports = extract_imports(content, file_type)

            file_entry = {
                "path": rel_path,
                "language": file_type if file_type != 'other' else mimetypes.guess_type(file)[0] or 'unknown',
                "type": file_type,
                "size": len(content),
                "code": content,
            }

            if imports:
                file_entry["imports"] = imports

            all_files.append(file_entry)
            print(f"Added: {rel_path} ({file_type}, {len(content)} chars)")

    project_json = {
        "repo_name": os.path.basename(root_dir),
        "total_files": len(all_files),
        "files": all_files
    }

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(project_json, f, indent=4)

    print(f"\nSuccessfully saved {len(all_files)} files to: {output_file}")

# Usage
if __name__ == "__main__":
    target_path = '/Users/qijianma/code/LEGO'  # Replace with your repo path
    codebase_to_json(target_path)