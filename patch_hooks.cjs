const fs = require('fs');

const files = [
    'useTasks.ts', 'useStreaks.ts', 'useStocks.ts',
    'useReviews.ts', 'useNotes.ts', 'useJournal.ts',
    'useIndex.ts', 'useAlerts.ts', 'useAchievements.ts'
];

files.forEach(file => {
    const path = `src/hooks/${file}`;
    let content = fs.readFileSync(path, 'utf8');

    // Add import if not exists
    if (!content.includes('import { useAuth }')) {
        content = content.replace(/(import .*;\n)+/, match => match + "import { useAuth } from './useAuth';\n");
    }

    // Remove top-level const
    content = content.replace(/(\/\/\s*TEMP:.*\n)?const currentUserId = 1;\n/g, '');

    // Inject const { user } = useAuth(); const currentUserId = user?.id; into the hook body
    const hookName = file.replace('.ts', '');
    const hookRegex = new RegExp(`export const ${hookName} = \\(\\) => \\{`);
    content = content.replace(hookRegex, match => {
        return `${match}\n  const { user } = useAuth();\n  const currentUserId = user?.id;`;
    });

    // Specifically inject `if (!currentUserId) return;` at the beginning of the top-level fetch function if not present
    // This varies per file, but generally the first line of fetchTasks, fetchStocks etc.
    content = content.replace(/(const fetch[A-Za-z]+ = async \(\) => {\n)/, match => {
        return `${match}    if (!currentUserId) return;\n`;
    });

    // Update empty useEffect dependency arrays to depend on currentUserId
    content = content.replace(/useEffect\(\(\) => \{\n\s+fetch[A-Za-z]+\(\);\n\s+(?:\/\/ eslint-disable-next-line\n\s+)?\}, \[\]\);/g, match => {
        return match.replace('[]', '[currentUserId]');
    });

    // Same for other patterns of useEffect calling fetch
    content = content.replace(/useEffect\(\(\) => \{\n\s+load[A-Za-z]+\(\);\n\s+(?:\/\/ eslint-disable-next-line\n\s+)?\}, \[\]\);/g, match => {
        return match.replace('[]', '[currentUserId]');
    });

    fs.writeFileSync(path, content);
    console.log('Patched', file);
});
console.log('Done.');
