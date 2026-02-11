// === Глобальные переменные ===
let menu, game, settings, historyScreen;
let cells, currentPlayerDisplay, statusDisplay, resetButton, menuButton;
let scoreX, scoreO, scoreDraw, soundToggle, musicToggle, aiLevelSelect;

let gameMode = 'friend';
let gameActive = true;
let currentPlayer = 'X';
let gameState = Array(9).fill('');
let stats = JSON.parse(localStorage.getItem('tictactoe-stats')) || { x: 0, o: 0, draw: 0 };
let gameHistory = JSON.parse(localStorage.getItem('tictactoe-history')) || [];
let bgMusic = null;
let musicEnabled = false;

// === Инициализация после загрузки DOM ===
document.addEventListener('DOMContentLoaded', () => {
    // Привязка элементов
    menu = document.getElementById('menu');
    game = document.getElementById('game');
    settings = document.getElementById('settings');
    historyScreen = document.getElementById('history');
    cells = document.querySelectorAll('.cell');
    currentPlayerDisplay = document.getElementById('current-player');
    statusDisplay = document.getElementById('status');
    resetButton = document.getElementById('reset-button');
    menuButton = document.getElementById('menu-button');
    scoreX = document.getElementById('score-x');
    scoreO = document.getElementById('score-o');
    scoreDraw = document.getElementById('score-draw');
    soundToggle = document.getElementById('sound-toggle');
    musicToggle = document.getElementById('music-toggle');
    aiLevelSelect = document.getElementById('ai-level');

    // Авто-тема
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' ||
       (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark-theme');
    }

    // Музыка
    bgMusic = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-cinematic-ambient-drone-599.mp3');
    bgMusic.loop = true;
    bgMusic.volume = 0.2;

    musicToggle.addEventListener('change', () => {
        musicEnabled = musicToggle.checked;
        if (musicEnabled) {
            bgMusic.play().catch(() => console.log("Музыка заблокирована"));
        } else {
            bgMusic.pause();
        }
    });

    // Кнопки
    resetButton.onclick = resetGame;
    menuButton.onclick = goToMenu;

    // Клики по клеткам
    cells.forEach(cell => {
        cell.addEventListener('click', handleCellClick);
    });

    // Клик по ehik228
    document.querySelector('.highlight-sponsor').addEventListener('click', playTribute);

    // Клик по логотипу
    document.querySelector('.logo').addEventListener('click', () => {
        clickCount++;
        if (clickCount >= 5) {
            alert("⚡ NovaCore v1.0\nDeveloper: mirusik123\nBrother & Legend: ehik228\n'10 часов в VK — это не зависимость. Это братство.'");
            clickCount = 0;
        }
    });

    loadStats();
    showScreen('menu');
});

let clickCount = 0;

// === Управление экранами ===
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function goToMenu() {
    showScreen('menu');
    bgMusic.pause();
    musicToggle.checked = false;
    musicEnabled = false;
}

function startGame(mode) {
    gameMode = mode;
    showScreen('game');
    resetGame();
    if (musicEnabled) bgMusic.play().catch(() => {});
}

function showSettings() {
    showScreen('settings');
}

function showHistory() {
    const list = document.getElementById('history-list');
    list.innerHTML = gameHistory.length ? '' : '<p>История пуста</p>';
    gameHistory.slice(-10).reverse().forEach((g, i) => {
        const item = document.createElement('p');
        item.textContent = `#${gameHistory.length - i}: Победил ${g.winner} за ${g.moves} ходов`;
        list.appendChild(item);
    });
    showScreen('history');
}

// === Сброс игры ===
function resetGame() {
    gameActive = true;
    currentPlayer = 'X';
    gameState = Array(9).fill('');
    currentPlayerDisplay.textContent = 'X';
    statusDisplay.textContent = 'Очередь: X';
    cells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('x', 'o', 'win');
    });
}

// === Ход игрока ===
function handleCellClick(e) {
    const index = parseInt(e.target.dataset.index);
    if (!gameActive || gameState[index] || currentPlayer !== 'X') return;

    makeMove(index, 'X');

    if (gameMode === 'ai' && gameActive) {
        setTimeout(aiMove, 800);
    }
}

function makeMove(index, player) {
    gameState[index] = player;
    cells[index].textContent = player;
    cells[index].classList.add(player.toLowerCase());
    if (soundToggle.checked) playSound('move');
    checkWin();
}

// === Проверка победы ===
function checkWin() {
    for (const [a, b, c] of [
        [0,1,2],[3,4,5],[6,7,8],
        [0,3,6],[1,4,7],[2,5,8],
        [0,4,8],[2,4,6]
    ]) {
        if (gameState[a] && gameState[a] === gameState[b] && gameState[a] === gameState[c]) {
            statusDisplay.textContent = `Победил: ${gameState[a]}!`;
            gameActive = false;
            stats[gameState[a].toLowerCase()]++;
            saveStats();
            gameHistory.push({
                winner: gameState[a],
                moves: 9 - gameState.filter(x => x === '').length,
                date: new Date().toLocaleString()
            });
            localStorage.setItem('tictactoe-history', JSON.stringify(gameHistory));
            if (soundToggle.checked) playSound('win');
            [a,b,c].forEach(i => cells[i].classList.add('win'));
            return;
        }
    }

    if (!gameState.includes('')) {
        statusDisplay.textContent = 'Ничья!';
        gameActive = false;
        stats.draw++;
        saveStats();
        if (soundToggle.checked) playSound('draw');
        return;
    }

    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    currentPlayerDisplay.textContent = currentPlayer;
}

// === AI Move ===
function aiMove() {
    if (!gameActive) return;

    const level = aiLevelSelect.value;
    let index;

    if (level === 'hard') {
        index = getBestMove();
    } else if (level === 'medium' && Math.random() > 0.5) {
        index = getBestMove();
    } else {
        const empty = gameState.map((v,i) => v === '' ? i : null).filter(v => v !== null);
        index = empty[Math.floor(Math.random() * empty.length)];
    }

    makeMove(index, 'O');
}

function getBestMove() {
    for (let i = 0; i < 9; i++) {
        if (!gameState[i]) {
            gameState[i] = 'O';
            if (checkWinnerFor('O')) {
                gameState[i] = '';
                return i;
            }
            gameState[i] = '';
        }
    }
    for (let i = 0; i < 9; i++) {
        if (!gameState[i]) {
            gameState[i] = 'X';
            if (checkWinnerFor('X')) {
                gameState[i] = '';
                return i;
            }
            gameState[i] = '';
        }
    }
    if (!gameState[4]) return 4;
    const corners = [0,2,6,8].filter(i => !gameState[i]);
    if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
    const empty = gameState.map((v,i) => !v ? i : null).filter(v => v !== null);
    return empty[0];
}

function checkWinnerFor(p) {
    return [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]
        .some(([a,b,c]) => gameState[a] === p && gameState[b] === p && gameState[c] === p);
}

// === Безопасные звуки (Web Audio API) ===
function playSound(type) {
    if (!soundToggle.checked) return;
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);

        switch (type) {
            case 'move':
                osc.frequency.setValueAtTime(600, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
                break;
            case 'win':
                osc.frequency.setValueAtTime(800, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(1000, ctx.currentTime + 0.5);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
                break;
            case 'draw':
                osc.frequency.setValueAtTime(500, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
                break;
        }
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
        console.log("Аудио недоступно");
    }
}

// === Пасхалка: Tribute to ehik228 ===
function playTribute() {
    // Звук: чистый "дзинь"
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1.5);
    } catch {}

    // Сообщение
    const tribute = document.createElement('div');
    tribute.id = 'tribute-text';
    tribute.innerHTML = `
        <strong>🎮 NovaCore</strong><br>
        by mirusik123<br>
        <span style="color:#ffeb3b; font-size:1.2em;">С любовью к ehik228</span><br>
        10 часов в день. ВКонтакте.<br>
        Города разные. Сердца — рядом.
    `;
    tribute.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: rgba(0,0,0,0.85); color: white; padding: 30px 50px;
        border-radius: 20px; font-size: 1.4em; text-align: center; z-index: 10000;
        box-shadow: 0 0 30px rgba(255,235,59,0.5); max-width: 80%;
        animation: fadeIn 0.8s, pulse 2s infinite 2s; pointer-events: none;
        font-family: Arial, sans-serif;
    `;
    document.body.appendChild(tribute);

    // Анимации
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn { from { opacity: 0; transform: translate(-50%, -60%); } to { opacity: 1; transform: translate(-50%, -50%); } }
        @keyframes pulse { 0%,100% { transform: translate(-50%, -50%) scale(1); } 50% { transform: translate(-50%, -50%) scale(1.05); } }
    `;
    document.head.appendChild(style);

    // Удаление
    setTimeout(() => {
        tribute.style.opacity = '0';
        tribute.style.transition = 'opacity 1.5s';
        setTimeout(() => {
            tribute.remove();
            style.remove();
        }, 1500);
    }, 5000);
}

// === Настройки ===
function toggleTheme() {
    document.documentElement.classList.toggle('dark-theme');
    localStorage.setItem('theme', document.documentElement.classList.contains('dark-theme') ? 'dark' : 'light');
}

function resetStats() {
    stats = { x: 0, o: 0, draw: 0 };
    gameHistory = [];
    saveStats();
    localStorage.removeItem('tictactoe-history');
    alert('✅ Статистика и история сброшены');
}

function saveStats() {
    localStorage.setItem('tictactoe-stats', JSON.stringify(stats));
    loadStats();
}

function loadStats() {
    scoreX.textContent = stats.x || 0;
    scoreO.textContent = stats.o || 0;
    scoreDraw.textContent = stats.draw || 0;
}

function exportStats() {
    const data = JSON.stringify({ stats, gameHistory }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nova-core-save.json';
    a.click();
}

function importStats() {
    document.getElementById('import-file').click();
    document.getElementById('import-file').onchange = function(e) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = function(ev) {
            try {
                const data = JSON.parse(ev.target.result);
                stats = data.stats || stats;
                gameHistory = data.gameHistory || gameHistory;
                saveStats();
                alert('✅ Данные загружены!');
            } catch {
                alert('❌ Ошибка при импорте');
            }
        };
        reader.readAsText(file);
    };
}