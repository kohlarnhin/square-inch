// 创建PNG图标的脚本
// 在浏览器控制台中运行此脚本来生成PNG图标

function createIcon(size) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // 创建渐变背景
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#4f46e5');
    gradient.addColorStop(0.5, '#7c3aed');
    gradient.addColorStop(1, '#ec4899');
    
    // 绘制圆形背景
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(size/2, size/2, size/2 - 2, 0, 2 * Math.PI);
    ctx.fill();
    
    // 绘制网格
    const gridSize = Math.floor(size / 8);
    const spacing = Math.floor(size / 6);
    const startX = size/2 - spacing;
    const startY = size/2 - spacing;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    
    // 绘制3x3网格
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
            const x = startX + col * spacing;
            const y = startY + row * spacing;
            
            if (row === 2 && col === 2) {
                // 绘制加号
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.lineWidth = Math.max(1, size / 32);
                ctx.strokeRect(x, y, gridSize, gridSize);
                
                const centerX = x + gridSize/2;
                const centerY = y + gridSize/2;
                const lineLength = gridSize * 0.6;
                
                ctx.beginPath();
                ctx.moveTo(centerX, centerY - lineLength/2);
                ctx.lineTo(centerX, centerY + lineLength/2);
                ctx.moveTo(centerX - lineLength/2, centerY);
                ctx.lineTo(centerX + lineLength/2, centerY);
                ctx.stroke();
            } else {
                // 绘制普通方块
                const opacity = (row + col) % 2 === 0 ? 0.9 : 0.7;
                ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
                ctx.fillRect(x, y, gridSize, gridSize);
            }
        }
    }
    
    return canvas.toDataURL('image/png');
}

// 生成不同尺寸的图标
const sizes = [16, 32, 48, 128];
sizes.forEach(size => {
    const dataUrl = createIcon(size);
    console.log(`Icon ${size}x${size}:`, dataUrl);
    
    // 创建下载链接
    const link = document.createElement('a');
    link.download = `icon-${size}.png`;
    link.href = dataUrl;
    link.textContent = `Download ${size}x${size} icon`;
    link.style.display = 'block';
    link.style.margin = '10px';
    document.body.appendChild(link);
});

console.log('PNG图标已生成，请点击页面上的链接下载');
