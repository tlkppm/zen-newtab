import { useEffect, useRef } from 'react';

export const DynamicBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let confetti: Confetti[] = [];
        let balloons: Balloon[] = [];

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43', '#ee5a24', '#c8d6e5'];

        class Confetti {
            x: number;
            y: number;
            vx: number;
            vy: number;
            size: number;
            color: string;
            rotation: number;
            rotationSpeed: number;
            shape: 'rect' | 'circle';

            constructor() {
                this.x = Math.random() * canvas!.width;
                this.y = -20 - Math.random() * 100;
                this.vx = (Math.random() - 0.5) * 2;
                this.vy = Math.random() * 3 + 2;
                this.size = Math.random() * 8 + 4;
                this.color = colors[Math.floor(Math.random() * colors.length)];
                this.rotation = Math.random() * 360;
                this.rotationSpeed = (Math.random() - 0.5) * 10;
                this.shape = Math.random() > 0.5 ? 'rect' : 'circle';
            }

            update() {
                this.x += this.vx + Math.sin(this.y * 0.01) * 0.5;
                this.y += this.vy;
                this.rotation += this.rotationSpeed;

                if (this.y > canvas!.height + 20) {
                    this.y = -20;
                    this.x = Math.random() * canvas!.width;
                }
            }

            draw() {
                if (!ctx) return;
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate((this.rotation * Math.PI) / 180);
                ctx.fillStyle = this.color;
                if (this.shape === 'rect') {
                    ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size * 0.6);
                } else {
                    ctx.beginPath();
                    ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }
        }

        class Balloon {
            x: number;
            y: number;
            vy: number;
            size: number;
            color: string;
            wobble: number;
            wobbleSpeed: number;

            constructor() {
                this.x = Math.random() * canvas!.width;
                this.y = canvas!.height + 50 + Math.random() * 100;
                this.vy = Math.random() * 1 + 0.5;
                this.size = Math.random() * 20 + 30;
                this.color = colors[Math.floor(Math.random() * colors.length)];
                this.wobble = Math.random() * Math.PI * 2;
                this.wobbleSpeed = Math.random() * 0.02 + 0.01;
            }

            update() {
                this.y -= this.vy;
                this.wobble += this.wobbleSpeed;
                this.x += Math.sin(this.wobble) * 0.5;

                if (this.y < -this.size * 2) {
                    this.y = canvas!.height + 50;
                    this.x = Math.random() * canvas!.width;
                }
            }

            draw() {
                if (!ctx) return;
                ctx.save();
                ctx.globalAlpha = 0.8;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.ellipse(this.x, this.y, this.size * 0.7, this.size, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(this.x, this.y + this.size);
                ctx.lineTo(this.x - 3, this.y + this.size + 5);
                ctx.lineTo(this.x + 3, this.y + this.size + 5);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(this.x, this.y + this.size + 5);
                ctx.quadraticCurveTo(this.x + 10, this.y + this.size + 30, this.x, this.y + this.size + 50);
                ctx.stroke();
                ctx.restore();
            }
        }

        const init = () => {
            confetti = [];
            balloons = [];
            for (let i = 0; i < 80; i++) {
                const c = new Confetti();
                c.y = Math.random() * canvas.height;
                confetti.push(c);
            }
            for (let i = 0; i < 15; i++) {
                const b = new Balloon();
                b.y = Math.random() * canvas.height;
                balloons.push(b);
            }
        };

        const animate = () => {
            if (!ctx || !canvas) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            balloons.forEach(b => {
                b.update();
                b.draw();
            });

            confetti.forEach(c => {
                c.update();
                c.draw();
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        window.addEventListener('resize', resize);
        resize();
        init();
        animate();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas 
            ref={canvasRef} 
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)' }} 
        />
    );
};