## 概述

PNA Proxy Extension 是一个款Chrome浏览器扩展插件，专门用于绕过Chrome浏览器的Private Network Access (PNA)安全限制。该插件通过透明拦截机制，自动拦截网页中向`127.0.0.1`和`localhost`发起的所有Ajax请求（包括XMLHttpRequest和Fetch API），并通过扩展的后台脚本代理转发这些请求，完全不需要修改原有代码。

## 功能特性

1. **完全透明拦截**：自动拦截所有向127.0.0.1和localhost发起的请求，无需修改前端代码
2. **双API支持**：同时支持XMLHttpRequest和Fetch API的拦截与代理
3. **全端口支持**：支持所有127.0.0.1和localhost的端口
4. **完整的XHR模拟**：正确模拟XMLHttpRequest的所有状态和事件
5. **响应数据返回**：将服务器响应的原始数据正确返回给原始请求
6. **错误处理完善**：提供完整的错误处理机制
