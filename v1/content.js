// content.js

// 定义唯一的事件名称，防止冲突
const EVENT_REQUEST = 'PNA_PROXY_REQUEST_e8f9'; // 加随机后缀更安全
const EVENT_RESPONSE = 'PNA_PROXY_RESPONSE_e8f9';

// 1. 监听网页发起的自定义请求事件
window.addEventListener(EVENT_REQUEST, (event) => {
  // 注意：CustomEvent 的数据存储在 event.detail 中
  const requestData = event.detail;

  if (!requestData) return;

  // 2. 转发给后台 Service Worker
  chrome.runtime.sendMessage(requestData.payload, (response) => {
    
    // 3. 收到后台数据，创建自定义响应事件发回给网页
    // 注意：必须 cloneInto 或者确保数据是可序列化的，但在 Chrome 中直接传对象通常没问题
    const responseEvent = new CustomEvent(EVENT_RESPONSE, {
      detail: {
        id: requestData.id, // 这里的 ID 用于回调匹配
        payload: response
      }
    });

    window.dispatchEvent(responseEvent);
  });
});