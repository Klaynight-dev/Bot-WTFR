
import fs from 'fs';
import path from 'path';

// Define path to package.json
const packageJsonPath = path.resolve(__dirname, '../package.json');

// Function to bump version
function bumpVersion(type = 'patch') {
    try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const currentVersion = packageJson.version;
        const parts = currentVersion.split('.').map(Number);

        if (type === 'major') {
            parts[0]++;
            parts[1] = 0;
            parts[2] = 0;
        } else if (type === 'minor') {
            parts[1]++;
            parts[2] = 0;
        } else {
            // patch or default
            parts[2]++;
        }

        const newVersion = parts.join('.');
        packageJson.version = newVersion;

        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
        console.log(`Version updated from ${currentVersion} to ${newVersion}`);
    } catch (error) {
        console.error('Error bumping version:', error);
        process.exit(1);
    }
}

// Get type from args
const type = process.argv[2];
bumpVersion(type);
