/* ===== Hexagon Puzzle — Game =====
   Place hex-shaped pieces onto hexagonal board, fill lines to clear
   Drag hex pieces from tray, fill full rows, score tracking, multiple levels
*/
(function() {
  'use strict';

  const BOARD_TIERS = 3; // default, increased with upgrades
  const HEX_SIZE = 24;
  const BOARD_COLS = 3; // columns of hex grid

  let canvas, ctx;
  let board = {}; // { "r,c": { color, tier } }
  let pieces = []; // pieces in tray
  let selectedPiece = null;
  let selectedHex = null;
  let score = 0;
  let placedCount = 0;
  let rowsCleared = 0;
  let currentCombo = 0;
  let bestCombo = 0;
  let gameOver = false;
  let animFrame = null;
  let gameRunning = false;
  let dragOffset = { x: 0, y: 0 };
  let isDragging = false;
  let hexColors = ['#ff6b6b', '#48dbfb', '#ff9ff3', '#54a0ff', '#ffd700', '#00ff88', '#ff8c00', '#a29bfe'];

  let BOARD_ROWS = 10;
  let boardWidth, boardHeight, cellW, cellH;

  function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    resize();

    ProgressionSystem.load();

    // Initialize framework modules
    AdsManager.init();
    ChallengesSystem.init();
    StoreRotator.init();
    RetentionSystem.init();
    CollectiblesSystem.init();
    TutorialSystem.init({ gameTitle: 'Hexagon Puzzle' });
    if (TutorialSystem.shouldShow()) {
      setTimeout(() => TutorialSystem.start(), 500);
    }

    RetentionSystem.onGameStart();

    const bonuses = ProgressionSystem.getActiveBonuses();
    BOARD_ROWS = 10 + bonuses.bonusCells * 2;

    score = 0;
    placedCount = 0;
    rowsCleared = 0;
    currentCombo = 0;
    bestCombo = 0;
    gameOver = false;
    board = {};
    pieces = [];
    selectedPiece = null;

    generatePieces(3);
    render();

    document.getElementById('newGame').addEventListener('click', restartGame);
    document.getElementById('levelInfo').textContent = `${BOARD_ROWS} rows`;

    setupInput();
    updateUI();
    gameRunning = true;
  }

  function resize() {
    const maxW = Math.min(window.innerWidth - 16, 480);
    const maxH = Math.min(window.innerHeight - 300, 500);
    const size = Math.min(maxW, maxH + 100);
    canvas.style.width = size + 'px';
    canvas.style.height = (size * 0.75) + 'px';
    canvas.width = size;
    canvas.height = size * 0.75;
    cellW = canvas.width / (BOARD_COLS * 2 + 2);
    cellH = canvas.height / (BOARD_ROWS + 3);
  }

  // Hex piece shapes (relative coordinates)
  const PIECE_SHAPES = [
    // Single
    { cells: [[0,0]], name: 'Mono' },
    // Double vertical
    { cells: [[0,0], [0,1]], name: 'Duo' },
    // L-shape
    { cells: [[0,0], [0,1], [1,0]], name: 'L' },
    // Straight triple
    { cells: [[0,0], [0,1], [0,2]], name: 'Triple' },
    // T-shape
    { cells: [[0,0], [0,1], [0,2], [1,1]], name: 'T' },
    // Square-ish (2x2)
    { cells: [[0,0], [0,1], [1,0], [1,1]], name: 'Square' },
    // Zigzag
    { cells: [[0,0], [0,1], [1,1], [1,2]], name: 'Zigzag' },
    // Big L
    { cells: [[0,0], [0,1], [0,2], [1,2]], name: 'Big L' },
    // Plus
    { cells: [[0,0], [0,1], [0,2], [1,1], [2,1]], name: 'Plus' },
    // Line of 4
    { cells: [[0,0], [0,1], [0,2], [0,3]], name: 'Line' },
    // Full block (3x3 minus corners)
    { cells: [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2],[2,0],[2,1],[2,2]], name: 'Block' },
  ];

  function generatePieces(count) {
    pieces = [];
    const shapePool = PIECE_SHAPES.filter(s => {
      // Filter shapes that work for current board size
      return true;
    });

    for (let i = 0; i < count; i++) {
      const shape = shapePool[Math.floor(Math.random() * shapePool.length)];
      const color = hexColors[Math.floor(Math.random() * hexColors.length)];
      pieces.push({
        shape: shape.cells,
        name: shape.name,
        color: color,
        placed: false,
      });
    }
  }

  // Convert hex grid position to pixel coordinates
  function hexToPixel(r, c) {
    const x = cellW * 1.5 + c * cellW * 1.8;
    const y = cellH * 0.8 + r * cellH * 0.75 + (c % 2 === 1 ? cellH * 0.375 : 0);
    return { x, y };
  }

  // Convert pixel to nearest hex
  function pixelToHex(px, py) {
    let bestR = -1, bestC = -1, bestDist = Infinity;
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const pos = hexToPixel(r, c);
        const dx = px - pos.x;
        const dy = py - pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < bestDist && dist < cellH * 0.6) {
          bestDist = dist;
          bestR = r;
          bestC = c;
        }
      }
    }
    if (bestR >= 0) return { r: bestR, c: bestC };
    return null;
  }

  function canPlace(piece, startR, startC) {
    const cells = piece.shape;
    for (const [dc, dr] of cells) {
      const r = startR + dr;
      const c = startC + dc;
      if (r < 0 || r >= BOARD_ROWS || c < 0 || c >= BOARD_COLS) return false;
      if (board[`${r},${c}`]) return false;
    }
    return true;
  }

  function placePiece(piece, startR, startC) {
    const cells = piece.shape;
    const color = piece.color;
    for (const [dc, dr] of cells) {
      const r = startR + dr;
      const c = startC + dc;
      board[`${r},${c}`] = { color, tier: 1 };
    }
    piece.placed = true;
    placedCount++;
    updateUI();
    checkRowClears();
    if (pieces.every(p => p.placed)) {
      generatePieces(3);
    }
    render();
  }

  function checkRowClears() {
    const clearedRows = [];
    for (let r = 0; r < BOARD_ROWS; r++) {
      let full = true;
      for (let c = 0; c < BOARD_COLS; c++) {
        if (!board[`${r},${c}`]) { full = false; break; }
      }
      if (full) clearedRows.push(r);
    }

    if (clearedRows.length > 0) {
      const bonuses = ProgressionSystem.getActiveBonuses();
      const mult = bonuses.scoreMult;
      const combo = bonuses.comboBonus;
      const chain = bonuses.chainMult;

      currentCombo++;
      if (currentCombo > bestCombo) bestCombo = currentCombo;

      const points = clearedRows.length * 50 * mult * chain + combo * clearedRows.length;
      score += Math.floor(points);
      rowsCleared += clearedRows.length;

      // Remove rows
      for (const r of clearedRows) {
        for (let c = 0; c < BOARD_COLS; c++) {
          delete board[`${r},${c}`];
        }
      }

      // Drop pieces above cleared rows
      for (let r = BOARD_ROWS - 1; r >= 0; r--) {
        for (let c = 0; c < BOARD_COLS; c++) {
          if (board[`${r},${c}`]) {
            // Find lowest empty spot below
            let dropTo = r;
            while (dropTo < BOARD_ROWS - 1 && !board[`${dropTo + 1},${c}`]) dropTo++;
            if (dropTo !== r) {
              board[`${dropTo},${c}`] = board[`${r},${c}`];
              delete board[`${r},${c}`];
            }
          }
        }
      }

      showNotification(`+${Math.floor(points)} pts! ${clearedRows.length} rows cleared! 🔥`);
    } else {
      currentCombo = 0;
    }

    // Check game over
    checkGameOver();
    updateUI();
  }

  function checkGameOver() {
    // Check if any piece can be placed
    for (const piece of pieces) {
      if (piece.placed) continue;
      for (let r = 0; r < BOARD_ROWS; r++) {
        for (let c = 0; c < BOARD_COLS; c++) {
          if (canPlace(piece, r, c)) return;
        }
      }
    }

    // If no piece can be placed and pieces remain unplaced
    if (pieces.some(p => !p.placed)) {
      gameOver = true;
      endGame();
    }
  }

  function endGame() {
    const result = { score, placed: placedCount, rows: rowsCleared, combo: bestCombo };
    ProgressionSystem.endOfGame(result);
    ProgressionSystem.checkAchievements();

    // Framework game-over hooks
    RetentionSystem.onGameEnd(result.score || 0);
    RetentionSystem.submitScore('Player', result.score || 0);
    ChallengesSystem.reportProgress('games', 1);
    ChallengesSystem.reportProgress('score', result.score || 0);
    ChallengesSystem.reportProgress('lines', result.rows || 0);
    CollectiblesSystem.incrementTracker('totalGames');
    if (result.score > 0) CollectiblesSystem.incrementTracker('wins');
    CollectiblesSystem.setTracker('highestScore', result.score || 0);
    CollectiblesSystem.incrementTracker('perfectGames', result.combo >= 1 ? 1 : 0);
    AdsManager.tryShowInterstitial();

    document.getElementById('gameOverScreen').style.display = 'flex';
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalRows').textContent = rowsCleared;
    document.getElementById('finalPieces').textContent = placedCount;
  }

  function restartGame() {
    document.getElementById('gameOverScreen').style.display = 'none';
    RetentionSystem.onGameStart();
    const bonuses = ProgressionSystem.getActiveBonuses();
    BOARD_ROWS = 10 + bonuses.bonusCells * 2;
    score = 0; placedCount = 0; rowsCleared = 0;
    currentCombo = 0; bestCombo = 0; gameOver = false;
    board = {}; pieces = []; selectedPiece = null;
    generatePieces(3);
    document.getElementById('levelInfo').textContent = `${BOARD_ROWS} rows`;
    render();
    updateUI();
  }

  // ─── Input ────────────────────────────────────────
  function setupInput() {
    canvas.addEventListener('mousedown', (e) => {
      if (gameOver) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      // Check tray area (bottom)
      const trayY = canvas.height - cellH * 2.5;
      if (my > trayY) {
        // Check which piece
        for (let i = 0; i < pieces.length; i++) {
          if (pieces[i].placed) continue;
          const px = 30 + i * 70;
          const py = trayY + 20;
          if (mx >= px && mx <= px + 60 && my >= py && my <= py + 60) {
            selectedPiece = { piece: pieces[i], index: i };
            isDragging = true;
            dragOffset.x = mx - px;
            dragOffset.y = my - py;
            selectedHex = null;
            return;
          }
        }
      }

      // Check board
      const hex = pixelToHex(mx, my);
      if (hex) {
        // If there's a selected piece, try to place
        if (selectedPiece && !selectedPiece.piece.placed) {
          if (canPlace(selectedPiece.piece, hex.r, hex.c)) {
            placePiece(selectedPiece.piece, hex.r, hex.c);
            selectedPiece = null;
          }
        }
      }
      render();
    });

    canvas.addEventListener('mousemove', (e) => {
      if (!isDragging || !selectedPiece) return;
      // Show placement preview
      render();

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      const hex = pixelToHex(mx, my);
      selectedHex = hex;
      if (hex && canPlace(selectedPiece.piece, hex.r, hex.c)) {
        // Draw preview
        drawPieceAt(selectedPiece.piece, hex.r, hex.c, 0.4);
      }
    });

    canvas.addEventListener('mouseup', (e) => {
      if (isDragging && selectedPiece) {
        isDragging = false;
      }
    });

    // Touch support
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const mx = (t.clientX - rect.left) * scaleX;
      const my = (t.clientY - rect.top) * scaleY;

      const trayY = canvas.height - cellH * 2.5;
      if (my > trayY) {
        for (let i = 0; i < pieces.length; i++) {
          if (pieces[i].placed) continue;
          const px = 30 + i * 70;
          const py = trayY + 20;
          if (mx >= px && mx <= px + 60 && my >= py && my <= py + 60) {
            selectedPiece = { piece: pieces[i], index: i };
            isDragging = true;
            dragOffset.x = mx - px;
            dragOffset.y = my - py;
            return;
          }
        }
      }
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      if (!isDragging || !selectedPiece) { isDragging = false; return; }
      isDragging = false;
      const t = e.changedTouches[0];
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const mx = (t.clientX - rect.left) * scaleX;
      const my = (t.clientY - rect.top) * scaleY;

      const hex = pixelToHex(mx, my);
      if (hex && canPlace(selectedPiece.piece, hex.r, hex.c)) {
        placePiece(selectedPiece.piece, hex.r, hex.c);
      }
      selectedPiece = null;
      render();
    }, { passive: false });
  }

  // ─── Drawing ──────────────────────────────────────
  function drawHex(ctx, cx, cy, size, color, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = Math.PI / 3 * i - Math.PI / 6;
      const x = cx + size * Math.cos(angle);
      const y = cy + size * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  function drawPieceAt(piece, startR, startC, alpha) {
    const cells = piece.shape;
    for (const [dc, dr] of cells) {
      const r = startR + dr;
      const c = startC + dc;
      const pos = hexToPixel(r, c);
      drawHex(ctx, pos.x, pos.y, HEX_SIZE * 0.8, piece.color, alpha);
    }
  }

  function render() {
    const w = canvas.width;
    const h = canvas.height;

    // Background
    ctx.fillStyle = '#0f1020';
    ctx.fillRect(0, 0, w, h);

    // Draw board hexes
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const pos = hexToPixel(r, c);
        const key = `${r},${c}`;
        if (board[key]) {
          drawHex(ctx, pos.x, pos.y, HEX_SIZE * 0.8, board[key].color, 1);
        } else {
          // Empty cell
          ctx.fillStyle = 'rgba(255,255,255,0.03)';
          drawHex(ctx, pos.x, pos.y, HEX_SIZE * 0.8, 'rgba(255,255,255,0.03)', 1);
        }
      }
    }

    // Preview for drag
    if (selectedHex && selectedPiece && canPlace(selectedPiece.piece, selectedHex.r, selectedHex.c)) {
      drawPieceAt(selectedPiece.piece, selectedHex.r, selectedHex.c, 0.4);
    }

    // Tray area
    const trayY = h - cellH * 2.5;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, trayY, w, cellH * 2.5);
    ctx.fillStyle = '#333';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Drag pieces to board', w / 2, trayY + 14);

    // Draw tray pieces
    for (let i = 0; i < pieces.length; i++) {
      if (pieces[i].placed) continue;
      const px = 30 + i * 70;
      const py = trayY + 30;
      const cells = pieces[i].shape;
      for (const [dc, dr] of cells) {
        const x = px + dc * 20;
        const y = py + dr * 20;
        drawHex(ctx, x, y, 10, pieces[i].color, isDragging && selectedPiece?.index === i ? 0.3 : 0.8);
      }
      ctx.fillStyle = '#888';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(pieces[i].name, px + 25, py + 55);
    }

    // Score overlay
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(`✦ ${score}`, w - 10, 10);
  }

  function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('rowsCleared').textContent = rowsCleared;
    document.getElementById('piecesPlaced').textContent = placedCount;
  }

  function showNotification(msg) {
    const el = document.getElementById('notification') || (() => { const n=document.createElement('div'); n.id='notification'; document.body.appendChild(n); return n; })();
    el.textContent = msg;
    el.className = 'show';
    clearTimeout(el._timeout);
    el._timeout = setTimeout(()=>el.className='',2500);
  }

  // ─── Public API ─────────────────────────────────────
  window.HexPuzzle = { init, restartGame };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
