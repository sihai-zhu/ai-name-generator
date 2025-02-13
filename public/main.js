// 名字生成逻辑
const firstNames = {
    '张': ['James', 'Jack', 'Jason', 'Justin', 'Jacob'],
    '李': ['Leo', 'Lucas', 'Liam', 'Logan', 'Louis'],
    '王': ['William', 'Wade', 'Wesley', 'Walter', 'Warren'],
    '陈': ['Charles', 'Chris', 'Calvin', 'Carl', 'Cameron'],
    '林': ['Leonard', 'Lewis', 'Lance', 'Lawrence', 'Luke'],
    '刘': ['Larry', 'Louis', 'Leon', 'Lionel', 'Lloyd'],
    '黄': ['Henry', 'Howard', 'Harry', 'Hugh', 'Harold'],
    '吴': ['Wayne', 'Wilson', 'Wyatt', 'Wallace', 'Wade'],
    '周': ['Zachary', 'Zion', 'Zack', 'Zeus', 'Zane'],
    '徐': ['Xavier', 'Xander', 'Xerxes', 'Xico', 'Xiomar']
};

const lastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones',
    'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
    'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson',
    'Martin', 'Lee', 'Thompson', 'White', 'Harris'
];

const meanings = {
    'James': '源自希伯来语，意为"上帝的恩赐"',
    'Leo': '源自拉丁语，意为"狮子"',
    'William': '源自日耳曼语，意为"坚定的保护者"',
    'Charles': '源自日耳曼语，意为"自由人"',
    'Leonard': '源自日耳曼语，意为"勇猛如狮"',
    'Larry': '源自拉丁语，意为"桂冠"',
    'Henry': '源自日耳曼语，意为"统治者"',
    'Wayne': '源自盎格鲁撒克逊语，意为"制车人"',
    'Zachary': '源自希伯来语，意为"上帝记得"',
    'Xavier': '源自巴斯克语，意为"新房子"'
};

// API参数配置
const API_ENDPOINT = 'https://api.siliconflow.cn/v1/chat/completions';
const MODEL_NAME = 'Pro/deepseek-ai/DeepSeek-R1';
const API_KEY = 'sk-zdonnlmvneeywanlpjyvdiwvvwrcsrwovktugsojsipwtvpr';

// 生成名字的核心函数
async function generateNames() {
    const chineseName = document.getElementById('nameInput').value.trim();
    if (!chineseName) {
        return showError('请输入中文姓名');
    }

    const requestBody = {
        model: MODEL_NAME,
        messages: [{
            role: 'system',
            content: '你是一个专业的英文起名专家。请为用户生成英文名。请严格按照以下格式返回5个名字：{"names":[{"english_name":"英文名","meaning":"含义说明"}]}'
        }, {
            role: 'user',
            content: `请根据中文名「${chineseName}」生成5个英文名，要求：1. 结合原名的发音或含义 2. 名字要有趣且富有创意 3. 提供详细的中文解释`
        }],
        temperature: 0.8,
        top_p: 0.95,
        max_tokens: 2000,
        stream: false
    };

    try {
        // 显示加载动画
        const resultsDiv = document.getElementById('results');
        resultsDiv.innerHTML = '<div class="loading">正在为你生成独特的英文名</div>';
        resultsDiv.style.display = 'block';
        
        // 隐藏之前的错误信息（如果有）
        const errorDiv = document.getElementById('error');
        errorDiv.style.display = 'none';

        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error('网络请求失败，请稍后重试');
        }

        const data = await response.json();
        
        if (!data.choices?.[0]?.message?.content) {
            throw new Error('API返回数据格式错误');
        }

        // 获取API返回的文本内容
        const content = data.choices[0].message.content;
        
        // 尝试提取JSON部分
        let jsonStr = content;
        
        // 如果返回的内容包含其他文本，尝试提取JSON部分
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            jsonStr = jsonMatch[0];
        }

        try {
            // 尝试解析JSON数据
            const namesData = JSON.parse(jsonStr);
            
            // 验证数据格式
            if (!namesData.names || !Array.isArray(namesData.names)) {
                throw new Error('数据格式不正确');
            }

            // 确保每个名字对象都有必要的属性
            const validNames = namesData.names.map(item => ({
                english_name: item.english_name || '未知名字',
                meaning: item.meaning || '暂无解释'
            }));

            displayResults({ names: validNames });
        } catch (e) {
            console.error('JSON解析错误:', e);
            console.error('原始内容:', content);
            
            // 如果JSON解析失败，尝试使用正则表达式提取名字和含义
            const names = [];
            const nameMatches = content.match(/[A-Za-z]+\s+[A-Za-z]+/g) || [];
            const meanings = content.split('\n').filter(line => line.includes('：') || line.includes(':'));
            
            for (let i = 0; i < Math.min(nameMatches.length, meanings.length); i++) {
                names.push({
                    english_name: nameMatches[i],
                    meaning: meanings[i].replace(/^[^：:]+[：:]/, '').trim()
                });
            }

            if (names.length > 0) {
                displayResults({ names });
            } else {
                throw new Error('无法解析返回的数据，请重试');
            }
        }

    } catch (error) {
        console.error('错误详情:', error);
        showError(error.message || '生成失败，请稍后重试');
        // 清除加载动画
        const resultsDiv = document.getElementById('results');
        resultsDiv.style.display = 'none';
    }
}

// 显示结果的函数
function displayResults(data) {
    const resultsDiv = document.getElementById('results');
    
    if (!data.names || !Array.isArray(data.names) || data.names.length === 0) {
        showError('生成的数据格式不正确');
        return;
    }

    let html = '';
    data.names.forEach(item => {
        html += `
            <div class="name-card">
                <h2>${escapeHtml(item.english_name)}</h2>
                <p>${escapeHtml(item.meaning)}</p>
            </div>
        `;
    });

    resultsDiv.innerHTML = html;
    resultsDiv.style.display = 'block';
}

// HTML转义函数，防止XSS攻击
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// 显示错误信息的函数
function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    // 3秒后自动隐藏错误信息
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 3000);
}
