const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'frontend-react', 'src');

for (const file of fs.readdirSync(srcDir).filter(f => f.endsWith('.jsx'))) {
  const fullPath = path.join(srcDir, file);
  let text = fs.readFileSync(fullPath, 'utf8');

  if (!text.includes('http://127.0.0.1:5000')) continue;

  if (!text.includes("import { API_URL } from './config'")) {
    const lines = text.split(/\r?\n/);
    const insertAt = lines.findIndex(line => line.startsWith('import '));
    if (insertAt === -1) {
      lines.unshift("import { API_URL } from './config'");
    } else {
      lines.splice(insertAt + 1, 0, "import { API_URL } from './config'");
    }
    text = lines.join('\n');
    if (!text.endsWith('\n')) text += '\n';
  }

  text = text.replace(/fetch\(\s*(["'`])http:\/\/127\.0\.0\.1:5000([^"'`]*?)\1/g, (_, __, pathPart) => {
    return "fetch(`${API_URL}" + pathPart + "`)";
  });

  fs.writeFileSync(fullPath, text, 'utf8');
}
