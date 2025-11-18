const fs = require('fs');
const path = require('path');

const hooksDir = path.join(__dirname, 'src', 'hooks');
const files = fs.readdirSync(hooksDir).filter(f => f.endsWith('.ts') && f !== 'useAuth.ts' && f !== 'useAuth.tsx');

files.forEach(file => {
    const filePath = path.join(hooksDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    if (content.includes('useAuth') && !content.includes("import { useAuth }")) {
        // prepend to the file
        content = "import { useAuth } from './useAuth';\n" + content;
        fs.writeFileSync(filePath, content);
        console.log('Fixed import in', file);
    }
});
