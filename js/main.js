// js/main.js

// --- Инициализация Игрового Состояния ---
const gameState = {
    player: {
        health: 100,
        maxHealth: 100,
        hunger: 0, // 0 = не голоден, 100 = умирает от голода
        maxHunger: 100,
        thirst: 0, // 0 = не хочет пить, 100 = умирает от жажды
        maxThirst: 100,
        fatigue: 0, // 0 = бодр, 100 = истощен
        maxFatigue: 100,
    },
    inventory: {
        "Питательная паста": 3,
        "Гидрогель": 3,
        "Нож": 1,
        "Пистолет 9мм": 1,
        "Патроны 9мм": 18 // 2 обоймы по 9
    },
    world: {
        // Пока пусто
    },
    flags: {
        introCompleted: true // Предположим, интро уже прошло
    }
};

// --- Переменные ---
let currentEvent = null; // Объект текущего активного события
let gameInterval; // ID интервала игрового цикла

// --- Функции Обновления UI ---
function updateUI() {
    // Обновление статус-баров
    const healthPercent = (gameState.player.health / gameState.player.maxHealth) * 100;
    document.getElementById('health-value').textContent = Math.round(healthPercent);
    document.getElementById('health-bar').style.width = healthPercent + '%';

    const hungerPercent = (gameState.player.hunger / gameState.player.maxHunger) * 100;
    document.getElementById('hunger-value').textContent = Math.round(hungerPercent);
    document.getElementById('hunger-bar').style.width = hungerPercent + '%';

    const thirstPercent = (gameState.player.thirst / gameState.player.maxThirst) * 100;
    document.getElementById('thirst-value').textContent = Math.round(thirstPercent);
    document.getElementById('thirst-bar').style.width = thirstPercent + '%';

    const fatiguePercent = (gameState.player.fatigue / gameState.player.maxFatigue) * 100;
    document.getElementById('fatigue-value').textContent = Math.round(fatiguePercent);
    document.getElementById('fatigue-bar').style.width = fatiguePercent + '%';

    // Обновление инвентаря
    const inventoryList = document.getElementById('inventory-list');
    inventoryList.innerHTML = ''; // Очищаем список
    for (const [itemName, quantity] of Object.entries(gameState.inventory)) {
        if (quantity > 0) { // Показываем только предметы в наличии
             const listItem = document.createElement('li');
             listItem.textContent = `${itemName} (x${quantity})`;
             inventoryList.appendChild(listItem);
        }
    }
}

function addToLog(message, isEventMessage = false) {
    const logDiv = document.getElementById('game-log');
    const messageElement = document.createElement('div');
    if (isEventMessage) {
        messageElement.style.fontWeight = 'bold';
        messageElement.style.color = '#ff0'; // Желтый цвет для событий
    }
    messageElement.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logDiv.appendChild(messageElement);
    logDiv.scrollTop = logDiv.scrollHeight; // Автопрокрутка вниз
}

// --- Функции для работы с событиями ---
function showEvent(eventData) {
    currentEvent = eventData; // Сохраняем ссылку на текущее событие

    const descriptionDiv = document.getElementById('description-text');
    const actionsDiv = document.querySelector('.actions-section');

    // Очищаем описание и действия
    descriptionDiv.innerHTML = `<p><strong>${eventData.title}</strong></p><p>${eventData.description}</p>`;
    actionsDiv.innerHTML = '<h2>Выбор:</h2>';

    // Создаем кнопки для выборов
    eventData.choices.forEach((choice, index) => {
        const button = document.createElement('button');
        button.textContent = choice.text;
        button.addEventListener('click', () => handleEventChoice(index));
        actionsDiv.appendChild(button);
    });

    // Добавляем сообщение в лог
    addToLog(`Событие: ${eventData.title}`, true);
}

function hideEvent() {
    currentEvent = null;
    const descriptionDiv = document.getElementById('description-text');
    const actionsDiv = document.querySelector('.actions-section');

    // Восстанавливаем стандартное описание
    descriptionDiv.innerHTML = '<p>Вы очнулись в спасательной капсуле после крушения корабля. Вокруг пусто, но вы чувствуете, что не один. Нужно выжить и найти способ подать сигнал о помощи.</p>';

    // Восстанавливаем стандартные кнопки действий
    actionsDiv.innerHTML = '<h2>Действия:</h2>';
    const restBtn = document.createElement('button');
    restBtn.id = 'rest-btn';
    restBtn.textContent = 'Отдыхать';
    restBtn.addEventListener('click', rest);
    actionsDiv.appendChild(restBtn);

    const exploreBtn = document.createElement('button');
    exploreBtn.id = 'explore-btn';
    exploreBtn.textContent = 'Исследовать';
    exploreBtn.addEventListener('click', explore);
    actionsDiv.appendChild(exploreBtn);
}

function handleEventChoice(choiceIndex) {
    if (!currentEvent) return;

    const choice = currentEvent.choices[choiceIndex];
    if (!choice) {
        console.error("Неверный индекс выбора:", choiceIndex);
        return;
    }

    // Применяем эффекты выбора
    if (choice.effects && choice.effects.length > 0) {
        applyEventEffects(choice.effects);
    }

    // Добавляем результат выбора в лог
    if (choice.outcome) {
        addToLog(choice.outcome, true);
    }

    // Скрываем событие и возвращаем обычный UI
    hideEvent();
    updateUI(); // Обновляем UI после применения эффектов

    // Проверка на смерть после события
    checkDeath();
}

function applyEventEffects(effects) {
    effects.forEach(effect => {
        if (effect.type === 'player') {
            if (gameState.player.hasOwnProperty(effect.stat)) {
                if (effect.stat === 'health') {
                    gameState.player.health = Math.max(0, Math.min(gameState.player.maxHealth, gameState.player.health + effect.value));
                } else if (['hunger', 'thirst', 'fatigue'].includes(effect.stat)) {
                     const maxValue = gameState.player[`max${effect.stat.charAt(0).toUpperCase() + effect.stat.slice(1)}`];
                     gameState.player[effect.stat] = Math.max(0, Math.min(maxValue, gameState.player[effect.stat] + effect.value));
                } else {
                    // Для других параметров, если они будут
                    gameState.player[effect.stat] += effect.value;
                }
                addToLog(`Изменение ${effect.stat}: ${effect.value > 0 ? '+' : ''}${effect.value}`);
            }
        } else if (effect.type === 'inventory') {
            const currentQuantity = gameState.inventory[effect.item] || 0;
            const newQuantity = currentQuantity + effect.value;
            if (newQuantity > 0) {
                gameState.inventory[effect.item] = newQuantity;
            } else {
                delete gameState.inventory[effect.item]; // Удаляем предмет, если количество <= 0
            }
            addToLog(`Инвентарь: ${effect.item} ${effect.value > 0 ? '+' : ''}${effect.value}`);
        }
    });
}


// --- Игровая Логика (Действия) ---
function rest() {
    if (gameState.player.health >= gameState.player.maxHealth) {
        addToLog("Вы уже полностью здоровы.");
        return;
    }

    const healAmount = 10;
    const fatigueIncrease = 5;
    const hungerIncrease = 2;
    const thirstIncrease = 3;

    gameState.player.health = Math.min(gameState.player.maxHealth, gameState.player.health + healAmount);
    gameState.player.fatigue = Math.min(gameState.player.maxFatigue, gameState.player.fatigue + fatigueIncrease);
    gameState.player.hunger = Math.min(gameState.player.maxHunger, gameState.player.hunger + hungerIncrease);
    gameState.player.thirst = Math.min(gameState.player.maxThirst, gameState.player.thirst + thirstIncrease);

    addToLog(`Вы отдохнули. Здоровье +${healAmount}, Усталость +${fatigueIncrease}, Голод +${hungerIncrease}, Жажда +${thirstIncrease}.`);
    updateUI();
    checkDeath();
}

function explore() {
    // Сначала применяем стандартные эффекты исследования
    const fatigueIncrease = 5;
    const hungerIncrease = 3;
    const thirstIncrease = 4;

    gameState.player.fatigue = Math.min(gameState.player.maxFatigue, gameState.player.fatigue + fatigueIncrease);
    gameState.player.hunger = Math.min(gameState.player.maxHunger, gameState.player.hunger + hungerIncrease);
    gameState.player.thirst = Math.min(gameState.player.maxThirst, gameState.player.thirst + thirstIncrease);

    addToLog(`Вы исследуете окрестности... Усталость +${fatigueIncrease}, Голод +${hungerIncrease}, Жажда +${thirstIncrease}.`);
    updateUI();

    // Проверка на смерть после стандартных эффектов
    if (checkDeath()) {
        return;
    }

    // --- Теперь запускаем систему событий ---
    // Проверяем, доступен ли модуль событий
    if (typeof window.gameEvents !== 'undefined' && window.gameEvents.getRandomEvent) {
        // Добавим шанс события, например, 40%
        if (Math.random() < 0.4) {
            const event = window.gameEvents.getRandomEvent(gameState);
            if (event) {
                showEvent(event);
                return; // Не продолжаем стандартную логику explore
            }
        }
    }

    // Старая логика explore (если событие не произошло или модуль событий не загружен)
    const outcomes = [
        { text: "Вы обыскали окрестности, но ничего не нашли.", items: {}, healthChange: 0, hungerChange: 2, thirstChange: 2, fatigueChange: 3 },
        { text: "Вы нашли немного растений. Возможно, их можно использовать.", items: {"Растения": 2}, healthChange: 0, hungerChange: 1, thirstChange: 1, fatigueChange: 2 },
        { text: "Вы поскользнулись и упали, получив царапину.", items: {}, healthChange: -5, hungerChange: 1, thirstChange: 1, fatigueChange: 2 },
        { text: "Вы услышали странный звук вдалеке. Лучше быть начеку.", items: {}, healthChange: 0, hungerChange: 2, thirstChange: 2, fatigueChange: 4 },
    ];

    const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
    gameState.player.health = Math.max(0, Math.min(gameState.player.maxHealth, gameState.player.health + outcome.healthChange));
    gameState.player.hunger = Math.min(gameState.player.maxHunger, gameState.player.hunger + outcome.hungerChange);
    gameState.player.thirst = Math.min(gameState.player.maxThirst, gameState.player.thirst + outcome.thirstChange);
    gameState.player.fatigue = Math.min(gameState.player.maxFatigue, gameState.player.fatigue + outcome.fatigueChange);

    for (const [itemName, quantity] of Object.entries(outcome.items)) {
        if (gameState.inventory[itemName]) {
            gameState.inventory[itemName] += quantity;
        } else {
            gameState.inventory[itemName] = quantity;
        }
    }

    addToLog(outcome.text);
    if (Object.keys(outcome.items).length > 0) {
        addToLog(`Найдено: ${Object.entries(outcome.items).map(([name, qty]) => `${name} x${qty}`).join(', ')}`);
    }
    if (outcome.healthChange !== 0) addToLog(`Здоровье: ${outcome.healthChange > 0 ? '+' : ''}${outcome.healthChange}`);

    updateUI();
    checkDeath();
}

// --- Функция проверки смерти ---
function checkDeath() {
    if (gameState.player.hunger >= gameState.player.maxHunger || gameState.player.thirst >= gameState.player.maxThirst || gameState.player.health <= 0) {
        gameState.player.health = 0;
        updateUI();
        addToLog("=== ВЫ УМЕРЛИ ===");
        clearInterval(gameInterval);
        // Отключаем кнопки
        const buttons = document.querySelectorAll('.actions-section button');
        buttons.forEach(btn => btn.disabled = true);
        if (currentEvent) hideEvent(); // Скрываем событие, если оно было активно
        return true; // Умер
    }
    return false; // Жив
}

// --- Игровой Цикл ---
function gameLoop() {
    // Здесь будет логика пассивного течения времени
    // Например, увеличение голода, жажды, усталости
    gameState.player.hunger = Math.min(gameState.player.maxHunger, gameState.player.hunger + 0.5); // Голод растет медленно
    gameState.player.thirst = Math.min(gameState.player.maxThirst, gameState.player.thirst + 0.7); // Жажда растет немного быстрее
    gameState.player.fatigue = Math.min(gameState.player.maxFatigue, gameState.player.fatigue + 0.3); // Усталость растет медленно

    // Проверка на смерть
    checkDeath(); // checkDeath уже обновляет UI и останавливает игру

    // Обновляем UI на каждом тике (если игра не остановлена)
    // updateUI вызывается внутри checkDeath если игрок умер
    // если игрок жив, обновляем UI
    if (gameState.player.health > 0) {
         updateUI();
    }
}

// --- Инициализация и Запуск ---
document.addEventListener('DOMContentLoaded', () => {
    // Привязываем обработчики событий к кнопкам
    document.getElementById('rest-btn').addEventListener('click', rest);
    document.getElementById('explore-btn').addEventListener('click', explore);

    // Инициализируем UI
    updateUI();
    addToLog("Спасательная капсула приземлилась. Вы один. Нужно выжить.");

    // Запускаем игровой цикл (например, обновление раз в 5 секунд)
    gameInterval = setInterval(gameLoop, 5000); // 5000 мс = 5 секунд
});
