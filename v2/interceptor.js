(function() {
  const EVT_REQ = 'PNA_REQ_BRIDGE';
  const EVT_RES = 'PNA_RES_BRIDGE';
  
  const originalFetch = window.fetch;
  const OriginalXHR = window.XMLHttpRequest;

  // 辅助：判断是否是需要代理的本地地址
  function isLocalUrl(url) {
    // 容错处理：有些XHR的url可能是相对路径，这里简单判断
    if (!url) return false;
    return url.includes('//127.0.0.1') || url.includes('//localhost');
  }

  const generateId = () => Math.random().toString(36).slice(2) + Date.now();

  function sendToExtension(url, options) {
    return new Promise((resolve, reject) => {
      const id = generateId();
      
      const handler = (e) => {
        if (e.detail.id === id) {
          window.removeEventListener(EVT_RES, handler);
          const res = e.detail.response;
          if (res && res.success) resolve(res);
          else reject(new Error(res ? res.error : 'Unknown Proxy Error'));
        }
      };
      
      window.addEventListener(EVT_RES, handler);
      window.dispatchEvent(new CustomEvent(EVT_REQ, {
        detail: { id, url, options }
      }));
    });
  }

  // ==========================================
  // 1. 劫持 window.fetch (保持不变，这部分通常没问题)
  // ==========================================
  window.fetch = async function(input, init) {
    let url = input;
    if (input instanceof Request) url = input.url;

    if (isLocalUrl(url)) {
      const options = {
        method: (init && init.method) || 'GET',
        headers: (init && init.headers) || {},
        body: (init && init.body) || undefined
      };

      // 简单处理 JSON body
      if (options.body && typeof options.body === 'object') {
          try { options.body = JSON.stringify(options.body); } catch(e){}
      }

      try {
        const proxyRes = await sendToExtension(url, options);
        return new Response(proxyRes.data, {
          status: proxyRes.status,
          statusText: proxyRes.statusText,
          headers: new Headers(proxyRes.headers)
        });
      } catch (e) {
        throw e; // 让前端捕获错误
      }
    }
    return originalFetch.apply(this, arguments);
  };

  // ==========================================
  // 2. 劫持 XMLHttpRequest (修复核心痛点)
  // ==========================================
  class ProxyXHR extends OriginalXHR {
    constructor() {
      super();
      this._isLocal = false;
      this._proxyUrl = '';
      this._proxyMethod = 'GET';
      this._proxyHeaders = {};
    }

    /**
     * 
     * @param {*} method 
     * @param {*} url 
     * @param {*} async  Chrome 插件的消息通信机制不支持同步阻塞，所以此参数时无效的
     * @param {*} user 
     * @param {*} password 
     */
    open(method, url, async, user, password) {
    
      // 处理相对路径或补全
      let targetUrl = url;
      try {
         targetUrl = new URL(url, window.location.href).href;
      } catch(e) {}

      if (isLocalUrl(targetUrl)) {
        this._isLocal = true;
        this._proxyUrl = targetUrl;
        this._proxyMethod = method;
        // 依然调用 super.open 防止一些库检查 readyState 状态
        // 但我们要小心不要让它真的发出请求，所以传入一个空地址或者不理会
        // 这里选择完全接管，不调用 super.open 也可以，只要模拟好状态
      } else {
        super.open(...arguments);
      }
    }

    setRequestHeader(header, value) {
      if (this._isLocal) {
        this._proxyHeaders[header] = value;
      } else {
        super.setRequestHeader(...arguments);
      }
    }

    send(body) {
      if (!this._isLocal) {
        return super.send(body);
      }

      // 1. 模拟网络开始：readyState = 1 (OPENED)
      this._defineProp('readyState', 1);
      this.dispatchEvent(new Event('readystatechange'));

      // 准备数据
      const options = {
        method: this._proxyMethod,
        headers: this._proxyHeaders,
        body: body
      };

      // 发送给插件
      sendToExtension(this._proxyUrl, options)
        .then(res => {
          console.log('res ----------------- : ',res.data)
          // 2. 模拟数据接收：填充属性
          this._defineProp('readyState', 4); // DONE
          this._defineProp('status', res.status);
          this._defineProp('statusText', res.statusText);
          this._defineProp('responseText', res.data);
          this._defineProp('response', res.data); // 这里假设 responseType 是 text/json
          this._defineProp('responseURL', this._proxyUrl);
          
          // 3. 派发标准事件 (关键修复点！！！)
          // 许多库(Axios)依赖 addEventListener('readystatechange') 或 'load'
          
          // 触发 readystatechange
          this.dispatchEvent(new Event('readystatechange'));

          // 触发 progress (可选)
          // this.dispatchEvent(new ProgressEvent('progress', { lengthComputable: true, loaded: 100, total: 100 }));

          // 触发 load
          this.dispatchEvent(new ProgressEvent('load'));

          // 触发 loadend (Axios 也会监听这个)
          this.dispatchEvent(new ProgressEvent('loadend'));

          // 兼容旧代码：如果用户手动设置了 onload 回调
          if (typeof this.onload === 'function') {
            this.onload(new ProgressEvent('load'));
          }
        })
        .catch(err => {
          console.error('[PNA Proxy] XHR Failed:', err);
          this._defineProp('readyState', 4);
          this._defineProp('status', 0);
          this._defineProp('statusText', 'Proxy Error');
          
          this.dispatchEvent(new Event('readystatechange'));
          this.dispatchEvent(new ProgressEvent('error'));
          this.dispatchEvent(new ProgressEvent('loadend'));
          
          if (typeof this.onerror === 'function') {
            this.onerror(err);
          }
        });
    }

    // 辅助函数：使用 Object.defineProperty 修改只读属性
    _defineProp(prop, value) {
      Object.defineProperty(this, prop, {
        value: value,
        writable: false,
        configurable: true // 允许再次修改
      });
    }
  }

  // 覆盖全局 XHR
  window.XMLHttpRequest = ProxyXHR;
  
  console.log('%c[PNA Proxy] Interceptor Loaded', 'color: green; font-weight: bold;');

})();