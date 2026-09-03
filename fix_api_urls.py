from pathlib import Path
import re

root = Path(r"C:\Users\Wamisha\Desktop\Project-Gym\frontend-react\src")

for path in sorted(root.glob("*.jsx")):
    text = path.read_text(encoding="utf-8")

    text = re.sub(r"fetch\(\`\$\{API_URL\}([^`]+)\`\)\)", r"fetch(`${API_URL}$1`)", text)
    text = re.sub(r"fetch\(\`\$\{API_URL\}([^`]+)\`\)\s*,\s*\{", r"fetch(`${API_URL}$1`, {", text)

    if "http://127.0.0.1:5000" in text:
        text = re.sub(
            r"fetch\s*\(\s*(?:[\"'`])http://127\.0\.0\.1:5000([^\"'`]*?)(?:[\"'`])\s*(?=,|\))",
            r"fetch(`${API_URL}\1`)",
            text,
        )

    if "import { API_URL } from './config'" not in text:
        lines = text.splitlines()
        insert_at = next((i for i, line in enumerate(lines) if line.startswith("import ")), None)
        if insert_at is None:
            lines.insert(0, "import { API_URL } from './config'")
        else:
            lines.insert(insert_at + 1, "import { API_URL } from './config'")
        text = "\n".join(lines)
        if not text.endswith("\n"):
            text += "\n"

    path.write_text(text, encoding="utf-8")
