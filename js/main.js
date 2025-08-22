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
        introCompleted: true, // Предположим, интро уже прошло
        // --- Флаги для стартового квеста ---
        quest_started: false, // Начался ли квест
        quest_food_found: false, // Найдена еда
        quest_medicine_found: false, // Найдены лекарства
        quest_shelter_found: false, // Найдено убежище
        quest_crash_site_found: false, // Найден обломок корабля
        quest_base_established: false, // База создана
        // --- Общие флаги ---
        has_shelter: false, // Есть ли у игрока убежище
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
    
    // Обновление описания квеста (если квест активен)
    updateQuestDescription();
}

function updateQuestDescription() {
    const descriptionDiv = document.getElementById('description-text');
    let questDescription = "<p>Вы очнулись в спасательной капсуле после крушения корабля. Вокруг пусто, но вы чувствуете, что не один. Нужно выжить и найти способ подать сигнал о помощи.</p>";
    
    if (gameState.flags.quest_started && !gameState.flags.quest_base_established) {
        questDescription = "<p><strong>Стартовый квест: Выживание</strong></p><ul>";
        
        if (!gameState.flags.quest_food_found) {
            questDescription += "<li>☐ Найти еду</li>";
        } else {
            questDescription += "<li>✓ Найти еду</li>";
        }
        
        if (!gameState.flags.quest_medicine_found) {
            questDescription += "<li>☐ Найти лекарства</li>";
        } else {
            questDescription += "<li>✓ Найти лекарства</li>";
        }
        
        if (!gameState.flags.quest_shelter_found) {
            questDescription += "<li>☐ Найти убежище</li>";
        } else {
            questDescription += "<li>✓ Найти убежище</li>";
        }
        
        if (!gameState.flags.quest_crash_site_found) {
            questDescription += "<li>☐ Найти обломки корабля</li>";
        } else {
            questDescription += "<li>✓ Найти обломки корабля</li>";
        }
        
        questDescription += "</ul>";
        
        if (gameState.flags.quest_food_found && 
            gameState.flags.quest_medicine_found && 
            gameState.flags.quest_shelter_found && 
            gameState.flags.quest_crash_site_found) {
            questDescription += "<p><em>Вы выполнили все задачи! Теперь вы можете превратить обломки корабля в свою базу.</em></p>";
        }
    }
    
    if (gameState.flags.quest_base_established) {
        questDescription = "<p><strong>База создана!</strong></p><p>Вы превратили обломки корабля в свою базу. Теперь у вас есть безопасное место для отдыха и хранения ресурсов.</p>";
    }
    
    // Обновляем только если описание квеста отличается от текущего
    if (descriptionDiv.innerHTML !== questDescription) {
        descriptionDiv.innerHTML = questDescription;
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
    // Восстанавливаем описание квеста
    updateQuestDescription();
    
    // Восстанавливаем стандартные кнопки действий
    const actionsDiv = document.querySelector('.actions-section');
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
    
    // Добавляем кнопку "Создать базу", если все условия выполнены
    if (gameState.flags.quest_food_found && 
        gameState.flags.quest_medicine_found && 
        gameState.flags.quest_shelter_found && 
        gameState.flags.quest_crash_site_found && 
        !gameState.flags.quest_base_established) {
        const establishBaseBtn = document.createElement('button');
        establishBaseBtn.id = 'establish-base-btn';
        establishBaseBtn.textContent = 'Создать базу';
        establishBaseBtn.addEventListener('click', establishBase);
        actionsDiv.appendChild(establishBaseBtn);
    }
}

function handleEventChoice(choiceIndex) {
    if (!currentEvent) return;

    const choice = currentEvent.choices[choiceIndex];
    if (!choice) {
        console.error("Неверный индекс выбора:", choiceIndex);
        return;
    }

    // Сначала добавляем результат выбора в лог
    if (choice.outcome) {
        addToLog(choice.outcome, true);
    }

    // Затем применяем эффекты выбора
    if (choice.effects && choice.effects.length > 0) {
        applyEventEffects(choice.effects);
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
            
            // Проверяем, не выполнил ли игрок задачи квеста
            checkQuestProgress(effect.item);
        } else if (effect.type === 'flag') {
            gameState.flags[effect.flag] = effect.value;
            addToLog(`Флаг установлен: ${effect.flag} = ${effect.value}`);
            
            // Проверяем, не выполнил ли игрок задачи квеста
            if (effect.flag === 'quest_crash_site_found' && effect.value === true) {
                addToLog("Вы нашли обломки корабля! Теперь вы можете превратить их в свою базу.", true);
                updateUI(); // Обновляем UI, чтобы показать кнопку "Создать базу"
            }
        }
    });
}

// --- Функции для работы с квестом ---
function startQuest() {
    if (!gameState.flags.quest_started) {
        gameState.flags.quest_started = true;
        addToLog("=== СТАРТОВЫЙ КВЕСТ: Выживание ===", true);
        addToLog("Вам нужно найти еду, лекарства, убежище и обломки корабля.", true);
        updateUI();
    }
}

function checkQuestProgress(itemName) {
    if (!gameState.flags.quest_started) return;
    
    // Проверка на еду
    if (!gameState.flags.quest_food_found && 
        (itemName.includes("Паста") || itemName.includes("Растения") || itemName.includes("Мясо"))) {
        gameState.flags.quest_food_found = true;
        addToLog("✓ Задача выполнена: Найти еду", true);
    }
    
    // Проверка на лекарства
    if (!gameState.flags.quest_medicine_found && 
        (itemName.includes("Аптечка") || itemName.includes("Лекарства"))) {
        gameState.flags.quest_medicine_found = true;
        addToLog("✓ Задача выполнена: Найти лекарства", true);
    }
    
    // Проверка на убежище (через флаг, а не предмет)
    // Это будет обрабатываться в событиях
    
    // Проверка на обломки корабля (через флаг)
    // Это будет обрабатываться в событиях
    
    updateUI();
}

function establishBase() {
    if (gameState.flags.quest_food_found && 
        gameState.flags.quest_medicine_found && 
        gameState.flags.quest_shelter_found && 
        gameState.flags.quest_crash_site_found && 
        !gameState.flags.quest_base_established) {
        
        gameState.flags.quest_base_established = true;
        gameState.flags.has_shelter = true; // Устанавливаем общий флаг убежища
        addToLog("=== ВЫ СОЗДАЛИ СВОЮ БАЗУ! ===", true);
        addToLog("Обломки корабля стали вашим новым домом. Вы установили сигнальное устройство и начали восстанавливать системы.", true);
        updateUI();
        hideEvent(); // На случай, если кнопка была показана во время события
    }
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
    // Начинаем квест при первом исследовании
    if (!gameState.flags.quest_started) {
        startQuest();
    }
    
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
        // Проверяем прогресс квеста
        checkQuestProgress(itemName);
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
    addToLog("Нажмите 'Исследовать', чтобы начать свой путь.", true);

    // Запускаем игровой цикл (например, обновление раз в 5 секунд)
    gameInterval = setInterval(gameLoop, 5000); // 5000 мс = 5 секунд
});
