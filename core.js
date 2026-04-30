const config = {
    dictDir: './', // 修改点：指向同级目录
    sections: ['algebra', 'calculus', 'numbertheory', 'series']
};

/**
 * 将 txt 字典内容解析为 HTML 结构
 */
function parseLatexDict(rawText) {
    // 按空行分割不同的公式块
    const blocks = rawText.trim().split(/\n\s*\n/);
    let html = '';
    
    for (const block of blocks) {
        const lines = block.split('\n');
        let containerHtml = '<div class="formula-container">\n';
        
        for (let line of lines) {
            line = line.trim();
            if (!line) continue;
            
            // 自动补全 LaTeX 展示模式定界符
            if (!line.startsWith('\\[')) {
                line = `\\[ ${line} \\]`;
            }
            containerHtml += `    ${line}\n`;
        }
        
        containerHtml += '</div>\n';
        html += containerHtml;
    }
    return html;
}

/**
 * 懒加载并渲染指定页面的字典
 */
async function loadAndRenderSection(id) {
    const container = document.getElementById(id);
    
    // 如果已经加载并渲染过，直接跳过，避免重复消耗性能
    if (container.dataset.loaded === "true") return;

    try {
        // 保留了强制禁用缓存的配置
        const response = await fetch(`${config.dictDir}${id}.txt`, { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const rawText = await response.text();
        container.innerHTML = parseLatexDict(rawText);
        container.dataset.loaded = "true";

        // 优化渲染：仅针对当前刚刚挂载内容的 DOM 节点进行 MathJax 渲染
        if (window.MathJax && window.MathJax.typesetPromise) {
            MathJax.typesetPromise([container]).catch(function (err) {
                console.error('MathJax 渲染错误: ', err.message);
            });
        }
    } catch (error) {
        console.error(`加载字典 ${id}.txt 失败:`, error);
        container.innerHTML = `<p style="color: red; text-align: center;">无法加载数据字典 ${id}.txt，请确保服务器正在运行且文件存在。</p>`;
    }
}

/**
 * 导航切换逻辑
 */
window.showSection = function(id, btn) {
    // 切换 UI 状态
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(id).classList.add('active');
    if (btn) btn.classList.add('active');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // 触发字典加载与内核渲染
    loadAndRenderSection(id);
};

// 页面加载完成后，初始化第一个页面
document.addEventListener('DOMContentLoaded', () => {
    // 等待 MathJax 准备就绪后再执行首次加载
    const initInterval = setInterval(() => {
        if (window.MathJax && window.MathJax.typesetPromise) {
            clearInterval(initInterval);
            showSection('algebra', document.querySelector('.nav-btn.active'));
        }
    }, 100);

    // 禁用右键菜单和 F12 
    document.addEventListener('contextmenu', event => event.preventDefault());
    document.addEventListener('keydown', event => {
        if (event.key === 'F12' || event.keyCode === 123) {
            event.preventDefault();
        }
    });
});