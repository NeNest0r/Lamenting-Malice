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
const trackNameDisplay = document.getElementById("track-name"); // Проверь этот ID
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
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    // 1. Инициализируем аудио контекст при первом клике
    if (!isAudioContextSetup) setupVisualizer();
    // Если контекст был на паузе (браузеры иногда стопят), возобновляем
    if (audioContext.state === "suspended") audioContext.resume();
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

    playerContainer.classList.add("active");
    trackNameDisplay.innerText = `${song.id}. ${song.title}`;

    const fileName = `Cynthoni - LAMENTING MALICE - ${song.id} ${song.title}.mp3`;
    // Тут убираем encodeURI, если имена файлов простые, или оставляем как есть
    audio.src = fileName;

    audio
      .play()
      .then(() => {
        playPauseBtn.innerText = "⏸";
        document.body.classList.add("is-playing");
      })
      .catch((err) => {
        console.error("Ошибка:", err);
      });
  };
  playlistElem.appendChild(li);
});

// Кнопка плей/пауза
playPauseBtn.onclick = () => {
  if (!audio.src) return;

  // Тоже проверяем контекст при нажатии кнопки
  if (!isAudioContextSetup) setupVisualizer();
  if (audioContext && audioContext.state === "suspended") audioContext.resume();

  if (audio.paused) {
    audio.play();
    playPauseBtn.innerText = "⏸";
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
  // Если хочешь, чтобы плеер тоже исчезал, когда музыка кончилась:
  // playerContainer.classList.remove("active");
};

// Обновление ползунка времени
audio.ontimeupdate = () => {
  if (!isNaN(audio.duration)) {
    const progress = (audio.currentTime / audio.duration) * 100;
    seekSlider.value = progress;
    currTimeElem.innerText = formatTime(audio.currentTime);
    totalTimeElem.innerText = formatTime(audio.duration);
  }
};

// Перемотка
seekSlider.oninput = () => {
  const seekTo = audio.duration * (seekSlider.value / 100);
  audio.currentTime = seekTo;
};

// Громкость
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
// --- Функция настройки визуализатора (запустим один раз) ---
function setupVisualizer() {
  if (isAudioContextSetup) return;

  // 1. Создаем контекст
  audioContext = new (window.AudioContext || window.webkitAudioContext)();

  // 2. Создаем анализатор
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 256; // Количество полосок (чем меньше число, тем жирнее полоски). 256 оптимально.

  // 3. Подключаем аудио-элемент к анализатору
  // Важно: crossOrigin нужен, если файлы лежат не на том же домене, но локально может ругаться CORS
  audio.crossOrigin = "anonymous";
  source = audioContext.createMediaElementSource(audio);

  // 4. Соединяем: Источник -> Анализатор -> Выход (динамики)
  source.connect(analyser);
  analyser.connect(audioContext.destination);

  isAudioContextSetup = true;
  drawVisualizer(); // Запускаем цикл рисования
}

// --- Функция рисования (Loop) ---
let fallArray = new Float32Array(128);

function drawVisualizer() {
  requestAnimationFrame(drawVisualizer);

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(dataArray);

  canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Создаем вертикальный градиент: от низа (снизу темный) к верху (светло-фиолетовый)
  // 0, canvas.height - начальная точка (низ)
  // 0, 0 - конечная точка (верх)
  const gradient = canvasCtx.createLinearGradient(0, canvas.height, 0, 0);
  gradient.addColorStop(0.5, "rgba(188, 0, 255, 0.9)"); // Твой основной акцент посередине
  gradient.addColorStop(1.0, "#f0afff"); // Светло-фиолетовый (почти белый) на самом пике

  const barWidth = (canvas.width / bufferLength) * 2.2;
  let x = 0;

  for (let i = 0; i < bufferLength; i++) {
    // Контрастность для брейккора (чтобы полоски не стояли стеной)
    let rawValue = dataArray[i] / 255;
    let boostedValue = Math.pow(rawValue, 2.8) * canvas.height * 1.8;

    // Гравитация (плавное падение)
    if (boostedValue > fallArray[i]) {
      fallArray[i] = boostedValue;
    } else {
      fallArray[i] -= 3.0; // Чуть ускорил падение для динамики
    }

    let barHeight = fallArray[i];

    // Применяем градиент
    canvasCtx.fillStyle = gradient;

    // Добавляем небольшое свечение только для самых высоких пиков
    if (barHeight > canvas.height * 0.7) {
      canvasCtx.shadowBlur = 10;
      canvasCtx.shadowColor = "#bc00ff";
    } else {
      canvasCtx.shadowBlur = 0;
    }

    // Рисуем полоску
    // Вычитаем 1 из barWidth, чтобы были четкие промежутки
    canvasCtx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);

    x += barWidth;
  }
}

function resizeCanvas() {
  canvas.width = playerContainer.clientWidth;
  canvas.height = 80; // Та же высота, что и в CSS
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas(); // Вызываем сразу при старте
