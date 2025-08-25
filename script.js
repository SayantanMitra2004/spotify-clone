let currSong = new Audio();
let currFolder;
let allSongs = []

// 🔹 utility to clean song name
const getCleanName = (file) =>
    decodeURIComponent(file).replace(".mp3", "").split("(")[0].trim();

// 🔹 utility to play song by index
const playByIndex = (index, songs, folder) => {
    let songURL = `/songs/${folder}/${songs[index]}`;
    let cleanName = getCleanName(songs[index]);

    sessionStorage.setItem("currIndex", index);
    playMusic(songURL, cleanName);
};

async function getSongs(folder) {
    currFolder = folder;
    let a = await fetch(`/songs/${folder}`);
    let response = await a.text();

    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");

    return Array.from(as)
        .filter(el => el.href.endsWith(".mp3"))
        .map(el => el.href.split(`/${folder}/`)[1]);
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
    allSongs = await getSongs(folder);  // ✅ store globally

    let songUL = document.querySelector(".songList ul");
    songUL.innerHTML = "";

    allSongs.forEach((song, index) => {
        let cleanName = getCleanName(song);

        songUL.innerHTML += `
            <li>
                <img class="invert" src="images/music.svg" alt="">
                <div class="info">
                    <div>${cleanName}</div>
                    <div>Sayantan</div>
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
    let a = await fetch(`/songs/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a");
    let cardContainer = document.querySelector(".cardContainer");

    Array.from(anchors).forEach(async e => {
        if (e.href.includes("/songs")) {
            let folder = e.href.split("/").slice(-2)[0];
            let a = await fetch(`/songs/${folder}/info.json`);
            let response = await a.json();

            let card = document.createElement("div");
            card.classList.add("card");
            card.dataset.folder = folder;
            card.innerHTML = `
                <img src="/songs/${folder}/cover.jpg" alt="">
                <h2>${response.title}</h2>
                <p>${response.description}</p>
                <button class="play-btn"><img src="images/play.svg" alt="playButton"></button>
            `;

            // play first song when card clicked
            card.addEventListener("click", async () => {
                let songs = await loadSongs(folder);
                if (songs.length > 0) playByIndex(0, songs, folder);
            });

            cardContainer.appendChild(card);
        }
    });
}

async function main() {
    let songs = await loadSongs("songs");
    displayFolders();

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
