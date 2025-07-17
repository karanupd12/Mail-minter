console.log("Content script loaded");

// Function to create the AI reply button
function createAiButton() {
    const button = document.createElement('button');
    
    // Google-like styling
    button.style.cssText = `
        background-color: #36053fff;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 8px 16px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        margin-right: 8px;
        box-shadow: 0 1px 2px rgba(60,64,67,0.3);
        transition: background-color 0.2s;
    `;
    
    button.innerHTML = '🤖 AI Reply';
    button.setAttribute('title', 'Generate AI Reply');
    
    // Hover effect
    button.onmouseover = () => button.style.backgroundColor = '#1557b0';
    button.onmouseout = () => button.style.backgroundColor = '#1a73e8';
    
    return button;
}

// Get email content
function getEmailContent() {
    // Try multiple selectors for email content
    const selectors = ['.h7', '.a3s.aiL', '.gmail_quote', '[role="presentation"]'];
    
    for (const selector of selectors) {
        const content = document.querySelector(selector);
        if (content) {
            return content.innerText.trim();
        }
    }
    
    return '';
}

// Find compose toolbar
function findComposeToolbar() {
    const selectors = ['.aDh', '.btC', '[role="dialog"] .aDh', '.gU.Up'];
    for (const selector of selectors) {
        const toolbar = document.querySelector(selector);
        if (toolbar) return toolbar;
    }
    return null;
}

// Inject button into Gmail
function injectButton() {
    // Remove existing button
    const existingButton = document.querySelector('.ai-reply-button');
    if (existingButton) existingButton.remove();

    const toolBar = findComposeToolbar();
    if (!toolBar) return;

    const button = createAiButton();
    button.classList.add('ai-reply-button');

    // Button click handler
    button.addEventListener('click', async () => {
        try {
            button.innerHTML = '⏳ Generating...';
            button.disabled = true;

            const emailContent = getEmailContent();
            if (!emailContent) {
                throw new Error('No email content found');
            }

            const response = await fetch('http://localhost:8080/api/email/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    content: emailContent,
                    tone: 'friendly'
                })
            });

            if (!response.ok) {
                throw new Error('Failed to generate reply');
            }

            const generatedReply = await response.text();
            
            // Insert into compose box
            const composeBox = document.querySelector('[role="textbox"][g_editable="true"], [contenteditable="true"].Am');
            if (composeBox) {
                composeBox.focus();
                composeBox.innerHTML += '<br><br>' + generatedReply;
                
                // Trigger input event
                composeBox.dispatchEvent(new Event('input', { bubbles: true }));
            } else {
                throw new Error('Compose box not found');
            }

        } catch (error) {
            console.error('Error:', error);
            alert('Failed to generate reply: ' + error.message);
        } finally {
            button.innerHTML = '🤖 AI Reply';
            button.disabled = false;
        }
    });

    toolBar.insertBefore(button, toolBar.firstChild);
}

// Watch for compose window changes
const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        const addedNodes = Array.from(mutation.addedNodes);
        const hasComposeElements = addedNodes.some(node => 
            node.nodeType === Node.ELEMENT_NODE &&
            (node.matches('.aDh, .btC, [role="dialog"]') || 
             node.querySelector('.aDh, .btC, [role="dialog"]'))
        );

        if (hasComposeElements) {
            setTimeout(injectButton, 500);
        }
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Try to inject if compose is already open
setTimeout(() => {
    if (findComposeToolbar()) injectButton();
}, 1000);