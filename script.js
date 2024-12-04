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
let blobRadius = parseInt(localStorage.getItem('blobRadius')) || 150; 
let swirlAngle = 0;
let time = 0;
let magnetMode = false;
let vortexMode = false;
let vortexStrength = 1;
let explosions = [];
let mirrorMode = false;
let currentShape = 'circle';
let shapeIndex = 0;
let morphing = false;
let targetBlob = [];
let morphProgress = 0;
let is3DMode = false;

const shapes = ['normal', 'circle', 'square', 'heart', 'target', 'triangle', 'spiral', 'flower', 'starburst'];
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;

const mouse = { x: null, y: null, radius: parseInt(localStorage.getItem('cursorSize')) || 100 };

const blobRadiusSlider = document.getElementById('blobRadiusSlider');
const blobRadiusValue = document.getElementById('blobRadiusValue');
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

blobRadiusSlider.value = blobRadius; 
blobRadiusValue.textContent = blobRadius;
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

blobRadiusSlider.addEventListener('input', function () {
    blobRadius = parseInt(this.value); 
    blobRadiusValue.textContent = this.value; 
    localStorage.setItem('blobRadius', this.value); 
    resetBlob(); 
});

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
    if (is3DMode) return; 

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

function toggle3DMode() {
    is3DMode = !is3DMode;

    const swirlContainer = document.querySelector('.slider-container.swirl');
    const waveContainer = document.querySelector('.slider-container.wave');

    if (is3DMode) {
        modeStatus.textContent = 'Mode: 3D Object';
        swirlContainer.style.display = 'none';
        waveContainer.style.display = 'none';

        magnetMode = false;
        vortexMode = false;
        mirrorMode = false;
        mouse.radius = 300; 
        switchTo3DObject();
    } else {
        modeStatus.textContent = 'Mode: Normal';
        swirlContainer.style.display = 'block';
        waveContainer.style.display = 'block';
        resetBlob();
    }
}

let cubeAngleX = 0;
let cubeAngleY = 0;

function switchTo3DObject() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const cubeSize = blobRadius * 2;

    const symbolsPerFace = Math.floor(blob.length / 6);

    blob.forEach((part, index) => {
        let x, y, z;

        const faceIndex = Math.floor(index / symbolsPerFace);
        const positionOnFace = index % symbolsPerFace;
        const gridSize = Math.sqrt(symbolsPerFace);
        const cellSize = cubeSize / gridSize;

        const gridX = positionOnFace % gridSize;
        const gridY = Math.floor(positionOnFace / gridSize);

        switch (faceIndex) {
            case 0: // Front face
                x = -cubeSize / 2 + gridX * cellSize;
                y = -cubeSize / 2 + gridY * cellSize;
                z = cubeSize / 2;
                break;
            case 1: // Back face
                x = -cubeSize / 2 + gridX * cellSize;
                y = -cubeSize / 2 + gridY * cellSize;
                z = -cubeSize / 2;
                break;
            case 2: // Top face
                x = -cubeSize / 2 + gridX * cellSize;
                y = cubeSize / 2;
                z = -cubeSize / 2 + gridY * cellSize;
                break;
            case 3: // Bottom face
                x = -cubeSize / 2 + gridX * cellSize;
                y = -cubeSize / 2;
                z = -cubeSize / 2 + gridY * cellSize;
                break;
            case 4: // Left face
                x = -cubeSize / 2;
                y = -cubeSize / 2 + gridX * cellSize;
                z = -cubeSize / 2 + gridY * cellSize;
                break;
            case 5: // Right face
                x = cubeSize / 2;
                y = -cubeSize / 2 + gridX * cellSize;
                z = -cubeSize / 2 + gridY * cellSize;
                break;
        }

        const rotatedX = x * Math.cos(cubeAngleY) - z * Math.sin(cubeAngleY);
        const rotatedZ = x * Math.sin(cubeAngleY) + z * Math.cos(cubeAngleY);

        const rotatedY = y * Math.cos(cubeAngleX) - rotatedZ * Math.sin(cubeAngleX);
        const finalZ = y * Math.sin(cubeAngleX) + rotatedZ * Math.cos(cubeAngleX);

        const perspective = 800 / (800 - finalZ);
        part.x = centerX + rotatedX * perspective;
        part.y = centerY + rotatedY * perspective;
        part.vx = 0;
        part.vy = 0;
    });
}

document.getElementById('switchTo3DMode').addEventListener('click', toggle3DMode);

canvas.addEventListener('contextmenu', function (event) {
    event.preventDefault();
    asciiExplosion(event.x, event.y);
});

window.addEventListener('keydown', (event) => {
    if (is3DMode) return; // Disable mirror mode in 3D mode

    if (event.key === 'm' || event.key === 'M') {
        mirrorMode = !mirrorMode;
        modeStatus.textContent = mirrorMode ? `Mode: Mirror` : `Mode: Normal`;
    }
});

window.addEventListener('keydown', (event) => {
    if (is3DMode) return; // Disable mirror mode in 3D mode

    if (event.key === 's' || event.key === 'S') {
        shapeIndex = (shapeIndex + 1) % shapes.length;
        currentShape = shapes[shapeIndex];
        modeStatus.textContent = `Shape: ${currentShape.charAt(0).toUpperCase() + currentShape.slice(1)}`;
        changeBlobShape(currentShape);
    }
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

let startBlob = []; 

function interpolatePositions(current, target, progress) {
    return {
        x: current.x + (target.x - current.x) * progress,
        y: current.y + (target.y - current.y) * progress,
    };
}
function changeBlobShape(shape) {
    const angleIncrement = (2 * Math.PI) / numSymbols;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    startBlob = blob.map(part => ({ x: part.x, y: part.y })); 
    targetBlob = []; 

    for (let i = 0; i < blob.length; i++) {
        let x, y;
        const angle = angleIncrement * i;

        if (shape === 'normal') {
            const distanceFromCenter = Math.random() * blobRadius;
            x = centerX + Math.cos(angle) * distanceFromCenter;
            y = centerY + Math.sin(angle) * distanceFromCenter;
        } else if (shape === 'circle') {
            x = centerX + Math.cos(angle) * blobRadius;
            y = centerY + Math.sin(angle) * blobRadius;
        } else if (shape === 'square') {
            const sideLength = blobRadius * 2;
            const segment = i % (numSymbols / 4);
            if (i < numSymbols / 4) {
                x = centerX - blobRadius + (segment / (numSymbols / 4)) * sideLength;
                y = centerY - blobRadius;
            } else if (i < numSymbols / 2) {
                x = centerX + blobRadius;
                y = centerY - blobRadius + ((segment + 1) / (numSymbols / 4)) * sideLength;
            } else if (i < (3 * numSymbols) / 4) {
                x = centerX + blobRadius - ((segment + 2) / (numSymbols / 4)) * sideLength;
                y = centerY + blobRadius;
            } else {
                x = centerX - blobRadius;
                y = centerY + blobRadius - ((segment + 3) / (numSymbols / 4)) * sideLength;
            }
        } else if (shape === 'heart') {
            const t = angle; 
            const scale = 15;
            x = centerX + scale * 16 * Math.pow(Math.sin(t), 3);
            y = centerY - scale * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        } else if (shape === 'target') {
            const spikes = 5;
            const radius1 = blobRadius;
            const radius2 = blobRadius / 2;
            const spikeAngle = Math.PI / spikes;

            if (i % 2 === 0) {
                x = centerX + Math.cos(angle) * radius1;
                y = centerY + Math.sin(angle) * radius1;
            } else {
                x = centerX + Math.cos(angle + spikeAngle) * radius2;
                y = centerY + Math.sin(angle + spikeAngle) * radius2;
            }
        } else if (shape === 'spiral') {
            const spiralTurns = 5; 
            const maxRadius = blobRadius; 
            const totalSymbols = numSymbols; 
            const angle = (i / totalSymbols) * spiralTurns * Math.PI * 2; 
            const radius = (i / totalSymbols) * maxRadius; 
        
            x = centerX + radius * Math.cos(angle);
            y = centerY + radius * Math.sin(angle);

        } else if (shape === 'flower') {
            const petals = 6; 
            const petalDepth = 0.3; 
            const radius = blobRadius * (1 + petalDepth * Math.sin(petals * angle)); 
        
            x = centerX + radius * Math.cos(angle);
            y = centerY + radius * Math.sin(angle);

        } else if (shape === 'starburst') {
            const spikes = 12; 
            const spikeIntensity = 0.7; 
            const waveFrequency = 3; 
            const waveAmplitude = 0.2; 
            const baseRadius = blobRadius; 
            const radius = baseRadius * (
                1 +
                spikeIntensity * Math.sin(spikes * angle) + 
                waveAmplitude * Math.sin(waveFrequency * spikes * angle) 
            );

            x = centerX + radius * Math.cos(angle);
            y = centerY + radius * Math.sin(angle);

        } else if (shape === 'triangle') {
            const triangleSides = 3; 
            const perimeterSegments = numSymbols / triangleSides; 
        
            const rawVertices = [
                { x: 0, y: -blobRadius }, 
                { x: -blobRadius, y: blobRadius }, 
                { x: blobRadius, y: blobRadius }  
            ];
        
            const centroid = {
                x: (rawVertices[0].x + rawVertices[1].x + rawVertices[2].x) / 3,
                y: (rawVertices[0].y + rawVertices[1].y + rawVertices[2].y) / 3
            };
        
            const vertices = rawVertices.map(vertex => ({
                x: vertex.x - centroid.x + centerX,
                y: vertex.y - centroid.y + centerY
            }));
        
            const side = Math.floor(i / perimeterSegments);
            const t = (i % perimeterSegments) / perimeterSegments; 
        
            const startVertex = vertices[side];
            const endVertex = vertices[(side + 1) % triangleSides];
        
            x = startVertex.x + t * (endVertex.x - startVertex.x);
            y = startVertex.y + t * (endVertex.y - startVertex.y);
        }  

        blob[i].originalX = x;
        blob[i].originalY = y;
        blob[i].x = x;
        blob[i].y = y;

        targetBlob.push({ x, y }); 
    }
    morphing = true;
    morphProgress = 0;
}

function drawBlob() {
    if (morphing) {
        morphProgress += 0.01;
        if (morphProgress >= 1) {
            morphProgress = 1;
            morphing = false;

            blob.forEach(part => {
                part.vx = 0;
                part.vy = 0;
                part.x = part.originalX;
                part.y = part.originalY;
            });
        }
    }

    swirlAngle += swirlSpeed;
    time += waveEffect * 0.02;

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#e1bee7');
    gradient.addColorStop(0.25, '#ce93d8');
    gradient.addColorStop(0.5, '#ba68c8');
    gradient.addColorStop(0.75, '#ab47bc');
    gradient.addColorStop(1, '#9c27b0');

    blob.forEach((part, index) => {
        if (morphing) {
            const start = startBlob[index];
            const target = targetBlob[index];
            const interpolated = interpolatePositions(start, target, morphProgress);
            part.x = interpolated.x;
            part.y = interpolated.y;
        }

        const dx = mouse.x - part.x;
        const dy = mouse.y - part.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (!morphing) {
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
        }

        ctx.fillStyle = gradient;
        ctx.font = `${symbolSize}px monospace`;
        ctx.fillText(part.symbol, part.x, part.y);

        if (mirrorMode) {
            const mirroredX = canvas.width - part.x;
            ctx.fillText(part.symbol, mirroredX, part.y);
        }
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

    if (is3DMode) {
        cubeAngleX += 0.01;
        cubeAngleY += 0.01;
        switchTo3DObject();
    }

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