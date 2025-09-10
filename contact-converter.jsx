import React, { useState } from 'react';

const ContactConverter = () => {
  const [inputText, setInputText] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [result, setResult] = useState('');
  const [batchMode, setBatchMode] = useState(false);
  const [batchContacts, setBatchContacts] = useState([]);
  const [batchResult, setBatchResult] = useState('');
  
  // LLM配置相关状态
  const [useCustomLLM, setUseCustomLLM] = useState(false);
  const [customAPI, setCustomAPI] = useState({
    baseURL: 'http://localhost:1234/v1',
    apiKey: '',
    model: 'llama-3-8b-instruct'
  });
  const [showLLMConfig, setShowLLMConfig] = useState(false);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputText(text);
    } catch (err) {
      // 如果clipboard API不可用，显示提示
      alert('无法访问剪贴板，请手动粘贴内容');
      console.error('Failed to read clipboard contents: ', err);
    }
  };

  const handleConvert = async () => {
    if (!inputText.trim()) {
      alert('请先输入或粘贴要转换的文字');
      return;
    }

    setIsConverting(true);
    setResult('');

    try {
      let response;
      
      if (useCustomLLM) {
        // 使用自定义LLM API (OpenAI兼容格式)
        if (!customAPI.baseURL) {
          alert('请先配置自定义LLM的API地址');
          setIsConverting(false);
          return;
        }
        
        const headers = {
          "Content-Type": "application/json",
        };
        
        // 如果提供了API密钥，则添加Authorization头
        if (customAPI.apiKey) {
          headers["Authorization"] = `Bearer ${customAPI.apiKey}`;
        }
        
        response = await fetch(`${customAPI.baseURL}/chat/completions`, {
          method: "POST",
          headers: headers,
          body: JSON.stringify({
            model: customAPI.model,
            max_tokens: 1000,
            messages: [
              {
                role: "user",
                content: `请仔细分析以下文字，智能提取所有可能的联系人信息并转换为完整的vCard格式。请根据文本内容灵活识别各种信息字段：

文字内容：
${inputText}

提取要求：
1. **基本信息**：姓名(FN/N)、电话(TEL)、邮箱(EMAIL)
2. **工作信息**：公司/机构(ORG)、职位/职务(TITLE)
3. **地址信息**：如有地址信息请提取(ADR)
4. **教育背景**：学历、毕业院校、专业、导师等信息
5. **专业领域**：研究方向、技能、专长等
6. **其他信息**：任何有价值的补充信息

输出格式要求：
- 严格按照vCard 3.0标准格式
- 根据提取到的信息灵活包含相应字段：
  * FN: 全名
  * N: 姓;名;;;
  * ORG: 公司/机构名称
  * TITLE: 职位/职务/身份
  * TEL: 电话号码
  * EMAIL: 邮箱地址
  * ADR: 地址信息（如有）
  * NOTE: 教育背景、专业方向、技能等补充信息
- 如果某个字段信息不明确或缺失，可以不包含该字段
- NOTE字段用于存放教育背景、专业方向、技能特长等重要补充信息
- 确保格式完全正确，能被iPhone通讯录识别
- 只输出vCard内容，不要包含任何markdown格式或其他文字

请根据实际提取到的信息生成vCard，不要生成示例中的虚假信息。`
              }
            ]
          })
        });
        
        const data = await response.json();
        
        // 处理OpenAI格式的响应
        if (data.choices && data.choices[0] && data.choices[0].message) {
          var vCardContent = data.choices[0].message.content.trim();
        } else {
          throw new Error('自定义LLM响应格式异常');
        }
        
      } else {
        // 使用Claude API
        response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1000,
            messages: [
              {
                role: "user",
                content: `请仔细分析以下文字，智能提取所有可能的联系人信息并转换为完整的vCard格式。请根据文本内容灵活识别各种信息字段：

文字内容：
${inputText}

提取要求：
1. **基本信息**：姓名(FN/N)、电话(TEL)、邮箱(EMAIL)
2. **工作信息**：公司/机构(ORG)、职位/职务(TITLE)
3. **地址信息**：如有地址信息请提取(ADR)
4. **教育背景**：学历、毕业院校、专业、导师等信息
5. **专业领域**：研究方向、技能、专长等
6. **其他信息**：任何有价值的补充信息

输出格式要求：
- 严格按照vCard 3.0标准格式
- 根据提取到的信息灵活包含相应字段：
  * FN: 全名
  * N: 姓;名;;;
  * ORG: 公司/机构名称
  * TITLE: 职位/职务/身份
  * TEL: 电话号码
  * EMAIL: 邮箱地址
  * ADR: 地址信息（如有）
  * NOTE: 教育背景、专业方向、技能等补充信息
- 如果某个字段信息不明确或缺失，可以不包含该字段
- NOTE字段用于存放教育背景、专业方向、技能特长等重要补充信息
- 确保格式完全正确，能被iPhone通讯录识别
- 只输出vCard内容，不要包含任何markdown格式或其他文字

示例输出格式：
BEGIN:VCARD
VERSION:3.0
FN:张三
N:张;三;;;
ORG:ABC科技有限公司
TITLE:产品经理
TEL:13800138000
EMAIL:zhangsan@example.com
ADR:;;北京市海淀区中关村大街1号;;;中国
NOTE:清华大学计算机科学与技术专业硕士，专注于人工智能和机器学习领域，有5年产品设计经验
END:VCARD

请根据实际提取到的信息生成vCard，不要生成示例中的虚假信息。`
              }
            ]
          })
        });

        const data = await response.json();
        var vCardContent = data.content[0].text.trim();
      }
      
      if (batchMode) {
        // 批量模式：添加到联系人列表
        const newContact = {
          id: Date.now(),
          originalText: inputText,
          vCard: vCardContent,
          name: extractNameFromVCard(vCardContent)
        };
        setBatchContacts(prev => [...prev, newContact]);
        updateBatchResult([...batchContacts, newContact]);
        setInputText(''); // 清空输入框准备下一个
        alert(`联系人已添加到批量列表！当前共有 ${batchContacts.length + 1} 个联系人`);
      } else {
        // 单个模式：直接显示结果
        setResult(vCardContent);
      }
    } catch (error) {
      alert(`转换失败：${error.message}，请检查LLM配置或重试`);
      console.error('Conversion error:', error);
    } finally {
      setIsConverting(false);
    }
  };

  const extractNameFromVCard = (vCard) => {
    const fnMatch = vCard.match(/FN:(.+)/);
    return fnMatch ? fnMatch[1].trim() : '未知联系人';
  };

  const updateBatchResult = (contacts) => {
    const combinedVCards = contacts.map(contact => contact.vCard).join('\n\n');
    setBatchResult(combinedVCards);
  };

  const removeBatchContact = (id) => {
    const updatedContacts = batchContacts.filter(contact => contact.id !== id);
    setBatchContacts(updatedContacts);
    updateBatchResult(updatedContacts);
  };

  const clearBatch = () => {
    setBatchContacts([]);
    setBatchResult('');
  };

  const toggleBatchMode = () => {
    setBatchMode(!batchMode);
    setResult('');
    setInputText('');
  };

  const downloadVCard = () => {
    const content = batchMode ? batchResult : result;
    if (!content) return;

    const blob = new Blob([content], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileName = batchMode ? `contacts_batch_${batchContacts.length}.vcf` : 'contact.vcf';
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    const content = batchMode ? batchResult : result;
    try {
      await navigator.clipboard.writeText(content);
      const message = batchMode ? 
        `批量vCard内容已复制到剪贴板（共${batchContacts.length}个联系人）` : 
        'vCard内容已复制到剪贴板';
      alert(message);
    } catch (err) {
      console.error('Failed to copy: ', err);
      alert('复制失败，请手动复制');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
            📇 AI联系人转换器
          </h1>
          <p className="text-gray-600 text-center mb-6">
            将文字信息智能转换为iPhone通讯录可导入的vCard格式
          </p>

          {/* 模式切换 */}
          <div className="flex justify-center mb-8">
            <div className="bg-gray-100 p-1 rounded-lg">
              <button
                onClick={toggleBatchMode}
                className={`px-6 py-2 rounded-md font-medium transition-all duration-200 ${
                  !batchMode 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                🔄 单个转换
              </button>
              <button
                onClick={toggleBatchMode}
                className={`px-6 py-2 rounded-md font-medium transition-all duration-200 ${
                  batchMode 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                📚 批量转换
              </button>
            </div>
          </div>

          {batchMode && batchContacts.length > 0 && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-blue-800">
                  批量联系人列表 ({batchContacts.length}个)
                </h3>
                <button
                  onClick={clearBatch}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  🗑️ 清空列表
                </button>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {batchContacts.map((contact) => (
                  <div key={contact.id} className="flex justify-between items-center bg-white p-2 rounded">
                    <span className="text-sm text-gray-700 font-medium">{contact.name}</span>
                    <button
                      onClick={() => removeBatchContact(contact.id)}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      ✕ 删除
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LLM配置面板 */}
          {showLLMConfig && (
            <div className="mb-8 p-6 bg-purple-50 rounded-lg border-2 border-purple-200">
              <h3 className="text-xl font-semibold text-purple-800 mb-4">🤖 LLM配置</h3>
              
              <div className="space-y-4">
                {/* LLM选择 */}
                <div className="flex gap-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      checked={!useCustomLLM}
                      onChange={() => setUseCustomLLM(false)}
                      className="text-purple-600"
                    />
                    <span className="text-gray-700 font-medium">🔮 使用Claude (默认)</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      checked={useCustomLLM}
                      onChange={() => setUseCustomLLM(true)}
                      className="text-purple-600"
                    />
                    <span className="text-gray-700 font-medium">🏠 使用自定义LLM</span>
                  </label>
                </div>

                {/* 自定义LLM配置 */}
                {useCustomLLM && (
                  <div className="mt-4 p-4 bg-white rounded-lg border space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        API地址 (Base URL)
                      </label>
                      <input
                        type="text"
                        value={customAPI.baseURL}
                        onChange={(e) => setCustomAPI(prev => ({...prev, baseURL: e.target.value}))}
                        placeholder="http://localhost:1234/v1"
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        支持OpenAI兼容的API，如LMStudio、Ollama、vLLM等
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        API密钥 (可选)
                      </label>
                      <input
                        type="password"
                        value={customAPI.apiKey}
                        onChange={(e) => setCustomAPI(prev => ({...prev, apiKey: e.target.value}))}
                        placeholder="sk-xxx (本地模型通常不需要)"
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        模型名称
                      </label>
                      <input
                        type="text"
                        value={customAPI.model}
                        onChange={(e) => setCustomAPI(prev => ({...prev, model: e.target.value}))}
                        placeholder="llama-3-8b-instruct"
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      />
                    </div>
                    
                    <div className="mt-3 p-3 bg-blue-50 rounded text-sm">
                      <div className="font-medium text-blue-800 mb-1">💡 常用配置示例：</div>
                      <div className="text-blue-700 space-y-1">
                        <div>• <strong>LM Studio</strong>: http://localhost:1234/v1</div>
                        <div>• <strong>Ollama</strong>: http://localhost:11434/v1</div>
                        <div>• <strong>vLLM</strong>: http://localhost:8000/v1</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    当前使用：<span className="font-medium text-purple-600">
                      {useCustomLLM ? `${customAPI.model} (${customAPI.baseURL})` : 'Claude (Anthropic)'}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowLLMConfig(false)}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    ✅ 保存配置
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-8">
            {/* 输入区域 */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-700">
                {batchMode ? '输入联系人信息（批量模式）' : '输入联系人信息'}
              </h2>
              
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={batchMode 
                  ? "请输入或粘贴联系人信息，转换后将添加到批量列表中：&#10;&#10;张三&#10;手机：13800138000&#10;邮箱：zhangsan@example.com&#10;公司：ABC科技有限公司&#10;职位：产品经理&#10;&#10;转换完成后可继续添加下一个联系人..."
                  : "请输入或粘贴联系人信息，例如：&#10;&#10;张三&#10;手机：13800138000&#10;邮箱：zhangsan@example.com&#10;公司：ABC科技有限公司&#10;职位：产品经理"
                }
                className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              <div className="flex gap-3">
                <button
                  onClick={handlePaste}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  📋 粘贴
                </button>
                <button
                  onClick={() => setShowLLMConfig(!showLLMConfig)}
                  className="bg-purple-500 hover:bg-purple-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 text-sm"
                >
                  ⚙️ LLM配置
                </button>
                <button
                  onClick={handleConvert}
                  disabled={isConverting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  {isConverting ? '🔄 转换中...' : (batchMode ? '➕ 添加到列表' : '🤖 AI转换')}
                </button>
              </div>
            </div>

            {/* 输出区域 */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-700">
                {batchMode ? `vCard输出 (${batchContacts.length}个联系人)` : 'vCard输出'}
              </h2>
              
              <textarea
                value={batchMode ? batchResult : result}
                readOnly
                placeholder={batchMode 
                  ? "批量转换的vCard内容将显示在这里...&#10;所有联系人的vCard将合并在一个文件中"
                  : "转换后的vCard内容将显示在这里..."
                }
                className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none bg-gray-50 font-mono text-sm"
              />

              {((batchMode && batchResult) || (!batchMode && result)) && (
                <div className="flex gap-3">
                  <button
                    onClick={copyToClipboard}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
                  >
                    📋 复制{batchMode ? `(${batchContacts.length}个)` : ''}
                  </button>
                  <button
                    onClick={downloadVCard}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
                  >
                    💾 下载.vcf文件{batchMode ? `(${batchContacts.length}个)` : ''}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 使用说明 */}
          <div className="mt-8 p-6 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">使用说明</h3>
            <div className="text-blue-700 space-y-2 text-sm">
              <div className="font-medium">🔄 单个转换模式：</div>
              <ul className="ml-4 space-y-1">
                <li>• 在左侧输入框中输入或粘贴联系人信息</li>
                <li>• 点击"AI转换"按钮，AI将自动识别并转换为vCard格式</li>
                <li>• 下载生成的.vcf文件，然后在iPhone上打开即可导入通讯录</li>
              </ul>
              
              <div className="font-medium pt-2">📚 批量转换模式：</div>
              <ul className="ml-4 space-y-1">
                <li>• 切换到批量模式，可以连续添加多个联系人</li>
                <li>• 输入联系人信息后点击"添加到列表"，联系人会被添加到批量列表</li>
                <li>• 输入框会自动清空，可以继续添加下一个联系人</li>
                <li>• 所有联系人的vCard会合并在一个.vcf文件中，方便批量导入</li>
                <li>• 可以在列表中删除不需要的联系人或清空整个列表</li>
              </ul>
              
              <div className="font-medium pt-2">🤖 AI智能识别能力：</div>
              <ul className="ml-4 space-y-1">
                <li>• **基本信息**：姓名、电话、邮箱地址</li>
                <li>• **工作信息**：公司/机构名称、职位/职务/身份</li>
                <li>• **教育背景**：毕业院校、学历、专业、导师信息</li>
                <li>• **专业领域**：研究方向、技能特长、工作经验</li>
                <li>• **地址信息**：工作地址、联系地址（如有）</li>
                <li>• **补充信息**：所有有价值的信息都会整理到NOTE字段</li>
              </ul>
              
              <div className="font-medium pt-2">⚙️ LLM配置：</div>
              <ul className="ml-4 space-y-1">
                <li>• 默认使用Claude提供最佳识别效果</li>
                <li>• 支持本地LLM：LM Studio、Ollama、vLLM等</li>
                <li>• 兼容OpenAI API格式的所有大模型</li>
                <li>• 可自定义API地址、密钥和模型名称</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactConverter;