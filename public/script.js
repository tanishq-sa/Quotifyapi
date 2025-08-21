// Tab functionality
document.addEventListener('DOMContentLoaded', function() {
    // Tab switching
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // Remove active class from all buttons and panes
            tabButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.classList.remove('border-blue-400');
                btn.classList.add('border-transparent');
            });
            tabPanes.forEach(pane => pane.classList.add('hidden'));
            
            // Add active class to clicked button and corresponding pane
            button.classList.add('active', 'border-blue-400');
            button.classList.remove('border-transparent');
            document.getElementById(targetTab).classList.remove('hidden');
        });
    });

    // Custom Dropdown functionality
    const dropdownTrigger = document.getElementById('dropdown-trigger');
    const dropdownMenu = document.getElementById('dropdown-menu');
    const selectedOption = document.getElementById('selected-option');
    const dropdownOptions = document.querySelectorAll('.dropdown-option');
    let selectedValue = '/api';

    // Toggle dropdown
    dropdownTrigger.addEventListener('click', (e) => {
        e.preventDefault();
        const isOpen = dropdownMenu.classList.contains('opacity-100');
        
        if (isOpen) {
            // Close dropdown
            dropdownMenu.classList.remove('opacity-100', 'visible', 'transform-none');
            dropdownMenu.classList.add('opacity-0', 'invisible', '-translate-y-2');
            dropdownTrigger.querySelector('svg').style.transform = 'rotate(0deg)';
        } else {
            // Open dropdown
            dropdownMenu.classList.remove('opacity-0', 'invisible', '-translate-y-2');
            dropdownMenu.classList.add('opacity-100', 'visible', 'transform-none');
            dropdownTrigger.querySelector('svg').style.transform = 'rotate(180deg)';
        }
    });

    // Handle option selection
    dropdownOptions.forEach(option => {
        option.addEventListener('click', () => {
            const value = option.getAttribute('data-value');
            const label = option.getAttribute('data-label');
            
            selectedValue = value;
            selectedOption.textContent = label;
            
            // Close dropdown
            dropdownMenu.classList.remove('opacity-100', 'visible', 'transform-none');
            dropdownMenu.classList.add('opacity-0', 'invisible', '-translate-y-2');
            dropdownTrigger.querySelector('svg').style.transform = 'rotate(0deg)';
            
            // Add visual feedback
            dropdownTrigger.classList.add('ring-2', 'ring-blue-500/50');
            setTimeout(() => {
                dropdownTrigger.classList.remove('ring-2', 'ring-blue-500/50');
            }, 300);
        });
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!dropdownTrigger.contains(e.target) && !dropdownMenu.contains(e.target)) {
            dropdownMenu.classList.remove('opacity-100', 'visible', 'transform-none');
            dropdownMenu.classList.add('opacity-0', 'invisible', '-translate-y-2');
            dropdownTrigger.querySelector('svg').style.transform = 'rotate(0deg)';
        }
    });

    // API Tester functionality
    const testBtn = document.getElementById('test-btn');
    const responseStatus = document.getElementById('response-status');
    const responseBody = document.getElementById('response-body');

    // Get the correct API domain for API calls
    let currentDomain;
    if (window.location.hostname === 'localhost' && window.location.port === '8000') {
        // If running on local Python server, use the actual API
        currentDomain = 'https://quotifyapi.vercel.app';
    } else {
        // Use current domain for production
        currentDomain = window.location.origin;
    }

        // Store the last API response data
    let lastResponseData = null;
    let isPrettyView = true;

    testBtn.addEventListener('click', async () => {
        const fullUrl = `${currentDomain}${selectedValue}`;
        
        // Update UI to show loading state
        responseStatus.textContent = 'Loading...';
        responseStatus.className = 'px-3 py-1 bg-yellow-500 text-white text-sm font-medium rounded-lg';
        responseBody.innerHTML = `
            <div class="text-center py-8">
                <div class="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                <p class="text-slate-300">Making request to: <code class="bg-slate-800 px-2 py-1 rounded text-blue-400">${fullUrl}</code></p>
            </div>
        `;
        
        try {
            const response = await fetch(fullUrl);
            
            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error(`Expected JSON but got: ${contentType || 'unknown'}`);
            }
            
            const data = await response.json();
            lastResponseData = data; // Store the raw data
            
            // Update UI to show success state
            responseStatus.textContent = `Success (${response.status})`;
            responseStatus.className = 'px-3 py-1 bg-green-500 text-white text-sm font-medium rounded-lg';
            
            // Show the current view (pretty or raw)
            if (isPrettyView) {
                responseBody.innerHTML = createFormattedJSON(data);
            } else {
                responseBody.innerHTML = createRawJSON(data);
            }
            
            // Show copy button and view toggle
            const copyBtn = document.getElementById('copy-response');
            const viewToggle = document.getElementById('view-toggle');
            copyBtn.classList.remove('hidden');
            viewToggle.classList.remove('opacity-0', 'invisible');
            viewToggle.style.display = 'flex';
            
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
                        <div>
                            <h4 class="font-semibold text-red-400 mb-2">Request Failed</h4>
                            <p class="text-red-200 text-sm leading-relaxed mb-3">${error.message}</p>
                            <div class="bg-slate-800/50 rounded-lg p-3">
                                <p class="text-slate-300 text-xs font-mono">URL: ${fullUrl}</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    });
    
    // Function to create beautifully formatted JSON (for website display)
    function createFormattedJSON(data) {
        const jsonString = JSON.stringify(data, null, 2);
        
        // Create a beautiful section layout with enhanced styling
        let formattedContent = '';
        
        // Process each top-level property
        Object.entries(data).forEach(([key, value], index) => {
            if (typeof value === 'object' && value !== null) {
                // Handle nested objects (like quote object)
                formattedContent += `
                    <div class="mb-6">
                        <div class="flex items-center gap-3 mb-4">
                            <div class="w-3 h-3 bg-blue-400 rounded-full"></div>
                            <h4 class="text-xl font-bold text-white">
                                ${key.charAt(0).toUpperCase() + key.slice(1)}
                            </h4>
                            <div class="flex-1 h-px bg-slate-600/50"></div>
                        </div>
                        <div class="bg-slate-700/80 border border-slate-600/50 rounded-xl p-6 shadow-lg">
                            ${Object.entries(value).map(([subKey, subValue]) => `
                                <div class="flex items-start gap-4 mb-4 last:mb-0 p-3 rounded-lg hover:bg-slate-600/30 transition-colors duration-150">
                                    <div class="flex items-center gap-2 min-w-[100px]">
                                        <span class="w-2 h-2 bg-blue-400 rounded-full"></span>
                                        <span class="text-blue-300 font-semibold text-sm uppercase tracking-wide">${subKey}</span>
                                    </div>
                                    <div class="flex-1">
                                        <span class="text-slate-100 text-base leading-relaxed">${subValue}</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            } else {
                // Handle simple properties with optimized styling
                formattedContent += `
                    <div class="flex items-center gap-4 mb-4 p-4 bg-slate-700/50 border border-slate-600/50 rounded-xl hover:bg-slate-700/70 transition-colors duration-150">
                        <div class="flex items-center gap-3 min-w-[120px]">
                            <span class="w-2 h-2 bg-green-400 rounded-full"></span>
                            <span class="text-green-300 font-semibold text-sm uppercase tracking-wide">${key}</span>
                        </div>
                        <div class="flex-1">
                            <span class="text-slate-100 text-base font-medium">${value}</span>
                        </div>
                    </div>
                `;
            }
        });
        
        return `
            <div class="space-y-6">
                <div class="flex items-center justify-between mb-6">
                    <div class="flex items-center gap-3">
                        <h4 class="text-xl font-bold text-white">Response Data</h4>
                        <div class="w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                            <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="px-3 py-1 bg-slate-700 text-slate-300 text-sm font-medium rounded-full border border-slate-600/50">
                            ${Object.keys(data).length} properties
                        </span>
                        <span class="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full border border-green-500/30">
                            Success
                        </span>
                    </div>
                </div>
                ${formattedContent}
            </div>
        `;
    }
    
    // Function to create raw JSON (for developers)
    function createRawJSON(data) {
        const jsonString = JSON.stringify(data, null, 2);
        
        return `
            <div class="space-y-6">
                <div class="flex items-center justify-between mb-8">
                    <div class="flex items-center gap-3">
                        <h4 class="text-2xl font-bold text-white">Raw JSON Response</h4>
                        <div class="w-8 h-8 bg-gradient-to-r from-purple-400 to-blue-500 rounded-full flex items-center justify-center">
                            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="px-4 py-2 bg-gradient-to-r from-slate-700 to-slate-800 text-slate-300 text-sm font-medium rounded-full border border-slate-600/50 shadow-lg">
                            ${Object.keys(data).length} properties
                        </span>
                        <span class="px-3 py-1 bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-400 text-xs font-medium rounded-full border border-purple-500/30">
                            Developer
                        </span>
                    </div>
                </div>
                <div class="bg-gradient-to-br from-slate-700/80 to-slate-800/80 border border-slate-600/50 rounded-2xl p-6 shadow-xl backdrop-blur-sm overflow-x-auto">
                    <pre class="text-sm leading-relaxed font-mono text-slate-200">${jsonString}</pre>
                </div>
            </div>
        `;
    }

    // Enhanced smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('nav a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                // Calculate offset for sticky navigation
                const navHeight = document.querySelector('nav').offsetHeight;
                const targetPosition = targetSection.offsetTop - navHeight - 20;
                
                // Enhanced click feedback animation matching header style
                link.style.transform = 'scale(0.92)';
                link.style.transition = 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)';
                link.style.filter = 'brightness(0.9)';
                
                setTimeout(() => {
                    link.style.transform = 'scale(1)';
                    link.style.filter = 'brightness(1)';
                }, 200);
                
                // Enhanced smooth scroll animation matching header style
                const startPosition = window.pageYOffset;
                const distance = targetPosition - startPosition;
                const duration = 1200; // Longer duration for smoother feel
                let startTime = null;
                
                function animation(currentTime) {
                    if (startTime === null) startTime = currentTime;
                    const timeElapsed = currentTime - startTime;
                    const progress = Math.min(timeElapsed / duration, 1);
                    
                    // Smooth easing function matching header animations
                    const easeOutQuart = t => 1 - Math.pow(1 - t, 4);
                    const easedProgress = easeOutQuart(progress);
                    
                    // Add slight bounce at the end for natural feel
                    const finalProgress = progress === 1 ? 1 : easedProgress;
                    
                    window.scrollTo(0, startPosition + distance * finalProgress);
                    
                    if (progress < 1) {
                        requestAnimationFrame(animation);
                    } else {
                        // Add a subtle final animation when reaching target
                        setTimeout(() => {
                            targetSection.style.transform = 'scale(1.02)';
                            targetSection.style.transition = 'transform 0.3s ease-out';
                            setTimeout(() => {
                                targetSection.style.transform = 'scale(1)';
                            }, 300);
                        }, 100);
                    }
                }
                
                requestAnimationFrame(animation);
                
                // Active state styling
                navLinks.forEach(navLink => {
                    navLink.classList.remove('text-blue-400', 'bg-blue-500/10', 'border-blue-400');
                });
                
                link.classList.add('text-blue-400', 'bg-blue-500/10', 'border-blue-400');
                
                // Remove active state after animation
                setTimeout(() => {
                    link.classList.remove('text-blue-400', 'bg-blue-500/10', 'border-blue-400');
                }, 1000);
            }
        });
    });
    
    // Removed heavy scroll progress indicator for better performance

    // Simplified Intersection Observer for better performance
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                
                // Enhanced animation for child elements including header buttons
                const animatedElements = entry.target.querySelectorAll('.group, .endpoint, .rate-limit-card, .install-method, a[href^="#"], a[href^="http"]');
                
                // Special handling for header buttons
                if (entry.target.id === 'header') {
                    const headerButtons = entry.target.querySelectorAll('a');
                    headerButtons.forEach((btn, index) => {
                        btn.style.opacity = '0';
                        btn.style.transform = 'translateY(20px)';
                        btn.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                        
                        setTimeout(() => {
                            btn.style.opacity = '1';
                            btn.style.transform = 'translateY(0)';
                        }, 200 + (index * 100)); // Staggered animation for buttons
                    });
                }
                
                // Regular animation for other elements
                animatedElements.forEach((el, index) => {
                    if (index < 5) { // Animate first 5 elements for better header coverage
                        setTimeout(() => {
                            el.style.opacity = '1';
                            el.style.transform = 'translateY(0)';
                        }, index * 80); // Slightly longer delay for smoother effect
                    } else {
                        // Show remaining elements immediately
                        el.style.opacity = '1';
                        el.style.transform = 'translateY(0)';
                    }
                });
                
                // Simple navigation highlighting
                const sectionId = entry.target.id;
                if (sectionId) {
                    const correspondingNavLink = document.querySelector(`nav a[href="#${sectionId}"]`);
                    if (correspondingNavLink) {
                        navLinks.forEach(navLink => {
                            navLink.classList.remove('text-blue-400', 'bg-blue-500/10');
                        });
                        correspondingNavLink.classList.add('text-blue-400', 'bg-blue-500/10');
                    }
                }
            }
        });
    }, observerOptions);

    // Observe all sections and header for animation
    const sections = document.querySelectorAll('section[id], header[id]');
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.4s ease, transform 0.4s ease'; // Simplified transitions
        
        // Set initial state for child elements including header buttons
        const animatedElements = section.querySelectorAll('.group, .endpoint, .rate-limit-card, .install-method, a[href^="#"], a[href^="http"]');
        animatedElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(15px)';
            el.style.transition = 'opacity 0.3s ease, transform 0.3s ease'; // Faster transitions
        });
        
        // Special handling for header buttons initial state
        if (section.id === 'header') {
            const headerButtons = section.querySelectorAll('a');
            headerButtons.forEach(btn => {
                btn.style.opacity = '0';
                btn.style.transform = 'translateY(20px)';
                btn.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            });
        }
        
        observer.observe(section);
    });
    
    // Trigger header animation immediately on page load
    setTimeout(() => {
        const header = document.getElementById('header');
        if (header) {
            header.style.opacity = '1';
            header.style.transform = 'translateY(0)';
            
            // Animate header buttons
            const headerButtons = header.querySelectorAll('a');
            headerButtons.forEach((btn, index) => {
                setTimeout(() => {
                    btn.style.opacity = '1';
                    btn.style.transform = 'translateY(0)';
                }, 200 + (index * 100)); // Staggered animation
            });
        }
    }, 100); // Small delay to ensure DOM is ready
    
    // Add scroll performance optimization
    let ticking = false;
    function updateScrollProgress() {
        if (!ticking) {
            requestAnimationFrame(() => {
                const scrolled = window.pageYOffset;
                const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
                const scrollProgress = (scrolled / maxScroll) * 100;
                
                // Update any scroll progress indicators
                const progressBars = document.querySelectorAll('.scroll-progress');
                progressBars.forEach(bar => {
                    bar.style.width = `${scrollProgress}%`;
                });
                
                ticking = false;
            });
            ticking = true;
        }
    }
    
    window.addEventListener('scroll', updateScrollProgress, { passive: true });

    // Add some interactive features
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // View toggle functionality
    const viewToggleBtn = document.getElementById('view-toggle');
    viewToggleBtn.addEventListener('click', () => {
        if (!lastResponseData) return;
        
        isPrettyView = !isPrettyView;
        
        if (isPrettyView) {
            viewToggleBtn.innerHTML = `
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path>
                </svg>
                Pretty
            `;
            responseBody.innerHTML = createFormattedJSON(lastResponseData);
        } else {
            viewToggleBtn.innerHTML = `
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                Raw
            `;
            responseBody.innerHTML = createRawJSON(lastResponseData);
        }
    });

    // Copy response functionality
    const copyResponseBtn = document.getElementById('copy-response');
    copyResponseBtn.addEventListener('click', async () => {
        try {
            const responseText = responseBody.textContent || responseBody.innerText;
            await navigator.clipboard.writeText(responseText);
            
            // Show success feedback
            const originalText = copyResponseBtn.innerHTML;
            copyResponseBtn.innerHTML = `
                <svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Copied!
            `;
            copyResponseBtn.classList.add('bg-green-600', 'text-white');
            
            // Reset after 2 seconds
            setTimeout(() => {
                copyResponseBtn.innerHTML = originalText;
                copyResponseBtn.classList.remove('bg-green-600', 'text-white');
            }, 2000);
            
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    });

    // Enhanced scroll-to-top functionality
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
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            scrollToTopBtn.classList.remove('opacity-0', 'invisible', 'translate-y-10');
            scrollToTopBtn.classList.add('opacity-100', 'visible', 'translate-y-0');
        } else {
            scrollToTopBtn.classList.add('opacity-0', 'invisible', 'translate-y-10');
            scrollToTopBtn.classList.remove('opacity-100', 'visible', 'translate-y-0');
        }
    });
    
    // Smooth scroll to top with enhanced animation
    scrollToTopBtn.addEventListener('click', () => {
        // Add click animation
        scrollToTopBtn.style.transform = 'scale(0.9) rotate(180deg)';
        
        // Smooth scroll to top
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        
        // Reset button state
        setTimeout(() => {
            scrollToTopBtn.style.transform = 'scale(1) rotate(0deg)';
        }, 300);
    });

    // Rate limit cards animation
    const rateLimitCards = document.querySelectorAll('.rate-limit-card');
    rateLimitCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        card.style.animation = 'fadeInUp 0.6s ease-out forwards';
    });

    // Copy code functionality
    const codeBlocks = document.querySelectorAll('pre code');
    codeBlocks.forEach(block => {
        block.addEventListener('click', () => {
            navigator.clipboard.writeText(block.textContent).then(() => {
                // Show a temporary "Copied!" message
                const originalText = block.textContent;
                block.textContent = 'Copied!';
                block.style.color = '#10b981';
                
                setTimeout(() => {
                    block.textContent = originalText;
                    block.style.color = '';
                }, 1000);
            }).catch(err => {
                console.log('Failed to copy: ', err);
            });
        });
        
        // Add cursor pointer to indicate it's clickable
        block.style.cursor = 'pointer';
    });

    // Add loading animation for the API tester
    const addLoadingAnimation = () => {
        const dots = ['.', '..', '...'];
        let dotIndex = 0;
        
        return setInterval(() => {
            responseBody.textContent = `Making request${dots[dotIndex]}`;
            dotIndex = (dotIndex + 1) % dots.length;
        }, 500);
    };

    // Enhanced API tester with better error handling
    testBtn.addEventListener('click', async () => {
        const selectedEndpoint = endpointSelect.value;
        const fullUrl = `${currentDomain}${selectedEndpoint}`;
        
        // Update UI to show loading state
        responseStatus.textContent = 'Loading...';
        responseStatus.className = 'status loading';
        
        const loadingInterval = addLoadingAnimation();
        
        try {
            const response = await fetch(fullUrl);
            clearInterval(loadingInterval);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Update UI to show success state
            responseStatus.textContent = `Success (${response.status})`;
            responseStatus.className = 'status success';
            responseBody.textContent = JSON.stringify(data, null, 2);
            
        } catch (error) {
            clearInterval(loadingInterval);
            
            // Update UI to show error state
            responseStatus.textContent = 'Error';
            responseStatus.className = 'px-3 py-1 bg-red-500 text-white text-sm font-medium rounded-lg';
            responseBody.textContent = `Error: ${error.message}`;
        }
    });

    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + Enter to test API
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            testBtn.click();
        }
        
        // Escape to clear response
        if (e.key === 'Escape') {
            responseStatus.textContent = 'Ready';
            responseStatus.className = 'px-3 py-1 bg-slate-600 text-slate-300 text-sm font-medium rounded-lg';
            responseBody.textContent = 'Click "Send Request" to test the API';
        }
    });

    // Add tooltip for keyboard shortcuts
    testBtn.title = 'Press Ctrl+Enter to send request';
    
    // Add some visual feedback for the custom dropdown
    dropdownTrigger.addEventListener('focus', () => {
        dropdownTrigger.classList.add('ring-2', 'ring-blue-500/50');
    });
    
    dropdownTrigger.addEventListener('blur', () => {
        setTimeout(() => {
            dropdownTrigger.classList.remove('ring-2', 'ring-blue-500/50');
        }, 200);
    });

    // Add a subtle pulse animation to the logo
    const logo = document.querySelector('.logo');
    setInterval(() => {
        logo.style.transform = 'scale(1.05)';
        setTimeout(() => {
            logo.style.transform = 'scale(1)';
        }, 200);
    }, 5000);

    // Add a "back to top" button that appears when scrolling down
    const backToTopBtn = document.createElement('button');
    backToTopBtn.innerHTML = '↑';
    backToTopBtn.className = 'back-to-top';
    backToTopBtn.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        color: white;
        border: none;
        cursor: pointer;
        font-size: 20px;
        font-weight: bold;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        z-index: 1000;
        box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
    `;
    
    document.body.appendChild(backToTopBtn);
    
    // Show/hide back to top button based on scroll position
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTopBtn.style.opacity = '1';
            backToTopBtn.style.visibility = 'visible';
        } else {
            backToTopBtn.style.opacity = '0';
            backToTopBtn.style.visibility = 'hidden';
        }
    });
    
    // Back to top functionality
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // Add hover effect to back to top button
    backToTopBtn.addEventListener('mouseenter', () => {
        backToTopBtn.style.transform = 'scale(1.1)';
        backToTopBtn.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
    });
    
    backToTopBtn.addEventListener('mouseleave', () => {
        backToTopBtn.style.transform = 'scale(1)';
        backToTopBtn.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)';
    });
    
    // Simple copy to clipboard function
    window.copyToClipboard = function(button, text) {
        navigator.clipboard.writeText(text).then(() => {
            // Visual feedback
            const originalText = button.innerHTML;
            button.innerHTML = `
                <svg class="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                Copied!
            `;
            button.classList.add('bg-green-600', 'text-white');
            button.classList.remove('bg-slate-700', 'hover:bg-slate-600', 'text-slate-300');
            
            // Reset after 2 seconds
            setTimeout(() => {
                button.innerHTML = originalText;
                button.classList.remove('bg-green-600', 'text-white');
                button.classList.add('bg-slate-700', 'hover:bg-slate-600', 'text-slate-300');
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy: ', err);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            // Show feedback
            button.innerHTML = `
                <svg class="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                Copied!
            `;
            button.classList.add('bg-green-600', 'text-white');
            button.classList.remove('bg-slate-700', 'hover:bg-slate-600', 'text-slate-300');
            
            setTimeout(() => {
                button.innerHTML = originalText;
                button.classList.remove('bg-green-600', 'text-white');
                button.classList.add('bg-slate-700', 'hover:bg-slate-600', 'text-slate-300');
            }, 2000);
        });
    };
});
