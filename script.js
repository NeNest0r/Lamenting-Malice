const songs = [
  { id: "01", title: "Unbirthing" },
  { id: "02", title: "The Fucking Apocalypse" },
  { id: "03", title: "Enshittification" },
  { id: "04", title: "BleakReality" },
  { id: "05", title: "Hell Sings" },
  { id: "06", title: "MentallyILL" },
  { id: "07", title: "Imminent Eradication" },
  { id: "08", title: "Nihilism Extremist" },
  { id: "09", title: "Dead Doom Scrolls" },
  { id: "10", title: "Endlessly Dying Machine" },
  { id: "11", title: "(emotion)2" },
  { id: "12", title: "Fearful Avoidant Disorganised Attachment" },
  { id: "13", title: "Disappearing" },
  { id: "14", title: "It Is 0 Seconds To Midnight" },
  { id: "add", title: "Shut Your Bitch Ass Up PROLAPSE OF THE MIND" },
];

const playlistElem = document.getElementById("playlist");
const audio = document.getElementById("audio-player");
const trackNameDisplay = document.getElementById("track-name");
const playPauseBtn = document.getElementById("play-pause-btn");
const seekSlider = document.getElementById("seek-slider");
const volumeSlider = document.getElementById("volume-slider");
const currTimeElem = document.getElementById("curr-time");
const totalTimeElem = document.getElementById("total-time");
const playerContainer = document.querySelector(".player-container");
const canvas = document.getElementById("visualizer");
const canvasCtx = canvas.getContext("2d");

let audioContext;
let analyser;
let source;
let isAudioContextSetup = false;

songs.forEach((song) => {
  const li = document.createElement("li");
  li.className = "song-item";
  li.innerText = `${song.id}. ${song.title}`;

  li.onclick = () => {
    if (!isAudioContextSetup) setupVisualizer();
    if (audioContext.state === "suspended") audioContext.resume();

    playerContainer.classList.add("active");
    trackNameDisplay.innerText = `${song.id}. ${song.title}`;

    const fileName = `Cynthoni - LAMENTING MALICE - ${song.id} ${song.title}.mp3`;
    audio.src = fileName;

    audio
      .play()
      .then(() => {
        playPauseBtn.innerText = "❚❚";
        document.body.classList.add("is-playing");
      })
      .catch((err) => {
        console.error("Ошибка:", err);
      });
  };
  playlistElem.appendChild(li);
});

// КНОПКА ПАУЗЫ
playPauseBtn.onclick = () => {
  if (!audio.src) return;

  if (!isAudioContextSetup) setupVisualizer();
  if (audioContext && audioContext.state === "suspended") audioContext.resume();

  if (audio.paused) {
    audio.play();
    playPauseBtn.innerText = "❚❚";
    document.body.classList.add("is-playing");
  } else {
    audio.pause();
    playPauseBtn.innerText = "▶";
    document.body.classList.remove("is-playing");
  }
};

audio.onended = () => {
  body.classList.remove("is-playing");
  playPauseBtn.innerText = "▶";
  playerContainer.classList.remove("active");
};

audio.ontimeupdate = () => {
  if (!isNaN(audio.duration)) {
    const progress = (audio.currentTime / audio.duration) * 100;
    seekSlider.value = progress;
    currTimeElem.innerText = formatTime(audio.currentTime);
    totalTimeElem.innerText = formatTime(audio.duration);
  }
};

// ПЕРЕМОТКА
seekSlider.oninput = () => {
  const seekTo = audio.duration * (seekSlider.value / 100);
  audio.currentTime = seekTo;
};

// ГРОМКОСТЬ
volumeSlider.oninput = () => {
  audio.volume = volumeSlider.value / 100;
};

audio.onended = () => {
  body.classList.remove("is-playing");
  playPauseBtn.innerText = "▶";
};

function formatTime(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min}:${sec < 10 ? "0" : ""}${sec}`;
}

// ВИЗУАЛ
function setupVisualizer() {
  if (isAudioContextSetup) return;

  audioContext = new (window.AudioContext || window.webkitAudioContext)();

  analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;

  audio.crossOrigin = "anonymous";
  source = audioContext.createMediaElementSource(audio);

  source.connect(analyser);
  analyser.connect(audioContext.destination);

  isAudioContextSetup = true;
  drawVisualizer();
}

// РИСОВАНИЕ
let fallArray = new Float32Array(128);

function drawVisualizer() {
  requestAnimationFrame(drawVisualizer);

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(dataArray);

  canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

  const gradient = canvasCtx.createLinearGradient(0, canvas.height, 0, 0);
  gradient.addColorStop(0.5, "rgba(188, 0, 255, 0.9)");
  gradient.addColorStop(1.0, "#f0afff");

  const barWidth = (canvas.width / bufferLength) * 2.2;
  let x = 0;

  for (let i = 0; i < bufferLength; i++) {
    // КОНТРАСТНОСТЬ ДЛЯ БРЕЙККОРА
    let rawValue = dataArray[i] / 255;
    let boostedValue = Math.pow(rawValue, 2.8) * canvas.height * 1.8;

    // ГРАВИТАЦИЯ ПОЛОСОК ПЛЕЕРА
    if (boostedValue > fallArray[i]) {
      fallArray[i] = boostedValue;
    } else {
      fallArray[i] -= 3.0;
    }

    let barHeight = fallArray[i];

    canvasCtx.fillStyle = gradient;

    if (barHeight > canvas.height * 0.7) {
      canvasCtx.shadowBlur = 10;
      canvasCtx.shadowColor = "#bc00ff";
    } else {
      canvasCtx.shadowBlur = 0;
    }

    canvasCtx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);

    x += barWidth;
  }
}

function resizeCanvas() {
  canvas.width = playerContainer.clientWidth;
  canvas.height = 80;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();
