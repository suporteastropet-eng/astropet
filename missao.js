/* ============================================ */
/* SONS E VIBRAÇÃO                              */
/* ============================================ */
let audioCtx = null;
let somAcertoBuffer = null;
let somErroBuffer = null;
let audioIniciado = false;

function iniciarAudio() {
  if (audioIniciado) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    audioIniciado = true;
    fetch('sons/acerto.mp3').then(r => r.arrayBuffer()).then(b => audioCtx.decodeAudioData(b)).then(buf => { somAcertoBuffer = buf; }).catch(() => {});
    fetch('sons/erro.mp3').then(r => r.arrayBuffer()).then(b => audioCtx.decodeAudioData(b)).then(buf => { somErroBuffer = buf; }).catch(() => {});
  } catch (e) { /* sem áudio */ }
}

document.addEventListener('pointerdown', iniciarAudio, { once: true });

function beep(freq, dur) {
  if (!audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  } catch (e) { /* ignora */ }
}

function tocarAcerto() {
  if (somAcertoBuffer && audioCtx) {
    try {
      const src = audioCtx.createBufferSource();
      src.buffer = somAcertoBuffer;
      src.connect(audioCtx.destination);
      src.start();
      return;
    } catch (e) {}
  }
  beep(880, 0.12);
}

function tocarErro() {
  if (somErroBuffer && audioCtx) {
    try {
      const src = audioCtx.createBufferSource();
      src.buffer = somErroBuffer;
      src.connect(audioCtx.destination);
      src.start();
      return;
    } catch (e) {}
  }
  beep(220, 0.2);
}

function vibrarAcerto() {
  if (navigator.vibrate) navigator.vibrate(40);
}
function vibrarErro() {
  if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
}

/* ============================================ */
/* UTILITÁRIOS                                  */
/* ============================================ */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/* ============================================ */
/* CONTROLE DE MODAIS COM FOCO E ESC            */
/* ============================================ */
let lastFocusedElement = null;

function openGame(petId) {
  const map = {
    luna: ['lunaGameModal', resetLunaGame],
    bolt: ['boltGameModal', resetBoltGame],
    mimi: ['mimiGameModal', resetMimiGame],
    tiko: ['tikoGameModal', resetTikoGame]
  };
  const [modalId, reset] = map[petId];
  lastFocusedElement = document.activeElement;

  iniciarAudio();

  const modal = document.getElementById(modalId);
  modal.classList.add('active');
  document.body.classList.add('modal-open');

  setTimeout(() => {
    const title = modal.querySelector('h2');
    if (title) title.focus();
  }, 50);

  reset();
}

function closeGame(petId) {
  const map = {
    luna: ['lunaGameModal', resetLunaGame],
    bolt: ['boltGameModal', resetBoltGame],
    mimi: ['mimiGameModal', resetMimiGame],
    tiko: ['tikoGameModal', resetTikoGame]
  };
  const [modalId, reset] = map[petId];
  document.getElementById(modalId).classList.remove('active');
  document.body.classList.remove('modal-open');
  reset();

  if (lastFocusedElement && lastFocusedElement.focus) {
    lastFocusedElement.focus();
  }
  lastFocusedElement = null;
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const modais = ['lunaGameModal', 'boltGameModal', 'mimiGameModal', 'tikoGameModal'];
    for (const id of modais) {
      const m = document.getElementById(id);
      if (m && m.classList.contains('active')) {
        const petId = id.replace('GameModal', '');
        closeGame(petId);
        return;
      }
    }
    const victory = document.getElementById('victoryOverlay');
    if (victory && victory.classList.contains('active')) {
      fecharVitoria();
    }
  }
});

document.addEventListener('click', (e) => {
  if (e.target.classList && e.target.classList.contains('modal-overlay') && e.target.classList.contains('active')) {
    const petId = e.target.id.replace('GameModal', '');
    closeGame(petId);
  }
  if (e.target.id === 'victoryOverlay' && e.target.classList.contains('active')) {
    fecharVitoria();
  }
});

/* ============================================ */
/* VITÓRIA                                      */
/* ============================================ */
let victoryContext = null;

function mostrarVitoria(petId, opcoes) {
  victoryContext = { petId, restartFn: opcoes.restartFn };

  const overlay = document.getElementById('victoryOverlay');
  const petImg = document.getElementById('victory-pet-img');
  const title = document.getElementById('victory-title');
  const msg = document.getElementById('victory-message');

  const petsImgs = {
    luna: 'luna.png',
    bolt: 'Bolt.png',
    mimi: 'mimi.png',
    tiko: 'tiko.png'
  };
  const nomes = { luna: 'Luna', bolt: 'Bolt', mimi: 'Mimi', tiko: 'Tiko' };

  petImg.src = petsImgs[petId] || 'luna.png';
  petImg.alt = nomes[petId] || '';
  title.textContent = `Parabéns, ${nomes[petId] || 'AstroPet'}!`;
  msg.textContent = opcoes.mensagem || 'Você completou a missão!';

  overlay.classList.add('active');
  document.body.classList.add('modal-open');

  setTimeout(() => title.focus(), 50);
}

function fecharVitoria() {
  const overlay = document.getElementById('victoryOverlay');
  overlay.classList.remove('active');
  document.body.classList.remove('modal-open');
  victoryContext = null;
}

document.getElementById('btn-victory-again').addEventListener('click', () => {
  const ctx = victoryContext;
  fecharVitoria();
  if (ctx && ctx.restartFn) {
    setTimeout(() => ctx.restartFn(), 100);
  }
});

document.getElementById('btn-victory-other').addEventListener('click', () => {
  const ctx = victoryContext;
  fecharVitoria();
  if (ctx) {
    const petId = ctx.petId;
    document.getElementById(petId + 'GameModal').classList.remove('active');
    document.body.classList.remove('modal-open');
    const map = {
      luna: resetLunaGame, bolt: resetBoltGame,
      mimi: resetMimiGame, tiko: resetTikoGame
    };
    map[petId]();
  }
});

/* ============================================ */
/* LUNA — SIMON SAYS INFINITO                   */
/* ============================================ */
const planetElements = document.querySelectorAll('#planets-grid .planet');
const feedbackMemoria = document.getElementById('feedback-memoria');
const btnLunaStart = document.getElementById('btn-luna-start');

let lunaState = 'idle';
let lunaSequence = [];
let lunaPlayerIndex = 0;
let lunaNivelAtual = 0;

function resetLunaGame() {
  lunaState = 'idle';
  lunaSequence = [];
  lunaPlayerIndex = 0;
  lunaNivelAtual = 0;
  feedbackMemoria.textContent = 'Clique em "Começar" para ver a sequência.';
  feedbackMemoria.className = 'game-feedback';
  btnLunaStart.textContent = 'Começar';
  btnLunaStart.disabled = false;
  btnLunaStart.onclick = iniciarMemoria;
  planetElements.forEach(p => p.classList.remove('error', 'highlight', 'turn-active', 'correct-flash'));
}

async function piscarSequenciaInteira() {
  lunaState = 'showing';
  btnLunaStart.disabled = true;
  planetElements.forEach(p => p.classList.remove('turn-active', 'correct-flash', 'error'));

  feedbackMemoria.textContent = `👀 Observe com atenção... (${lunaSequence.length} ${lunaSequence.length === 1 ? 'passo' : 'passos'})`;
  feedbackMemoria.className = 'game-feedback observing';

  await delay(600);

  for (let i = 0; i < lunaSequence.length; i++) {
    const planet = document.getElementById(lunaSequence[i]);
    planet.classList.add('highlight');
    await delay(550);
    planet.classList.remove('highlight');
    await delay(300);
  }

  lunaState = 'waiting';
  lunaPlayerIndex = 0;
  btnLunaStart.disabled = true;
  feedbackMemoria.textContent = '👉 Sua vez! Toque nos pets na ordem que você viu.';
  feedbackMemoria.className = 'game-feedback your-turn';
  planetElements.forEach(p => p.classList.add('turn-active'));
}

async function iniciarMemoria() {
  if (lunaState === 'showing' || lunaState === 'waiting') return;
  if (lunaNivelAtual === 0) lunaNivelAtual = 1;
  const idx = Math.floor(Math.random() * 4);
  lunaSequence.push(planetElements[idx].id);
  lunaPlayerIndex = 0;
  feedbackMemoria.textContent = 'Preparando...';
  feedbackMemoria.className = 'game-feedback';
  await delay(400);
  await piscarSequenciaInteira();
}

async function tentarNovamenteLuna() {
  if (lunaState === 'showing' || lunaState === 'waiting') return;
  lunaPlayerIndex = 0;
  feedbackMemoria.textContent = 'Preparando...';
  feedbackMemoria.className = 'game-feedback';
  await delay(400);
  await piscarSequenciaInteira();
}

async function proximoNivelLuna() {
  if (lunaState === 'showing' || lunaState === 'waiting') return;
  lunaNivelAtual++;
  const idx = Math.floor(Math.random() * 4);
  lunaSequence.push(planetElements[idx].id);
  lunaPlayerIndex = 0;
  feedbackMemoria.textContent = 'Preparando...';
  feedbackMemoria.className = 'game-feedback';
  await delay(400);
  await piscarSequenciaInteira();
}

planetElements.forEach(planet => {
  planet.addEventListener('click', async (e) => {
    if (lunaState !== 'waiting') return;
    const clickedId = e.currentTarget.id;

    if (clickedId === lunaSequence[lunaPlayerIndex]) {
      e.currentTarget.classList.add('correct-flash');
      tocarAcerto();
      vibrarAcerto();
      setTimeout(() => e.currentTarget.classList.remove('correct-flash'), 400);

      lunaPlayerIndex++;

      if (lunaPlayerIndex === lunaSequence.length) {
        lunaState = 'idle';
        planetElements.forEach(p => p.classList.remove('turn-active'));
        feedbackMemoria.textContent = `✅ Muito bem! Você completou ${lunaSequence.length} ${lunaSequence.length === 1 ? 'passo' : 'passos'}!`;
        feedbackMemoria.className = 'game-feedback success';

        btnLunaStart.disabled = false;
        btnLunaStart.textContent = 'Próximo Nível';
        btnLunaStart.onclick = proximoNivelLuna;
      }
    } else {
      lunaState = 'idle';
      planetElements.forEach(p => p.classList.remove('turn-active'));
      e.currentTarget.classList.add('error');
      tocarErro();
      vibrarErro();
      setTimeout(() => e.currentTarget.classList.remove('error'), 800);

      feedbackMemoria.textContent =
        `❌ Quase! Você acertou ${lunaPlayerIndex} de ${lunaSequence.length}. ` +
        `Clique em "Tentar Novamente" para ver a mesma sequência.`;
      feedbackMemoria.className = 'game-feedback error';

      btnLunaStart.disabled = false;
      btnLunaStart.textContent = 'Tentar Novamente';
      btnLunaStart.onclick = tentarNovamenteLuna;
    }
  });
});

/* ============================================ */
/* BOLT                                         */
/* ============================================ */
const colorNameRow = document.getElementById('color-name-row');
const colorBlockRow = document.getElementById('color-block-row');
const boltFeedback = document.getElementById('bolt-feedback');
let boltMatchesCompleted = 0;
let boltSelectedElement = null;
let boltTypeSelected = null;

const COLORS_MAP = [
  { name: "LARANJA",  hex: "#FF6A00" },
  { name: "AZUL",     hex: "#0055FF" },
  { name: "VERMELHO", hex: "#E60012" },
  { name: "AMARELO",  hex: "#FFD700" },
  { name: "VERDE",    hex: "#00A32E" },
  { name: "ROSA",     hex: "#FF1493" },
  { name: "MARROM",   hex: "#7A3E17" },
  { name: "ROXO",     hex: "#7A00CC" }
];

function generateBoltGame() {
  boltMatchesCompleted = 0;
  colorNameRow.innerHTML = '';
  colorBlockRow.innerHTML = '';
  boltSelectedElement = null;
  boltTypeSelected = null;
  boltFeedback.textContent = 'Clique no nome da cor e depois no bloco colorido correspondente.';
  boltFeedback.className = 'game-feedback';

  const shuffledNames = [...COLORS_MAP].sort(() => Math.random() - 0.5);
  const shuffledBlocks = [...COLORS_MAP].sort(() => Math.random() - 0.5);

  shuffledNames.forEach(color => {
    const btn = document.createElement('button');
    btn.classList.add('match-item', 'color-name-item');
    btn.textContent = color.name;
    btn.dataset.value = color.name;
    btn.dataset.type = 'name';
    btn.addEventListener('click', handleBoltClick);
    colorNameRow.appendChild(btn);
  });

  shuffledBlocks.forEach(color => {
    const btn = document.createElement('button');
    btn.classList.add('match-item', 'color-block-item');
    btn.style.backgroundColor = color.hex;
    btn.dataset.value = color.name;
    btn.dataset.type = 'block';
    btn.setAttribute('aria-label', `Bloco da cor ${color.name.toLowerCase()}`);
    btn.addEventListener('click', handleBoltClick);
    colorBlockRow.appendChild(btn);
  });
}

function startBoltGame() {
  generateBoltGame();
  document.querySelector('#bolt-game-controls button').textContent = 'Reiniciar Jogo';
}

function resetBoltGame() {
  generateBoltGame();
  boltFeedback.textContent = "Clique em 'Iniciar Jogo' para começar.";
  boltFeedback.className = 'game-feedback';
  document.querySelector('#bolt-game-controls button').textContent = 'Iniciar Jogo';
}

function checkBoltWin() {
  if (boltMatchesCompleted === COLORS_MAP.length) {
    boltFeedback.textContent = '🎉 Parabéns! Todas as cores foram assimiladas!';
    boltFeedback.className = 'game-feedback success';

    setTimeout(() => {
      mostrarVitoria('bolt', {
        mensagem: 'Você combinou todas as cores do Bolt!',
        restartFn: () => {
          document.getElementById('boltGameModal').classList.add('active');
          resetBoltGame();
          startBoltGame();
        }
      });
    }, 500);
  }
}

function handleBoltClick(event) {
  const el = event.currentTarget;
  if (el.classList.contains('matched')) return;
  const value = el.dataset.value;
  const type = el.dataset.type;

  if (!boltSelectedElement) {
    el.classList.add('selected');
    boltSelectedElement = el;
    boltTypeSelected = type;
    boltFeedback.textContent = `Selecionado: ${value}. Agora clique no correspondente.`;
    boltFeedback.className = 'game-feedback your-turn';
    return;
  }

  if (boltSelectedElement === el) {
    el.classList.remove('selected');
    boltSelectedElement = null;
    boltTypeSelected = null;
    boltFeedback.textContent = 'Seleção cancelada.';
    boltFeedback.className = 'game-feedback';
    return;
  }

  if (type === boltTypeSelected) {
    boltFeedback.textContent = '❌ Escolha um nome E um bloco de cor.';
    boltFeedback.className = 'game-feedback error';
    setTimeout(() => {
      boltFeedback.className = 'game-feedback';
      boltFeedback.textContent = 'Escolha um nome e depois uma cor.';
    }, 1500);
    return;
  }

  if (value === boltSelectedElement.dataset.value) {
    tocarAcerto();
    vibrarAcerto();
    el.classList.add('correct-flash');
    boltSelectedElement.classList.add('correct-flash');

    setTimeout(() => {
      el.classList.remove('correct-flash');
      if (boltSelectedElement) boltSelectedElement.classList.remove('correct-flash');
      el.classList.add('matched');
      if (boltSelectedElement) boltSelectedElement.classList.add('matched');
      if (boltSelectedElement) boltSelectedElement.classList.remove('selected');
      boltSelectedElement = null;
      boltTypeSelected = null;
    }, 400);

    boltFeedback.textContent = `✅ Acerto! ${value} combinado.`;
    boltFeedback.className = 'game-feedback success';

    boltMatchesCompleted++;
    checkBoltWin();
  } else {
    tocarErro();
    vibrarErro();
    el.classList.add('error');
    if (boltSelectedElement) boltSelectedElement.classList.add('error');
    setTimeout(() => {
      el.classList.remove('error');
      if (boltSelectedElement) boltSelectedElement.classList.remove('error');
    }, 600);

    boltFeedback.textContent = `❌ Erro! Não é a cor de ${boltSelectedElement.dataset.value}.`;
    boltFeedback.className = 'game-feedback error';
    if (boltSelectedElement) boltSelectedElement.classList.remove('selected');
    boltSelectedElement = null;
    boltTypeSelected = null;
    setTimeout(() => {
      boltFeedback.className = 'game-feedback';
      boltFeedback.textContent = `Tente novamente. ${COLORS_MAP.length - boltMatchesCompleted} pares restantes.`;
    }, 2000);
  }
}

/* ============================================ */
/* MIMI — NÍVEIS 1-10 até 91-100                */
/* ============================================ */
const extensoRow = document.getElementById('extenso-row');
const numeralRow = document.getElementById('numeral-row');
const mimiFeedback = document.getElementById('mimi-feedback');
const mimiLevelDisplay = document.getElementById('mimi-level');
const mimiLevelStep = document.getElementById('mimi-level-step');
const mimiGameStep = document.getElementById('mimi-game-step');
const mimiLevelSelector = document.getElementById('mimi-level-selector');
const btnMimiMain = document.getElementById('btn-mimi-main');

const MIMI_LEVELS = [
  { id: 1,  start: 1,  end: 10,  label: 'Nível 1',  range: '1 a 10' },
  { id: 2,  start: 11, end: 20,  label: 'Nível 2',  range: '11 a 20' },
  { id: 3,  start: 21, end: 30,  label: 'Nível 3',  range: '21 a 30' },
  { id: 4,  start: 31, end: 40,  label: 'Nível 4',  range: '31 a 40' },
  { id: 5,  start: 41, end: 50,  label: 'Nível 5',  range: '41 a 50' },
  { id: 6,  start: 51, end: 60,  label: 'Nível 6',  range: '51 a 60' },
  { id: 7,  start: 61, end: 70,  label: 'Nível 7',  range: '61 a 70' },
  { id: 8,  start: 71, end: 80,  label: 'Nível 8',  range: '71 a 80' },
  { id: 9,  start: 81, end: 90,  label: 'Nível 9',  range: '81 a 90' },
  { id: 10, start: 91, end: 100, label: 'Nível 10', range: '91 a 100' }
];

let mimiCurrentLevel = 1;
let mimiPairsToMatch = 10;
let mimiMatchesCompleted = 0;
let mimiSelectedElement = null;
let mimiTypeSelected = null;

const NUMBERS_MAP = {
  1: "UM", 2: "DOIS", 3: "TRÊS", 4: "QUATRO", 5: "CINCO",
  6: "SEIS", 7: "SETE", 8: "OITO", 9: "NOVE", 10: "DEZ",
  11: "ONZE", 12: "DOZE", 13: "TREZE", 14: "QUATORZE", 15: "QUINZE",
  16: "DEZESSEIS", 17: "DEZESSETE", 18: "DEZOITO", 19: "DEZENOVE", 20: "VINTE",
  21: "VINTE E UM", 22: "VINTE E DOIS", 23: "VINTE E TRÊS", 24: "VINTE E QUATRO", 25: "VINTE E CINCO",
  26: "VINTE E SEIS", 27: "VINTE E SETE", 28: "VINTE E OITO", 29: "VINTE E NOVE", 30: "TRINTA",
  31: "TRINTA E UM", 32: "TRINTA E DOIS", 33: "TRINTA E TRÊS", 34: "TRINTA E QUATRO", 35: "TRINTA E CINCO",
  36: "TRINTA E SEIS", 37: "TRINTA E SETE", 38: "TRINTA E OITO", 39: "TRINTA E NOVE", 40: "QUARENTA",
  41: "QUARENTA E UM", 42: "QUARENTA E DOIS", 43: "QUARENTA E TRÊS", 44: "QUARENTA E QUATRO", 45: "QUARENTA E CINCO",
  46: "QUARENTA E SEIS", 47: "QUARENTA E SETE", 48: "QUARENTA E OITO", 49: "QUARENTA E NOVE", 50: "CINQUENTA",
  51: "CINQUENTA E UM", 52: "CINQUENTA E DOIS", 53: "CINQUENTA E TRÊS", 54: "CINQUENTA E QUATRO", 55: "CINQUENTA E CINCO",
  56: "CINQUENTA E SEIS", 57: "CINQUENTA E SETE", 58: "CINQUENTA E OITO", 59: "CINQUENTA E NOVE", 60: "SESSENTA",
  61: "SESSENTA E UM", 62: "SESSENTA E DOIS", 63: "SESSENTA E TRÊS", 64: "SESSENTA E QUATRO", 65: "SESSENTA E CINCO",
  66: "SESSENTA E SEIS", 67: "SESSENTA E SETE", 68: "SESSENTA E OITO", 69: "SESSENTA E NOVE", 70: "SETENTA",
  71: "SETENTA E UM", 72: "SETENTA E DOIS", 73: "SETENTA E TRÊS", 74: "SETENTA E QUATRO", 75: "SETENTA E CINCO",
  76: "SETENTA E SEIS", 77: "SETENTA E SETE", 78: "SETENTA E OITO", 79: "SETENTA E NOVE", 80: "OITENTA",
  81: "OITENTA E UM", 82: "OITENTA E DOIS", 83: "OITENTA E TRÊS", 84: "OITENTA E QUATRO", 85: "OITENTA E CINCO",
  86: "OITENTA E SEIS", 87: "OITENTA E SETE", 88: "OITENTA E OITO", 89: "OITENTA E NOVE", 90: "NOVENTA",
  91: "NOVENTA E UM", 92: "NOVENTA E DOIS", 93: "NOVENTA E TRÊS", 94: "NOVENTA E QUATRO", 95: "NOVENTA E CINCO",
  96: "NOVENTA E SEIS", 97: "NOVENTA E SETE", 98: "NOVENTA E OITO", 99: "NOVENTA E NOVE", 100: "CEM"
};

function construirSeletorNiveis() {
  mimiLevelSelector.innerHTML = '';
  MIMI_LEVELS.forEach(lv => {
    const btn = document.createElement('button');
    btn.className = 'level-option';
    btn.dataset.level = lv.id;
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', 'false');
    btn.innerHTML = `
      <span class="level-title">${lv.label}</span>
      <span class="level-range">Números ${lv.range}</span>
    `;
    btn.addEventListener('click', () => escolherNivelMimi(lv.id));
    mimiLevelSelector.appendChild(btn);
  });
}

function getMimiLevelData(id) {
  return MIMI_LEVELS.find(lv => lv.id === id) || MIMI_LEVELS[0];
}

function mostrarEscolhaNivelMimi() {
  mimiLevelStep.style.display = 'block';
  mimiGameStep.classList.remove('active');
  document.querySelectorAll('.level-option').forEach(btn => {
    btn.classList.remove('selected');
    btn.setAttribute('aria-checked', 'false');
  });
}

function escolherNivelMimi(levelId) {
  mimiCurrentLevel = levelId;

  document.querySelectorAll('.level-option').forEach(btn => {
    const isThis = parseInt(btn.dataset.level) === levelId;
    btn.classList.toggle('selected', isThis);
    btn.setAttribute('aria-checked', isThis ? 'true' : 'false');
  });
  mimiLevelStep.style.display = 'none';
  mimiGameStep.classList.add('active');
  generateMimiGame();
  btnMimiMain.textContent = 'Reiniciar Nível';
  btnMimiMain.onclick = startMimiGame;
}

function voltarEscolherNivelMimi() {
  mostrarEscolhaNivelMimi();
}

function generateMimiGame() {
  const level = getMimiLevelData(mimiCurrentLevel);
  const { start, end, range } = level;
  const pairs = end - start + 1;
  mimiPairsToMatch = pairs;

  mimiLevelDisplay.textContent = `${level.label} (${range})`;
  mimiMatchesCompleted = 0;
  extensoRow.innerHTML = '';
  numeralRow.innerHTML = '';
  mimiSelectedElement = null;
  mimiTypeSelected = null;
  mimiFeedback.textContent = 'Clique no número por extenso e depois no numeral correto.';
  mimiFeedback.className = 'game-feedback';

  const nums = [];
  for (let i = start; i <= end; i++) nums.push(i);

  const shuffledN = [...nums].sort(() => Math.random() - 0.5);
  const shuffledE = [...nums].sort(() => Math.random() - 0.5);

  shuffledE.forEach(n => {
    const btn = document.createElement('button');
    btn.classList.add('match-item', 'extenso-item');
    btn.textContent = NUMBERS_MAP[n];
    btn.dataset.value = n;
    btn.dataset.type = 'extenso';
    btn.addEventListener('click', handleMimiClick);
    extensoRow.appendChild(btn);
  });
  shuffledN.forEach(n => {
    const btn = document.createElement('button');
    btn.classList.add('match-item', 'numeral-item');
    btn.textContent = n;
    btn.dataset.value = n;
    btn.dataset.type = 'numeral';
    btn.addEventListener('click', handleMimiClick);
    numeralRow.appendChild(btn);
  });
}

function startMimiGame() {
  generateMimiGame();
  btnMimiMain.textContent = 'Reiniciar Nível';
  btnMimiMain.onclick = startMimiGame;
}

function resetMimiGame() {
  mimiMatchesCompleted = 0;
  mimiSelectedElement = null;
  mimiTypeSelected = null;
  extensoRow.innerHTML = '';
  numeralRow.innerHTML = '';
  btnMimiMain.textContent = 'Iniciar Nível';
  btnMimiMain.onclick = startMimiGame;
  mimiCurrentLevel = 1;
  mostrarEscolhaNivelMimi();
}

function checkMimiWin() {
  if (mimiMatchesCompleted === mimiPairsToMatch) {
    mimiFeedback.textContent = `🎉 Parabéns! Você completou o ${getMimiLevelData(mimiCurrentLevel).label}!`;
    mimiFeedback.className = 'game-feedback success';

    const levelData = getMimiLevelData(mimiCurrentLevel);
    const nextLevel = MIMI_LEVELS.find(lv => lv.id === mimiCurrentLevel + 1);

    setTimeout(() => {
      mostrarVitoria('mimi', {
        mensagem: `Você completou o ${levelData.label} (${levelData.range})!${nextLevel ? ' Que tal o próximo?' : ''}`,
        restartFn: () => {
          document.getElementById('mimiGameModal').classList.add('active');
          document.body.classList.add('modal-open');
          if (nextLevel) {
            escolherNivelMimi(nextLevel.id);
          } else {
            escolherNivelMimi(mimiCurrentLevel);
          }
        }
      });
    }, 500);
  }
}

function handleMimiClick(event) {
  const el = event.currentTarget;
  if (el.classList.contains('matched')) return;
  const value = parseInt(el.dataset.value);
  const type = el.dataset.type;

  if (!mimiSelectedElement) {
    el.classList.add('selected');
    mimiSelectedElement = el;
    mimiTypeSelected = type;
    mimiFeedback.textContent = `Selecionado: ${el.textContent}. Agora clique no correspondente.`;
    mimiFeedback.className = 'game-feedback your-turn';
    return;
  }
  if (mimiSelectedElement === el) {
    el.classList.remove('selected');
    mimiSelectedElement = null;
    mimiTypeSelected = null;
    mimiFeedback.textContent = 'Seleção cancelada.';
    mimiFeedback.className = 'game-feedback';
    return;
  }
  if (type === mimiTypeSelected) {
    mimiFeedback.textContent = '❌ Escolha um extenso E um numeral.';
    mimiFeedback.className = 'game-feedback error';
    setTimeout(() => {
      mimiFeedback.className = 'game-feedback';
      mimiFeedback.textContent = 'Escolha um item de cada fileira.';
    }, 1500);
    return;
  }

  if (value === parseInt(mimiSelectedElement.dataset.value)) {
    tocarAcerto();
    vibrarAcerto();
    el.classList.add('correct-flash');
    mimiSelectedElement.classList.add('correct-flash');

    setTimeout(() => {
      el.classList.remove('correct-flash');
      if (mimiSelectedElement) mimiSelectedElement.classList.remove('correct-flash');
      el.classList.add('matched');
      if (mimiSelectedElement) mimiSelectedElement.classList.add('matched');
      if (mimiSelectedElement) mimiSelectedElement.classList.remove('selected');
      mimiSelectedElement = null;
      mimiTypeSelected = null;
    }, 400);

    mimiFeedback.textContent = `✅ Acerto! Número ${value} combinado.`;
    mimiFeedback.className = 'game-feedback success';
    mimiMatchesCompleted++;
    checkMimiWin();
  } else {
    tocarErro();
    vibrarErro();
    el.classList.add('error');
    if (mimiSelectedElement) mimiSelectedElement.classList.add('error');
    setTimeout(() => {
      el.classList.remove('error');
      if (mimiSelectedElement) mimiSelectedElement.classList.remove('error');
    }, 600);

    mimiFeedback.textContent = `❌ Erro! ${mimiSelectedElement.textContent} não é ${el.textContent}.`;
    mimiFeedback.className = 'game-feedback error';
    if (mimiSelectedElement) mimiSelectedElement.classList.remove('selected');
    mimiSelectedElement = null;
    mimiTypeSelected = null;
    setTimeout(() => {
      mimiFeedback.className = 'game-feedback';
      mimiFeedback.textContent = `Tente novamente. ${mimiPairsToMatch - mimiMatchesCompleted} pares restantes.`;
    }, 2000);
  }
}

construirSeletorNiveis();

/* ============================================ */
/* TIKO                                         */
/* ============================================ */
const TILE_COUNT = 9;
const GRID_SIZE = 3;
const TIKO_FEEDBACK = document.getElementById('tiko-feedback');
const TIKO_GRID = document.getElementById('tiko-puzzle-grid');
let puzzleState = [];
let isTikoGameRunning = false;

function getTilePosition(index) {
  const row = Math.floor(index / GRID_SIZE);
  const col = index % GRID_SIZE;
  const x = (col / (GRID_SIZE - 1)) * 100;
  const y = (row / (GRID_SIZE - 1)) * 100;
  return `${x}% ${y}%`;
}

function createTikoTile(index, value) {
  const tile = document.createElement('button');
  tile.classList.add('puzzle-tile');
  tile.dataset.value = value;
  tile.dataset.index = index;
  if (value === TILE_COUNT) {
    tile.classList.add('empty');
    tile.setAttribute('aria-label', 'Espaço vazio');
  } else {
    tile.style.backgroundPosition = getTilePosition(value - 1);
    tile.setAttribute('aria-label', `Peça ${value}`);
    tile.addEventListener('click', handleTikoClick);
  }
  return tile;
}

function renderTikoPuzzle() {
  TIKO_GRID.innerHTML = '';
  puzzleState.forEach((value, index) => {
    TIKO_GRID.appendChild(createTikoTile(index, value));
  });
}

function shufflePuzzle(array) {
  let a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  let inv = 0;
  for (let i = 0; i < TILE_COUNT; i++)
    for (let j = i + 1; j < TILE_COUNT; j++)
      if (a[i] !== TILE_COUNT && a[j] !== TILE_COUNT && a[i] > a[j]) inv++;
  if (inv % 2 !== 0) {
    for (let i = 0; i < TILE_COUNT - 1; i++) {
      if (a[i] !== TILE_COUNT && a[i + 1] !== TILE_COUNT) {
        [a[i], a[i + 1]] = [a[i + 1], a[i]];
        break;
      }
    }
  }
  return a;
}

function isSolved(state) {
  for (let i = 0; i < TILE_COUNT; i++) if (state[i] !== i + 1) return false;
  return true;
}

function startTikoGame() {
  const solved = Array.from({ length: TILE_COUNT }, (_, i) => i + 1);
  do { puzzleState = shufflePuzzle(solved); } while (isSolved(puzzleState));
  renderTikoPuzzle();
  isTikoGameRunning = true;
  TIKO_FEEDBACK.textContent = 'Clique nas peças adjacentes ao espaço vazio para movê-las.';
  TIKO_FEEDBACK.className = 'game-feedback your-turn';
  document.querySelector('#tiko-game-controls button').textContent = 'Reiniciar Quebra-cabeça';
}

function resetTikoGame() {
  TIKO_GRID.innerHTML = '';
  puzzleState = [];
  isTikoGameRunning = false;
  TIKO_FEEDBACK.textContent = "Clique em 'Iniciar Quebra-cabeça' para embaralhar as peças.";
  TIKO_FEEDBACK.className = 'game-feedback';
  document.querySelector('#tiko-game-controls button').textContent = 'Iniciar Quebra-cabeça';
}

function getAdjacentIndexes(index) {
  const row = Math.floor(index / GRID_SIZE);
  const col = index % GRID_SIZE;
  const adj = [];
  if (row > 0) adj.push(index - GRID_SIZE);
  if (row < GRID_SIZE - 1) adj.push(index + GRID_SIZE);
  if (col > 0) adj.push(index - 1);
  if (col < GRID_SIZE - 1) adj.push(index + 1);
  return adj;
}

function checkTikoWin() {
  for (let i = 0; i < TILE_COUNT; i++) if (puzzleState[i] !== i + 1) return false;
  return true;
}

function handleTikoClick(event) {
  if (!isTikoGameRunning) return;
  const tile = event.currentTarget;
  const idx = parseInt(tile.dataset.index);
  const emptyIdx = puzzleState.indexOf(TILE_COUNT);
  const adj = getAdjacentIndexes(emptyIdx);

  if (adj.includes(idx)) {
    [puzzleState[idx], puzzleState[emptyIdx]] = [puzzleState[emptyIdx], puzzleState[idx]];
    renderTikoPuzzle();
    tocarAcerto();
    vibrarAcerto();

    if (checkTikoWin()) {
      isTikoGameRunning = false;
      TIKO_FEEDBACK.textContent = '🏆 Missão Completa! Tiko está feliz com a imagem restaurada!';
      TIKO_FEEDBACK.className = 'game-feedback success';
      const finalTile = TIKO_GRID.querySelector(`[data-value="${TILE_COUNT}"]`);
      if (finalTile) {
        finalTile.classList.remove('empty');
        finalTile.style.backgroundImage = "url('tiko_puzzle_image.png')";
        finalTile.style.backgroundSize = '300% 300%';
        finalTile.style.backgroundPosition = getTilePosition(TILE_COUNT - 1);
        TIKO_GRID.querySelectorAll('.puzzle-tile').forEach(t => t.removeEventListener('click', handleTikoClick));
      }

      setTimeout(() => {
        mostrarVitoria('tiko', {
          mensagem: 'Você restaurou a imagem secreta do Tiko!',
          restartFn: () => {
            document.getElementById('tikoGameModal').classList.add('active');
            document.body.classList.add('modal-open');
            resetTikoGame();
            startTikoGame();
          }
        });
      }, 700);
    } else {
      TIKO_FEEDBACK.textContent = 'Movimento realizado. Continue!';
      TIKO_FEEDBACK.className = 'game-feedback';
    }
  } else {
    tocarErro();
    vibrarErro();
    TIKO_FEEDBACK.textContent = '❌ Clique em uma peça adjacente ao espaço vazio.';
    TIKO_FEEDBACK.className = 'game-feedback error';
    setTimeout(() => {
      if (isTikoGameRunning) {
        TIKO_FEEDBACK.textContent = 'Continue a missão!';
        TIKO_FEEDBACK.className = 'game-feedback';
      }
    }, 1500);
  }
}

/* ============================================ */
/* ESTRELAS DE FUNDO                            */
/* ============================================ */
const canvas = document.getElementById('stars');
const ctx = canvas.getContext('2d');
let stars = [];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  stars = Array.from({ length: 90 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.2 + 0.3,
    o: Math.random()
  }));
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function drawStars() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const s of stars) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    const alpha = reduzirMovimento ? 0.85 : 0.7 + 0.3 * Math.sin(Date.now() / 1500 + s.o * 6.28);
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fill();
  }
  requestAnimationFrame(drawStars);
}
drawStars();

/* ============================================ */
/* SERVICE WORKER                               */
/* ============================================ */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}