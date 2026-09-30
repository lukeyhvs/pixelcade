const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const currentScoreEl = document.getElementById('current-score');
const highScoreEl = document.getElementById('high-score');
const overlay = document.getElementById('game-over-overlay');
const restartBtn = document.getElementById('restart-btn');
const hintText = document.getElementById('hint-text');
const gameBtns = document.querySelectorAll('.game-btn');

let activeGame = 'snake';
let gameLoop = null;
let isGameOver = false;
let score = 0;

// High Score Manager
function getHighScore(game) {
  return localStorage.getItem(`pixelcade_${game}_highscore`) || 0;
}

function updateHighScore() {
  const currentHigh = getHighScore(activeGame);
  if (score > currentHigh) {
    localStorage.setItem(`pixelcade_${activeGame}_highscore`, score);
    highScoreEl.textContent = score;
  }
}

// -------------------------------------------------------------
// 🐍 SNAKE GAME ENGINE
// -------------------------------------------------------------
const gridSize = 20;
const tileCount = canvas.width / gridSize;
let snake = [];
let food = { x: 0, y: 0 };
let dx = gridSize;
let dy = 0;

function initSnake() {
  snake = [
    { x: 160, y: 200 },
    { x: 140, y: 200 },
    { x: 120, y: 200 }
  ];
  dx = gridSize;
  dy = 0;
  spawnFood();
}

function spawnFood() {
  food.x = Math.floor(Math.random() * tileCount) * gridSize;
  food.y = Math.floor(Math.random() * tileCount) * gridSize;
}

function updateSnake() {
  if (isGameOver) return;

  const head = { x: snake[0].x + dx, y: snake[0].y + dy };

  // Wall Collisions
  if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height) {
    return triggerGameOver();
  }

  // Self Collision
  for (let segment of snake) {
    if (head.x === segment.x && head.y === segment.y) {
      return triggerGameOver();
    }
  }

  snake.unshift(head);

  // Eat Food
  if (head.x === food.x && head.y === food.y) {
    score += 10;
    currentScoreEl.textContent = score;
    updateHighScore();
    spawnFood();
  } else {
    snake.pop();
  }
}

function drawSnake() {
  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw Food
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(food.x + gridSize / 2, food.y + gridSize / 2, gridSize / 2 - 2, 0, Math.PI * 2);
  ctx.fill();

  // Draw Snake
  snake.forEach((part, index) => {
    ctx.fillStyle = index === 0 ? '#22c55e' : '#4ade80';
    ctx.fillRect(part.x, part.y, gridSize - 1, gridSize - 1);
  });
}

// -------------------------------------------------------------
// 🐤 FLAPPY BIRD ENGINE
// -------------------------------------------------------------
let bird = { x: 50, y: 200, velocity: 0, gravity: 0.35, jump: -6.5, radius: 12 };
let pipes = [];
let pipeFrame = 0;

function initFlappy() {
  bird.y = 200;
  bird.velocity = 0;
  pipes = [];
  pipeFrame = 0;
}

function updateFlappy() {
  if (isGameOver) return;

  bird.velocity += bird.gravity;
  bird.y += bird.velocity;

  // Floor / Ceiling Collision
  if (bird.y + bird.radius >= canvas.height || bird.y - bird.radius <= 0) {
    return triggerGameOver();
  }

  // Spawn Pipes
  pipeFrame++;
  if (pipeFrame % 90 === 0) {
    const gap = 120;
    const topHeight = Math.floor(Math.random() * (canvas.height - gap - 80)) + 40;
    pipes.push({ x: canvas.width, top: topHeight, bottom: topHeight + gap, passed: false });
  }

  // Move & Collision Check
  pipes.forEach(p => {
    p.x -= 2;

    if (
      bird.x + bird.radius > p.x &&
      bird.x - bird.radius < p.x + 40 &&
      (bird.y - bird.radius < p.top || bird.y + bird.radius > p.bottom)
    ) {
      triggerGameOver();
    }

    if (!p.passed && p.x + 40 < bird.x) {
      p.passed = true;
      score += 1;
      currentScoreEl.textContent = score;
      updateHighScore();
    }
  });

  pipes = pipes.filter(p => p.x > -50);
}

function drawFlappy() {
  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw Pipes
  ctx.fillStyle = '#6366f1';
  pipes.forEach(p => {
    ctx.fillRect(p.x, 0, 40, p.top);
    ctx.fillRect(p.x, p.bottom, 40, canvas.height - p.bottom);
  });

  // Draw Bird
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(bird.x, bird.y, bird.radius, 0, Math.PI * 2);
  ctx.fill();
}

// -------------------------------------------------------------
// CORE ENGINE CONTROLLER
// -------------------------------------------------------------
function gameLoopStep() {
  if (activeGame === 'snake') {
    updateSnake();
    drawSnake();
  } else {
    updateFlappy();
    drawFlappy();
  }
}

function startGame() {
  clearInterval(gameLoop);
  score = 0;
  isGameOver = false;
  currentScoreEl.textContent = 0;
  highScoreEl.textContent = getHighScore(activeGame);
  overlay.classList.add('hidden');

  if (activeGame === 'snake') {
    initSnake();
    hintText.innerHTML = 'Use <strong>Arrow Keys</strong> or <strong>WASD</strong> to navigate.';
    gameLoop = setInterval(gameLoopStep, 100);
  } else {
    initFlappy();
    hintText.innerHTML = 'Press <strong>Spacebar</strong> or <strong>Tap Screen</strong> to flap.';
    gameLoop = setInterval(gameLoopStep, 1000 / 60);
  }
}

function triggerGameOver() {
  isGameOver = true;
  clearInterval(gameLoop);
  overlay.classList.remove('hidden');
}

// Input Controllers
window.addEventListener('keydown', (e) => {
  if (isGameOver && e.code === 'Space') {
    return startGame();
  }

  if (activeGame === 'snake') {
    if ((e.key === 'ArrowUp' || e.key === 'w') && dy === 0) { dx = 0; dy = -gridSize; }
    if ((e.key === 'ArrowDown' || e.key === 's') && dy === 0) { dx = 0; dy = gridSize; }
    if ((e.key === 'ArrowLeft' || e.key === 'a') && dx === 0) { dx = -gridSize; dy = 0; }
    if ((e.key === 'ArrowRight' || e.key === 'd') && dx === 0) { dx = gridSize; dy = 0; }
  } else if (activeGame === 'flappy') {
    if (e.code === 'Space' || e.key === 'ArrowUp') {
      bird.velocity = bird.jump;
    }
  }
});

canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  if (isGameOver) return startGame();
  if (activeGame === 'flappy') bird.velocity = bird.jump;
});

gameBtns.forEach(btn => {
  btn.addEventListener('click', (e) => {
    gameBtns.forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    activeGame = e.target.dataset.game;
    startGame();
  });
});

restartBtn.addEventListener('click', startGame);

// Start on load
startGame();
