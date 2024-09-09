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
    magnetMode = !magnetMode;
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
    ctx.clearRect(0, 0, canvas.width, canvas.height);

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

function animate() {
    drawBlob();
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