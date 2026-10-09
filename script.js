// ===== CONFIG =====
let conversationHistory = [];
const url =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';
const apiKey = window.API_KEY; // read from config.js

// ===== DOM ELEMENTS =====
const mybtn = document.getElementById('myButton');
const input = document.getElementById('input');
const conversation = document.getElementById('conversation');

// ===== EVENT LISTENERS =====
mybtn.addEventListener('click', handler);
input.addEventListener('keydown', (e) => e.key === 'Enter' && handler(e));

// ===== HANDLER FUNCTION =====
async function handler() {
    // Temp reset for testing purposes. Uncomment to reset history while testing.
    // conversationHistory = [];

    try {
        // Validate input
        if (!input.value.trim()) {
            alert('Please enter a question.');
            return;
        }
        // Add user's query to the conversation history
        conversationHistory.push({
            role: 'user',
            parts: [{ text: input.value }],
        });

        // console.log('Query with conversation History:', conversationHistory);

        // Send the entire conversation history to Gemini
        const response = await window.fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey,
            },
            body: JSON.stringify({ contents: conversationHistory }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const details = errorData.error?.message || errorData.message;
            throw new Error(
                `Request failed (HTTP ${response.status} ${response.statusText})${details ? `: ${details}` : '.'}`,
            );
        }

        // Process response
        const data = await response.json();
        const query = input.value;
        const answer = data.candidates[0].content.parts[0].text;

        // Add Gemini's reply to the conversation history
        conversationHistory.push({
            role: 'model',
            parts: [{ text: answer }],
        });

        console.log('Answered Conversation History:', conversationHistory);

        // Safely convert Markdown to HTML and sanitize it
        const markdown = marked.parse(answer);
        const sanitizedMarkdown = DOMPurify.sanitize(markdown);

        // Create query message group
        const queryWrapper = document.createElement('div');
        queryWrapper.classList.add('message-group', 'query-group');
        const queryLabel = document.createElement('small');
        queryLabel.classList.add('label');
        queryLabel.textContent = 'You:';
        const queryDiv = document.createElement('div');
        queryDiv.classList.add('query');
        queryDiv.textContent = query;
        queryWrapper.append(queryLabel, queryDiv);

        // Create answer message group
        const answerWrapper = document.createElement('div');
        answerWrapper.classList.add('message-group', 'answer-group');
        const answerLabel = document.createElement('small');
        answerLabel.classList.add('label');
        answerLabel.textContent = 'Gemini:';
        const answerDiv = document.createElement('div');
        answerDiv.classList.add('answer');
        answerDiv.innerHTML = sanitizedMarkdown;
        answerWrapper.append(answerLabel, answerDiv);

        // Append to conversation
        conversation.append(queryWrapper, answerWrapper);

        // Reset input
        input.value = '';
        input.focus();
    } catch (error) {
        console.error(error);
        alert(error.message || 'An unexpected error occurred.');
    }
}
