# Reminder Plugin

一个基于 React + Vite 的小型任务提醒插件原型，支持在时间段内对任务进行提醒。

## 已实现功能

- 设置开始/结束时间的任务
- 创建、编辑、删除任务
- 浏览器通知提醒（任务开始前 10 分钟 + 进入时间段）
- 本地持久化（LocalStorage）
- 友好的响应式界面

## 运行方式

```bash
cd reminder-plugin
npm install
npm run dev
```

然后在浏览器访问终端输出的本地地址。

## 可维护性建议

- 将提醒策略抽到 src/services/reminderService.js
- 将任务校验规则抽到 src/utils/validators.js
- 未来若需多端同步，可替换 localStorage 为后端 API
