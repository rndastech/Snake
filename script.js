document.addEventListener('DOMContentLoaded', () => {
    // Game canvas and context
    const canvas = document.getElementById('game-board');
    const ctx = canvas.getContext('2d');
    
    // Game elements
    const GRID_SIZE = 20;
    const GAME_SPEED_INITIAL = 150; // ms
    const LEVEL_THRESHOLD = 5; // Points needed to level up
    
    // Game state
    let snake = [];
    let food = {};
    let direction = '';
    let nextDirection = '';
    let gameInterval;
    let score = 0;
    let highScore = localStorage.getItem('snakeHighScore') || 0;
    let gameActive = false;
    let isPaused = false;
    let level = 1;
    let gameSpeed = GAME_SPEED_INITIAL;
    
    // Set canvas size based on viewport
    function setCanvasSize() {
        const maxSize = Math.min(window.innerWidth - 40, window.innerHeight - 200);
        const gridCount = Math.floor(maxSize / GRID_SIZE);
        
        canvas.width = gridCount * GRID_SIZE;
        canvas.height = gridCount * GRID_SIZE;
    }
    
    // Initialize game
    function initGame() {
        setCanvasSize();
        updateScoreDisplay();
        document.getElementById('high-score').textContent = highScore;
        document.getElementById('level').textContent = level;
        
        // Initial snake position (center of canvas)
        const centerX = Math.floor(canvas.width / GRID_SIZE / 2);
        const centerY = Math.floor(canvas.height / GRID_SIZE / 2);
        snake = [
            { x: centerX, y: centerY },
            { x: centerX - 1, y: centerY },
            { x: centerX - 2, y: centerY }
        ];
        
        direction = 'right';
        nextDirection = 'right';
        score = 0;
        level = 1;
        gameSpeed = GAME_SPEED_INITIAL;
        updateScoreDisplay();
        document.getElementById('level').textContent = level;
        
        generateFood();
        draw();
    }
    
    // Generate food at random position
    function generateFood() {
        const maxX = Math.floor(canvas.width / GRID_SIZE);
        const maxY = Math.floor(canvas.height / GRID_SIZE);
        
        // Generate random position
        let newFood;
        let onSnake;
        
        do {
            newFood = {
                x: Math.floor(Math.random() * maxX),
                y: Math.floor(Math.random() * maxY)
            };
            
            // Check if food is on snake
            onSnake = snake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
        } while (onSnake);
        
        food = newFood;
    }
    
    // Draw game elements
    function draw() {
        // Clear canvas
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw snake
        snake.forEach((segment, index) => {
            // Head has different color
            if (index === 0) {
                ctx.fillStyle = '#7CFC00'; // Light green for head
            } else {
                ctx.fillStyle = '#4CAF50'; // Regular green for body
            }
            
            ctx.fillRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
            
            // Add eye details to the head
            if (index === 0) {
                ctx.fillStyle = '#000';
                
                // Position eyes based on direction
                let eyePositionX1, eyePositionY1, eyePositionX2, eyePositionY2;
                
                switch(direction) {
                    case 'up':
                        eyePositionX1 = segment.x * GRID_SIZE + GRID_SIZE * 0.25;
                        eyePositionY1 = segment.y * GRID_SIZE + GRID_SIZE * 0.25;
                        eyePositionX2 = segment.x * GRID_SIZE + GRID_SIZE * 0.75;
                        eyePositionY2 = segment.y * GRID_SIZE + GRID_SIZE * 0.25;
                        break;
                    case 'down':
                        eyePositionX1 = segment.x * GRID_SIZE + GRID_SIZE * 0.25;
                        eyePositionY1 = segment.y * GRID_SIZE + GRID_SIZE * 0.75;
                        eyePositionX2 = segment.x * GRID_SIZE + GRID_SIZE * 0.75;
                        eyePositionY2 = segment.y * GRID_SIZE + GRID_SIZE * 0.75;
                        break;
                    case 'left':
                        eyePositionX1 = segment.x * GRID_SIZE + GRID_SIZE * 0.25;
                        eyePositionY1 = segment.y * GRID_SIZE + GRID_SIZE * 0.25;
                        eyePositionX2 = segment.x * GRID_SIZE + GRID_SIZE * 0.25;
                        eyePositionY2 = segment.y * GRID_SIZE + GRID_SIZE * 0.75;
                        break;
                    case 'right':
                        eyePositionX1 = segment.x * GRID_SIZE + GRID_SIZE * 0.75;
                        eyePositionY1 = segment.y * GRID_SIZE + GRID_SIZE * 0.25;
                        eyePositionX2 = segment.x * GRID_SIZE + GRID_SIZE * 0.75;
                        eyePositionY2 = segment.y * GRID_SIZE + GRID_SIZE * 0.75;
                        break;
                }
                
                // Draw eyes
                ctx.beginPath();
                ctx.arc(eyePositionX1, eyePositionY1, GRID_SIZE * 0.1, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(eyePositionX2, eyePositionY2, GRID_SIZE * 0.1, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Add inner detail to body segments
            if (index > 0) {
                ctx.fillStyle = '#6EC071';
                ctx.fillRect(
                    segment.x * GRID_SIZE + GRID_SIZE * 0.25, 
                    segment.y * GRID_SIZE + GRID_SIZE * 0.25, 
                    GRID_SIZE * 0.5, 
                    GRID_SIZE * 0.5
                );
            }
        });
        
        // Draw food
        ctx.fillStyle = '#FF4500';
        ctx.beginPath();
        ctx.arc(
            food.x * GRID_SIZE + GRID_SIZE / 2,
            food.y * GRID_SIZE + GRID_SIZE / 2,
            GRID_SIZE / 2,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // Add shine to food
        ctx.fillStyle = '#FFA07A';
        ctx.beginPath();
        ctx.arc(
            food.x * GRID_SIZE + GRID_SIZE * 0.3,
            food.y * GRID_SIZE + GRID_SIZE * 0.3,
            GRID_SIZE * 0.15,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // Draw grid (optional - for better visibility)
        if (GRID_SIZE > 15) {  // Only draw grid if cells are big enough
            ctx.strokeStyle = '#111';
            ctx.lineWidth = 0.5;
            
            for (let x = 0; x < canvas.width; x += GRID_SIZE) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
                ctx.stroke();
            }
            
            for (let y = 0; y < canvas.height; y += GRID_SIZE) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }
        }
        
        // Draw pause indicator if game is paused
        if (isPaused) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#FFF';
            ctx.font = '20px "Press Start 2P"';
            ctx.textAlign = 'center';
            ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
        }
    }
    
    // Update game state
    function update() {
        if (!gameActive || isPaused) return;
        
        // Update direction from nextDirection
        direction = nextDirection;
        
        // Calculate new head position based on current direction
        const head = { ...snake[0] };
        switch (direction) {
            case 'up':
                head.y -= 1;
                break;
            case 'down':
                head.y += 1;
                break;
            case 'left':
                head.x -= 1;
                break;
            case 'right':
                head.x += 1;
                break;
        }
        
        // Check for collision with walls
        const maxX = Math.floor(canvas.width / GRID_SIZE);
        const maxY = Math.floor(canvas.height / GRID_SIZE);
        
        if (head.x < 0 || head.x >= maxX || head.y < 0 || head.y >= maxY) {
            gameOver();
            return;
        }
        
        // Check for collision with self
        if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            gameOver();
            return;
        }
        
        // Add new head to the snake
        snake.unshift(head);
        
        // Check if food is eaten
        if (head.x === food.x && head.y === food.y) {
            // Increase score
            score++;
            updateScoreDisplay();
            
            // Check if level up is needed
            if (score % LEVEL_THRESHOLD === 0) {
                levelUp();
            }
            
            // Generate new food
            generateFood();
        } else {
            // Remove tail if no food is eaten
            snake.pop();
        }
        
        // Redraw game
        draw();
    }
    
    function updateScoreDisplay() {
        document.getElementById('score').textContent = score;
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('snakeHighScore', highScore);
            document.getElementById('high-score').textContent = highScore;
        }
    }
    
    function levelUp() {
        level++;
        document.getElementById('level').textContent = level;
        
        // Increase game speed
        gameSpeed = Math.max(GAME_SPEED_INITIAL - (level - 1) * 10, 50);
        
        // Restart interval with new speed
        clearInterval(gameInterval);
        gameInterval = setInterval(update, gameSpeed);
        
        // Visual indicator of level up (flash the canvas)
        canvas.style.borderColor = '#FFA500';
        setTimeout(() => {
            canvas.style.borderColor = '#4CAF50';
        }, 300);
    }
    
    function gameOver() {
        gameActive = false;
        clearInterval(gameInterval);
        
        // Show game over modal
        document.getElementById('final-score').textContent = score;
        document.getElementById('modal-high-score').textContent = highScore;
        document.getElementById('game-over-modal').style.display = 'flex';
    }
    
    function startGame() {
        if (gameActive) return;
        
        document.getElementById('game-over-modal').style.display = 'none';
        gameActive = true;
        isPaused = false;
        document.getElementById('pause-btn').textContent = 'Pause';
        
        initGame();
        gameInterval = setInterval(update, gameSpeed);
    }
    
    function togglePause() {
        if (!gameActive) return;
        
        isPaused = !isPaused;
        document.getElementById('pause-btn').textContent = isPaused ? 'Resume' : 'Pause';
        draw();
    }
    
    // Event listeners
    document.getElementById('start-btn').addEventListener('click', startGame);
    document.getElementById('pause-btn').addEventListener('click', togglePause);
    document.getElementById('restart-btn').addEventListener('click', startGame);
    
    // Touch controls for mobile
    document.getElementById('up-btn').addEventListener('click', () => {
        if (direction !== 'down') nextDirection = 'up';
    });
    
    document.getElementById('down-btn').addEventListener('click', () => {
        if (direction !== 'up') nextDirection = 'down';
    });
    
    document.getElementById('left-btn').addEventListener('click', () => {
        if (direction !== 'right') nextDirection = 'left';
    });
    
    document.getElementById('right-btn').addEventListener('click', () => {
        if (direction !== 'left') nextDirection = 'right';
    });
    
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        // Prevent default behavior for arrow keys to avoid scrolling
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
            e.preventDefault();
        }
        
        switch (e.key) {
            case 'ArrowUp':
                if (direction !== 'down') nextDirection = 'up';
                break;
            case 'ArrowDown':
                if (direction !== 'up') nextDirection = 'down';
                break;
            case 'ArrowLeft':
                if (direction !== 'right') nextDirection = 'left';
                break;
            case 'ArrowRight':
                if (direction !== 'left') nextDirection = 'right';
                break;
            case ' ':
                if (gameActive) {
                    togglePause();
                } else {
                    startGame();
                }
                break;
        }
    });
    
    // Window resize handler
    window.addEventListener('resize', () => {
        setCanvasSize();
        if (gameActive) {
            draw();
        }
    });
    
    // Initialize canvas on load
    setCanvasSize();
    draw();
});
