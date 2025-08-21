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
        // Можно добавить другие характеристики позже
    },
    inventory: {
        "Питательная паста": 3,
        "Гидрогель": 3,
        "Нож": 1,
        "Пистолет 9мм": 1,
        "Патроны 9мм": 18 // 2 обоймы по 9
    },
    world: {
        // Пока пусто, но сюда можно добавить информацию о локации
    },
    // Флаги для отслеживания прогресса
    flags: {
        introCompleted: true // Предположим, интро уже прошло
        // introCompleted: false // Если захотите реализовать интро позже
    }
};

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

    // Описание/События - пока статичное, позже будет динамическим
    // document.getElementById('description-text').textContent = "Текущая ситуация...";

    // Лог - можно добавлять сообщения сюда
}

function addToLog(message) {
    const logDiv = document.getElementById('game-log');
    const messageElement = document.createElement('div');
    messageElement.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logDiv.appendChild(messageElement);
    logDiv.scrollTop = logDiv.scrollHeight; // Автопрокрутка вниз
}

// --- Игровая Логика (Действия) ---

function rest() {
    // Простое действие: восстановление здоровья за счет увеличения усталости и голода/жажды
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
    updateUI(); // Обновляем UI после действия
}

function explore() {
    // Простое действие: исследование с шансом найти что-то или получить урон
    const outcomes = [
        { text: "Вы обыскали окрестности, но ничего не нашли.", items: {}, healthChange: 0, hungerChange: 5, thirstChange: 5, fatigueChange: 10 },
        { text: "Вы нашли немного растений. Возможно, их можно использовать.", items: {"Растения": 2}, healthChange: 0, hungerChange: 3, thirstChange: 3, fatigueChange: 8 },
        { text: "Вы поскользнулись и упали, получив царапину.", items: {}, healthChange: -5, hungerChange: 2, thirstChange: 2, fatigueChange: 5 },
        { text: "Вы услышали странный звук вдалеке. Лучше быть начеку.", items: {}, healthChange: 0, hungerChange: 4, thirstChange: 4, fatigueChange: 6 },
    ];

    const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];

    // Применяем изменения
    gameState.player.health = Math.max(0, Math.min(gameState.player.maxHealth, gameState.player.health + outcome.healthChange));
    gameState.player.hunger = Math.min(gameState.player.maxHunger, gameState.player.hunger + outcome.hungerChange);
    gameState.player.thirst = Math.min(gameState.player.maxThirst, gameState.player.thirst + outcome.thirstChange);
    gameState.player.fatigue = Math.min(gameState.player.maxFatigue, gameState.player.fatigue + outcome.fatigueChange);

    // Добавляем предметы в инвентарь
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


// --- Игровой Цикл ---
let gameInterval;

function gameLoop() {
    // Здесь будет логика пассивного течения времени
    // Например, увеличение голода, жажды, усталости
    gameState.player.hunger = Math.min(gameState.player.maxHunger, gameState.player.hunger + 0.5); // Голод растет медленно
    gameState.player.thirst = Math.min(gameState.player.maxThirst, gameState.player.thirst + 0.7); // Жажда растет немного быстрее
    gameState.player.fatigue = Math.min(gameState.player.maxFatigue, gameState.player.fatigue + 0.3); // Усталость растет медленно

    // Проверка на смерть (упрощенная)
    if (gameState.player.hunger >= gameState.player.maxHunger || gameState.player.thirst >= gameState.player.maxThirst || gameState.player.health <= 0) {
         gameState.player.health = 0; // Убедимся, что здоровье 0
         updateUI();
         addToLog("=== ВЫ УМЕРЛИ ===");
         clearInterval(gameInterval); // Останавливаем игру
         // Можно добавить кнопку "Начать заново"
         document.getElementById('rest-btn').disabled = true;
         document.getElementById('explore-btn').disabled = true;
         return;
    }


    updateUI(); // Обновляем UI на каждом тике
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
