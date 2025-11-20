// background.js

// 修改点：改为 chrome.runtime.onMessage
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    
  if (request.type === 'PROXY_FETCH') {
    const { url, options } = request;

    fetch(url, options)
      .then(async (response) => {
        const data = await response.text();
        let parsedData;
        try { parsedData = JSON.parse(data); } catch (e) { parsedData = data; }

        sendResponse({
          success: true,
          status: response.status,
          data: parsedData
        });
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });

    return true; // 保持异步通道开启
  }
});