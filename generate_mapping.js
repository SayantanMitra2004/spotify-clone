const fs = require('fs').promises;
const path = require('path');

async function getDirectories(source) {
    return (await fs.readdir(source, { withFileTypes: true }))
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
}

async function getMP3Files(dir) {
    try {
        const files = await fs.readdir(dir);
        return files.filter(file => file.endsWith('.mp3'));
    } catch (error) {
        console.error(`Error reading directory ${dir}:`, error);
        return [];
    }
}

async function getSongInfo(folder) {
    try {
        const infoPath = path.join('songs', folder, 'info.json');
        const info = JSON.parse(await fs.readFile(infoPath, 'utf8'));
        // Check if cover.jpg exists, otherwise use default
        let coverPath = `songs/${folder}/cover.jpg`;
        try {
            await fs.access(coverPath);
        } catch {
            coverPath = 'images/default-cover.jpg'; // Fallback to default cover
        }
        return {
            title: info.title || folder,
            description: info.description || '',
            cover: coverPath
        };
    } catch (error) {
        console.error(`Error reading info for ${folder}:`, error);
        return {
            title: folder,
            description: 'No description available',
            cover: 'images/default-cover.jpg'
        };
    }
}

async function generateMapping() {
    const songsDir = path.join(__dirname, 'songs');
    const folders = await getDirectories(songsDir);
    const mapping = {};

    for (const folder of folders) {
        const folderPath = path.join(songsDir, folder);
        const mp3Files = await getMP3Files(folderPath);
        const info = await getSongInfo(folder);
        
        mapping[folder] = {
            ...info,
            songs: mp3Files.map(file => ({
                name: file.replace(/\.mp3$/, '').replace(/\([^)]+\)/g, '').trim(),
                file: file,
                path: `songs/${folder}/${file}`
            }))
        };
    }

    await fs.writeFile(
        path.join(__dirname, 'songs_mapping.json'),
        JSON.stringify(mapping, null, 2)
    );
    
    console.log('songs_mapping.json has been generated successfully!');
}

generateMapping().catch(console.error);
