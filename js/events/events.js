// js/events/events.js

// --- Список событий ---
const EVENTS = [
    {
        id: 'strange_noise',
        title: 'Странный шум',
        description: 'Из кустов доносится странный скрежет. Что-то движется. Вы чувствуете, что наблюдаете за вами.',
        // Условия появления (можно расширить)
        conditions: (gameState) => true, // Появляется всегда, если вызвано
        choices: [
            {
                text: 'Подкрасться и посмотреть',
                outcome: 'Вы осторожно приближаетесь. Внезапно, из тени выпрыгивает странное существо!',
                effects: [
                    { type: 'player', stat: 'health', value: -10 },
                    { type: 'player', stat: 'fatigue', value: 5 }
                ]
            },
            {
                text: 'Бросить камень, чтобы отвлечь',
                outcome: 'Камень с грохотом падает в кусты. Звук смолкает. Вы решаете обойти это место стороной.',
                effects: [
                    { type: 'player', stat: 'fatigue', value: 2 }
                ]
            },
            {
                text: 'Уйти как можно тише',
                outcome: 'Вы медленно отходите, стараясь не издавать ни звука. Скрежет постепенно стихает.',
                effects: [
                    { type: 'player', stat: 'fatigue', value: 3 }
                ]
            }
        ]
    },
    {
        id: 'find_cache',
        title: 'Старый тайник',
        description: 'Ваши поиски приводят вас к полузасыпанному ящику. Похоже, он остался от предыдущих поселенцев или исследователей.',
        conditions: (gameState) => true,
        choices: [
            {
                text: 'Открыть ящик',
                outcome: 'Внутри вы находите припасы!',
                effects: [
                    { type: 'inventory', item: 'Консервы', value: 2 },
                    { type: 'inventory', item: 'Вода (бутылка)', value: 1 },
                    { type: 'inventory', item: 'Аптечка', value: 1 }
                ]
            },
            {
                text: 'Осмотреть ящик снаружи',
                outcome: 'Ящик выглядит старым, но прочным. Вы замечаете следы какого-то существа рядом.',
                effects: []
            },
            {
                text: 'Оставить ящик в покое',
                outcome: 'Лучше не рисковать. Вы уходите, оставив тайник нетронутым.',
                effects: []
            }
        ]
    },
    {
        id: 'local_fauna',
        title: 'Местная фауна',
        description: 'Вы замечаете стайку небольших, похожих на крыс животных. Они что-то жадно поедают опавшие плоды.',
        conditions: (gameState) => true,
        choices: [
            {
                text: 'Попробовать поймать одну',
                outcome: 'Вам удается схватить одну из тварей. Она довольно сочная. Это может быть еда, если вы голодны.',
                effects: [
                    { type: 'player', stat: 'hunger', value: -15 },
                    { type: 'inventory', item: 'Мясо местное (сырое)', value: 1 }
                ]
            },
            {
                text: 'Понаблюдать за ними',
                outcome: 'Наблюдая, вы замечаете, что они избегают определенную часть растений. Интересно, почему?',
                effects: []
            },
            {
                text: 'Отпугнуть их',
                outcome: 'Вы кричите и машете руками. Стая с визгом разбегается. Вы чувствуете себя немного глупо.',
                effects: [
                    { type: 'player', stat: 'fatigue', value: 2 }
                ]
            }
        ]
    },
    {
        id: 'broken_shelter',
        title: 'Разрушенное укрытие',
        description: 'Вы натыкаетесь на полуразрушенную конструкцию, похожую на временный приют. Стены из металлических листов и пластика.',
        conditions: (gameState) => true,
        choices: [
            {
                text: 'Обследовать внутри',
                outcome: 'Внутри темно и пыльно. Вы находите немного полезных материалов.',
                effects: [
                    { type: 'inventory', item: 'Металлолом', value: 3 },
                    { type: 'inventory', item: 'Пластик', value: 2 }
                ]
            },
            {
                text: 'Попробовать починить',
                outcome: 'Вы потратили много сил, но немного укрепили конструкцию. Это может стать временным убежищем.',
                effects: [
                    { type: 'player', stat: 'fatigue', value: 10 }
                ]
            },
            {
                text: 'Осмотреть окрестности',
                outcome: 'Осмотрев территорию вокруг, вы находите следы других существ. Похоже, это место кто-то использует.',
                effects: []
            }
        ]
    }
    // --- Добавьте больше событий сюда ---
];

// --- Функция для получения случайного события ---
function getRandomEvent(gameState) {
    // Фильтруем события по условиям
    const availableEvents = EVENTS.filter(event => event.conditions(gameState));

    if (availableEvents.length === 0) {
        console.log("Нет доступных событий для текущего состояния.");
        return null;
    }

    // Выбираем случайное событие из доступных
    const randomIndex = Math.floor(Math.random() * availableEvents.length);
    // Глубокое копирование, чтобы не мутировать исходный объект
    return JSON.parse(JSON.stringify(availableEvents[randomIndex]));
}

// Экспортируем функцию для использования в main.js
// В более современном JS можно использовать export { getRandomEvent };
// Но для простоты делаем ее доступной глобально
window.gameEvents = {
    getRandomEvent: getRandomEvent
};
