// js/main.js (обновленные/новые части)

// --- Импорт модуля событий (в реальном проекте это будет через import/export или глобальная переменная) ---
// Пока что мы просто будем ссылаться на объект eventsModule, который будет определен в events.js
// В более сложной архитектуре (например, с ES6 modules) это было бы иначе.

// --- Добавим переменную для хранения текущего активного события ---
let currentEvent = null; // Объект текущего события, если оно активно

// --- Обновим addToLog для лучшей читаемости ---
function addToLog(message, isEventMessage = false) {
    const logDiv = document.getElementById('game-log');
    const messageElement = document.createElement('div');
    if (isEventMessage) {
        messageElement.style.fontWeight = 'bold'; // Выделяем сообщения событий
        messageElement.style.color = '#ff0'; // Желтый цвет для событий
    }
    messageElement.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logDiv.appendChild(messageElement);
    logDiv.scrollTop = logDiv.scrollHeight; // Автопрокрутка вниз
}

// --- Функция для отображения события в UI ---
function showEvent(eventData) {
    currentEvent = eventData; // Сохраняем ссылку на текущее событие

    const descriptionDiv = document.getElementById('description-text');
    const actionsDiv = document.querySelector('.actions-section');

    // Очищаем описание и действия
    descriptionDiv.innerHTML = `<p>${eventData.description}</p>`;
    actionsDiv.innerHTML = '<h2>Выбор:</h2>'; // Очищаем старые кнопки

    // Создаем кнопки для выборов
    eventData.choices.forEach((choice, index) => {
        const button = document.createElement('button');
        button.textContent = choice.text;
        button.addEventListener('click', () => {
            handleEventChoice(index);
        });
        actionsDiv.appendChild(button);
    });

    // Добавляем сообщение в лог
    addToLog(`Событие: ${eventData.title}`, true);
}

// --- Функция для обработки выбора в событии ---
function handleEventChoice(choiceIndex) {
    if (!currentEvent) return;

    const choice = currentEvent.choices[choiceIndex];
    if (!choice) {
        console.error("Неверный индекс выбора:", choiceIndex);
        return;
    }

    // Применяем эффекты выбора
    if (choice.effects) {
        applyEventEffects(choice.effects);
    }

    // Добавляем результат выбора в лог
    if (choice.outcome) {
        addToLog(choice.outcome, true);
    }

    // Скрываем событие и возвращаем обычный UI
    hideEvent();
    updateUI(); // Обновляем UI после применения эффектов
}

// --- Функция для применения эффектов события ---
function applyEventEffects(effects) {
    for (const [key, value] of Object.entries(effects)) {
        // Предполагаем, что ключи имеют формат "player.health", "inventory.Предмет" и т.д.
        if (key.startsWith('player.')) {
            const stat = key.split('.')[1];
            if (gameState.player.hasOwnProperty(stat)) {
                // Простая логика: если значение число - прибавляем/вычитаем, если строка - устанавливаем
                if (typeof value === 'number') {
                    gameState.player[stat] += value;
                    // Убедимся, что значения остаются в пределах
                    if (['health', 'maxHealth'].includes(stat)) {
                         gameState.player[stat] = Math.max(0, Math.min(gameState.player.maxHealth, gameState.player[stat]));
                    } else if (['hunger', 'thirst', 'fatigue', 'maxHunger', 'maxThirst', 'maxFatigue'].includes(stat)) {
                         const maxStat = stat.replace('max', ''); // hunger -> maxHunger -> hunger
                         const maxValue = gameState.player[`max${stat.charAt(0).toUpperCase() + stat.slice(1)}`] || 100;
                         gameState.player[stat] = Math.max(0, Math.min(maxValue, gameState.player[stat]));
                    }
                } else {
                    gameState.player[stat] = value;
                }
                 addToLog(`Изменение ${stat}: ${typeof value === 'number' ? (value > 0 ? '+' : '') + value : value}`);
            }
        } else if (key.startsWith('inventory.')) {
            const itemName = key.split('.').slice(1).join('.'); // На случай, если имя предмета содержит точки
            const currentQuantity = gameState.inventory[itemName] || 0;
            const newQuantity = currentQuantity + value;
            if (newQuantity > 0) {
                gameState.inventory[itemName] = newQuantity;
            } else {
                delete gameState.inventory[itemName]; // Удаляем предмет, если количество <= 0
            }
            addToLog(`Инвентарь: ${itemName} ${value > 0 ? '+' : ''}${value}`);
        }
        // Можно добавить обработку других типов эффектов (например, флаги, мир и т.д.)
    }
}


// --- Функция для скрытия события и возврата к обычному UI ---
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

// --- Обновим функцию explore для интеграции с системой событий ---
function explore() {
    // Сначала применяем стандартные эффекты исследования
    const fatigueIncrease = 5;
    const hungerIncrease = 3;
    const thirstIncrease = 4;

    gameState.player.fatigue = Math.min(gameState.player.maxFatigue, gameState.player.fatigue + fatigueIncrease);
    gameState.player.hunger = Math.min(gameState.player.maxHunger, gameState.player.hunger + hungerIncrease);
    gameState.player.thirst = Math.min(gameState.player.maxThirst, gameState.player.thirst + thirstIncrease);

    addToLog(`Вы исследуете окрестности... Усталость +${fatigueIncrease}, Голод +${hungerIncrease}, Жажда +${thirstIncrease}.`);

    // Проверка на смерть после стандартных эффектов
    if (checkDeath()) {
        return; // Игра остановлена в checkDeath
    }

    // --- Теперь запускаем систему событий ---
    // Предполагаем, что eventsModule доступен глобально (или импортирован)
    if (typeof eventsModule !== 'undefined' && eventsModule.getRandomEvent) {
        // Добавим шанс события, например, 40%
        if (Math.random() < 0.4) {
            const event = eventsModule.getRandomEvent(gameState);
            if (event) {
                showEvent(event);
                // updateUI(); // updateUI будет вызван после обработки выбора
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
}

// --- Функция проверки смерти ---
function checkDeath() {
    if (gameState.player.hunger >= gameState.player.maxHunger || gameState.player.thirst >= gameState.player.maxThirst || gameState.player.health <= 0) {
        gameState.player.health = 0;
        updateUI();
        addToLog("=== ВЫ УМЕРЛИ ===");
        clearInterval(gameInterval);
        document.getElementById('rest-btn').disabled = true;
        document.getElementById('explore-btn').disabled = true;
        if (currentEvent) hideEvent(); // Скрываем событие, если оно было активно
        return true;
    }
    return false;
}

// --- Остальной код main.js остается без изменений ---
// (DOMContentLoaded, gameLoop, updateUI, rest и т.д.)
