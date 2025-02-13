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

// 显示加载动画
function showLoading() {
    const results = document.getElementById('results');
    results.innerHTML = '<div class="loading">生成中...</div>';
    results.style.display = 'block';
}

// 隐藏加载动画
function hideLoading() {
    const results = document.getElementById('results');
    results.style.display = 'none';
}

// 显示错误信息
function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 3000);
}

// 显示结果
function showResults(names) {
    const results = document.getElementById('results');
    results.innerHTML = marked.parse(names);
    results.style.display = 'block';
}

// 生成名字
async function generateNames() {
    const input = document.getElementById('nameInput');
    const chineseName = input.value.trim();
    
    if (!chineseName) {
        showError('请输入中文姓名');
        return;
    }

    showLoading();

    try {
        console.log('发送请求到本地代理...');
        const response = await fetch('/api/generate-names', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: "system",
                        content: "你是一个专业的英文名字起名专家。你需要根据用户输入的中文名字，生成合适的英文名字。"
                    },
                    {
                        role: "user",
                        content: `请根据我的中文名字"${chineseName}"，生成5个适合我的英文名字。每个名字都要包含First Name和Last Name，并说明名字的含义和为什么适合我。请用Markdown格式输出，每个名字占一段，名字本身用加粗显示。`
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('API错误:', errorData);
            throw new Error(`请求失败: ${response.status}`);
        }

        const data = await response.json();
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            console.error('无效的API响应:', data);
            throw new Error('API返回数据格式错误');
        }

        showResults(data.choices[0].message.content);
    } catch (error) {
        console.error('生成名字时出错:', error);
        showError('生成名字时出错，请稍后重试');
    } finally {
        hideLoading();
    }
}

// 监听输入框的回车事件
document.getElementById('nameInput').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        generateNames();
    }
});

// 监听按钮点击事件
document.getElementById('generateButton').addEventListener('click', generateNames);

// HTML转义函数，防止XSS攻击
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
