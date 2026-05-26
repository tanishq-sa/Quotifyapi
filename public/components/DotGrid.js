/**
 * DotGrid - Interactive Canvas-based Dot Grid Component
 * Built using GSAP for smooth spring returns and physics animations.
 */

const throttle = (func, limit) => {
    let lastCall = 0;
    return function (...args) {
        const now = performance.now();
        if (now - lastCall >= limit) {
            lastCall = now;
            func.apply(this, args);
        }
    };
};

function hexToRgb(hex) {
    const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (!m) return { r: 0, g: 0, b: 0 };
    return {
        r: parseInt(m[1], 16),
        g: parseInt(m[2], 16),
        b: parseInt(m[3], 16)
    };
}

class DotGrid {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        if (!this.container) {
            console.error('DotGrid: Target container not found');
            return;
        }

        // Default properties
        this.dotSize = options.dotSize || 16;
        this.gap = options.gap || 32;
        this.baseColor = options.baseColor || '#5227FF';
        this.activeColor = options.activeColor || '#5227FF';
        this.proximity = options.proximity || 150;
        this.speedTrigger = options.speedTrigger || 100;
        this.shockRadius = options.shockRadius || 250;
        this.shockStrength = options.shockStrength || 5;
        this.maxSpeed = options.maxSpeed || 5000;
        this.resistance = options.resistance || 750;
        this.returnDuration = options.returnDuration || 1.5;
        this.className = options.className || '';

        // RGB caching
        this.baseRgb = hexToRgb(this.baseColor);
        this.activeRgb = hexToRgb(this.activeColor);

        // Path2D cache
        this.circlePath = new Path2D();
        this.circlePath.arc(0, 0, this.dotSize / 2, 0, Math.PI * 2);

        // Grid state
        this.dots = [];
        this.pointer = {
            x: -9999,
            y: -9999,
            vx: 0,
            vy: 0,
            speed: 0,
            lastTime: 0,
            lastX: 0,
            lastY: 0
        };

        this.init();
    }

    init() {
        // Create wrapper and canvas HTML
        this.wrapper = document.createElement('div');
        this.wrapper.className = `dot-grid__wrap ${this.className}`;
        
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'dot-grid__canvas';
        
        this.wrapper.appendChild(this.canvas);
        this.container.appendChild(this.wrapper);

        // Setup layouts
        this.buildGrid();

        // Bind and add events
        this.resizeObserver = null;
        if ('ResizeObserver' in window) {
            this.resizeObserver = new ResizeObserver(() => this.buildGrid());
            this.resizeObserver.observe(this.wrapper);
        } else {
            window.addEventListener('resize', () => this.buildGrid());
        }

        this.throttledMove = throttle((e) => this.onMove(e), 50);
        window.addEventListener('mousemove', this.throttledMove, { passive: true });
        window.addEventListener('click', (e) => this.onClick(e));

        // Start animation frame loop
        this.rafId = requestAnimationFrame(() => this.draw());
    }

    buildGrid() {
        if (!this.wrapper || !this.canvas) return;

        const { width, height } = this.wrapper.getBoundingClientRect();
        console.log(`DotGrid buildGrid: wrapper size is ${width}x${height}`);
        const dpr = window.devicePixelRatio || 1;

        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
        
        const ctx = this.canvas.getContext('2d');
        if (ctx) ctx.scale(dpr, dpr);

        const cols = Math.floor((width + this.gap) / (this.dotSize + this.gap));
        const rows = Math.floor((height + this.gap) / (this.dotSize + this.gap));
        const cell = this.dotSize + this.gap;

        const gridW = cell * cols - this.gap;
        const gridH = cell * rows - this.gap;

        const extraX = width - gridW;
        const extraY = height - gridH;

        const startX = extraX / 2 + this.dotSize / 2;
        const startY = extraY / 2 + this.dotSize / 2;

        const dots = [];
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const cx = startX + x * cell;
                const cy = startY + y * cell;
                dots.push({ cx, cy, xOffset: 0, yOffset: 0, _inertiaApplied: false });
            }
        }
        this.dots = dots;
    }

    draw() {
        if (!this.canvas) return;
        const ctx = this.canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const { x: px, y: py } = this.pointer;
        const proxSq = this.proximity * this.proximity;

        for (const dot of this.dots) {
            const ox = dot.cx + dot.xOffset;
            const oy = dot.cy + dot.yOffset;
            const dx = dot.cx - px;
            const dy = dot.cy - py;
            const dsq = dx * dx + dy * dy;

            let fillStyle = this.baseColor;
            if (dsq <= proxSq) {
                const dist = Math.sqrt(dsq);
                const t = 1 - dist / this.proximity;
                const r = Math.round(this.baseRgb.r + (this.activeRgb.r - this.baseRgb.r) * t);
                const g = Math.round(this.baseRgb.g + (this.activeRgb.g - this.baseRgb.g) * t);
                const b = Math.round(this.baseRgb.b + (this.activeRgb.b - this.baseRgb.b) * t);
                fillStyle = `rgb(${r},${g},${b})`;
            }

            ctx.save();
            ctx.translate(ox, oy);
            ctx.fillStyle = fillStyle;
            ctx.fill(this.circlePath);
            ctx.restore();
        }

        this.rafId = requestAnimationFrame(() => this.draw());
    }

    onMove(e) {
        if (!this.canvas) return;
        const now = performance.now();
        const pr = this.pointer;
        const dt = pr.lastTime ? now - pr.lastTime : 16;
        const dx = e.clientX - pr.lastX;
        const dy = e.clientY - pr.lastY;
        
        let vx = (dx / dt) * 1000;
        let vy = (dy / dt) * 1000;
        let speed = Math.hypot(vx, vy);
        
        if (speed > this.maxSpeed) {
            const scale = this.maxSpeed / speed;
            vx *= scale;
            vy *= scale;
            speed = this.maxSpeed;
        }

        pr.lastTime = now;
        pr.lastX = e.clientX;
        pr.lastY = e.clientY;
        pr.vx = vx;
        pr.vy = vy;
        pr.speed = speed;

        const rect = this.canvas.getBoundingClientRect();
        pr.x = e.clientX - rect.left;
        pr.y = e.clientY - rect.top;

        for (const dot of this.dots) {
            const dist = Math.hypot(dot.cx - pr.x, dot.cy - pr.y);
            if (speed > this.speedTrigger && dist < this.proximity && !dot._inertiaApplied) {
                dot._inertiaApplied = true;
                gsap.killTweensOf(dot);
                
                const pushX = dot.cx - pr.x + vx * 0.005;
                const pushY = dot.cy - pr.y + vy * 0.005;
                
                // Animate push away and spring back (simulating inertia physics)
                gsap.to(dot, {
                    xOffset: pushX,
                    yOffset: pushY,
                    duration: 0.3,
                    ease: 'power2.out',
                    onComplete: () => {
                        gsap.to(dot, {
                            xOffset: 0,
                            yOffset: 0,
                            duration: this.returnDuration,
                            ease: 'elastic.out(1,0.75)'
                        });
                        dot._inertiaApplied = false;
                    }
                });
            }
        }
    }

    onClick(e) {
        if (!this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;

        for (const dot of this.dots) {
            const dist = Math.hypot(dot.cx - cx, dot.cy - cy);
            if (dist < this.shockRadius && !dot._inertiaApplied) {
                dot._inertiaApplied = true;
                gsap.killTweensOf(dot);
                
                const falloff = Math.max(0, 1 - dist / this.shockRadius);
                const pushX = (dot.cx - cx) * this.shockStrength * falloff;
                const pushY = (dot.cy - cy) * this.shockStrength * falloff;
                
                gsap.to(dot, {
                    xOffset: pushX,
                    yOffset: pushY,
                    duration: 0.3,
                    ease: 'power2.out',
                    onComplete: () => {
                        gsap.to(dot, {
                            xOffset: 0,
                            yOffset: 0,
                            duration: this.returnDuration,
                            ease: 'elastic.out(1,0.75)'
                        });
                        dot._inertiaApplied = false;
                    }
                });
            }
        }
    }

    destroy() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        window.removeEventListener('mousemove', this.throttledMove);
        cancelAnimationFrame(this.rafId);
        
        if (this.wrapper && this.wrapper.parentNode) {
            this.wrapper.parentNode.removeChild(this.wrapper);
        }
    }
}

// Export for global or module use
if (typeof window !== 'undefined') {
    window.DotGrid = DotGrid;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DotGrid;
}
