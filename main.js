// --- Sound Engine ---
const synth = new Tone.Synth().toDestination();
const sounds = {
    success: () => synth.triggerAttackRelease("C5", "8n"),
    failure: () => synth.triggerAttackRelease("C3", "8n"),
    click: () => synth.triggerAttackRelease("C4", "16n"),
    drop: () => synth.triggerAttackRelease("E4", "16n"),
    win: () => {
        const now = Tone.now();
        const startTime = now + 0.01;
        synth.triggerAttackRelease("C5", "8n", startTime);
        synth.triggerAttackRelease("E5", "8n", startTime + 0.2);
        synth.triggerAttackRelease("G5", "8n", startTime + 0.4);
    }
};

// --- Global State & Navigation ---
const mainMenu = document.getElementById('main-menu');
const gameContainer = document.getElementById('game-container');
const gameScreens = document.querySelectorAll('.game-screen');

function showGame(gameId) {
    sounds.click();
    mainMenu.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    gameScreens.forEach(screen => screen.classList.add('hidden'));
    document.getElementById(gameId).classList.remove('hidden');

    if (gameId === 'robot-game') {
        initRobotGame();
        showModal('❔', 'Peraturan', "Bantu robot menemukan berlian! <br> Bantu robot menemukan berlian sebanyak 10x untuk memenangkan permainan.", 'Mulai permainan!', () => { })
    };
    if (gameId === 'toys-game') initToysGame();
    if (gameId === 'recipe-game') initRecipeGame();
}

function showMenu() {
    sounds.click();
    mainMenu.classList.remove('hidden');
    gameContainer.classList.add('hidden');
}

// --- Modal ---
const modal = document.getElementById('modal');
const modalContent = document.getElementById('modal-content');

function showModal(emoji, title, message, buttonText, onButtonClick) {
    modalContent.innerHTML = `
                <div class="text-8xl mb-4">${emoji}</div>
                <h3 class="text-3xl font-display text-blue-600 mb-2">${title}</h3>
                <p class="text-gray-600 mb-6">${message}</p>
                <button id="modal-button" class="btn bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-xl text-lg font-display">${buttonText}</button>
            `;
    modal.classList.remove('hidden');
    document.getElementById('modal-button').onclick = () => {
        sounds.click();
        modal.classList.add('hidden');
        if (onButtonClick) onButtonClick();
    };
}

// --- Game 1: Robot Game (Now with Tap Controls) ---
const robotGrid = document.getElementById('robot-grid');
const commandSequence = document.getElementById('command-sequence');
const availableCommands = document.getElementById('available-commands');
let robotPos = { x: 0, y: 0 };
let gemPos = { x: 0, y: 0 };
const gridSize = 5;
let score = 0;
const robotScore = document.getElementById("robot-score");
robotScore.textContent = score;

function initRobotGame() {
    robotGrid.innerHTML = '';
    commandSequence.innerHTML = '';

    for (let i = 0; i < gridSize * gridSize; i++) {
        const cell = document.createElement('div');
        cell.classList.add('w-full', 'h-full', 'bg-blue-200', 'rounded-md', 'flex', 'items-center', 'justify-center', 'text-2xl', 'md:text-3xl');
        robotGrid.appendChild(cell);
    }

    do {
        robotPos = { x: Math.floor(Math.random() * gridSize), y: Math.floor(Math.random() * gridSize) };
        gemPos = { x: Math.floor(Math.random() * gridSize), y: Math.floor(Math.random() * gridSize) };
    } while (robotPos.x === gemPos.x && robotPos.y === gemPos.y);

    drawRobotGrid();
}

function resetCommands() {
    commandSequence.innerHTML = '';
}

// Add tap listeners for robot game
availableCommands.addEventListener('click', e => {
    if (e.target.classList.contains('tappable-command')) {
        sounds.click();
        const command = e.target.dataset.command;
        const newBlock = document.createElement('div');
        newBlock.classList.add('command-block', 'bg-blue-500', 'text-white', 'p-3', 'rounded-lg', 'shadow-md', 'text-2xl');
        newBlock.dataset.command = command;
        newBlock.textContent = e.target.textContent;
        commandSequence.appendChild(newBlock);
    }
});

commandSequence.addEventListener('click', e => {
    if (e.target.classList.contains('command-block')) {
        sounds.failure();
        e.target.remove();
    }
});

function drawRobotGrid() {
    const cells = robotGrid.children;
    for (let i = 0; i < cells.length; i++) cells[i].textContent = '';
    cells[robotPos.y * gridSize + robotPos.x].textContent = '🤖';
    cells[gemPos.y * gridSize + gemPos.x].textContent = '💎';
}

function runRobot() {
    const userSequence = Array.from(commandSequence.children).map(el => el.dataset.command);
    let currentPos = { ...robotPos };
    let path = [];
    userSequence.forEach(cmd => {
        if (cmd === 'up') currentPos.y--;
        if (cmd === 'down') currentPos.y++;
        if (cmd === 'left') currentPos.x--;
        if (cmd === 'right') currentPos.x++;
        path.push({ ...currentPos });
    });
    animateRobot(path);
}

function animateRobot(path) {
    console.log(path);
    let step = 0;
    const interval = setInterval(() => {
        if (step < path.length) {
            const pos = path[step];
            const cells = robotGrid.children;
            for (let i = 0; i < cells.length; i++) {
                if (cells[i].textContent === '🤖') cells[i].textContent = '';
            }
            if (pos.x >= 0 && pos.x < gridSize && pos.y >= 0 && pos.y < gridSize) {
                cells[pos.y * gridSize + pos.x].textContent = '🤖';
            }
            step++;
        } else {
            clearInterval(interval);
            checkRobotWin(path[path.length - 1]);
        }
    }, 400);
}

function checkRobotWin(finalPos) {
    if (finalPos.x === gemPos.x && finalPos.y === gemPos.y) {
        score++;
        if (parseInt(score) < 10) {
            sounds.win();
            resetRobotGame();
            robotScore.textContent = score;
        } else {
            sounds.win();
            showModal('🎉', 'Berhasil!', 'Kamu hebat! Robotnya sampai ke tujuan.', 'Main Lagi', resetRobotGame);
            score = 0;
            robotScore.textContent = score;
        }
    } else {
        sounds.failure();
        score = 0;
        robotScore.textContent = score;
        showModal('😥', 'Oh tidak!', 'Robotnya tersesat. Coba periksa lagi urutan perintahmu!', 'Coba Lagi', () => {
            drawRobotGrid();
        });
    }
}

function resetRobotGame() {
    initRobotGame();
}

// --- Generic Drag and Drop Logic (for Mouse and Touch) ---
function enableDragAndDrop(dragContainer, dropContainers, onDrop) {
    let draggedItem = null;
    let clone = null;
    let startX, startY;

    // Mouse Events
    dragContainer.addEventListener('dragstart', e => {
        if (e.target.dataset.drag) {
            draggedItem = e.target;
            setTimeout(() => e.target.classList.add('hidden'), 0);
        }
    });

    dragContainer.addEventListener('dragend', e => {
        if (draggedItem) {
            draggedItem.classList.remove('hidden');
            draggedItem = null;
        }
    });

    dropContainers.forEach(container => {
        container.addEventListener('dragover', e => e.preventDefault());
        container.addEventListener('drop', e => {
            e.preventDefault();
            if (draggedItem) onDrop(draggedItem, container);
        });
    });

    // Touch Events
    dragContainer.addEventListener('touchstart', e => {
        if (e.target.dataset.drag) {
            draggedItem = e.target;
            clone = draggedItem.cloneNode(true);
            clone.classList.add('dragging');
            document.body.appendChild(clone);

            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;

            clone.style.left = `${touch.clientX - clone.offsetWidth / 2}px`;
            clone.style.top = `${touch.clientY - clone.offsetHeight / 2}px`;
            draggedItem.style.opacity = '0.5';
        }
    });

    dragContainer.addEventListener('touchmove', e => {
        if (draggedItem && clone) {
            e.preventDefault();
            const touch = e.touches[0];
            clone.style.left = `${touch.clientX - clone.offsetWidth / 2}px`;
            clone.style.top = `${touch.clientY - clone.offsetHeight / 2}px`;
        }
    });

    dragContainer.addEventListener('touchend', e => {
        if (draggedItem && clone) {
            clone.style.display = 'none';
            const endElement = document.elementFromPoint(
                e.changedTouches[0].clientX,
                e.changedTouches[0].clientY
            );
            clone.remove();

            let dropTarget = endElement;
            while (dropTarget && !dropTarget.dataset.drop) {
                dropTarget = dropTarget.parentElement;
            }

            if (dropTarget) {
                onDrop(draggedItem, dropTarget);
            }

            draggedItem.style.opacity = '1';
            draggedItem = null;
            clone = null;
        }
    });
}

// --- Game 2: Toys Game ---
const toysArea = document.getElementById('toys-area');
const toyBoxesArea = document.getElementById('toy-boxes-area');
const toyTypes = [
    { shape: 'bola', emoji: '⚽', boxEmoji: '🥅' },
    { shape: 'mobil', emoji: '🚗', boxEmoji: '🏠' },
    { shape: 'boneka', emoji: '🧸', boxEmoji: '🛏️' },
    { shape: 'balok', emoji: '🧱', boxEmoji: '📦' }
];

function initToysGame() {
    toysArea.innerHTML = '';
    toyBoxesArea.innerHTML = '';

    const toysToSort = [...toyTypes, ...toyTypes].sort(() => 0.5 - Math.random());
    toysToSort.forEach((toy, index) => {
        const toyEl = document.createElement('div');
        toyEl.classList.add('toy', 'text-5xl', 'p-2');
        toyEl.textContent = toy.emoji;
        toyEl.draggable = true;
        toyEl.dataset.drag = 'toy';
        toyEl.dataset.shape = toy.shape;
        toysArea.appendChild(toyEl);
    });

    toyTypes.forEach(type => {
        const boxEl = document.createElement('div');
        boxEl.classList.add('toy-box', 'p-6', 'rounded-xl', 'bg-purple-100', 'flex', 'flex-col', 'items-center', 'justify-center');
        boxEl.dataset.drop = 'toy-box';
        boxEl.dataset.shape = type.shape;
        boxEl.innerHTML = `<div class="text-6xl mb-2 pointer-events-none">${type.boxEmoji}</div><div class="font-bold text-purple-800 pointer-events-none">Kotak ${type.shape}</div>`;
        toyBoxesArea.appendChild(boxEl);
    });

    enableDragAndDrop(toysArea, Array.from(toyBoxesArea.children), (toy, box) => {
        if (box.dataset.shape === toy.dataset.shape) {
            sounds.success();
            toy.remove();
            if (toysArea.children.length === 0) {
                sounds.win();
                showModal('🏆', 'Hore!', 'Semua mainan sudah rapi!', 'Main Lagi', initToysGame);
            }
        } else {
            sounds.failure();
        }
    });
}

// --- Game 3: Recipe Game ---
const recipeStepsEl = document.getElementById('recipe-steps');
const ingredientsArea = document.getElementById('ingredients-area');
const cauldronEl = document.getElementById('cauldron');
const cakeResultEl = document.getElementById('cake-result');
const recipe = [
    { name: 'Tepung', emoji: '🍚' }, { name: 'Telur', emoji: '🥚' },
    { name: 'Gula', emoji: '🍬' }, { name: 'Susu', emoji: '🥛' },
];
let currentStep = 0;

function initRecipeGame() {
    currentStep = 0;
    cakeResultEl.textContent = '';
    cauldronEl.innerHTML = '🥣';
    cauldronEl.dataset.drop = 'cauldron';

    recipeStepsEl.innerHTML = '';
    recipe.forEach(step => {
        recipeStepsEl.innerHTML += `<li data-name="${step.name}">Masukkan ${step.name}</li>`;
    });
    updateRecipeStepsUI();

    ingredientsArea.innerHTML = '';
    const shuffledIngredients = [...recipe].sort(() => 0.5 - Math.random());
    shuffledIngredients.forEach(ing => {
        const el = document.createElement('div');
        el.classList.add('ingredient', 'text-5xl', 'p-3', 'bg-white', 'rounded-lg', 'shadow');
        el.textContent = ing.emoji;
        el.draggable = true;
        el.dataset.drag = 'ingredient';
        el.dataset.name = ing.name;
        ingredientsArea.appendChild(el);
    });

    enableDragAndDrop(ingredientsArea, [cauldronEl], (ingredient, cauldron) => {
        const correctIngredient = recipe[currentStep];
        if (ingredient.dataset.name === correctIngredient.name) {
            sounds.success();
            currentStep++;
            updateRecipeStepsUI();
            ingredient.draggable = false;
            ingredient.style.opacity = '0.5';

            if (currentStep === recipe.length) {
                sounds.win();
                cauldronEl.textContent = '✨';
                cakeResultEl.textContent = '🎂';
                showModal('🎂', 'Yummy!', 'Kue ajaib berhasil dibuat!', 'Buat Lagi', initRecipeGame);
            }
        } else {
            sounds.failure();
            showModal('🤨', 'Hmm...', 'Bukan bahan yang benar. Coba lihat resepnya!', 'Oke');
        }
    });
}

function updateRecipeStepsUI() {
    const steps = recipeStepsEl.children;
    for (let i = 0; i < steps.length; i++) {
        steps[i].classList.remove('font-bold', 'text-yellow-800', 'line-through', 'text-gray-400');
        if (i < currentStep) {
            steps[i].classList.add('line-through', 'text-gray-400');
        } else if (i === currentStep) {
            steps[i].classList.add('font-bold', 'text-yellow-800');
        }
    }
}

function resetRecipeGame() { initRecipeGame(); }

// --- Initial Load ---
window.onload = () => {
    document.body.addEventListener('click', () => Tone.start(), { once: true });
};