# TaskMaster Tree View (VS Code)

Visualize **TaskMaster** `.taskmaster/tasks/tasks.json` in a live-updating tree view inside VS Code.

## Features
- Auto-refresh on file changes
- Search, filters, dependencies map (from the HTML UI)
- Optional "save back" support

## Requirements
A workspace with `.taskmaster/tasks/tasks.json`.

## Usage
1. Install the extension.
2. `Ctrl/Cmd+Shift+P` → **TaskMaster: Open Tree View**.
3. The view updates whenever `tasks.json` changes.

## Settings
None (for now). The extension watches `${workspaceRoot}/.taskmaster/tasks/tasks.json`.

## Known issues
- Only watches the first workspace folder.

## Release notes
See [CHANGELOG.md](./CHANGELOG.md).

## License
MIT
