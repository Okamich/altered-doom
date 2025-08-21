// --- Система Событий ---

// Функция для отображения события в UI
function displayEvent(event) {
    const descriptionElement = document.getElementById('description-text');
    const actionsSection = document.querySelector('.actions-section');

    // Очищаем описание и действия
    descriptionElement.innerHTML = `<strong>${event.title || "Событие"}:</strong><br>${event.text}`;
    actionsSection.innerHTML = '<h2>Выбор:</h2>'; // Очищаем старые кнопки действий

    // Создаем кнопки для каждого выбора
    event.choices.forEach(choice => {
        const button = document.createElement('button');
        button.textContent = choice.text;
        button.addEventListener('click', () => {
            // Выполняем действие выбора
            if (choice.action) {
                choice.action(gameState);
            }
            // После выбора обновляем UI и возвращаем обычные действия
            updateUI();
            // Возвращаем стандартное описание (можно улучшить)
            descriptionElement.textContent = "Вы очнулись в спасательной капсуле после крушения корабля. Вокруг пусто, но вы чувствуете, что не один. Нужно выжить и найти способ подать сигнал о помощи.";
            // Возвращаем стандартные кнопки действий (временно просто пересоздаем explore)
            actionsSection.innerHTML = `
                <h2>Действия:</h2>
                <button id="rest-btn">Отдыхать</button>
                <button id="explore-btn">Исследовать</button>
            `;
            // Переопределяем обработчики (важно!)
            document.getElementById('rest-btn').addEventListener('click', rest);
            document.getElementById('explore-btn').addEventListener('click', explore);
        });
        actionsSection.appendChild(button);
    });
}

// Функция для запуска случайного события
function triggerRandomEvent() {
    // База данных событий
    const events = [
        {
            id: 'find_plant',
            title: 'Находка',
            text: 'Вы наткнулись на странный кустарник с сочными на вид плодами.',
            choices: [
                {
                    text: 'Собрать плоды',
                    action: (state) => {
                        const amount = Math.floor(Math.random() * 3) + 1; // 1-3
                        if (!state.inventory['Плоды кустарника']) state.inventory['Плоды кустарника'] = 0;
                        state.inventory['Плоды кустарника'] += amount;
                        addToLog(`Вы собрали ${amount} плодов кустарника.`);
                        // Плоды могут быть опасны или полезны - добавим немного риска
                        if (Math.random() > 0.7) { // 30% шанс отравления
                             const damage = Math.floor(Math.random() * 10) + 5;
                             state.player.health = Math.max(0, state.player.health - damage);
                             addToLog(`Плоды оказались ядовитыми! Вы потеряли ${damage} здоровья.`);
                        }
                    }
                },
                {
                    text: 'Осмотреть и уйти',
                    action: (state) => {
                        addToLog('Вы осторожно осмотрели кустарник, но решили не рисковать и пошли дальше.');
                    }
                }
            ],
            trigger: (state) => true, // Может произойти всегда
            weight: 10
        },
        {
            id: 'encounter_creature_passive',
            title: 'Встреча',
            text: 'Из-за утеса выползает странное существо. Оно похоже на ящерицу, но с хитиновым панцирем и большими глазами. Оно смотрит на вас, не проявляя агрессии.',
            choices: [
                {
                    text: 'Попытаться приручить',
                    action: (state) => {
                        // Очень простая логика приручения
                        if (state.inventory['Плоды кустарника'] && state.inventory['Плоды кустарника'] > 0) {
                            if (Math.random() > 0.5) {
                                addToLog('Вы протягиваете плоды существу. Оно берет их и, похоже, начинает вам доверять. У вас появился питомец!');
                                state.inventory['Плоды кустарника'] -= 1;
                                if (!state.inventory['Питомец (Ящерица)']) state.inventory['Питомец (Ящерица)'] = 0;
                                state.inventory['Питомец (Ящерица)'] += 1;
                                 // Можно добавить бонусы от питомца позже
                            } else {
                                addToLog('Существо с любопытством смотрит на вас, но затем уползает прочь.');
                                state.inventory['Плоды кустарника'] -= 1;
                            }
                        } else {
                             if (Math.random() > 0.7) { // Меньше шанс без еды
                                addToLog('Вы машете руками и издаете успокаивающие звуки. Существо, казалось, понимает вашу доброжелательность и уходит, оставляя после себя немного странного слизистого вещества.');
                                if (!state.inventory['Слизь']) state.inventory['Слизь'] = 0;
                                state.inventory['Слизь'] += 1;
                             } else {
                                addToLog('Существо испугалось ваших движений и быстро скрылось.');
                             }
                        }
                    }
                },
                {
                    text: 'Атаковать',
                    action: (state) => {
                        // Проверим, есть ли оружие
                        const hasGun = state.inventory['Пистолет 9мм'] && state.inventory['Патроны 9мм'] > 0;
                        const hasMelee = state.inventory['Нож'];

                        if (hasGun) {
                            state.inventory['Патроны 9мм'] -= 1;
                            addToLog('Вы достали пистолет и выстрелили. Существо погибло. Вы получили немного мяса.');
                            if (!state.inventory['Мясо местное']) state.inventory['Мясо местное'] = 0;
                            state.inventory['Мясо местное'] += 2;
                        } else if (hasMelee) {
                            // Ближний бой с риском
                            if (Math.random() > 0.3) { // 70% шанс победы
                                addToLog('Вы схватили нож и напали. После короткой схватки существо повержено. Вы получили немного мяса.');
                                if (!state.inventory['Мясо местное']) state.inventory['Мясо местное'] = 0;
                                state.inventory['Мясо местное'] += 1;
                            } else {
                                const damage = Math.floor(Math.random() * 15) + 5;
                                state.player.health = Math.max(0, state.player.health - damage);
                                addToLog(`Существо оказалось проворным и укусило вас! Вы потеряли ${damage} здоровья.`);
                            }
                        } else {
                            // Рукопашная без оружия - высокий риск
                            if (Math.random() > 0.8) { // 20% шанс победы
                                addToLog('Вы бросились на существо голыми руками. Это было рискованно, но вам удалось одолеть его. Вы получили немного мяса.');
                                if (!state.inventory['Мясо местное']) state.inventory['Мясо местное'] = 0;
                                state.inventory['Мясо местное'] += 1;
                            } else {
                                const damage = Math.floor(Math.random() * 20) + 10;
                                state.player.health = Math.max(0, state.player.health - damage);
                                addToLog(`Существо оказалось сильнее! Вы получили серьезные увечья. Потеряно ${damage} здоровья.`);
                            }
                        }
                    }
                },
                {
                    text: 'Наблюдать издалека',
                    action: (state) => {
                        addToLog('Вы остаетесь неподвижно, наблюдая за существом. Оно через некоторое время теряет к вам интерес и уползает.');
                    }
                }
            ],
            trigger: (state) => true, // Может произойти всегда
            weight: 8
        },
        {
            id: 'find_scrap',
            title: 'Находка',
            text: 'Вы наткнулись на обломок вашего корабля. Среди обломков можно найти что-нибудь полезное.',
            choices: [
                {
                    text: 'Обыскать обломки',
                    action: (state) => {
                        const outcomes = [
                            {item: "Металлолом", amount: 2, message: "Вы нашли приличное количество металлолома."},
                            {item: "Энергоячейка", amount: 1, message: "Среди проводов вы обнаружили целую энергоячейку!"},
                            {item: "Поврежденный коммуникатор", amount: 1, message: "Вы нашли коммуникатор, но он серьезно поврежден."},
                            {item: null, amount: 0, message: "Обломки оказались почти бесполезны. Вы устали зря."}, // Ничего не найдено
                            {item: "Металлолом", amount: 1, message: "Вы нашли немного металлолома и немного пыли.", fatigue: 5}, // С усталостью
                        ];

                        const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
                        if (outcome.item) {
                            if (!state.inventory[outcome.item]) state.inventory[outcome.item] = 0;
                            state.inventory[outcome.item] += outcome.amount;
                            addToLog(outcome.message);
                        } else {
                            addToLog(outcome.message);
                        }
                        if (outcome.fatigue) {
                            state.player.fatigue = Math.min(state.player.maxFatigue, state.player.fatigue + outcome.fatigue);
                            addToLog(`Усталость +${outcome.fatigue}`);
                        }
                    }
                },
                {
                    text: 'Уйти прочь',
                    action: (state) => {
                        addToLog('Обломки корабля вызывают тяжелые воспоминания. Вы решаете не рисковать и идете в обход.');
                    }
                }
            ],
            trigger: (state) => true, // Может произойти всегда
            weight: 7
        },
        {
            id: 'encounter_creature_aggressive',
            title: 'Нападение!',
            text: 'Из кустов внезапно выпрыгивает агрессивное существо! Оно рычит и бросается на вас!',
            choices: [
                {
                    text: 'Сражаться',
                    action: (state) => {
                         // Логика почти такая же, как в passive, но без варианта "приручить"
                         const hasGun = state.inventory['Пистолет 9мм'] && state.inventory['Патроны 9мм'] > 0;
                         const hasMelee = state.inventory['Нож'];

                         if (hasGun) {
                             state.inventory['Патроны 9мм'] -= 1;
                             addToLog('Вы достали пистолет и выстрелили. Существо погибло.');
                             if (!state.inventory['Мясо местное']) state.inventory['Мясо местное'] = 0;
                             state.inventory['Мясо местное'] += 2;
                         } else if (hasMelee) {
                             if (Math.random() > 0.4) { // 60% шанс победы в ближнем бою
                                 addToLog('Вы схватили нож. После жестокой схватки существо повержено.');
                                 if (!state.inventory['Мясо местное']) state.inventory['Мясо местное'] = 0;
                                 state.inventory['Мясо местное'] += 1;
                             } else {
                                 const damage = Math.floor(Math.random() * 20) + 10;
                                 state.player.health = Math.max(0, state.player.health - damage);
                                 addToLog(`Существо ранило вас! Потеряно ${damage} здоровья.`);
                             }
                         } else {
                             if (Math.random() > 0.9) { // 10% шанс победы без оружия
                                 addToLog('Несмотря на отсутствие оружия, вам удалось одолеть существо в рукопашной.');
                                 if (!state.inventory['Мясо местное']) state.inventory['Мясо местное'] = 0;
                                 state.inventory['Мясо местное'] += 1;
                             } else {
                                 const damage = Math.floor(Math.random() * 25) + 15;
                                 state.player.health = Math.max(0, state.player.health - damage);
                                 addToLog(`Существо свирепо атакует! Вы получили тяжелые раны. Потеряно ${damage} здоровья.`);
                             }
                         }
                    }
                },
                {
                    text: 'Бежать',
                    action: (state) => {
                        if (Math.random() > 0.3) { // 70% шанс убежать
                            addToLog('Вы развернулись и бросились бежать. Существо преследовало вас недолго и отстало.');
                            // Может быть небольшая усталость или стресс
                            state.player.fatigue = Math.min(state.player.maxFatigue, state.player.fatigue + 5);
                        } else {
                            const damage = Math.floor(Math.random() * 15) + 5;
                            state.player.health = Math.max(0, state.player.health - damage);
                            addToLog(`Вам не удалось убежать! Существо догнало вас и нанесло урон. Потеряно ${damage} здоровья.`);
                        }
                    }
                }
            ],
            trigger: (state) => true, // Может произойти всегда
            weight: 5 // Менее вероятно, чем пассивная встреча
        }
        // --- Сюжетные события ---
        // {
        //     id: 'intro_wake_up',
        //     title: 'Пробуждение',
        //     text: 'Вы очнулись в спасательной капсуле после крушения корабля. Вокруг пусто, но вы чувствуете, что не один. Нужно выalive и найти способ подать сигнал о помощи.',
        //     choices: [
        //         { text: 'Осмотреть капсулу', action: (state) => { addToLog("Вы осмотрели капсулу. Все системы работают, но ресурсов немного."); } },
        //         { text: 'Выйти наружу', action: (state) => { addToLog("Вы открыли шлюз и вышли из капсулы. Вокруг неизвестная планета."); state.flags.introCompleted = true; } }
        //     ],
        //     trigger: (state) => !state.flags.introCompleted,
        //     weight: 1000 // Очень высокий вес, чтобы точно сработало первым
        // }
    ];

    // Фильтруем события по триггерам
    const availableEvents = events.filter(event => event.trigger(gameState));

    if (availableEvents.length === 0) {
        console.log("Нет доступных событий для запуска.");
        return; // Нет событий для запуска
    }

    // Выбор события с учетом веса (Weighted Random Selection)
    let totalWeight = availableEvents.reduce((sum, event) => sum + event.weight, 0);
    let random = Math.random() * totalWeight;
    let currentWeight = 0;
    let selectedEvent = null;

    for (let event of availableEvents) {
        currentWeight += event.weight;
        if (random <= currentWeight) {
            selectedEvent = event;
            break;
        }
    }

    // Если по какой-то причине событие не выбрано (например, все веса 0), берем первое попавшееся
    if (!selectedEvent) {
        selectedEvent = availableEvents[0];
        console.warn("Не удалось выбрать событие по весу, выбрано первое доступное:", selectedEvent.id);
    }

    // Отображаем выбранное событие
    if (selectedEvent) {
        console.log("Запуск события:", selectedEvent.id);
        displayEvent(selectedEvent);
    }
}
