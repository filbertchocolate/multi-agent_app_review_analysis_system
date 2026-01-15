基于 **Research Onion + UTAUT2 + RICE** 三重映射框架及多方召回策略的多 Agent 用户评论智能分析系统，覆盖从数据采集、智能分析到 PRD 自动生成的完整闭环。

## ✨ 功能特性

- 🔍 **自动采集**：从 Apple AppStore 抓取用户评论，支持增量去重
- 🎯 **智能分类**：自动识别评论类型（产品功能/运营活动/用户服务/不相关）
- 🧠 **心理洞察**：基于 UTAUT2 模型深挖用户心理动因
- 📈 **RICE 评分**：RAG 检索历史判例，量化需求优先级
- 📝 **PRD 生成**：自动输出包含 User Story 和功能需求的产品文档
- 📧 **邮件通知**：任务完成后通过 Outlook 发送通知

---
体验地址: https://ai.studio/apps/drive/1yNwiOGmZs0roPwzyvDiL0CU11p5HBEK3, 
注：请确保URL地址是具体评论地址

---

## 📁 目录结构

```
/multi_agent_app_review_analysis_system
├── /comment-insignt-workbench     # 工作台封装程式
├── /workflows
│   ├── app_reviews.json           # Part 1: 评论采集工作流
│   ├── single_comment.json        # Part 2: 单条评论分析工作流
│   └── reviews_analysis.json      # Part 3: 批量分析 + PRD 生成工作流
├── requirements.txt
└── README.md
└── sensitive_info.gitignore
```

---

## 🔧 requirements.txt

```
# LLM API
qwen3-max
qwen-turbo-latest

# Vector Store
pymongo>=4.0.0
langchain>=0.1.0

# Embedding
qwen3-embedding-8B

# Workflow Engine
n8n>=1.0.0

# Utils
requests>=2.28.0
python-dotenv>=1.6.0
```

---

# Part 1: App Reviews — 评论采集工作流

## 📖 概述

从 Apple AppStore 自动抓取指定应用的用户评论，支持：

- 根据应用名称自动查找 Track ID
- 增量采集（基于时间戳去重）
- 数据清洗与格式化
- 存储至 MongoDB

## 🔗 工作流节点

```
Webhook → 查找 Track ID (Agent + iTunes API) → HTTP Request (RSS) → Code 清洗/去重 → MongoDB Upsert
```

## 🌐 API 端点

| 端点 | 方法 | 说明 |
| --- | --- | --- |
| `/webhook/gettracknumber` | POST | 根据应用名查找 Track ID，返回 RSS URL |
| `/webhook/f3cd0daa-...` | POST | 抓取评论并存入 MongoDB |

## 📥 请求示例

```bash
# 获取应用的评论 RSS URL
curl -X POST https://your-n8n.cloud/webhook/gettracknumber \
  -H "Content-Type: application/json" \
  -d '{"app_name": "蚂蚁阿福"}'

# 抓取评论到数据库
curl -X POST https://your-n8n.cloud/webhook/f3cd0daa-... \
  -H "Content-Type: application/json" \
  -d '{"input": "https://itunes.apple.com/cn/rss/customerreviews/id=123456/sortBy=mostRecent/json"}'
```

## 📤 数据结构

```json
{
  "id": "评论唯一ID",
  "author": "用户名",
  "title": "评论标题",
  "content": "评论内容",
  "rating": 5,
  "source": "苹果AppStore_review",
  "version": "1.2.3",
  "date": "2026-01-15T10:00:00Z",
  "link": "评论链接",
  "url": "RSS来源URL"
}
```

---

# Part 2: Single Comment — 单条评论分析工作流

## 📖 概述

实时分析单条用户评论，通过 4 个 Agent 协作完成从场景还原到 PRD 生成的完整流程。

## 🧠 Agent 架构

| Agent | 模型 | 职责 |
| --- | --- | --- |
| **需求分析** | `qwen-turbo` | Research Onion 视角还原场景，分类评论 |
| **心理转译** | `qwen3-max` | UTAUT2 映射（PE/EE/SI/FC/HM/PV/HT） |
| **评分仲裁** | `qwen3-max` | RAG 检索 + RICE 优先级计算 |
| **输出 PRD** | `qwen3-max` | 综合决策，生成完整 PRD 文档 |

## 🔗 工作流节点

```
Webhook → Edit Fields → 需求分析 Agent → 心理转译 Agent → 评分仲裁 Agent → 格式化清洗 → PRD Agent → 响应
```

## 🌐 API 端点

| 端点 | 方法 | 说明 |
| --- | --- | --- |
| `/webhook/singlecomment` | POST | 主入口，接收单条评论并返回 PRD |
| `/webhook/chat-onboarding` | POST | 产品文档上传（向量化） |

## 📥 请求示例

```bash
curl -X POST https://your-n8n.cloud/webhook/singlecomment \
  -H "Content-Type: application/json" \
  -d '{"input": "这个App太卡了，每次打开都要等半天，差评！"}'
```

## 📤 输出示例

```json
{
  "analysis_summary": [{
    "pain_point": "应用启动慢",
    "root_cause": "冷启动性能瓶颈",
    "scenario": "用户日常打开App时",
    "priority": "P1"
  }],
  "generated_prd": {
    "title": "优化应用冷启动性能",
    "background": "用户反馈应用启动耗时过长...",
    "user_stories": ["作为用户，我希望打开App后3秒内可用"],
    "functional_requirements": [{
      "id": "REQ-01",
      "name": "启动流程优化",
      "description": "...",
      "acceptance_criteria": "冷启动时间 < 3s"
    }],
    "data_metrics": ["冷启动时间", "首屏渲染时间"]
  }
}
```

---

# Part 3: Reviews Analysis — 批量分析工作流

## 📖 概述

从 MongoDB 批量读取评论，执行多 Agent 分析，生成 PRD 并存储，支持邮件通知和词云导出。

## 🌐 API 端点

| 端点 | 方法 | 说明 |
| --- | --- | --- |
| `/webhook/167b7acb-...` | POST | 批量评论分析触发 |
| `/webhook/248acdd3-...` | POST | PRD 生成触发 |
| `/webhook/wordcloud` | POST | 词云数据导出 |

## 📧 通知

任务完成后自动发送邮件至配置的 Outlook 邮箱。

---

## 🗄️ MongoDB Collections

| Collection | 说明 |
| --- | --- |
| `app_reviews_{app}` | 原始评论数据+RICE分析结果 |
| `prd_{app}` | 生成的 PRD 文档 |
| `app_reviews_vector_store` | 历史判例向量索引 |

---

## 🚀 快速开始

### 1. 导入工作流

- 将 `workflows/*.json` 导入 n8n
- 配置 Credentials（OpenAI、MongoDB、Microsoft Outlook）

### 2. 上传产品文档

```bash
curl -X POST https://your-n8n.cloud/webhook/chat-onboarding \
  -F "file=@product_spec.txt"
```

### 3. 开始分析

```bash
# 单条评论
curl -X POST https://your-n8n.cloud/webhook/singlecomment \
  -d '{"input": "用户评论内容"}'

# 批量分析
curl -X POST https://your-n8n.cloud/webhook/167b7acb-... \
  -d '{"input": "app_name"}'
```

---

## 📄 License

MIT License
