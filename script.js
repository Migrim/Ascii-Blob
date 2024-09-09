const canvas = document.getElementById('asciiCanvas');
const ctx = canvas.getContext('2d');
const modeStatus = document.getElementById('modeStatus');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const blobText = [
    '@', '#', '%', '&', '$', '*', '=', '+', '-', '~', '!', '(', ')', '[', ']', '{', '}', '?', '/', '\\', '|',
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
];
const explosionText = ['@', '#', '*', '%', '$']; 

let blob = [];
let numSymbols = parseInt(localStorage.getItem('density')) || 2426;
let blobSpeed = parseFloat(localStorage.getItem('blobSpeed')) || 0.01;
let symbolSize = parseInt(localStorage.getItem('symbolSize')) || 15;
let swirlSpeed = parseFloat(localStorage.getItem('swirlSpeed')) || 0.02;
let bounceEffect = parseFloat(localStorage.getItem('bounceEffect')) || 5;
let waveEffect = parseFloat(localStorage.getItem('waveEffect')) || 1.1;
let swirlAngle = 0;
let time = 0;
let magnetMode = false;
let vortexMode = false;
let vortexStrength = 1;
let explosions = [];

const blobRadius = 150;
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;

const mouse = { x: null, y: null, radius: parseInt(localStorage.getItem('cursorSize')) || 100 };

const densitySlider = document.getElementById('densitySlider');
const densityValue = document.getElementById('densityValue');
const cursorSizeSlider = document.getElementById('cursorSizeSlider');
const cursorSizeValue = document.getElementById('cursorSizeValue');
const blobSpeedSlider = document.getElementById('blobSpeedSlider');
const blobSpeedValue = document.getElementById('blobSpeedValue');
const symbolSizeSlider = document.getElementById('symbolSizeSlider');
const symbolSizeValue = document.getElementById('symbolSizeValue');
const swirlSpeedSlider = document.getElementById('swirlSpeedSlider');
const swirlSpeedValue = document.getElementById('swirlSpeedValue');
const bounceEffectSlider = document.getElementById('bounceEffectSlider');
const bounceEffectValue = document.getElementById('bounceEffectValue');
const waveEffectSlider = document.getElementById('waveEffectSlider');
const waveEffectValue = document.getElementById('waveEffectValue');

densitySlider.value = numSymbols;
cursorSizeSlider.value = mouse.radius;
blobSpeedSlider.value = blobSpeed;
symbolSizeSlider.value = symbolSize;
swirlSpeedSlider.value = swirlSpeed;
bounceEffectSlider.value = bounceEffect;
waveEffectSlider.value = waveEffect;

densityValue.textContent = numSymbols;
cursorSizeValue.textContent = mouse.radius;
blobSpeedValue.textContent = blobSpeed;
symbolSizeValue.textContent = symbolSize;
swirlSpeedValue.textContent = swirlSpeed;
bounceEffectValue.textContent = bounceEffect;
waveEffectValue.textContent = waveEffect;

densitySlider.addEventListener('input', function () {
    numSymbols = parseInt(this.value);
    densityValue.textContent = this.value;
    localStorage.setItem('density', this.value);
    resetBlob();
});

cursorSizeSlider.addEventListener('input', function () {
    mouse.radius = parseInt(this.value);
    cursorSizeValue.textContent = this.value;
    localStorage.setItem('cursorSize', this.value);
});

blobSpeedSlider.addEventListener('input', function () {
    blobSpeed = parseFloat(this.value);
    blobSpeedValue.textContent = this.value;
    localStorage.setItem('blobSpeed', this.value);
});

symbolSizeSlider.addEventListener('input', function () {
    symbolSize = parseInt(this.value);
    symbolSizeValue.textContent = this.value;
    localStorage.setItem('symbolSize', this.value);
});

swirlSpeedSlider.addEventListener('input', function () {
    swirlSpeed = parseFloat(this.value);
    swirlSpeedValue.textContent = this.value;
    localStorage.setItem('swirlSpeed', this.value);
});

bounceEffectSlider.addEventListener('input', function () {
    bounceEffect = parseFloat(this.value);
    bounceEffectValue.textContent = this.value;
    localStorage.setItem('bounceEffect', this.value);
});

waveEffectSlider.addEventListener('input', function () {
    waveEffect = parseFloat(this.value);
    waveEffectValue.textContent = this.value;
    localStorage.setItem('waveEffect', this.value);
});

window.addEventListener('wheel', (event) => {
    if (vortexMode) {
        vortexStrength += event.deltaY * -0.01;  
        vortexStrength = Math.max(0.1, Math.min(vortexStrength, 30)); 
        modeStatus.textContent = `Mode: Vortex (Strength: ${vortexStrength.toFixed(2)})`;
    }
});

canvas.addEventListener('click', function () {
    if (!vortexMode && !magnetMode) {
        vortexMode = true;
        modeStatus.textContent = `Mode: Vortex`;
    } else if (vortexMode) {
        vortexMode = false;
        magnetMode = true;
        modeStatus.textContent = `Mode: Magnet`;
    } else {
        magnetMode = false;
        modeStatus.textContent = `Mode: Normal`;
    }
});

canvas.addEventListener('contextmenu', function (event) {
    event.preventDefault();
    asciiExplosion(event.x, event.y);
});

function initBlob() {
    blob = [];
    for (let i = 0; i < numSymbols; i++) {
        const distanceFromCenter = Math.random() * blobRadius;
        const angle = Math.random() * Math.PI * 2;
        const x = centerX + Math.cos(angle) * distanceFromCenter;
        const y = centerY + Math.sin(angle) * distanceFromCenter;
        blob.push({
            symbol: blobText[Math.floor(Math.random() * blobText.length)],
            originalX: x,
            originalY: y,
            x: x,
            y: y,
            vx: 0,
            vy: 0
        });
    }
}

function drawBlob() {
    swirlAngle += swirlSpeed;
    time += waveEffect * 0.02;

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#e1bee7');   
    gradient.addColorStop(0.25, '#ce93d8'); 
    gradient.addColorStop(0.5, '#ba68c8');  
    gradient.addColorStop(0.75, '#ab47bc'); 
    gradient.addColorStop(1, '#9c27b0');    

    blob.forEach((part, index) => {
        const dx = mouse.x - part.x;
        const dy = mouse.y - part.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (vortexMode && distance < mouse.radius) {
            const angle = Math.atan2(dy, dx);
            const attractionStrength = vortexStrength;
            part.vx += Math.cos(angle + Math.PI / 2) * attractionStrength;
            part.vy += Math.sin(angle + Math.PI / 2) * attractionStrength;
        } else if (magnetMode && distance < mouse.radius) {
            const attractionStrength = 0.02;
            part.vx += dx * attractionStrength;
            part.vy += dy * attractionStrength;
        } else if (distance < mouse.radius) {
            const angle = Math.atan2(dy, dx);
            const force = (mouse.radius - distance) / mouse.radius;
            const escapeSpeed = force * bounceEffect * 5;

            part.vx += Math.cos(angle) * -escapeSpeed;
            part.vy += Math.sin(angle) * -escapeSpeed;
        } else {
            const angleFromCenter = Math.atan2(part.originalY - centerY, part.originalX - centerX);
            const radiusFromCenter = Math.sqrt((part.originalX - centerX) ** 2 + (part.originalY - centerY) ** 2);
            const newX = centerX + Math.cos(angleFromCenter + swirlAngle) * radiusFromCenter;
            const newY = centerY + Math.sin(angleFromCenter + swirlAngle) * radiusFromCenter;

            const waveOffset = Math.sin(time + index * 0.1) * waveEffect * 20;
            const dx = newX - part.x;
            const dy = newY - part.y + waveOffset;

            part.vx += dx * blobSpeed;
            part.vy += dy * blobSpeed;
        }

        part.vx *= 0.9;
        part.vy *= 0.9;

        part.x += part.vx;
        part.y += part.vy;

        ctx.fillStyle = gradient;
        ctx.font = `${symbolSize}px monospace`;
        ctx.fillText(part.symbol, part.x, part.y);
    });
}

function asciiExplosion(x, y) {
    const explosionSize = mouse.radius * 1.5; 
    const numSymbolsInExplosion = 50; 
    const explosionSymbols = [];

    for (let i = 0; i < numSymbolsInExplosion; i++) {
        const symbol = explosionText[Math.floor(Math.random() * explosionText.length)]; 
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * explosionSize;
        explosionSymbols.push({
            symbol: symbol,
            x: x + Math.cos(angle) * distance,
            y: y + Math.sin(angle) * distance,
            vx: Math.cos(angle) * (Math.random() * 8), 
            vy: Math.sin(angle) * (Math.random() * 8),
            life: 100
        });
    }

    explosions.push(explosionSymbols);

    blob.forEach((part) => {
        const dx = part.x - x;
        const dy = part.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < explosionSize) {

            const force = (explosionSize - distance) / explosionSize;
            const explosionForce = force * mouse.radius * 4; 

            part.vx += dx / distance * explosionForce;
            part.vy += dy / distance * explosionForce;
        }
    });
}

function drawExplosions() {
    explosions.forEach((explosion, explosionIndex) => {
        explosion.forEach((symbol, symbolIndex) => {
            if (symbol.life > 0) {
                const gradient = ctx.createRadialGradient(
                    symbol.x, symbol.y, 0,
                    symbol.x, symbol.y, symbolSize * 2
                );
                gradient.addColorStop(0, `rgba(255, 255, 255, ${symbol.life / 100})`); 
                gradient.addColorStop(0.5, `rgba(138, 43, 226, ${symbol.life / 100})`); 
                gradient.addColorStop(1, `rgba(0, 255, 255, ${symbol.life / 100})`);

                ctx.font = `${symbolSize - 5}px monospace`; 
                ctx.fillStyle = gradient; 
                ctx.fillText(symbol.symbol, symbol.x, symbol.y);

                symbol.x += symbol.vx;
                symbol.y += symbol.vy;
                symbol.life -= 2; 
            }
        });

        explosions[explosionIndex] = explosion.filter(symbol => symbol.life > 0);
    });

    explosions = explosions.filter(explosion => explosion.length > 0);
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); 

    drawBlob();        
    drawExplosions();  

    requestAnimationFrame(animate);
}

function resetBlob() {
    initBlob();
}

window.addEventListener('mousemove', (event) => {
    mouse.x = event.x;
    mouse.y = event.y;
});

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    resetBlob();
});

initBlob();
animate();