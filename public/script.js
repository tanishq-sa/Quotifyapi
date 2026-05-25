// Enhanced functionality for QuoteAPI
document.addEventListener('DOMContentLoaded', function() {
    // Tab functionality for Examples section
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Remove active class from all buttons and panes
            tabButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.classList.add('text-gray-300');
                btn.classList.remove('text-white', 'bg-white/10');
            });
            
            tabPanes.forEach(pane => {
                pane.classList.add('hidden');
                pane.classList.remove('active');
            });
            
            // Add active class to clicked button
            this.classList.add('active');
            this.classList.remove('text-gray-300');
            this.classList.add('text-white', 'bg-white/10');
            
            // Show corresponding tab pane
            const targetPane = document.getElementById(targetTab);
            if (targetPane) {
                targetPane.classList.remove('hidden');
                targetPane.classList.add('active');
            }
        });
    });

    // Helper to write text to clipboard with secure and insecure (fallback) support
    function writeTextToClipboard(text, successCallback, failureCallback) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(successCallback).catch(failureCallback);
        } else {
            // Fallback for insecure (HTTP) contexts
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.top = "0";
            textArea.style.left = "0";
            textArea.style.position = "fixed";
            textArea.style.opacity = "0";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                const successful = document.execCommand('copy');
                if (successful) {
                    successCallback();
                } else {
                    failureCallback(new Error('Fallback copy command was unsuccessful'));
                }
            } catch (err) {
                failureCallback(err);
            }
            document.body.removeChild(textArea);
        }
    }

    // Copy to clipboard functionality
    window.copyToClipboard = function(button, text) {
        writeTextToClipboard(text, function() {
            const originalText = button.innerHTML;
            button.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>Copied!';
            button.classList.add('text-green-400');
            
            setTimeout(function() {
                button.innerHTML = originalText;
                button.classList.remove('text-green-400');
            }, 2000);
        }, function(err) {
            console.error('Could not copy text: ', err);
        });
    };

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
        e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add active state to navigation links based on scroll position
    window.addEventListener('scroll', function() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link');
        
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollY >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('text-white', 'bg-white/10');
            link.classList.add('text-gray-300');
            if (link.getAttribute('href') === '#' + current) {
                link.classList.remove('text-gray-300');
                link.classList.add('text-white', 'bg-white/10');
            }
        });
    });

    // API Tester functionality for Try It section
    const testBtn = document.getElementById('test-btn');
    const responseStatus = document.getElementById('response-status');
    const responseBody = document.getElementById('response-body');
    const endpointSelect = document.getElementById('endpoint-select');
    const apiKeyInput = document.getElementById('api-key-input');
    const copyApiKeyBtn = document.getElementById('copy-api-key');

    // Function to get base URL (localhost for development, production URL for production)
    function getBaseUrl() {
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (isLocalhost) {
            return `http://localhost:${window.location.port || 3000}`;
        }
        return 'https://quotify.dazzelr.tech';
    }

    // Function to get full URL for requests
    function getFullUrl() {
        const selectedEndpoint = endpointSelect ? endpointSelect.value : '/api/v1/quotes';
        const baseUrl = getBaseUrl();
        return `${baseUrl}${selectedEndpoint}`;
    }

    // Function to auto-fill API key from localStorage
    function autoFillApiKey() {
        const storedApiKey = localStorage.getItem('apiKey');
        if (storedApiKey && apiKeyInput) {
            apiKeyInput.value = storedApiKey;
        }
    }

    // Function to refresh API key (can be called from other pages)
    function refreshApiKey() {
        autoFillApiKey();
    }

    // Make refreshApiKey available globally
    window.refreshApiKey = refreshApiKey;

    // Initialize API tester
    function initializeApiTester() {
        // Auto-fill API key on page load
        autoFillApiKey();
        
        // Copy API key functionality
        if (copyApiKeyBtn && apiKeyInput) {
            copyApiKeyBtn.addEventListener('click', function() {
                writeTextToClipboard(apiKeyInput.value, () => {
                    copyApiKeyBtn.innerHTML = `
                        <svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                    `;
                    setTimeout(() => {
                        copyApiKeyBtn.innerHTML = `
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                            </svg>
                        `;
                    }, 2000);
                }, (err) => {
                    console.error('Could not copy API key: ', err);
                });
            });
        }
    }

    // Initialize the API tester
    initializeApiTester();

    if (testBtn && responseStatus && responseBody) {
        testBtn.addEventListener('click', async function() {
            const apiKey = apiKeyInput ? apiKeyInput.value : (localStorage.getItem('apiKey') || 'your-api-key');
            const fullUrl = getFullUrl();
        
        // Update UI to show loading state
        responseStatus.textContent = 'Loading...';
        responseStatus.className = 'px-3 py-1 bg-yellow-500 text-white text-sm font-medium rounded-lg';
        responseBody.innerHTML = `
            <div class="text-center py-8">
                <div class="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                <p class="text-gray-300">Making request to:</p>
                <code class="bg-gray-800 px-2 py-1 rounded text-blue-400 text-sm">${fullUrl}</code>
                <p class="text-gray-400 text-sm mt-2">Using API Key: ${apiKey.substring(0, 8)}...</p>
            </div>
        `;
        
        try {
                const response = await fetch(fullUrl, {
                    headers: {
                        'x-api-key': apiKey
                    }
                });
            
            const data = await response.json();
            
                if (response.ok) {
            // Update UI to show success state
            responseStatus.textContent = `Success (${response.status})`;
            responseStatus.className = 'px-3 py-1 bg-green-500 text-white text-sm font-medium rounded-lg';
            
                    responseBody.innerHTML = `
                        <div class="flex items-center justify-between mb-4">
                            <h4 class="text-lg font-semibold text-white">Response Data</h4>
                            <button onclick="copyToClipboard(this, this.closest('.flex').nextElementSibling.querySelector('pre').textContent)" class="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors duration-300">
                                Copy Response
                            </button>
                        </div>
                        <div class="bg-gray-900/50 rounded-xl p-4 overflow-auto max-h-[400px]">
                            <pre class="text-green-400 text-sm font-mono whitespace-pre-wrap break-words">${JSON.stringify(data, null, 2)}</pre>
                        </div>
                    `;
            } else {
                    throw new Error(`HTTP ${response.status}: ${data.message || 'Request failed'}`);
                }
                
        } catch (error) {
            // Update UI to show error state
            responseStatus.textContent = 'Error';
            responseStatus.className = 'px-3 py-1 bg-red-500 text-white text-sm font-medium rounded-lg';
            responseBody.innerHTML = `
                <div class="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                    <div class="flex items-start gap-3">
                        <svg class="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <div class="flex-1 min-w-0">
                            <h4 class="font-semibold text-red-400 mb-2">Request Failed</h4>
                            <p class="text-red-200 text-sm leading-relaxed mb-3 break-words">${error.message}</p>
                            <div class="bg-gray-800/50 rounded-lg p-3">
                                <p class="text-gray-300 text-xs font-mono break-all">URL: ${fullUrl}</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            }
        });
    }

    // Add scroll-to-top button
    const scrollToTopBtn = document.createElement('button');
    scrollToTopBtn.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
        </svg>
    `;
    scrollToTopBtn.className = 'fixed bottom-8 right-8 bg-gradient-to-r from-blue-500 to-purple-500 text-white p-3 rounded-full shadow-2xl opacity-0 invisible transform translate-y-10 transition-all duration-300 hover:scale-110 hover:shadow-blue-500/25 z-40';
    scrollToTopBtn.title = 'Scroll to top';
    document.body.appendChild(scrollToTopBtn);
    
    // Show/hide scroll-to-top button
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            scrollToTopBtn.classList.remove('opacity-0', 'invisible', 'translate-y-10');
            scrollToTopBtn.classList.add('opacity-100', 'visible', 'translate-y-0');
        } else {
            scrollToTopBtn.classList.add('opacity-0', 'invisible', 'translate-y-10');
            scrollToTopBtn.classList.remove('opacity-100', 'visible', 'translate-y-0');
        }
    });
        
        // Smooth scroll to top
    scrollToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Add intersection observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe all sections for animation
    const sections = document.querySelectorAll('section[id]');
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
    });

    // Trigger header animation immediately
        setTimeout(() => {
        const header = document.getElementById('header');
        if (header) {
            header.style.opacity = '1';
            header.style.transform = 'translateY(0)';
        }
    }, 100);
});
