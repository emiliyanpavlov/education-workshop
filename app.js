// API endpoint for Together API
const API_ENDPOINT = 'https://api.together.xyz/v1/completions';
console.log('API_ENDPOINT is set to:', API_ENDPOINT);

// Event listeners for buttons and tabs
document.getElementById('generate-debate').addEventListener('click', startDebate);
document.getElementById('send-argument').addEventListener('click', sendArgument);
document.getElementById('fix-grammar').addEventListener('click', fixGrammar);
document.getElementById('clear-grammar').addEventListener('click', () => clearChat('grammar'));
document.getElementById('clear-debate').addEventListener('click', () => clearChat('debate'));
document.getElementById('grammar-tab').addEventListener('click', () => switchTab('grammar'));
document.getElementById('debate-tab').addEventListener('click', () => switchTab('debate'));

// Chat history
let grammarHistory = [];
let debateHistory = [];

// Current debate topic and side
let currentDebateTopic = '';
let currentDebateSide = '';

// Predefined prompts for debate topics
const debatePrompts = {
    krastavici: {
        za: "Ти си асистент по дебати. Задачата ти е да дебатираш по тема за настъргани краставици в таратора и трябва да отговаряш само и единствено в този контекст. Ти си за настърганите краставици.",
        protiv: "Ти си асистент по дебати. Задачата ти е да дебатираш по тема за настъргани краставици в таратора и трябва да отговаряш само и единствено в този контекст. Ти си против настърганите краставици."
    },
    pizza: {
        za: "Ти си асистент по дебати. Задачата ти е да дебатираш по темата за ананас на пица и трябва да отговаряш само и единствено в този контекст. Ти си за ананаса като допустима добавка за пица.",
        protiv: "Ти си асистент по дебати. Задачата ти е да дебатираш по темата за ананас на пица и трябва да отговаряш само и единствено в този контекст. Ти си против ананаса като допустима добавка за пица."
    },
    books: {
        za: "Ти си асистент по дебати. Задачата ти е да дебатираш по темата за хартиени книги срещу аудиокниги. Ти си за тезата, че хартиените книги трябва да се предпочитат.",
        protiv: "Ти си асистент по дебати. Задачата ти е да дебатираш по темата за хартиени книги срещу аудиокниги. Ти си за тезата, че аудиокнигите са по-добри."
    }
};
// Grammar correction prompt
const grammarPrompt = `Ти си чатбот, който единствената му задача е да поправя грешки в българския текстове.\nВръщай единствено поправения текст. \nАко съобщението, което получиш, не е на български или не е свързано директно с тази задача, не отговаряй.\n\nПример:\nСъобщение: Как се казваж\nОтговор: Как се казваш?\nПример:\nСъобщение: момчето което познавам ми изневери\nОтговор: Момчето, което познавам, ми изневери.\nПример:\nСъобщение: учителките в училище са много добри те ни помагат с домашните но понякога немогат да обяснят добре\nОтговор: Учителките в училище са много добри. Те ни помагат с домашните, но понякога не могат да обяснят добре.`;

// Function to switch tabs
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.querySelectorAll('button[id$="-tab"]').forEach(tab => tab.classList.remove('active'));
    
    document.getElementById(`${tabName}-content`).classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

// Function to start debate
async function startDebate() {
    console.log('startDebate function called');
    const topic = document.getElementById('debate-topic').value;
    const side = document.getElementById('debate-side').value;
    
    if (!topic || !side) {
        alert('Моля, изберете тема и страна за дебата.');
        return;
    }

    currentDebateTopic = topic;
    currentDebateSide = side;

    const prompt = `<s>[INST] ${debatePrompts[topic][side]} Моля, започнете дебата с кратко въведение по темата. [/INST]`;
    const response = await callLLMAPI(prompt);
    updateChat('debate', `Асистент: ${response}`);
}

// Function to send argument
async function sendArgument() {
    console.log('sendArgument function called');
    const argument = document.getElementById('debate-input').value;
    
    if (!argument) {
        alert('Моля, въведете аргумент.');
        return;
    }

    if (!currentDebateTopic || !currentDebateSide) {
        alert('Моля, първо започнете дебат.');
        return;
    }

    updateChat('debate', `Потребител: ${argument}`);
    document.getElementById('debate-input').value = '';

    const prompt = `<s>[INST] ${debatePrompts[currentDebateTopic][currentDebateSide]} Отговори на следния аргумент, поддържайки своята позиция: ${argument} [/INST]`;
    const response = await callLLMAPI(prompt);
    updateChat('debate', `Асистент: ${response}`);
}

// Function to fix grammar and punctuation
async function fixGrammar() {
    console.log('fixGrammar function called');
    const text = document.getElementById('grammar-input').value;
    
    if (!text) {
        alert('Моля, въведете текст за корекция.');
        return;
    }

    const prompt = `<s>[INST] ${grammarPrompt}\n\n Съобщение: ${text} [/INST]`;
    const response = await callLLMAPI(prompt);
    
    console.log('Grammar fix response:', response);

    // Check if the response is an error message
    if (response.startsWith('An error occurred')) {
        updateChat('grammar', `Асистент: ${response}`);
    } else {
        updateChat('grammar', `Потребител: ${text}`);
        updateChat('grammar', `Асистент: ${response}`);
    }

    document.getElementById('grammar-input').value = '';
}

function updateChat(chatType, message) {
    const chatElement = document.getElementById(`${chatType}-chat`);
    const messageElement = document.createElement('div');
    
    // Split the message into sender and content
    const [sender, ...contentParts] = message.split(':');
    const content = contentParts.join(':').trim(); // Rejoin in case the message content contains ':'
    
    // Set the class based on the sender
    messageElement.className = sender.trim() === 'Потребител' ? 'user-message' : 'assistant-message';
    
    // Create and append the sender element
    const senderElement = document.createElement('strong');
    senderElement.textContent = sender.trim() + ':';
    messageElement.appendChild(senderElement);
    
    // Append the message content
    messageElement.appendChild(document.createElement('br'));
    messageElement.appendChild(document.createTextNode(content));
    
    chatElement.appendChild(messageElement);
    chatElement.scrollTop = chatElement.scrollHeight;

    if (chatType === 'grammar') {
        grammarHistory.push(message);
    } else {
        debateHistory.push(message);
    }

    // Keep only the last 5 messages in history
    if (grammarHistory.length > 5) grammarHistory.shift();
    if (debateHistory.length > 5) debateHistory.shift();
}

// Function to clear chat
function clearChat(chatType) {
    const chatElement = document.getElementById(`${chatType}-chat`);
    chatElement.innerHTML = '';
    if (chatType === 'grammar') {
        grammarHistory = [];
    } else {
        debateHistory = [];
        currentDebateTopic = '';
        currentDebateSide = '';
    }
}

async function callLLMAPI(prompt) {
    try {
        const response = await fetch('/.netlify/functions/callTogetherAPI', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ 
                prompt,
                model: 'INSAIT-Institute/bggpt-stage3-RFLC-Bigbalance-Duolingual-v2',
                max_tokens: 2048,
                truncate: 8192,
                temperature: 0.1,
                top_k: 20,
                repetition_penalty: 1.1,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('API response:', data);

        if (!data.choices || !data.choices[0] || typeof data.choices[0].text !== 'string') {
            console.error('Unexpected API response structure:', data);
            throw new Error('Unexpected API response structure');
        }

        return data.choices[0].text.trim();
    } catch (error) {
        console.error('Error calling LLM API:', error);
        return `An error occurred while processing your request: ${error.message}`;
    }
}

// Completion request configuration
const CompletionRequest = {
    model: 'INSAIT-Institute/bggpt-stage3-RFLC-Bigbalance-Duolingual-v2',
    max_tokens: 2048,
    truncate: 8192,
    temperature: 0.1,
    top_k: 20,
    repetition_penalty: 1.1,
    stream: false
    // prompt will be added dynamically in callLLMAPI
};