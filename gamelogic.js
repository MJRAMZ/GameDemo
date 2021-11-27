// Script for game logic

/*****************************************************
* TODO: add functionality for sound toggle buttons
 * add functionality to start game over after Win/Game Over
*******************************************************/

let canvas = document.getElementById("myCanvas");
// Rendering context - 2 dimensional
let ctx = canvas.getContext("2d");

// Set up sound fx
const brickSFX = new Audio("sounds/brick.m4a");
const paddleSFX = new Audio("sounds/paddle.m4a");
const wallSFX = new Audio("sounds/wall.m4a");
const groundSFX = new Audio("sounds/ground.mp3");
const gameoverSFX = new Audio("sounds/game-over.mp3")
const winSFX = new Audio("sounds/applause.mp3")

// Sound toggle button
const soundToggle = document.getElementById("sound-btn");

// Event listeners for sound toggle buttons
soundToggle.addEventListener("click", toggleAudio, false);

// Canvas Attributes
const HEIGHT = 600;
const WIDTH = 880;
const BACKGROUND_COLOR = "#272525"

// Setup canvas dimensions
canvas.height = HEIGHT;
canvas.width = WIDTH;

// Paddle Attributes
const PADDLE_COLOR = "#E8E4C6"
const PADDLE_HEIGHT = 20;
const PADDLE_WIDTH = 105;
const PADDLE_MARGIN = 50;
// Paddle starting point x/y axis
const PADDLE_X = (canvas.width - PADDLE_WIDTH) / 2;
const PADDLE_Y = canvas.height - PADDLE_HEIGHT - PADDLE_MARGIN;

// Ball Attributes
const BALL_COLOR = "#FBEDED"
const BALL_RADIUS = 10;
const BALL_SPD = 7;
const BALL_SPN = 2;
const BALL_DX = 0;
const BALL_DY = 0;
// Ball starting point x/y axis
const BALL_X = canvas.width / 2;
const BALL_Y = PADDLE_Y - BALL_RADIUS;

// Variables for keyboard presses
let rightPressed = false;
let leftPressed = false;
let escPressed = false;
let spacePressed = false;
let enterPressed = false;

// Variables for the bricks
let brickRows = 6;
let brickColumns = 10;
let brickWidth = 75;
let brickHeight = 20;
let brickPadding = 10;
let brickOffsetTop = 30;
let brickOffsetLeft = 30;
// Brick storage
let bricks = [];
for(let c=0; c<brickColumns; c++){
    bricks[c] = [];
    for(let r=0; r<brickRows; r++){
        bricks[c][r] = { x: 0, y: 0, status: 1 };
    }
}

// Game Trackers
const GAMESTATE = {
    WIN: 0,
    RUNNING: 1,
    GAMEOVER: 2
};
let state = GAMESTATE.RUNNING;
let score = 0;
let lives = 3;

// Game components
let paddle, ball;

// Setup new game
newGame();

// Adding event listeners for key presses
document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);
document.addEventListener("keydown", audioHandler, false);

/**********************************
 * Input Handlers
 *********************************/
/**
 * keyDownHandler()
 * Handles event when the keys are pressed
 * sets <key>Pressed to true if pressed
 * */
function keyDownHandler(e) {
    // Using additional "Right/Left" checks for IE/Edge support
    if(e.key === "Right" || e.key === "ArrowRight") {
        rightPressed = true;
    }
    else if(e.key === "Left" || e.key === "ArrowLeft") {
        leftPressed = true;
    }
    else if(e.key == " ") {
        // needed to disable space scrolling;
        e.preventDefault();
        spacePressed = true;
    }
}

/**
 * keyUpHandler()
 * Handles event when the keys stop being pressed
 * Resets  <key>Pressed back to default value once key is released
 * */
function keyUpHandler(e) {
    // Using additional "Right/Left" checks for IE/Edge support
    if(e.key === "Right" || e.key === "ArrowRight") {
        rightPressed = false;
    }
    else if(e.key === "Left" || e.key === "ArrowLeft") {
        leftPressed = false;
    }
    else if(e.key == " ") {
        spacePressed = false;
    }
}

/**
 * resetHandler()
 * Handles the game reset event when the 'enter' key is pressed
 * after when game is in the 'GAME OVER' or 'WIN' state
 * */
function resetHandler(e) {
    if(e.key === "Enter") {
        resetGame();
    }
}

/**
 * muteHandler()
 * Toggles the game audio on/off if user presses the 'm' key
 * */
function audioHandler(e) {
    if(e.key === "m") {
        toggleAudio();
    }
}

/**************************
 * Canvas Draw Functions
 **************************/
/**
* drawWin()
* Renders the win screen
**/
function drawWin() {
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fill();

    ctx.font = "40px Lucida Console";
    ctx.fillStyle = PADDLE_COLOR;
    ctx.textAlign = "center"
    ctx.fillText("YOU WON!!!", canvas.width/2, canvas.height/2);
    ctx.font = "30px Lucida Console";
    ctx.fillText("Press \'ENTER\' to play again.", canvas.width/2, canvas.height/2 + 50);
}

/**
* drawGameOver()
* Renders the gameover screen
**/
function drawGameOver() {
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fill();

    ctx.font = "40px Lucida Console";
    ctx.fillStyle = PADDLE_COLOR;
    ctx.textAlign = "center"
    ctx.fillText("GAME OVER", canvas.width/2, canvas.height/2);
    ctx.font = "30px Lucida Console";
    ctx.fillText("Press \'ENTER\' to play again.", canvas.width/2, canvas.height/2 + 50);
}

/**
* drawBackground()
* Renders the canvas background
**/
function drawBackground() {
    ctx.beginPath();
    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.closePath()
}

/**
* drawBall()
* Rendering 2d ball to bounce around the canvas
**/
function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2);
    ctx.fillStyle = BALL_COLOR;
    ctx.fill();
    ctx.closePath();
}

/**
 * drawPaddle()
 * Renders the paddle on the canvas
 **/
function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddle.x, paddle.y, paddle.w, paddle.h);
    ctx.fillStyle = PADDLE_COLOR;
    ctx.fill();
    ctx.closePath();
}

/**
 * drawBricks()
 * Renders the bricks on the canvas in a 3 X 5 pattern
 **/
function drawBricks() {
    let brickColor, rank, highestRank;
    rankHigh = brickRows * 0.5;
    for(let c=0; c<brickColumns; c++){
        rank = Math.floor(c * 0.5);
        brickColor = getBrickColor(rank, rankHigh);
        for(let r=0; r<brickRows; r++){
            if(bricks[c][r].status == 1) {

                let brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
                let brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop;
                bricks[c][r].x = brickX;
                bricks[c][r].y = brickY;
                ctx.beginPath();
                ctx.rect(brickX, brickY, brickWidth, brickHeight);
                ctx.fillStyle = brickColor;
                ctx.fill();
                ctx.closePath();
            }
        }
    }
}

/**
 * drawScore()
 * Displays player score and winning message when player beats the game
 **/
function drawScore() {
    ctx.font = "16px Arial";
    ctx.fillstyle = BALL_COLOR;
    ctx.fillText("Score: "+score, 8, 20);
}

/**
 * drawLives()
 * Displays how many lives the player has left
 **/
function drawLives() {
    ctx.font = "16px Arial";
    ctx.fillStyle = BALL_COLOR;
    ctx.fillText("Lives: "+lives, canvas.width-65, 20);
}

/**
* drawGame()
* Drawing loop to update the canvas drawing on each frame
**/
function drawGame() {
    drawBackground();
    drawBricks();
    drawBall();
    drawPaddle();
    drawScore();
    drawLives();
    collisionDetection();
}

/**************************
 * Game Component Functions
 **************************/
/**
 * Ball()
 * Sets attributes for ball game component
 */
function Ball() {
    this.r = BALL_RADIUS;
    this.x = BALL_X;
    this.y = BALL_Y;
    this.dxv = BALL_DX;
    this.dyv = BALL_DY;
}

/**
 * Paddle()
 * Sets attributes for paddle game component
 */
function Paddle() {
    this.w = PADDLE_WIDTH;
    this.h = PADDLE_HEIGHT;
    this.x = PADDLE_X;
    this.y = PADDLE_Y;
}

/**************************
 * Game Update Functions
 **************************/
/**
 * toggleAudio()
 * Mutes/Unmutes game sound effects based on toggle button clicks
 */
function toggleAudio() {
    // Toggle the button icon
    let volume = "bi bi-volume-up-fill";
    let mute = "bi bi-volume-mute-fill";
    let iconElement = document.getElementById("sound-btn-icon");
    let iconSrc = iconElement.getAttribute("class");
    let btnIcon = iconSrc === volume ? mute : volume;
    iconElement.setAttribute("class", btnIcon);

    // Toggle mute states
    brickSFX.muted     = brickSFX.muted ? false : true;
    paddleSFX.muted    = paddleSFX.muted ? false : true;
    wallSFX.muted      = wallSFX.muted ? false : true;
    groundSFX.muted    = groundSFX.muted ? false : true;
    gameoverSFX.muted  = gameoverSFX.muted ? false : true;
    winSFX.muted       = winSFX.muted ? false : true;
}

/**
 * resetGame()
 * Resets the game so player can play again
 */
function resetGame() {
    document.location.reload();
}
/**
 * newGame()
 * Sets up a new paddle and ball
 */
function newGame() {
    paddle = new Paddle();
    ball = new Ball();
}

/**
 * updateGameState()
 * Updates the state of the game
 */
function updateGameState() {
    // Check if there are still game lives left
    if(!lives) {
        state = GAMESTATE.GAMEOVER;
    }
    // Check if all bricks have been cleared
    // Score will match the total number of bricks
    if(score === brickRows*brickColumns) {
        state = GAMESTATE.WIN;
    }
}

/**
 * updatePaddle()
 * Updates the paddle position on canvas based on user key presses
 */
function updatePaddle() {
    // Logic for moving the paddle
    if(rightPressed) {
        paddle.x += 6;

        // Additional check so paddle wont disappear off edge of screen
        if(paddle.x + paddle.w > canvas.width) {
            paddle.x = canvas.width - paddle.w;
        }
    }
    else if(leftPressed) {
        paddle.x -= 6;
        // Additional check so paddle wont disappear off edge of screen
        if(paddle.x < 0) {
            paddle.x= 0;
        }
    }
}

/**
 * updateBallSpeed()
 * Updates the ball speed when colliding with paddle
 * Takes an angle parameter
 */
function updateBallSpeed(angle) {
    // keep angle between 30 and 150 degrees
    if(angle < Math.PI / 6) {
        angle = Math.PI /6;
    }
    else if(angle > Math.PI * 5 / 6){
        angle = Math.PI * 5 / 6;
    }
    // update ball x/y velocities
    ball.dxv = BALL_SPD * Math.cos(angle);
    ball.dyv = -BALL_SPD * Math.sin(angle);
}

/**
 * updateBall()
 * Updates the ball position on canvas
 */
function updateBall() {
    // Update ball position
    ball.x += ball.dxv;
    ball.y += ball.dyv;

    // Stationary ball check -- move ball with paddle
    if(ball.dyv === 0){
        ball.x = paddle.x + (paddle.w/2)
    }

    // Serve check
    if(spacePressed){
        serveBall();
    }

    // Left and right canvas collision detection
    if(ball.x + ball.dxv > canvas.width - ball.r || ball.x + ball.dxv < 0 + ball.r) {
        ball.dxv = -ball.dxv;
        wallSFX.play();
    }

    // Top canvas collision detection
    if(ball.y + ball.dyv < 0) {
        ball.dyv = -ball.dyv;
        wallSFX.play();
    }

    // Paddle collision detection - top of paddle
    if(ball.y > paddle.y - ball.r && ball.y < canvas.height - ball.r && ball.x + ball.r > paddle.x && ball.x - ball.r < paddle.x + paddle.w) {
        paddleSFX.play();
        ball.dyv = -ball.dyv;
        // modify angle of ball
        let ballAngle = Math.atan2(-ball.dyv, ball.dxv);
        ballAngle += (Math.random() * Math.PI/2 - Math.PI/4) * BALL_SPN
        updateBallSpeed(ballAngle);
    }

   // Bottom canvas collision detection
   if(ball.y + ball.dyv > canvas.height - ball.r - paddle.h) {
        // Play sfx of ball hit ground
        groundSFX.play();
        // Decrease life count if ball hits bottom of canvas
        lives--;
        newGame();
    }
}

/**
 * serveBall()
 * Sets the ball in motion when user after user presses space bar
 */
function serveBall() {
    // ball in motion check
    // prevent multiple serves
    if(ball.dyv != 0){
        return;
    }
    // pick random angle between 45 and 135 degrees
    let angle = Math.random() * Math.PI / 2 + Math.PI / 4;
    updateBallSpeed(angle);
}

/**
 * getBrickColor()
 * Calculates the color gradient for brick row
 *
 * Returns rgb string
 */
function getBrickColor(rank, highestRank) {
    let fraction = rank / highestRank;
    let r, g, b = 0;

    // red to orange to yellow gradient (increase green)
    if(fraction <= 0.67) {
        r = 255;
        g = 255 * fraction / 0.67;
    }
    // yellow to green (reduce red)
    else {
        r = 255 * (1 - fraction) / 0.33;
        g = 255;
    }
    // return rgb color string
    return "rgb(" + r + ", " + g + ", " + b + ")";

}

/**
 * collisionDetection()
 * Loops through all bricks and compares every brick's position with the ball's coordinates
 * when each frame is drawn.
 *
 * Changes direction of ball if center of ball is inside a brick's coordinates
 * Checks:
 * - Ball X-pos > Brick X-pos
 * - Ball X-pos < Brick X-pos + Brick Width
 * - Ball Y-pos > Brick Y-pos
 * - Ball Y-pos < Brick Y-pos + Brick Height
 */
function collisionDetection() {
    for(let c=0; c<brickColumns; c++) {
        for(let r=0; r<brickRows; r++) {
            let brick = bricks[c][r];
            // Check brick status
            if(brick.status == 1) {
                // Check if ball hits brick
                if(ball.x > brick.x && ball.x < brick.x+brickWidth && ball.y > brick.y && ball.y < brick.y+brickHeight) {
                    // Play brick collision sfx
                    brickSFX.play();
                    // Change ball direction
                    ball.dyv = -ball.dyv;
                    // Update brick status to hit
                    brick.status = 0;
                    // Update score counter
                    score++;
                }
            }
        }
    }
}

// Setting up the game loop
let timeDelta, timeLast = 0;
requestAnimationFrame(runGameLoop);
function runGameLoop(timeStamp) {
    if(!timeLast)
    {
        timeLast = timeStamp;
    }
    // Calc time difference
    timeDelta = (timeStamp - timeLast) / 1000;
    timeLast = timeStamp;

    // Update game
    updatePaddle();
    updateBall(timeDelta);
    updateGameState();

    // Game state checks
    if(state === GAMESTATE.RUNNING) {
        // Draw
        drawGame()
    }
    if(state === GAMESTATE.GAMEOVER) {
        gameoverSFX.play();
        drawGameOver();
        // Add reset event listener
        document.addEventListener("keydown", resetHandler, false);
    }
    if(state === GAMESTATE.WIN) {
        winSFX.play();
        drawWin();
        // Add reset event listener
        document.addEventListener("keydown", resetHandler, false);
    }
    if(state != GAMESTATE.GAMEOVER && state != GAMESTATE.WIN) {
        // Recursive call of next loop
        requestAnimationFrame(runGameLoop);
    }
}
