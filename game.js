/* This file contains the source code of the game itself but is not used in session or serverside.
*
* Sources for the code used and modified in this file:
* https://www.youtube.com/watch?v=nl0KXCa5pJk
* https://github.com/CodeExplainedRepo/Ping-Pong-Game-JavaScript
*
*/

const canvas = document.getElementById("gamecanvas"); // Game canvas...
const context = canvas.getContext("2d"); // ...and 2d context

const user = { // User paddle determination
    x: 0,
    y: canvas.height / 2 - (canvas.height * 0.25 / 2),
    width: canvas.width * 0.02,
    height: canvas.height * 0.25,
    color: "WHITE",
    score: 0
}

const ai_user = { // AI paddle determination
    x: canvas.width - canvas.width * 0.02,
    y: canvas.height / 2 - (canvas.height * 0.25 / 2),
    width: canvas.width * 0.02,
    height: canvas.height * 0.25,
    color: "WHITE",
    score: 0
}

const ball = { // Ball determination
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: canvas.height * 0.04,
    speed: 3,
    velocityX: 3,
    velocityY: 3,
    color: "WHITE"
}

function drawRectangle(x, y, width, height, color) { // Function for drawing the paddles to the both horizontal ends of the playing field
    context.fillStyle = color;
    context.fillRect(x, y, width, height);
}

function drawBall(x, y, radius, color) { // Function for drawing the ball inside the playing field
    context.fillStyle = color;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2, false);
    context.closePath();
    context.fill();
}

function drawText(text, x, y, color) { // Function for drawing a text inside the playing field
    context.fillStyle = color;
    context.font = "2em Arial"
    context.fillText(text, x, y);
}

function render() { // Renders everything
    drawRectangle(0, 0, canvas.width, canvas.height, "BLACK"); // Draws the playing field
    if (game_ended) {
        drawText(winner + " wins!", canvas.width / 2, canvas.height / 2, "WHITE"); /*When the game is ended, the text, which announces the winner, 
        will be drawn inside the playing field*/
    }
    drawRectangle(user.x, user.y, user.width, user.height, "WHITE"); // Draws the user paddle in the left end of the playing field
    drawRectangle(ai_user.x, ai_user.y, ai_user.width, ai_user.height, "WHITE"); // Draws the AI paddle in the right end of the playing field
    drawBall(ball.x, ball.y, ball.radius, "WHITE"); // Draws the ball
    document.getElementById("left_score").textContent = user.score;     // Shows the user score
    document.getElementById("right_score").textContent = ai_user.score; // Shows the AI score
}

canvas.addEventListener("mousemove", movePaddle); // Enables the user paddle to follow mouse movement.

function movePaddle(e) { // Enables the user paddle to follow mouse movement.
    let rect = canvas.getBoundingClientRect();
    user.y = e.clientY - rect.top - user.height / 2;
}

function resetBall() { /*Resets the ball, when either of the players scores. Basically, all velocities are reseted to the beginning stage and the ball movement
    direction will be somewhat opposite related to the direction at the moment of the latest scoring moment*/

    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.speed = 3;
    ball.velocityX = -ball.velocityX;
    ball.velocityY = -ball.velocityY;

    if (ball.velocityX >= 0) {
        ball.velocityX = ball.speed;
    }
    else {
        ball.velocityX = -ball.speed;
    }

    if (ball.velocityY >= 0) {
        ball.velocityY = ball.speed;
    }
    else {
        ball.velocityY = -ball.speed;
    }
}

function collision(b, p) { // Detects collision
    b.top = b.y - b.radius;
    b.bottom = b.y + b.radius;
    b.left = b.x - b.radius;
    b.right = b.x + b.radius;

    p.top = p.y;
    p.bottom = p.y + p.height;
    p.left = p.x;
    p.right = p.x + p.width;

    return b.right > p.left && b.bottom > p.top && b.left < p.right && b.top < p.bottom;
}

function update() { /* This function updates game events. The game primarily ends, when either of the players reaches 11 points. 
    However, a point difference between the players must have at least 2 points.*/

    if (game_ended) {
        return;
    }
    if (ball.x - ball.radius < 0) { //AI player scores
        ai_user.score++;
        if (ai_user.score >= 11 && ai_user.score - user.score >= 2) {
            game_ended = true;
            winner = "AI";
            return;
        }
        else {
            resetBall();
        }
    }
    else if (ball.x + ball.radius > canvas.width) { // User scores
        user.score++;
        if (user.score >= 11 && user.score - ai_user.score >= 2) {
            game_ended = true;
            winner = "User";
            return;
        }
        else {
            resetBall();
        }
    }

    ball.x += ball.velocityX;
    ball.y += ball.velocityY;

    const ai_level = 0.09;
    ai_user.y += (ball.y - (ai_user.y + ai_user.height / 2)) * ai_level; // Accuracy of the AI player

    if (ball.y + ball.radius > canvas.height || ball.y - ball.radius < 0) { /* When the ball hits either of the vertical ends of the playing field, 
        the vertical speed of the ball will be reversed */
        ball.velocityY = -ball.velocityY;
    }
    let player = (ball.x < canvas.width / 2) ? user : ai_user;

    if (collision(ball, player)) { /* When the collision happens either of the paddles. 
        Determines the movement of the ball after the collision and ball speed will also be incresed */

        let collidePoint = ball.y - (player.y + player.height / 2);
        collidePoint = collidePoint / (player.height / 2);
        let angleRad = collidePoint * Math.PI / 4;
        let direction = (ball.x < canvas.width / 2) ? 1 : -1;
        ball.velocityX = direction * ball.speed * Math.cos(angleRad);
        ball.velocityY = ball.speed * Math.sin(angleRad);
        ball.speed += 0.5;
    }
}

function game() { // Game fuction
    update();
    render();
    if (game_ended) { // The interval will be cleared when the game ends
        clearInterval(myinterval);
        return;
    }
}

const framePerSecond = 50;
let game_ended = false;
let winner;
let myinterval = setInterval(game, 1000 / framePerSecond);