// 等待页面加载完成
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM 加载完成，开始初始化...');
    initializeApp();
});

// 初始化应用
function initializeApp() {
    // 获取必要的 DOM 元素
    const generateBtn = document.getElementById('generateBtn');
    const chineseNameInput = document.getElementById('chineseName');
    const resultArea = document.getElementById('result');
    const loadingSpinner = document.getElementById('loading');

    // 检查必要元素是否存在
    if (!generateBtn) {
        console.error('未找到生成按钮元素！');
        return;
    }
    if (!chineseNameInput) {
        console.error('未找到输入框元素！');
        return;
    }
    if (!resultArea) {
        console.error('未找到结果区域元素！');
        return;
    }
    if (!loadingSpinner) {
        console.error('未找到加载动画元素！');
        return;
    }

    console.log('所有元素已找到，添加事件监听器...');

    // 添加按钮点击事件
    generateBtn.addEventListener('click', async function() {
        const chineseName = chineseNameInput.value.trim();
        
        // 输入验证
        if (!chineseName || !/^[\u4e00-\u9fa5]{1,10}$/.test(chineseName)) {
            showError('请输入有效的中文名字（1-10个汉字）');
            return;
        }

        // 显示加载动画
        loadingSpinner.style.display = 'flex';
        
        try {
            // 发送 API 请求
            const response = await fetch('/api/generate-names', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: [
                        {
                            role: "system",
                            content: "你是一个专业的英文名字起名专家。请只返回英文名字，不要返回解释。"
                        },
                        {
                            role: "user",
                            content: `请根据我的中文名字"${chineseName}"，生成5个适合我的英文名字，每行一个，前面加上序号。`
                        }
                    ]
                })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${await response.text()}`);
            }

            const data = await response.json();
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error('Invalid API response');
            }

            const content = data.choices[0].message.content;
            const names = parseNames(content);
            showResult(names);

        } catch (error) {
            console.error('生成名字时出错:', error);
            showError(error.message);
        } finally {
            loadingSpinner.style.display = 'none';
        }
    });

    // 添加输入框回车事件
    chineseNameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            generateBtn.click();
        }
    });

    console.log('初始化完成');
}

// 显示错误信息
function showError(message) {
    const resultArea = document.getElementById('result');
    if (resultArea) {
        resultArea.innerHTML = `<div class="error">${message}</div>`;
    }
}

// 显示结果
function showResult(names) {
    const resultArea = document.getElementById('result');
    if (resultArea) {
        resultArea.innerHTML = names.map((name, index) => 
            `<div class="name-item">${index + 1}. ${name}</div>`
        ).join('');
    }
}

// 解析名字
function parseNames(content) {
    return content
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^\d+[\.\s]+/, '').trim())
        .slice(0, 5);
}
