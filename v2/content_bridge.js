// 定义特有的事件名
const EVT_REQ = 'PNA_REQ_BRIDGE';
const EVT_RES = 'PNA_RES_BRIDGE';

window.addEventListener(EVT_REQ, (event) => {
  const { id, url, options } = event.detail;

  // 转发给后台
  chrome.runtime.sendMessage({
    type: 'PNA_PROXY_FETCH',
    url, 
    options
  }, (response) => {
    // 收到后台结果，派发事件回 Main World
    const resEvent = new CustomEvent(EVT_RES, {
      detail: { id, response }
    });
    window.dispatchEvent(resEvent);
  });
});