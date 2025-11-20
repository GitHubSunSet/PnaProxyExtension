// 前端调用代码

// 必须与 content.js 中的定义保持一致
const EVENT_REQUEST = 'PNA_PROXY_REQUEST_e8f9';
const EVENT_RESPONSE = 'PNA_PROXY_RESPONSE_e8f9';

function proxyFetch(url, options = {}) {
  const requestId = Date.now() + Math.random().toString();

  return new Promise((resolve, reject) => {
    
    // 1. 定义响应处理函数
    const handleResponse = (event) => {
      const data = event.detail;
      
      // 匹配请求ID
      if (data && data.id === requestId) {
        // 清理监听器
        window.removeEventListener(EVENT_RESPONSE, handleResponse);
        
        const res = data.payload;
        if (res && res.success) {
          resolve(res);
        } else {
          reject(new Error(res ? res.error : "Unknown Error"));
        }
      }
    };

    // 2. 先挂载监听器，等待 content.js 返回数据
    window.addEventListener(EVENT_RESPONSE, handleResponse);

    // 3. 创建并派发自定义事件
    const requestEvent = new CustomEvent(EVENT_REQUEST, {
      detail: {
        id: requestId,
        payload: {
          type: 'PROXY_FETCH',
          url: url,
          options: options
        }
      }
    });

    window.dispatchEvent(requestEvent);
  });
}

// --- 测试调用 ---
proxyFetch('http://127.0.0.1:10086/api/test')
  .then(res => console.log("成功:", res.data))
  .catch(err => console.error("失败:", err));