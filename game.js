// Game stats
let gameRunning = false
let gamePaused = false
let lastTime = 0
let score = 0
let lives = 3
let timeRemaining = 120
let alienDirection = 1 // 1 rigth -1left
const alienMoveDown = false
let shootCooldown = 0
let alienShootCooldown = 0
let gameLoopId = null
let timerInterval = null; // Store the timer interval ID


// Game elements
let player
let aliens = []
let bullets = []
let alienBullets = []

// DOM elemts
const gameArea = document.getElementById("game-area")
const scoreElem = document.getElementById("score")
const livesElem = document.getElementById("lives")
const timerElem = document.getElementById("timer")

function getbounds() {
    return {
        width : gameArea.clientWidth,
        height : gameArea.clientHeight
    }
    
}
const {width, height} = getbounds()

// pause menu 
const pauseMenu = document.createElement("div")
pauseMenu.id = "pause-menu"
pauseMenu.className = "hidden"
const menuContent = document.createElement("div")
menuContent.className = "menu-content"
const menuTitle = document.createElement("h2")
menuTitle.textContent = "PAUSED"
const continueBtn = document.createElement("button")
continueBtn.id = "continue-btn"
continueBtn.textContent = "CONTINUE"
const restartBtn = document.createElement("button")
restartBtn.id = "restart-btn"
restartBtn.textContent = "RESTART"
menuContent.appendChild(menuTitle)
menuContent.appendChild(continueBtn)
menuContent.appendChild(restartBtn)
pauseMenu.appendChild(menuContent)
document.querySelector(".game-container").appendChild(pauseMenu)

const startGame = () => {
    if (gameLoopId) {
        cancelAnimationFrame(gameLoopId);
        gameLoopId = null;
    }
    pauseMenu.style.display = 'none'
    resetPauseMenu()
    gamePaused = false
    createPlayer()
    createAliens()
    score = 0
    lives = 3
    timeRemaining = 120
    updateStats()
    lastTime = performance.now()
    gameRunning = true
    requestAnimationFrame(gameLoop)
    startTime()
}

const createPlayer = () => {
    player = document.createElement("div")
    player.className = "player"
    player.style.left = `${ width / 2 - 30}px` // mid game widtih - 30
    gameArea.appendChild(player)
}

const createAliens = () => {
    aliens = []
    const startX = (width - 10 * (40 + 10)) / 2 //(gamewidth - columns * (alienWidth + alien paddin)) / 2
    const startY = 50
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 10; j++) {
            const alien = document.createElement("div")
            alien.className = "alien" + (i + 1)
            alien.style.left = `${startX + j * (40 + 10)}px` // 10 = padding
            alien.style.top = `${startY + i * (30 + 10)}px`
            gameArea.appendChild(alien)
            aliens.push(alien)
        }
    }

}

const updateStats = () => {
    scoreElem.textContent = score
    livesElem.textContent = lives
    timerElem.textContent = Math.ceil(timeRemaining)
}

const startTime = () => {
    if (timerInterval) {
        clearInterval(timerInterval)
        timerInterval = null
    }
    timerInterval = setInterval(() => {
        if (!gamePaused && gameRunning) {
            timeRemaining -= 0.1
            updateStats()
            if (timeRemaining <= 0) {
                clearInterval(timerInterval)
                timerInterval = null
                gameOver()
            }
        }
    }, 100)
}
// game loop
function gameLoop(timestamp) {
    if (!gameRunning) return
    if (gamePaused) {
        gameLoopId = requestAnimationFrame(gameLoop)
        return
    }

    const deltaTime = timestamp - lastTime
    lastTime = timestamp

    // Update game state
    movePlayer()
    moveAliens()
    updateBullets()
    checkCollisions()

    // Cooldowns
    if (shootCooldown > 0) shootCooldown -= deltaTime
    if (alienShootCooldown > 0) alienShootCooldown -= deltaTime
    else alienShoot()

    // Continue the loop
    gameLoopId = requestAnimationFrame(gameLoop)
}

const movePlayer = () => {
    if (keys.ArrowLeft && Number.parseInt(player.style.left) > 30) {
        player.style.left = `${Number.parseInt(player.style.left) - 5}px`
        if (keys[' ']&& shootCooldown <= 0) shoot() 

    } else if (keys.ArrowRight && Number.parseInt(player.style.left) + 40 < width) { // game width - 60
        player.style.left = `${Number.parseInt(player.style.left) + 5}px` // 5 = player speed
        if (keys[' ']&& shootCooldown <= 0) shoot()

    } else if (keys[' '] && shootCooldown <= 0) {
        shoot() // needs modifications
    }
}

const moveAliens = () => {
    let moveDown = false
    let changeDirection = false
    for (let alien of aliens) {
        if (alienDirection > 0 && Number.parseInt(alien.style.left) > width - 60) {
            changeDirection = true
            moveDown = true
            break
        } else if (alienDirection < 0 && Number.parseInt(alien.style.left) < 10) {
            changeDirection = true
            moveDown = true
            break
        }
    }
    for (let alien of aliens) {
        if (moveDown) {
            alien.style.top = `${Number.parseInt(alien.style.top) + 20}px`
            if (Number.parseInt(alien.style.top) > height) {
                loseLife()
                resetAliens()
                break
            }
        }
        alien.style.left = `${Number.parseInt(alien.style.left) + 1 * alienDirection}px` // 1 = alien speed
    }
    if (changeDirection) {
        alienDirection *= -1
    }
}

const resetAliens = () => {
    const startY = 50
    let row = 0
    let col = 0
    const startX = (width - 10 * (40 + 10)) / 2 // width - cols * (width + padding) / 2
    for (let i = 0; i < aliens.length; i++) {
        row = Math.floor(i / 10)
        col = i % 10
        aliens[i].style.left = `${startX + col * (40 + 10)}px` // width + padding
        aliens[i].style.top = `${startY + row * (30 + 10)}px` // height + padding
    }
}

const updateBullets = () => {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i]
        bullet.style.top = `${Number.parseInt(bullet.style.top) - 7}px` // 7 = bullet speed
        if (Number.parseInt(bullet.style.top) < 0) { // off scrreen remove
            gameArea.removeChild(bullet)
            bullets.splice(i, 1)
        }
    }
    for (let i = alienBullets.length - 1; i >= 0; i--) {
        const bullet = alienBullets[i]
        bullet.style.top = `${Number.parseInt(bullet.style.top) + 5}px` // alien bullet speed = 5
        if (Number.parseInt(bullet.style.top) > 560) {
            gameArea.removeChild(bullet)
            alienBullets.splice(i, 1)
        }
    }
}

const shoot = () => {
    const bullet = document.createElement('div')
    bullet.className = 'bullet'
    bullet.style.left = `${Number.parseInt(player.style.left) + 28}px` // Center the bullet on the player
    bullet.style.top = `${height-50}px`
    gameArea.appendChild(bullet)
    bullets.push(bullet)
    shootCooldown = 400
}

const alienShoot = () => {
    if (aliens.length === 0) return
    const randomAlien = aliens[Math.floor(Math.random() * aliens.length)]
    const bullet = document.createElement('div')
    bullet.className = 'alien-bullet'
    bullet.style.left = `${Number.parseInt(randomAlien.style.left) + 18}px`
    bullet.style.top = `${Number.parseInt(randomAlien.style.top) + 30}px`
    gameArea.appendChild(bullet)
    alienBullets.push(bullet)
    alienShootCooldown = 1000 + Math.random() * 2000
}

// Check for collisions
const checkCollisions = () => {
    // Check player bullets vs aliens
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bulletRect = bullets[i].getBoundingClientRect()
        for (let j = aliens.length - 1; j >= 0; j--) {
            const alienRect = aliens[j].getBoundingClientRect()
            if (
                bulletRect.left < alienRect.right &&
                bulletRect.right > alienRect.left &&
                bulletRect.top < alienRect.bottom &&
                bulletRect.bottom > alienRect.top
            ) {
                gameArea.removeChild(bullets[i])
                bullets.splice(i, 1)
                gameArea.removeChild(aliens[j])
                aliens.splice(j, 1)
                score += 10
                updateStats()
                if (aliens.length === 0) {
                    timeRemaining += 20 
                    createAliens()
                    score += 50
                    updateStats()
                }
                break
            }
        }
    }
    const playerRect = player.getBoundingClientRect()
    for (let i = alienBullets.length - 1; i >= 0; i--) {
        const bulletRect = alienBullets[i].getBoundingClientRect()
        if (
            bulletRect.left < playerRect.right &&
            bulletRect.right > playerRect.left &&
            bulletRect.top < playerRect.bottom &&
            bulletRect.bottom > playerRect.top
        ) {
            gameArea.removeChild(alienBullets[i])
            alienBullets.splice(i, 1)
            loseLife()
        }
    }
}

const loseLife = () => {
    lives--
    updateStats()
    if (lives === 0) {
        gameOver()
    }
}

const resetPauseMenu = () => {
    pauseMenu.classList.add('hidden')
    menuTitle.textContent = 'PAUSED'
    continueBtn.style.display = 'block'
}

const gameOver = () => {
    gameRunning = false
    pauseMenu.style.display = 'flex'
    pauseMenu.classList.remove('hidden')
    document.getElementById('continue-btn').style.display = 'none'
    document.querySelector('.menu-content h2').textContent = `GAME OVER  Your Score: ${score}`
}

// events

const keys = {}
window.addEventListener("keydown", (e) => {
    keys[e.key] = true
    if (e.key === "Escape" && gameRunning) {
        togglePause()
    }
})
window.addEventListener("keyup", (e) => {
    keys[e.key] = false
})
continueBtn.addEventListener("click", () => {
    togglePause()
})
restartBtn.addEventListener("click", () => {
    pauseMenu.style.display = 'none'
    gamePaused = false
    resetGame()
})

const togglePause = () => {
    gamePaused = !gamePaused
    if (gamePaused) {
        pauseMenu.style.display = 'flex'
    } else {
        pauseMenu.style.display = 'none'
    }
}

const resetGame = () => {
    pauseMenu.style.display = 'none'
    gamePaused = false

    if (gameLoopId) {
        cancelAnimationFrame(gameLoopId)
        gameLoopId = null
    }
    // Stop the old game loop
    if (timerInterval) {
        clearInterval(timerInterval)
        timerInterval = null
    }

    while (gameArea.firstChild) {
        gameArea.removeChild(gameArea.firstChild)
    }
    bullets = []
    alienBullets = []
    aliens = []
    startGame()
}

window.addEventListener('load', startGame)

