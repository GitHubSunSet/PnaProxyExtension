# PNA Bypass Proxy Chrome Extension V1

## 概述

PNA Bypass Proxy V1 是一个Chrome浏览器扩展插件，专门用于绕过Chrome浏览器的Private Network Access (PNA)安全限制。该插件通过自定义事件和消息传递机制，拦截网页中向`127.0.0.1`和`localhost`发起的请求，并通过扩展的后台脚本代理转发这些请求。

## 功能特性

1. **绕过PNA限制**：通过Chrome扩展机制绕过浏览器的私有网络访问限制
2. **全端口支持**：支持所有127.0.0.1和localhost的端口（使用通配符配置）
3. **自定义事件机制**：使用CustomEvent实现页面与内容脚本间的通信
4. **Fetch API代理**：支持代理Fetch API请求
5. **响应数据返回**：将服务器响应的原始数据正确返回给原始请求

## 项目结构

```
PnaProxyExtensionV1/
├── manifest.json      # 扩展配置文件
├── content.js         # 内容脚本，负责监听页面事件
├── background.js      # 后台脚本，负责代理请求
├── proxyFetch.js      # 前端调用代码示例
└── README.md          # 项目说明文档
```

## 安装和使用

### 1. 加载扩展

1. 打开Chrome浏览器，访问 `chrome://extensions/`
2. 开启右上角的"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择 `PnaProxyExtensionV1` 文件夹
5. 确保扩展已启用

### 2. 使用方法

要在网页中使用此扩展，需要在页面中引入 `proxyFetch.js` 并调用 `proxyFetch` 函数：

```javascript
// 引入proxyFetch.js后，可以这样使用：
proxyFetch('http://127.0.0.1:10086/api/test')
  .then(res => console.log("成功:", res.data))
  .catch(err => console.error("失败:", err));
```

## 技术实现

### 工作原理

1. **内容脚本注入**：扩展在页面加载开始时注入content.js脚本
2. **自定义事件监听**：content.js监听页面发出的自定义事件
3. **消息传递**：通过chrome.runtime.sendMessage将请求发送到background.js
4. **代理请求**：background.js接收请求信息，发起实际的网络请求
5. **响应返回**：background.js将服务器响应通过消息传递返回给content.js
6. **事件响应**：content.js通过自定义事件将响应数据返回给页面

### 核心组件

#### Manifest配置 (manifest.json)

```json
{
  "manifest_version": 3,
  "name": "Localhost PNA Proxy (All URLs)",
  "version": "2.0",
  "background": {
    "service_worker": "background.js"
  },
  "host_permissions": [
    "http://127.0.0.1:*/*",
    "http://localhost:*/*"
  ],
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "run_at": "document_start"
    }
  ]
}
```

#### 内容脚本 (content.js)

内容脚本主要负责：

- 监听网页发起的自定义请求事件
- 通过chrome.runtime.sendMessage将请求转发给后台脚本
- 接收后台脚本的响应并通过自定义事件返回给页面

#### 后台脚本 (background.js)

后台脚本主要负责：

- 接收来自内容脚本的请求信息
- 发起实际的网络请求
- 将响应数据返回给内容脚本

#### 前端调用代码 (proxyFetch.js)

前端调用代码示例：

- 定义proxyFetch函数，用于发起代理请求
- 使用Promise处理异步响应
- 通过自定义事件与内容脚本通信

## 权限说明

### host_permissions

- `http://127.0.0.1:*/*`：允许访问所有127.0.0.1端口
- `http://localhost:*/*`：允许访问所有localhost端口

## 调试方法

1. 打开Chrome开发者工具 (F12)
2. 切换到Console标签页
3. 查看日志信息：
   - 扩展加载时的日志
   - 请求处理过程中的日志
4. 检查Network标签页，确认请求是否被正确代理

## 使用示例

### 基本用法

```javascript
proxyFetch('http://127.0.0.1:10086/api/test')
  .then(res => {
    console.log("请求成功:", res.data);
  })
  .catch(err => {
    console.error("请求失败:", err);
  });
```

### 带选项的请求

```javascript
proxyFetch('http://127.0.0.1:10086/api/data', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ key: 'value' })
})
  .then(res => {
    console.log("POST请求成功:", res.data);
  })
  .catch(err => {
    console.error("POST请求失败:", err);
  });
```

## 注意事项

1. 此版本使用自定义事件机制，需要在页面中引入proxyFetch.js
2. 请求和响应通过唯一的请求ID进行匹配
3. 扩展只处理类型为'PROXY_FETCH'的请求
4. 响应数据会尝试解析为JSON，如果失败则作为文本处理

## 常见问题

### 1. 扩展无法拦截请求

- 确保扩展已正确加载并启用
- 检查页面是否正确引入了proxyFetch.js
- 验证请求URL是否匹配127.0.0.1或localhost

### 2. 请求失败或返回错误

- 检查后台脚本的Console日志，查看具体的错误信息
- 确认目标服务器正在运行且可访问
- 验证服务器的CORS配置是否正确

## 开发和扩展

### 代码规范

1. 使用统一的事件名称，防止冲突
2. 请求和响应通过唯一的ID进行匹配
3. 错误处理要完整，确保不会影响页面正常功能

### 扩展建议

1. 添加对XMLHttpRequest的支持
2. 支持更多的HTTP方法
3. 添加请求日志记录功能
4. 支持请求过滤和黑白名单配置

## 许可证

本项目为开源项目，可用于学习和研究目的。

## 联系方式

如有问题或建议，请提交issue或联系开发者。
