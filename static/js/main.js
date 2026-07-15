document.addEventListener('DOMContentLoaded', () => {
    const generatorForm = document.getElementById('generatorForm');
    const productInfo = document.getElementById('product_info');
    const charCounter = document.getElementById('charCount');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');
    const btnIcon = document.getElementById('btnIcon');
    const btnLoader = document.getElementById('btnLoader');
    const resultsSection = document.getElementById('resultsSection');

    const captionsContainer = document.getElementById('captionsContainer');
    const hashtagsContainer = document.getElementById('hashtagsContainer');
    const ctasList = document.getElementById('ctasList');

    // State trackers for our custom button selectors
    let selectedPlatform = 'instagram';
    let selectedTone = 'professional';

    // Set up toggle logic for button groups
    setupToggleGroup('platformGroup', (val) => { selectedPlatform = val; });
    setupToggleGroup('toneGroup', (val) => { selectedTone = val; });

    function setupToggleGroup(groupId, callback) {
        const group = document.getElementById(groupId);
        if (!group) return;
        const buttons = group.querySelectorAll('.toggle-btn');
        
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                callback(btn.getAttribute('data-value'));
            });
        });
    }

    // Character counter logic
    productInfo.addEventListener('input', () => {
        const length = productInfo.value.length;
        charCounter.textContent = length;
        if (length >= 1800) {
            charCounter.style.color = '#ef4444';
        } else {
            charCounter.style.color = 'var(--text-secondary)';
        }
    });

    // Form submit controller
    generatorForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const infoValue = productInfo.value.trim();

        submitBtn.disabled = true;
        btnText.textContent = 'Generating Content...';
        btnIcon.style.display = 'none';
        btnLoader.style.display = 'block';

        try {
            const response = await fetch('/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    product_info: infoValue,
                    platform: selectedPlatform,
                    tone: selectedTone
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Server responded with an error');
            }

            renderResults(data);

        } catch (error) {
            showError(error.message);
        } finally {
            submitBtn.disabled = false;
            btnText.textContent = 'Generate Content';
            btnIcon.style.display = 'inline-block';
            btnLoader.style.display = 'none';
        }
    });

    function renderResults(data) {
        captionsContainer.innerHTML = '';
        hashtagsContainer.innerHTML = '';
        ctasList.innerHTML = '';

        // 1. Render Caption Cards
        data.captions.forEach(caption => {
            const card = document.createElement('div');
            card.className = 'caption-card';

            const text = document.createElement('p');
            text.className = 'caption-text';
            text.textContent = caption;

            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-btn';
            copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy Caption';
            copyBtn.onclick = () => copyTextToClipboard(caption, copyBtn);

            card.appendChild(text);
            card.appendChild(copyBtn);
            captionsContainer.appendChild(card);
        });

        // 2. Render Hashtags with Strict Double-Hashtag Protection
        data.hashtags.forEach(tag => {
            // Clean up text, remove all internal spaces, and strip any existing '#' prefixes
            let cleanTag = tag.trim().replace(/\s+/g, '').replace(/^#+/, '');

            // Safely apply exactly ONE single '#' at the front
            cleanTag = '#' + cleanTag;

            const chip = document.createElement('span');
            chip.className = 'hashtag-chip';
            chip.textContent = cleanTag;
            chip.onclick = () => copyTextToClipboard(cleanTag, chip);

            hashtagsContainer.appendChild(chip);
        });

        // 3. Render Call-To-Action Items
        data.ctas.forEach(cta => {
            const item = document.createElement('li');
            item.className = 'cta-item';

            const text = document.createElement('span');
            text.textContent = cta;

            const actionBtn = document.createElement('button');
            actionBtn.className = 'cta-copy';
            actionBtn.innerHTML = '<i class="fa-solid fa-copy"></i>';
            actionBtn.onclick = () => copyTextToClipboard(cta, actionBtn);

            item.appendChild(text);
            item.appendChild(actionBtn);
            ctasList.appendChild(item);
        });

        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    async function copyTextToClipboard(text, element) {
        try {
            await navigator.clipboard.writeText(text);
            const originalHTML = element.innerHTML;
            
            element.classList.add('copied');
            
            if (element.classList.contains('hashtag-chip')) {
                element.style.background = '#10b981';
                element.style.color = 'white';
                setTimeout(() => {
                    element.classList.remove('copied');
                    element.style.background = '';
                    element.style.color = '';
                }, 2000);
            } else if (element.classList.contains('cta-copy')) {
                element.innerHTML = '<i class="fa-solid fa-check" style="color: #10b981;"></i>';
                setTimeout(() => {
                    element.classList.remove('copied');
                    element.innerHTML = originalHTML;
                }, 2000);
            } else {
                element.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
                setTimeout(() => {
                    element.classList.remove('copied');
                    element.innerHTML = originalHTML;
                }, 2000);
            }
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    }

    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.position = 'fixed';
        errorDiv.style.bottom = '20px';
        errorDiv.style.right = '20px';
        errorDiv.style.background = '#f87171';
        errorDiv.style.color = '#7f1d1d';
        errorDiv.style.padding = '16px 24px';
        errorDiv.style.borderRadius = '12px';
        errorDiv.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.3)';
        errorDiv.style.zIndex = '1000';
        errorDiv.style.fontWeight = '600';
        errorDiv.textContent = message;

        document.body.appendChild(errorDiv);
        setTimeout(() => {
            errorDiv.remove();
        }, 4000);
    }
});