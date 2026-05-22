/**
 * Reusable Confirmation Modal Component
 * Usage: ConfirmationModal.show(options)
 */

class ConfirmationModal {
    constructor() {
        this.modal = null;
        this.content = null;
        this.isVisible = false;
        this.resolve = null;
        this.reject = null;
        this.init();
    }

    init() {
        // Create modal HTML if it doesn't exist
        if (!document.getElementById('confirmationModal')) {
            this.createModal();
        }
        
        this.modal = document.getElementById('confirmationModal');
        this.content = document.getElementById('confirmationModalContent');
    }

    createModal() {
        const modalHTML = `
            <!-- Confirmation Modal -->
            <div id="confirmationModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[20000] hidden flex items-center justify-center p-4">
                <div class="bg-gray-900 border border-white/20 rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-95 opacity-0" id="confirmationModalContent">
                    <div class="p-8">
                        <!-- Icon -->
                        <div class="flex justify-center mb-6">
                            <div id="confirmationIcon" class="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center">
                                <svg class="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                                </svg>
                            </div>
                        </div>
                        
                        <!-- Title -->
                        <h3 id="confirmationTitle" class="text-2xl font-bold text-white text-center mb-4 font-space">
                            Confirm Action
                        </h3>
                        
                        <!-- Message -->
                        <div class="text-center mb-8">
                            <p id="confirmationMessage" class="text-white/80 text-lg mb-4">
                                Are you sure you want to proceed?
                            </p>
                            
                            <!-- Custom Content Area -->
                            <div id="confirmationCustomContent" class="hidden">
                                <!-- Custom content will be inserted here -->
                            </div>
                            
                            <p id="confirmationSubtext" class="text-white/60 text-sm mt-4">
                                This action cannot be undone.
                            </p>
                        </div>
                        
                        <!-- Buttons -->
                        <div class="flex space-x-4">
                            <button id="confirmationCancel" class="flex-1 px-6 py-3 bg-gray-700/50 text-white rounded-xl hover:bg-gray-700 transition-all duration-200 font-medium border border-gray-600/50 hover:border-gray-500">
                                Cancel
                            </button>
                            <button id="confirmationConfirm" class="flex-1 px-6 py-3 bg-blue-500/80 text-white rounded-xl hover:bg-blue-500 transition-all duration-200 font-medium border border-blue-500/50 hover:border-blue-400">
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    show(options = {}) {
        return new Promise((resolve, reject) => {
            try {
                this.resolve = resolve;
                this.reject = reject;
                
                // Set default options
                const config = {
                    title: 'Confirm Action',
                    message: 'Are you sure you want to proceed?',
                    subtext: 'This action cannot be undone.',
                    confirmText: 'Confirm',
                    cancelText: 'Cancel',
                    confirmClass: 'bg-blue-500/80 hover:bg-blue-500 border-blue-500/50 hover:border-blue-400',
                    iconType: 'warning', // warning, danger, info, success
                    customContent: null,
                    ...options
                };

                // Update modal content
                this.updateContent(config);
                
                // Show modal
                this.modal.classList.remove('hidden');
                this.isVisible = true;
                
                // Trigger animation
                setTimeout(() => {
                    this.content.classList.remove('scale-95', 'opacity-0');
                    this.content.classList.add('scale-100', 'opacity-100');
                }, 10);
                
                // Add event listeners
                this.addEventListeners();
            } catch (error) {
                console.error('ConfirmationModal: Error showing modal:', error);
                reject(error);
            }
        });
    }

    updateContent(config) {
        try {
            // Update title
            const titleEl = document.getElementById('confirmationTitle');
            if (titleEl) titleEl.textContent = config.title;
            
            // Update message
            const messageEl = document.getElementById('confirmationMessage');
            if (messageEl) messageEl.textContent = config.message;
            
            // Update subtext
            const subtextEl = document.getElementById('confirmationSubtext');
            if (subtextEl) subtextEl.textContent = config.subtext;
            
            this.updateIcon(config.iconType);
            
            // Handle custom content
            const customContentDiv = document.getElementById('confirmationCustomContent');
            if (customContentDiv) {
                if (config.customContent) {
                    customContentDiv.innerHTML = config.customContent;
                    customContentDiv.classList.remove('hidden');
                } else {
                    customContentDiv.classList.add('hidden');
                }
            }

            // Update buttons
            const confirmBtn = document.getElementById('confirmationConfirm');
            const cancelBtn = document.getElementById('confirmationCancel');
            
            if (confirmBtn) {
                if (config.confirmText) {
                    confirmBtn.textContent = config.confirmText;
                    confirmBtn.className = 'flex-1 px-6 py-3 text-white rounded-xl transition-all duration-200 font-medium border ' + (config.confirmClass || 'bg-blue-500/80 hover:bg-blue-500 border-blue-500/50 hover:border-blue-400');
                    confirmBtn.classList.remove('hidden');
                } else {
                    confirmBtn.classList.add('hidden');
                }
            }
            
            if (cancelBtn) {
                if (config.cancelText) {
                    cancelBtn.textContent = config.cancelText;
                    cancelBtn.classList.remove('hidden');
                } else {
                    cancelBtn.classList.add('hidden');
                }
            }
        } catch (error) {
            console.error('ConfirmationModal: Error updating content:', error);
        }
    }

    updateIcon(type) {
        try {
            const iconDiv = document.getElementById('confirmationIcon');
            const iconSvg = iconDiv.querySelector('svg');
            
            if (!iconDiv || !iconSvg) {
                console.warn('ConfirmationModal: Icon elements not found');
                return;
            }
            
            const icons = {
                warning: {
                    bg: 'bg-yellow-500/20',
                    text: 'text-yellow-400',
                    path: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
                },
                danger: {
                    bg: 'bg-red-500/20',
                    text: 'text-red-400',
                    path: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                },
                info: {
                    bg: 'bg-blue-500/20',
                    text: 'text-blue-400',
                    path: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                },
                success: {
                    bg: 'bg-green-500/20',
                    text: 'text-green-400',
                    path: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                }
            };
            
            const icon = icons[type] || icons.warning;
            
            // Use setAttribute for better compatibility
            iconDiv.setAttribute('class', `w-16 h-16 ${icon.bg} rounded-full flex items-center justify-center`);
            iconSvg.setAttribute('class', `w-8 h-8 ${icon.text}`);
            
            const pathElement = iconSvg.querySelector('path');
            if (pathElement) {
                pathElement.setAttribute('d', icon.path);
            }
        } catch (error) {
            console.error('ConfirmationModal: Error updating icon:', error);
        }
    }

    addEventListeners() {
        // Cancel button
        document.getElementById('confirmationCancel').onclick = () => {
            this.hide();
            this.reject(new Error('User cancelled'));
        };
        
        // Confirm button
        document.getElementById('confirmationConfirm').onclick = () => {
            this.hide();
            this.resolve(true);
        };
        
        // Click outside to close
        this.modal.onclick = (event) => {
            if (event.target === this.modal) {
                this.hide();
                this.reject(new Error('User cancelled'));
            }
        };
    }

    hide() {
        if (!this.isVisible) return;
        
        // Remove event listeners
        this.modal.onclick = null;
        
        this.content.classList.remove('scale-100', 'opacity-100');
        this.content.classList.add('scale-95', 'opacity-0');
        
        setTimeout(() => {
            this.modal.classList.add('hidden');
            this.isVisible = false;
        }, 300);
    }

    // Static method for easy usage
    static show(options) {
        if (!window.confirmationModalInstance) {
            window.confirmationModalInstance = new ConfirmationModal();
        }
        return window.confirmationModalInstance.show(options);
    }
}

// Initialize global instance
window.confirmationModalInstance = new ConfirmationModal();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConfirmationModal;
}
