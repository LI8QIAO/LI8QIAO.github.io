document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('particle-canvas');
    const ctx = canvas.getContext('2d');
    
    // 设置canvas尺寸
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // 增强的粒子配置
    const config = {
        particleCount: 120, // 增加粒子数量
        maxDistance: 100,   // 减小连接距离使网络更密集
        lineWidth: 1.5,     // 加粗连接线
        minSize: 2,         // 最小粒子尺寸
        maxSize: 6,         // 最大粒子尺寸
        colors: [
            'rgba(108, 99, 255, 0.8)',  // 主色
            'rgba(255, 101, 132, 0.8)', // 强调色
            'rgba(255, 255, 255, 0.8)'  // 高光色
        ],
        speedMultiplier: 1.5, // 整体速度加快
        turbulence: 0.3,      // 增加随机扰动
        playOnce: true,
        duration: 4000,       // 延长持续时间
        launchPhase: 1000,    // 发射阶段持续时间
        maxConnections: 5      // 每个粒子的最大连接数
    };
    
    // 粒子数组
    let particles = [];
    let animationId;
    let startTime;
    let isLaunching = true;
    
    // 增强的粒子类
    class Particle {
        constructor() {
            this.reset(true);
            this.connections = 0;
        }
        
        reset(initial) {
            this.x = Math.random() * canvas.width;
            this.y = initial ? -Math.random() * canvas.height * 0.2 : -20;
            this.size = Math.random() * (config.maxSize - config.minSize) + config.minSize;
            this.baseSpeedX = (Math.random() - 0.5) * config.speedMultiplier;
            this.baseSpeedY = Math.random() * 2 * config.speedMultiplier;
            this.speedX = this.baseSpeedX;
            this.speedY = this.baseSpeedY;
            this.opacity = 0;
            this.targetOpacity = Math.random() * 0.7 + 0.3;
            this.life = 0;
            this.color = config.colors[Math.floor(Math.random() * config.colors.length)];
            this.connections = 0;
        }
        
        update() {
            // 发射阶段 - 快速下落
            if (isLaunching) {
                this.speedY = this.baseSpeedY * 3;
            } else {
                // 添加随机扰动
                this.speedX = this.baseSpeedX + (Math.random() - 0.5) * config.turbulence;
                this.speedY = this.baseSpeedY + (Math.random() - 0.5) * config.turbulence;
            }
            
            this.x += this.speedX;
            this.y += this.speedY;
            this.life++;
            
            // 淡入效果
            if (this.opacity < this.targetOpacity) {
                this.opacity += 0.03;
            }
            
            // 边界检查
            if (this.x < 0 || this.x > canvas.width) {
                this.speedX *= -0.8; // 反弹效果
            }
            
            // 如果粒子移出屏幕底部且设置为单次播放
            if (config.playOnce && this.y > canvas.height + 20) {
                this.reset(false);
            }
        }
        
        draw() {
            // 绘制发光效果
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 1.5, 0, Math.PI * 2);
            const glowGradient = ctx.createRadialGradient(
                this.x, this.y, 0, 
                this.x, this.y, this.size * 1.5
            );
            glowGradient.addColorStop(0, this.color.replace('0.8', '0.3'));
            glowGradient.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = glowGradient;
            ctx.fill();
            
            // 绘制粒子核心
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color.replace('0.8', this.opacity.toString());
            ctx.fill();
        }
    }
    
    // 初始化粒子
    function initParticles() {
        particles = [];
        for (let i = 0; i < config.particleCount; i++) {
            particles.push(new Particle());
        }
    }
    
    // 增强的连接线绘制
    function drawLines() {
        // 先按y坐标排序，使前面的粒子优先连接
        particles.sort((a, b) => a.y - b.y);
        
        for (let a = 0; a < particles.length; a++) {
            particles[a].connections = 0; // 重置连接计数
            
            for (let b = a + 1; b < particles.length; b++) {
                // 限制每个粒子的最大连接数
                if (particles[a].connections >= config.maxConnections) break;
                
                const dx = particles[a].x - particles[b].x;
                const dy = particles[a].y - particles[b].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < config.maxDistance) {
                    const opacity = 1 - distance / config.maxDistance;
                    const lineGradient = ctx.createLinearGradient(
                        particles[a].x, particles[a].y,
                        particles[b].x, particles[b].y
                    );
                    lineGradient.addColorStop(0, particles[a].color);
                    lineGradient.addColorStop(1, particles[b].color);
                    
                    ctx.strokeStyle = lineGradient;
                    ctx.lineWidth = config.lineWidth * opacity;
                    ctx.beginPath();
                    ctx.moveTo(particles[a].x, particles[a].y);
                    ctx.lineTo(particles[b].x, particles[b].y);
                    ctx.stroke();
                    
                    particles[a].connections++;
                    particles[b].connections++;
                }
            }
        }
    }
    
    // 动画循环
    function animate(currentTime) {
        if (!startTime) startTime = currentTime;
        const elapsedTime = currentTime - startTime;
        
        // 发射阶段结束检查
        if (isLaunching && elapsedTime > config.launchPhase) {
            isLaunching = false;
        }
        
        // 清除画布 - 使用半透明填充创建拖尾效果
        ctx.fillStyle = 'rgba(10, 10, 10, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 更新和绘制粒子
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
        // 绘制连接线
        drawLines();
        
        // 单次播放逻辑
        if (config.playOnce && elapsedTime >= config.duration) {
            cancelAnimationFrame(animationId);
            fadeOutCanvas();
            return;
        }
        
        animationId = requestAnimationFrame(animate);
    }
    
    // 增强的淡出效果
    function fadeOutCanvas() {
    //    let opacity = 1;
    //    const fadeOutInterval = setInterval(() => {
    //        opacity -= 0.02;
    //        canvas.style.opacity = opacity;
    //        
    //         同时减小粒子大小增强消失效果
    //        particles.forEach(p => {
    //            p.size = Math.max(0, p.size - 0.05);
    //        });
    //        
    //        if (opacity <= 0) {
    //            clearInterval(fadeOutInterval);
    //            canvas.style.display = 'none';
    //        }
    //    }, 16); // 约60fps
    cancelAnimationFrame(animationId)
    }
    
    // 启动动画
    function startAnimation() {
        initParticles();
        canvas.style.opacity = 1;
        canvas.style.display = 'block';
        startTime = null;
        isLaunching = true;
        animationId = requestAnimationFrame(animate);
        
        // 添加初始冲击波效果
        ctx.fillStyle = 'rgba(108, 99, 255, 0.2)';
        ctx.beginPath();
        ctx.arc(canvas.width/2, -100, 50, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 页面加载后启动动画
    startAnimation();
    
    // 暴露重新播放方法
    window.restartParticleAnimation = startAnimation;
});