chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'PNA_PROXY_FETCH') {
    const { url, options } = request;
    
    // 移除可能导致跨域问题的 header（视情况而定）
    // if (options.headers) delete options.headers['Sec-Fetch-Mode'];

    fetch(url, options)
      .then(async (response) => {
        // 获取文本数据
        const textData = await response.text();
        
        sendResponse({
          success: true,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()), // 序列化 Headers
          data: textData
        });
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });

    return true; // 保持异步通道
  }
});