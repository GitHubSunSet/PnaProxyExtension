# Transparent PNA Proxy Chrome Extension V2

## 概述

Transparent PNA Proxy V2 是一个增强版的Chrome浏览器扩展插件，专门用于绕过Chrome浏览器的Private Network Access (PNA)安全限制。该插件通过透明拦截机制，自动拦截网页中向`127.0.0.1`和`localhost`发起的所有Ajax请求（包括XMLHttpRequest和Fetch API），并通过扩展的后台脚本代理转发这些请求，完全不需要修改原有代码。

## 功能特性

1. **完全透明拦截**：自动拦截所有向127.0.0.1和localhost发起的请求，无需修改前端代码
2. **双API支持**：同时支持XMLHttpRequest和Fetch API的拦截与代理
3. **全端口支持**：支持所有127.0.0.1和localhost的端口
4. **完整的XHR模拟**：正确模拟XMLHttpRequest的所有状态和事件
5. **响应数据返回**：将服务器响应的原始数据正确返回给原始请求
6. **错误处理完善**：提供完整的错误处理机制

## 项目结构

```
PnaProxyExtensionV2/
├── manifest.json      # 扩展配置文件
├── interceptor.js     # 请求拦截器，运行在MAIN世界
├── content_bridge.js # 内容脚本桥接器，运行在隔离世界
├── background.js     # 后台脚本，负责代理请求
└── README.md         # 项目说明文档
```

## 安装和使用

### 1. 加载扩展

1. 打开Chrome浏览器，访问 `chrome://extensions/`
2. 开启右上角的"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择 `PnaProxyExtensionV2` 文件夹
5. 确保扩展已启用

### 2. 验证安装

1. 打开开发者工具 (F12)
2. 切换到Console标签页
3. 访问任意网页，应该能看到以下日志：
   ```
   [PNA Proxy] Interceptor Loaded
   ```

### 3. 使用方法

扩展会自动拦截所有向127.0.0.1和localhost的请求，无需任何额外配置或代码修改。

## 技术实现

### 工作原理

1. **双世界运行**：扩展使用Chrome的MAIN世界和ISOLATED世界分别运行不同脚本
2. **请求拦截**：interceptor.js在MAIN世界中替换window.XMLHttpRequest和window.fetch
3. **事件桥接**：content_bridge.js在ISOLATED世界中处理与后台脚本的通信
4. **代理请求**：background.js接收请求信息，发起实际的网络请求
5. **响应返回**：通过自定义事件机制将响应数据返回给页面

### 核心组件

#### Manifest配置 (manifest.json)

```json
{
  "manifest_version": 3,
  "name": "Transparent PNA Proxy",
  "version": "1.0",
  "host_permissions": [
    "http://127.0.0.1/*",
    "http://localhost/*"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["interceptor.js"],
      "world": "MAIN", 
      "run_at": "document_start"
    },
    {
      "matches": ["<all_urls>"],
      "js": ["content_bridge.js"],
      "run_at": "document_start"
    }
  ]
}
```

#### 请求拦截器 (interceptor.js)

主要功能：
- 替换window.XMLHttpRequest和window.fetch
- 拦截向127.0.0.1和localhost发起的请求
- 通过自定义事件与content_bridge.js通信
- 完整模拟XMLHttpRequest的所有状态和事件

#### 内容桥接器 (content_bridge.js)

主要功能：
- 监听来自interceptor.js的自定义事件
- 通过chrome.runtime.sendMessage与后台脚本通信
- 将后台响应通过自定义事件返回给interceptor.js

#### 后台脚本 (background.js)

主要功能：
- 接收来自content_bridge.js的请求信息
- 发起实际的网络请求
- 将响应数据返回给content_bridge.js

## 权限说明

### host_permissions
- `http://127.0.0.1/*`：允许访问所有127.0.0.1路径
- `http://localhost/*`：允许访问所有localhost路径

## 调试方法

1. 打开Chrome开发者工具 (F12)
2. 切换到Console标签页
3. 查看日志信息：
   - `[PNA Proxy] Interceptor Loaded`：拦截器加载成功
   - 请求处理过程中的详细日志
4. 检查Network标签页，确认请求是否被正确代理

## 使用示例

### XMLHttpRequest请求

```javascript
// 无需修改，自动拦截
const xhr = new XMLHttpRequest();
xhr.open('GET', 'http://127.0.0.1:8080/api/data');
xhr.onreadystatechange = function() {
  if (xhr.readyState === 4 && xhr.status === 200) {
    console.log(xhr.responseText);
  }
};
xhr.send();
```

### Fetch API请求

```javascript
// 无需修改，自动拦截
fetch('http://127.0.0.1:8080/api/data')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error(error));
```

### Axios请求

```javascript
// 无需修改，自动拦截
axios.get('http://127.0.0.1:8080/api/data')
  .then(response => console.log(response.data))
  .catch(error => console.error(error));
```

## 技术细节

### XMLHttpRequest模拟

扩展通过ProxyXHR类完整模拟了XMLHttpRequest的行为：
- 正确处理open、setRequestHeader、send等方法
- 模拟readyState、status、responseText等属性
- 触发readystatechange、load、error等事件
- 兼容onload、onerror等回调函数

### 双世界通信

扩展使用了Chrome的双世界机制：
- **MAIN世界**：运行interceptor.js，可以直接访问和修改页面对象
- **ISOLATED世界**：运行content_bridge.js，具有访问Chrome API的权限

通过自定义事件在两个世界之间传递数据。

## 注意事项

1. 扩展会在document_start阶段加载，确保能拦截到所有请求
2. **Chrome插件的消息通信机制不支持同步阻塞，所以XMLHttpRequest的async:false参数是无效的**
3. 扩展会自动处理相对路径URL，转换为绝对路径进行拦截
4. 响应数据默认作为文本处理，支持JSON自动解析

## 常见问题

### 1. 扩展无法拦截请求
- 确保扩展已正确加载并启用
- 检查Console中是否有拦截器加载的日志
- 验证请求URL是否匹配127.0.0.1或localhost

### 2. 请求失败或返回错误
- 检查后台脚本的Console日志，查看具体的错误信息
- 确认目标服务器正在运行且可访问
- 验证服务器的CORS配置是否正确

### 3. 页面JavaScript库不兼容
- 某些库可能依赖特定的XHR行为，需要针对性调整
- 可以通过修改ProxyXHR类来适配特定库的需求

## 开发和扩展

### 代码规范

1. 使用统一的事件名称，防止冲突
2. 请求和响应通过唯一的ID进行匹配
3. 错误处理要完整，确保不会影响页面正常功能

### 扩展建议

1. 添加对更多HTTP方法的支持
2. 支持配置拦截的IP地址范围
3. 添加请求日志记录功能
4. 支持请求过滤和黑白名单配置

## 许可证

本项目为开源项目，可用于学习和研究目的。

## 联系方式

如有问题或建议，请提交issue或联系开发者。