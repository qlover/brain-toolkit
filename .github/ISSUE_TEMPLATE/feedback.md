---
name: 用户反馈
about: PAM 用户反馈（后台自动创建 Issue 也使用本模板，占位符由服务端替换）
title: "[反馈][{{category}}] {{summary}}"
labels: feedback
---

> 来自 PAM 用户反馈 · 反馈 ID：`{{feedback_id}}` · [后台查看]({{admin_url}})

### 提交人

| 项目 | 值 |
| --- | --- |
| 昵称 | {{display_name}} |
| 邮箱 | {{email}} |
| 手机 | {{phone}} |
| 提交时间 | {{created_at}} |

### 描述

{{body}}

### 设备与环境

{{environment}}

### 页面

{{page_url}}

### 截图

{{screenshots}}

{{user_agent}}
