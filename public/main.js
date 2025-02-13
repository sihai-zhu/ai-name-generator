// 全局变量
const API_ENDPOINT = '/api/generate-names';
const MAX_RETRIES = 5;
const TIMEOUT = 120000;

// 元素引用
const generateBtn = document.getElementById('generateBtn');
const chineseNameInput = document.getElementById('chineseName');
const resultArea = document.getElementById('result');
const loadingSpinner = document.getElementById('loading');

// 错误消息
const ERROR_MESSAGES = {
    NETWORK: '网络连接错误，请检查您的网络连接并重试。',
    TIMEOUT: '请求超时。正在重试中，请耐心等待...',
    SERVER: '服务器正在处理中，请耐心等待...',
    INVALID_INPUT: '请输入有效的中文名字（1-10个汉字）。',
    PARSE_ERROR: '解析返回数据时出错，请重试。'
};

// 调试工具
const debug = {
    log: function(type, ...args) {
        const time = new Date().toISOString();
        console.log(`[${time}] [${type}]`, ...args);
    },
    error: function(type, ...args) {
        const time = new Date().toISOString();
        console.error(`[${time}] [${type}]`, ...args);
    }
};

// 显示加载动画
function showLoading(message = '生成中...') {
    debug.log('UI', '显示加载动画:', message);
    loadingSpinner.style.display = 'block';
    generateBtn.disabled = true;
    const loadingText = loadingSpinner.querySelector('p');
    if (loadingText) {
        loadingText.textContent = message;
    }
}

// 隐藏加载动画
function hideLoading() {
    debug.log('UI', '隐藏加载动画');
    loadingSpinner.style.display = 'none';
    generateBtn.disabled = false;
}

// 显示错误消息
function showError(message) {
    debug.error('UI', '显示错误:', message);
    resultArea.innerHTML = `<div class="error">${message}</div>`;
}

// 显示结果
function showResult(names) {
    debug.log('UI', '显示结果:', names);
    resultArea.innerHTML = `
        <div class="success">
            <h3>为您生成的英文名字：</h3>
            <ul>
                ${names.map((name, index) => `
                    <li>
                        <span class="name-number">${index + 1}.</span>
                        <span class="name-text">${name}</span>
                    </li>
                `).join('')}
            </ul>
        </div>
    `;
}

// 解析 API 响应中的名字
function parseNames(content) {
    debug.log('解析', '开始解析内容:', content);
    
    try {
        // 首先尝试按数字和点分割
        let names = content.split(/\d+\./).filter(Boolean).map(name => name.trim());
        debug.log('解析', '按数字和点分割结果:', names);
        
        // 如果没有找到名字，尝试按换行符分割
        if (!names.length) {
            debug.log('解析', '尝试按换行符分割');
            names = content.split('\n').filter(line => {
                // 过滤掉空行和不包含英文字母的行
                return line.trim() && /[a-zA-Z]/.test(line);
            }).map(line => {
                // 尝试提取每行中的英文名字部分
                const match = line.match(/[A-Za-z\s]+/);
                return match ? match[0].trim() : null;
            }).filter(Boolean);
            debug.log('解析', '按换行符分割结果:', names);
        }
        
        // 如果仍然没有找到名字，尝试直接提取所有英文单词
        if (!names.length) {
            debug.log('解析', '尝试提取所有英文单词');
            const matches = content.match(/[A-Za-z]+(?:\s+[A-Za-z]+)*/g);
            names = matches ? matches.filter(name => name.length > 1) : [];
            debug.log('解析', '提取英文单词结果:', names);
        }
        
        // 如果仍然没有找到名字，抛出错误
        if (!names.length) {
            debug.error('解析', '无法解析出名字:', content);
            throw new Error(ERROR_MESSAGES.PARSE_ERROR);
        }
        
        // 只返回前5个名字
        const result = names.slice(0, 5);
        debug.log('解析', '最终结果:', result);
        return result;
    } catch (error) {
        debug.error('解析', '解析失败:', error);
        throw error;
    }
}

// 带重试的 fetch 请求
async function fetchWithRetry(url, options, retries = MAX_RETRIES, timeout = TIMEOUT) {
    let lastError;
    
    for (let i = 0; i < retries; i++) {
        debug.log('请求', `开始第 ${i + 1} 次尝试`);
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            
            showLoading(`正在尝试生成（第 ${i + 1} 次）...`);
            
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            debug.log('请求', `收到响应:`, response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                debug.error('请求', `API错误 (${response.status}):`, errorText);
                throw new Error(response.status >= 500 ? ERROR_MESSAGES.SERVER : errorText);
            }
            
            const data = await response.json();
            debug.log('请求', '请求成功，返回数据:', data);
            return data;
            
        } catch (error) {
            debug.error('请求', `第 ${i + 1} 次尝试失败:`, error);
            lastError = error;
            
            if (error.name === 'AbortError') {
                if (i < retries - 1) {
                    debug.log('请求', '超时，准备重试');
                    showLoading(ERROR_MESSAGES.TIMEOUT);
                } else {
                    debug.error('请求', '所有重试都超时');
                    throw new Error(ERROR_MESSAGES.TIMEOUT);
                }
            }
            
            if (i === retries - 1) {
                debug.error('请求', '达到最大重试次数');
                throw lastError;
            }
            
            // 等待时间随重试次数增加
            const waitTime = Math.min(2000 * Math.pow(2, i), 10000);
            debug.log('请求', `等待 ${waitTime}ms 后重试`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }
}

// 生成名字
async function generateNames() {
    const chineseName = chineseNameInput.value.trim();
    debug.log('生成', '开始生成名字，输入:', chineseName);
    
    // 输入验证
    if (!chineseName || !/^[\u4e00-\u9fa5]{1,10}$/.test(chineseName)) {
        debug.error('生成', '输入验证失败');
        showError(ERROR_MESSAGES.INVALID_INPUT);
        return;
    }
    
    showLoading();
    
    try {
        debug.log('生成', '准备发送请求');
        const data = await fetchWithRetry(
            API_ENDPOINT,
            {
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
            }
        );
        
        debug.log('生成', '收到API响应');
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('无效的 API 响应格式');
        }
        
        const content = data.choices[0].message.content;
        debug.log('生成', 'API返回内容:', content);
        
        const names = parseNames(content);
        showResult(names);
        
    } catch (error) {
        debug.error('生成', '生成失败:', error);
        showError(error.message || ERROR_MESSAGES.SERVER);
    } finally {
        hideLoading();
    }
}

// 事件监听器
generateBtn.addEventListener('click', generateNames);
chineseNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        generateNames();
    }
});
