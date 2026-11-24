console.log("Gmail AI Reply Extension loaded");

// AI reply button
function createAiButton() {
    const button = document.createElement('button');
    button.style.cssText = `
        background-color: #1a73e8;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 8px 16px;
        font-size: 14px;
        cursor: pointer;
        margin-right: 8px;
    `;
    button.innerHTML = '🤖 AI Reply';
    button.onmouseover = () => button.style.backgroundColor = '#1557b0';
    button.onmouseout = () => button.style.backgroundColor = '#1a73e8';
    return button;
}

// Get email content from the conversation
function getEmailContent() {
    const selectors = [
        '.h7',              // Message body in conversation
        '.a3s.aiL',         // Alternative message body
        '.ii.gt .a3s'       // Message in thread
    ];

    for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
            let content = elements[elements.length - 1].innerText.trim();
            content = cleanEmailContent(content);
            if (content) return content;
        }
    }
    return '';
}

// Remove email headers and metadata
function cleanEmailContent(rawContent) {
    console.log('Raw content before cleaning:', rawContent);
    return rawContent.trim();
}

// Finding the compose toolbar
function findComposeToolbar() {
    const selectors = ['.btC', '.aDh', '.gU.Up'];
    for (const selector of selectors) {
        const toolbar = document.querySelector(selector);
        if (toolbar) return toolbar;
    }
    return null;
}

// Find the compose text box
function findComposeBox() {
    const selectors = [
        '[role="textbox"][g_editable="true"]',
        '[contenteditable="true"].Am'
    ];
    for (const selector of selectors) {
        const box = document.querySelector(selector);
        if (box) return box;
    }
    return null;
}

// Inject the AI reply button
function injectButton() {
    // Removing existing button
    const existing = document.querySelector('.ai-reply-button');
    if (existing) existing.remove();

    const toolbar = findComposeToolbar();
    if (!toolbar) return;

    const button = createAiButton();
    button.className = 'ai-reply-button';

    button.addEventListener('click', async () => {
        try {
            button.innerHTML = '⏳ Generating...';
            button.disabled = true;

            const emailContent = getEmailContent();
            console.log('Raw email content:', emailContent);
            console.log('Email content length:', emailContent ? emailContent.length : 0);
            console.log('Email content type:', typeof emailContent);
            
            if (!emailContent || emailContent.trim().length === 0) {
                throw new Error('No email content found');
            }

            const requestBody = {
                emailContent: emailContent, 
                tone: 'professional'
            };
            
            console.log('Sending to API:', JSON.stringify(requestBody, null, 2));

            const response = await fetch('http://localhost:8080/api/email/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) throw new Error('Failed to generate reply');

            const reply = await response.text();

            const composeBox = findComposeBox();
            if (!composeBox) {
                throw new Error('Compose box not found');
            }

            composeBox.focus();
            composeBox.innerHTML += '<br><br>' + reply;
            composeBox.dispatchEvent(new Event('input', { bubbles: true }));

        } catch (error) {
            console.error('Error:', error);
            alert('Error: ' + error.message);
        } finally {
            button.innerHTML = '🤖 AI Reply';
            button.disabled = false;
        }
    });

    toolbar.insertBefore(button, toolbar.firstChild);
}

// Watch for compose window changes
const observer = new MutationObserver(() => {
    if (findComposeToolbar() && !document.querySelector('.ai-reply-button')) {
        setTimeout(injectButton, 300);
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Initial injection
setTimeout(() => {
    if (findComposeToolbar()) injectButton();
}, 1000);