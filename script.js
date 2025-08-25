let currSong = new Audio();
let currFolder;
let allSongs = [];
let songsMapping = {};

// 🔹 utility to clean song name
const getCleanName = (name) => name.split("(")[0].trim();

// 🔹 utility to play song by index
const playByIndex = (index, songs, folder) => {
    const song = songs[index];
    sessionStorage.setItem("currIndex", index);
    playMusic(song.path, song.name);
};

// Load songs mapping from the centralized file
async function loadSongsMapping() {
    try {
        const response = await fetch('/songs_mapping.json');
        songsMapping = await response.json();
        return songsMapping;
    } catch (error) {
        console.error('Error loading songs mapping:', error);
        return {};
    }
}

const formatTime = (seconds) => {
    let mins = Math.floor(seconds / 60) || 0;
    let secs = Math.floor(seconds % 60) || 0;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

const playMusic = (track, songName) => {
    currSong.src = track;
    play.src = "images/pause.svg";
    currSong.play();
    document.querySelector(".song-info").innerHTML = songName;
    document.querySelector(".song-time").innerHTML = "00:00 / 00:00";
};

async function loadSongs(folder) {
    currFolder = folder;
    const folderData = songsMapping[folder];
    if (!folderData) {
        console.error(`No data found for folder: ${folder}`);
        return [];
    }

    allSongs = folderData.songs || [];
    let songUL = document.querySelector(".songList ul");
    songUL.innerHTML = "";

    allSongs.forEach((song, index) => {
        let cleanName = getCleanName(song.name);

        songUL.innerHTML += `
            <li>
                <img class="invert" src="images/music.svg" alt="">
                <div class="info">
                    <div>${cleanName}</div>
                    <div>${folderData.artist || 'Unknown Artist'}</div>
                </div>
                <div class="playnow justify-content align gap-1">
                    <span>Play Now</span>
                    <img class="invert" src="images/play.svg" alt="play now">
                </div>
            </li>`;
    });

    Array.from(songUL.getElementsByTagName("li")).forEach((li, index) => {
        li.addEventListener("click", () => playByIndex(index, allSongs, folder));
    });

    return allSongs;
}


async function displayFolders() {
    const cardContainer = document.querySelector(".cardContainer");
    cardContainer.innerHTML = ''; // Clear existing cards

    for (const [folder, data] of Object.entries(songsMapping)) {
        const card = document.createElement("div");
        card.classList.add("card");
        card.dataset.folder = folder;
        
        card.innerHTML = `
            <img src="${data.cover}" alt="${data.title}">
            <h2>${data.title}</h2>
            <p>${data.description}</p>
            <button class="play-btn"><img src="images/play.svg" alt="playButton"></button>
        `;

        // Play first song when card is clicked
        card.addEventListener("click", async () => {
            let songs = await loadSongs(folder);
            if (songs.length > 0) playByIndex(0, songs, folder);
        });

        cardContainer.appendChild(card);
    }
}

async function main() {
    // Load the songs mapping first
    await loadSongsMapping();
    
    // Display all available folders
    displayFolders();
    
    // Load the first folder's songs if available
    const firstFolder = Object.keys(songsMapping)[0];
    if (firstFolder) {
        await loadSongs(firstFolder);
    }

    const seekbar = document.querySelector(".seekbar");
    const circle = document.querySelector(".circle");

    function updateSeekbar() {
        const progress = (currSong.currentTime / currSong.duration) || 0;
        circle.style.left = `${progress * seekbar.offsetWidth}px`;
    }

    // Seek
    seekbar.addEventListener("click", (e) => {
        const rect = seekbar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        currSong.currentTime = (clickX / seekbar.offsetWidth) * currSong.duration;
        updateSeekbar();
    });

    // Dragging
    let isDragging = false;
    circle.addEventListener("mousedown", () => { isDragging = true; });
    document.addEventListener("mouseup", () => { isDragging = false; });
    document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        const rect = seekbar.getBoundingClientRect();
        let newX = Math.max(0, Math.min(e.clientX - rect.left, seekbar.offsetWidth));
        circle.style.left = `${newX}px`;
        currSong.currentTime = (newX / seekbar.offsetWidth) * currSong.duration;
    });

    currSong.addEventListener("timeupdate", () => {
        updateSeekbar();
        let current = formatTime(currSong.currentTime);
        let total = formatTime(currSong.duration || 0);
        document.querySelector(".song-time").innerHTML = `${current} / ${total}`;
    });

    // Controls
    play.addEventListener("click", () => {
        if (currSong.src) {
            if (currSong.paused) {
                currSong.play();
                play.src = "images/pause.svg";
            } else {
                currSong.pause();
                play.src = "images/play.svg";
            }
        } else if (songs.length > 0) {
            playByIndex(0, songs, currFolder);
        }
    });

    next.addEventListener("click", () => {
        if (allSongs.length === 0) return;
        let currIndex = Number(sessionStorage.getItem("currIndex")) || 0;
        let nextIndex = (currIndex + 1) % allSongs.length;
        playByIndex(nextIndex, allSongs, currFolder);
    });

    previous.addEventListener("click", () => {
        if (allSongs.length === 0) return;
        let currIndex = Number(sessionStorage.getItem("currIndex")) || 0;
        let prevIndex = (currIndex - 1 + allSongs.length) % allSongs.length;
        playByIndex(prevIndex, allSongs, currFolder);
    });



    // Sidebar
    document.querySelector(".hamburger-icon").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });
    document.querySelector(".cross").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-100%";
    });

    document.querySelector(".login-btn").addEventListener("click", () => {
        window.location.href = "notice.html"
    })
}

main();
