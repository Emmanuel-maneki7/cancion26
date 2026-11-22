// Lista de canciones personalizadas con su ruta en la carpeta "canciones"
const playlist = [
    { artist: "LP", title: "Lost On You", src: "canciones/cancion1.mp3" },
    { artist: "Coldplay", title: "Adventure Of A Lifetime", src: "canciones/cancion2.mp3" },
    { artist: "Cults", title: "Always Forever", src: "canciones/cancion3.mp3" },
    { artist: "Pk Heman", title: "Don't Go", src: "canciones/cancion4.mp3" },
    { artist: "Radiohead", title: "True Love Waits", src: "canciones/cancion5.mp3" },
    { artist: "Justin Bieber", title: "One Time", src: "canciones/cancion6.mp3" },
    { artist: "Rata Blanca", title: "Talismán", src: "canciones/cancion7.mp3" },
    { artist: "Fujii Kaze", title: "Shinunoga E-Wa", src: "canciones/cancion8.mp3" }
];

// Referencias del DOM
const welcomeScreen = document.getElementById("welcome-screen");
const playerScreen = document.getElementById("player-screen");
const enterBtn = document.getElementById("enter-btn");

const songListEl = document.getElementById("song-list");
const vinylDisc = document.getElementById("vinyl");
const tonearm = document.getElementById("tonearm");
const playStatus = document.getElementById("play-status");
const currentTitle = document.getElementById("current-title");
const currentArtist = document.getElementById("current-artist");

const progressBar = document.getElementById("progress-bar");
const currentTimeEl = document.getElementById("current-time");
const totalTimeEl = document.getElementById("total-time");

const playPauseBtn = document.getElementById("play-pause-btn");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");

const muteBtn = document.getElementById("mute-btn");
const volumeSlider = document.getElementById("volume-slider");
const volumeValue = document.getElementById("volume-value");

// Objeto de audio del navegador
const audioPlayer = new Audio();
audioPlayer.preload = "metadata";

let currentIndex = 0;
let isPlaying = false;
let isSeeking = false;
let lastVolume = parseFloat(volumeSlider.value) || 0.8;
audioPlayer.volume = lastVolume;

// Formatear segundos a m:ss
function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// Actualizar barra de progreso y tiempos
function updateProgressUI() {
    if (!isSeeking && Number.isFinite(audioPlayer.duration) && audioPlayer.duration > 0) {
        const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        progressBar.value = percent;
        currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
        totalTimeEl.textContent = formatTime(audioPlayer.duration);
    }
}

audioPlayer.addEventListener("loadedmetadata", () => {
    totalTimeEl.textContent = formatTime(audioPlayer.duration);
    currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
});

audioPlayer.addEventListener("timeupdate", updateProgressUI);

progressBar.addEventListener("input", () => {
    isSeeking = true;
    if (Number.isFinite(audioPlayer.duration) && audioPlayer.duration > 0) {
        const previewTime = (parseFloat(progressBar.value) / 100) * audioPlayer.duration;
        currentTimeEl.textContent = formatTime(previewTime);
    }
});

progressBar.addEventListener("change", () => {
    if (Number.isFinite(audioPlayer.duration) && audioPlayer.duration > 0) {
        audioPlayer.currentTime = (parseFloat(progressBar.value) / 100) * audioPlayer.duration;
    }
    isSeeking = false;
});

// Actualizar interfaz de volumen
function updateVolumeUI(vol) {
    const percentage = Math.round(vol * 100);
    volumeSlider.value = vol;
    volumeValue.textContent = `${percentage}%`;

    if (vol === 0 || audioPlayer.muted) {
        muteBtn.textContent = "🔇";
    } else if (vol < 0.45) {
        muteBtn.textContent = "🔉";
    } else {
        muteBtn.textContent = "🔊";
    }
}

volumeSlider.addEventListener("input", (e) => {
    const newVol = parseFloat(e.target.value);
    audioPlayer.muted = newVol === 0;
    audioPlayer.volume = newVol;
    if (newVol > 0) {
        lastVolume = newVol;
    }
    updateVolumeUI(newVol);
});

muteBtn.addEventListener("click", () => {
    if (audioPlayer.muted || audioPlayer.volume === 0) {
        const restoreVol = lastVolume > 0 ? lastVolume : 0.8;
        audioPlayer.muted = false;
        audioPlayer.volume = restoreVol;
        updateVolumeUI(restoreVol);
    } else {
        lastVolume = audioPlayer.volume;
        audioPlayer.muted = true;
        updateVolumeUI(0);
    }
});

// Transición de la portada al tocadiscos
enterBtn.addEventListener("click", () => {
    welcomeScreen.style.opacity = "0";
    welcomeScreen.style.transform = "scale(0.96)";
    
    setTimeout(() => {
        welcomeScreen.classList.add("hidden");
        playerScreen.classList.remove("hidden");
        selectSong(0, true);
    }, 450);
});

// Renderizar la setlist
function renderSetlist() {
    songListEl.innerHTML = "";
    playlist.forEach((song, index) => {
        const li = document.createElement("li");
        li.className = "song-item";
        li.dataset.index = index;

        li.innerHTML = `
            <div class="song-left">
                <span class="song-number">0${index + 1}</span>
                <div class="song-details">
                    <span class="song-title">${song.title}</span>
                    <span class="song-artist">${song.artist}</span>
                </div>
            </div>
            <span class="song-icon">🤎</span>
        `;

        li.addEventListener("click", () => {
            if (currentIndex === index && isPlaying) {
                pauseVinyl();
            } else {
                selectSong(index, true);
            }
        });

        songListEl.appendChild(li);
    });
}

// Seleccionar canción, cargar audio y actualizar interfaz
function selectSong(index, autoPlay = true) {
    currentIndex = index;
    const song = playlist[currentIndex];

    currentTitle.textContent = song.title;
    currentArtist.textContent = song.artist;
    progressBar.value = 0;
    currentTimeEl.textContent = "0:00";
    totalTimeEl.textContent = "0:00";

    audioPlayer.src = song.src;
    audioPlayer.currentTime = 0;

    document.querySelectorAll(".song-item").forEach((item, idx) => {
        item.classList.toggle("active", idx === currentIndex);
    });

    if (autoPlay) {
        playVinyl();
    } else {
        pauseVinyl();
    }
}

// Reproducir audio, girar vinilo y mover brazo
function playVinyl() {
    audioPlayer.play().then(() => {
        isPlaying = true;
        vinylDisc.classList.add("spinning");
        tonearm.classList.add("active");
        playPauseBtn.textContent = "⏸";
        playStatus.textContent = "Sonando ahora ♪";
    }).catch((err) => {
        console.warn("No se pudo reproducir el archivo automáticamente:", err);
        isPlaying = false;
        vinylDisc.classList.remove("spinning");
        tonearm.classList.remove("active");
        playPauseBtn.textContent = "▶";
        playStatus.textContent = "Revisa cancion" + (currentIndex + 1) + ".mp3";
    });
}

// Pausar audio, detener vinilo y retirar brazo
function pauseVinyl() {
    audioPlayer.pause();
    isPlaying = false;
    vinylDisc.classList.remove("spinning");
    tonearm.classList.remove("active");
    playPauseBtn.textContent = "▶";
    playStatus.textContent = "En pausa";
}

// Pasar automáticamente a la siguiente al terminar
audioPlayer.addEventListener("ended", () => {
    const nextIndex = (currentIndex + 1) % playlist.length;
    selectSong(nextIndex, true);
});

// Controles del reproductor
playPauseBtn.addEventListener("click", () => {
    if (!audioPlayer.src) {
        selectSong(currentIndex, true);
        return;
    }

    if (isPlaying) {
        pauseVinyl();
    } else {
        playVinyl();
    }
});

prevBtn.addEventListener("click", () => {
    const newIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    selectSong(newIndex, true);
});

nextBtn.addEventListener("click", () => {
    const newIndex = (currentIndex + 1) % playlist.length;
    selectSong(newIndex, true);
});

// Inicializar lista y volumen al cargar
renderSetlist();
updateVolumeUI(lastVolume);