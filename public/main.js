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
const API_ENDPOINT = 'https://api-prod.siliconflow.com/v1/chat/completions';
const MODEL_NAME = 'Pro/deepseek-ai/DeepSeek-R1';
const API_KEY = 'sk-zdonnlmvneeywanlpjyvdiwvvwrcsrwovktugsojsipwtvpr';

// 生成名字的核心函数
async function generateNames() {
    const chineseName = document.getElementById('nameInput').value.trim();
    if (!chineseName) {
        return showError('请输入中文姓名');
    }

    const requestBody = {
        messages: [
            {
                role: "system",
                content: "你是一个专业的英文名字起名专家。你需要根据用户输入的中文名字，生成合适的英文名字。"
            },
            {
                role: "user",
                content: `请根据我的中文名字"${chineseName}"，生成5个适合我的英文名字。每个名字都要包含First Name和Last Name，并说明名字的含义和为什么适合我。请用Markdown格式输出，每个名字占一段，名字本身用加粗显示。`
            }
        ],
        model: MODEL_NAME,
        temperature: 0.7,
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

        // 添加超时处理
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒超时

        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

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

        // 解析JSON
        const jsonData = JSON.parse(jsonStr);
        
        // 显示结果
        displayResults(jsonData);
    } catch (error) {
        if (error.name === 'AbortError') {
            showError('请求超时，请检查网络连接后重试');
        } else {
            showError(error.message || '生成失败，请稍后重试');
        }
    }
}

// 显示结果的函数
function displayResults(data) {
    const resultsDiv = document.getElementById('results');
    
    try {
        // 如果返回的是字符串，尝试解析成JSON
        const jsonData = typeof data === 'string' ? JSON.parse(data) : data;
        
        if (!jsonData.names || !Array.isArray(jsonData.names) || jsonData.names.length === 0) {
            showError('生成的数据格式不正确');
            return;
        }

        let html = '';
        jsonData.names.forEach(item => {
            html += `
                <div class="name-card">
                    <h3>${escapeHtml(item.english_name)}</h3>
                    <p>${escapeHtml(item.meaning)}</p>
                </div>
            `;
        });

        resultsDiv.innerHTML = html;
        resultsDiv.style.display = 'grid';  // 使用grid布局
    } catch (error) {
        showError('数据解析失败：' + error.message);
    }
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
