
import React, { useState, useRef, useEffect, useMemo } from 'react';
import BackgroundCanvas from './components/BackgroundCanvas';
import { analyzeProductDoc } from './services/geminiService';
import { AnalysisType } from './types';

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [appName, setAppName] = useState('');
  const [result, setResult] = useState<any>(null); 
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [hoverTargetId, setHoverTargetId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [showFullScreenResult, setShowFullScreenResult] = useState(false);

  const updateStatus = (msg: string) => {
    setStatusMessage(msg);
  };

  const handleAction = async (type: AnalysisType) => {
    if (type === AnalysisType.PRD) {
      if (!inputText.trim()) {
        alert('请先输入内容以生成 PRD！');
        return;
      }
      const prdWebhook = 'https://filbertchocolate.app.n8n.cloud/webhook/248acdd3-8197-4cf5-9082-a72634d2e9ee';
      await postToN8n(prdWebhook, "prd_trigger", "秒出 PRD");
      return;
    }

    if (type === AnalysisType.INSIGHT) {
      if (!inputText.trim()) {
        alert('请先在对话框输入背景内容以开始洞察！');
        return;
      }
      const insightWebhook = 'https://filbertchocolate.app.n8n.cloud/webhook/167b7acb-802f-43f0-8a4b-0aff7c9bfce8';
      await postToN8n(insightWebhook, "insight_trigger", "开始洞察真相");
    }
  };

  const postToN8n = async (webhookUrl: string, source: string, description: string, extraData: any = {}) => {
    if (!inputText.trim()) {
      alert(`请先在对话框中输入内容以进行${description}！`);
      return;
    }

    setIsLoading(true);
    setResult(null);
    setActiveTask(source);
    updateStatus(`正在准备${description}...`);

    try {
      const payload = {
        data: inputText,
        timestamp: new Date().toISOString(),
        type: source,
        source: "workbench_v4_cluster",
        ...extraData
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        cache: 'no-store'
      });

      if (response.ok) {
        const responseText = await response.text();
        let data: any = responseText;
        if (responseText.trim()) {
          try { data = JSON.parse(responseText); } catch (e) { data = responseText; }
        }
        
        let output: any = data;
        if (source === "insight_trigger") {
          output = "宝子，指令收到！洞察引擎正在疯狂蹦迪，真相挖掘进度条已拉满，坐稳扶好，最绝的分析报告正在火速赶往现场！💅✨🚀";
        } else if (source === "prd_trigger") {
          output = "PRD 猛男已进入暴走状态！键盘火星子都要按出来了，逻辑架构正在火速空投，这波 PRD 输出我愿称之为绝绝子！稍等片刻，神仙文档即将降临！🔥⌨️🚀✨";
        }

        const newResult = {
          content: output,
          type: source,
          description: description,
          timestamp: new Date().toLocaleString()
        };

        setResult(newResult);
        updateStatus(`${description}完成。`);

        const needsFullScreen = ["comment_data_upload", "single_comment_test", "word_cloud_trigger"];
        if (needsFullScreen.includes(source)) {
          setShowFullScreenResult(true);
        }
      } else {
        throw new Error(`传输失败，状态码: ${response.status}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      updateStatus(`分析链路异常: ${errorMsg}`);
      setResult({
        content: `## 🚨 数据传输中断\n\n**错误详情**: \`${errorMsg}\``,
        type: 'error'
      });
    } finally {
      setIsLoading(false);
      setActiveTask(null);
    }
  };

  const handleFetchUrl = async () => {
    if (!appName.trim()) {
      alert('请输入应用名称！');
      return;
    }
    setIsLoading(true);
    updateStatus(`正在请求 [${appName}] 的应用 URL...`);
    try {
      const response = await fetch('https://filbertchocolate.app.n8n.cloud/webhook/gettracknumber', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_name: appName })
      });
      if (response.ok) {
        const data = await response.json();
        const url = data.url || data.link || JSON.stringify(data);
        setInputText(url);
        updateStatus(`解析成功: ${url}`);
      }
    } catch (e) {
      updateStatus(`获取 URL 异常`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadData = () => postToN8n("https://filbertchocolate.app.n8n.cloud/webhook/f3cd0daa-5c5a-43d3-b8d3-a06f36559a86", "comment_data_upload", "上传评论数据");
  const handleFeedArchive = () => postToN8n("https://filbertchocolate.app.n8n.cloud/webhook/chat-onboarding", "product_archive_feed", "喂食产品档案");
  const handleSingleCommentTest = () => postToN8n("https://filbertchocolate.app.n8n.cloud/webhook/singlecomment", "single_comment_test", "单条评论解析");
  const handleCreateWordCloud = () => postToN8n("https://filbertchocolate.app.n8n.cloud/webhook/wordcloud", "word_cloud_trigger", "创建词云");

  const onMouseEnter = (id: string) => setHoverTargetId(id);
  const onMouseLeave = () => setHoverTargetId(null);

  const flattenData = (obj: any, prefix = ''): { key: string; value: any; level: number }[] => {
    const rows: { key: string; value: any; level: number }[] = [];
    const level = prefix ? prefix.split('.').length : 0;

    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        if (typeof item === 'object' && item !== null) {
          rows.push(...flattenData(item, `${prefix}[${index}]`));
        } else {
          rows.push({ key: `${prefix}[${index}]`, value: item, level });
        }
      });
    } else if (typeof obj === 'object' && obj !== null) {
      Object.entries(obj).forEach(([key, value]) => {
        const currentKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object' && value !== null) {
          rows.push({ key: currentKey, value: '', level });
          rows.push(...flattenData(value, currentKey));
        } else {
          rows.push({ key: currentKey, value, level });
        }
      });
    } else {
      rows.push({ key: prefix, value: obj, level });
    }
    return rows;
  };

  /**
   * 语义聚合物理词云组件 - 配色方案与快速下落逻辑
   */
  const FeatureWordCloudView: React.FC<{ data: any[] }> = ({ data }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [elements, setElements] = useState<any[]>([]);
    
    // 物理环境配置：大幅提高重力 (0.8) 确保 3s 内全部到位
    const config = {
      gravity: 0.85,          // 极限重力加速
      friction: 0.96,         // 稍微增加摩擦力防止着陆后过度反弹
      repulsion: 0.5,         // 词条间排斥力
      attraction: 0.012,      // 增强语义引力使聚合更迅速
      groundElasticity: 0.15, // 降低地面弹性，使其尽快停稳
      groundFriction: 0.8,    // 增加地面摩擦
      cushionZone: 120        // 增大缓冲带
    };

    // 严格使用 Star Gold (#d4af37) 和 MongoDB Green (#00ed64)
    const palettes = {
      gold: ['#fffceb', '#fce277', '#f4ce42', '#d4af37', '#b8942b', '#8c6e1a'], // 金色系
      green: ['#e1fff0', '#a1ffcf', '#57f2a4', '#00ed64', '#009e4a', '#00684a'] // MongoDB 绿系
    };

    const cloudData = useMemo(() => {
      const counts: Record<string, { count: number, category: string }> = {};
      const categories: Set<string> = new Set();
      const ignoreList = ['N/A', 'n/a', 'None', 'none', 'unknown', 'Other', 'other', 'NA', 'na', '-', ' ', '无', 'null', 'undefined'];
      
      data.forEach(item => {
        let key = item.feature_module || item.module || item.label || item.type || 'General';
        let category = key.toString().trim();
        let value = item.feature_module || item.module || item.label || item.type || '';
        if (value) {
          value = value.toString().trim();
          const isInvalid = ignoreList.some(ignore => value.toLowerCase() === ignore.toLowerCase()) || 
                           value.length < 2 || 
                           /^[0-9\W_]+$/.test(value);
          if (!isInvalid) {
            if (!counts[value]) {
              counts[value] = { count: 0, category };
              categories.add(category);
            }
            counts[value].count += 1;
          }
        }
      });

      const categoryList = Array.from(categories);
      const categoryToPalette = Object.fromEntries(
        categoryList.map(cat => [cat, Math.random() > 0.5 ? 'gold' : 'green'])
      );

      return Object.entries(counts)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 45)
        .map(([text, info]) => ({
          text,
          count: info.count,
          category: info.category,
          paletteType: categoryToPalette[info.category] as 'gold' | 'green'
        }));
    }, [data]);

    useEffect(() => {
      if (!containerRef.current || cloudData.length === 0) return;

      const rect = containerRef.current.getBoundingClientRect();
      const maxCount = Math.max(...cloudData.map(d => d.count));
      
      const categories = Array.from(new Set(cloudData.map(d => d.category)));
      const categoryCenters = Object.fromEntries(categories.map((cat, i) => [
        cat, 
        (rect.width * 0.1) + (i / categories.length) * (rect.width * 0.8)
      ]));

      // 初始化粒子：极度压缩 y 轴间隔 (12px)，确保下落几乎是同步的
      let particles = cloudData.map((d, idx) => {
        const ratio = d.count / maxCount;
        const fontSize = 0.7 + ratio * 1.2;
        const radius = (d.text.length * (fontSize * 9)) / 2 + 20; 
        
        const baseCenter = categoryCenters[d.category];
        const jitter = (Math.random() - 0.5) * 60;

        return {
          id: idx,
          ...d,
          ratio,
          fontSize,
          radius,
          x: baseCenter + jitter,
          y: -150 - (idx * 12), // 极大压缩纵向分布
          vx: (Math.random() - 0.5) * 4,
          vy: 15 + Math.random() * 10, // 初始带有向下冲力
          opacity: 0,
          rotation: (Math.random() - 0.5) * 20
        };
      });

      let animationFrame: number;
      const update = () => {
        if (!containerRef.current) return;
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        particles = particles.map(p => {
          if (p.opacity < 1) p.opacity += 0.08;
          const distToBottom = height - (p.y + p.radius);
          if (distToBottom < config.cushionZone && distToBottom > 0) {
            const bufferFactor = 1 - (distToBottom / config.cushionZone);
            p.vy *= (1 - bufferFactor * 0.05);
          }
          p.vy += config.gravity;
          p.vx *= config.friction;
          p.vy *= config.friction;
          p.x += p.vx;
          p.y += p.vy;
          if (p.y + p.radius > height) { 
            p.y = height - p.radius; 
            p.vy *= -config.groundElasticity; 
            p.vx *= config.groundFriction; 
          }
          if (p.x - p.radius < 5) { p.x = p.radius + 5; p.vx *= -0.4; }
          else if (p.x + p.radius > width - 5) { p.x = width - p.radius - 5; p.vx *= -0.4; }
          return p;
        });

        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const p1 = particles[i];
            const p2 = particles[j];
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const distSq = dx * dx + dy * dy;
            const distance = Math.sqrt(distSq);
            const minDist = p1.radius + p2.radius + 15;
            
            if (p1.category === p2.category && distance > minDist) {
              const pull = config.attraction;
              p1.vx += (dx / distance) * pull; p1.vy += (dy / distance) * pull;
              p2.vx -= (dx / distance) * pull; p2.vy -= (dy / distance) * pull;
            }
            if (distance < minDist) {
              const overlap = minDist - distance;
              const angle = Math.atan2(dy, dx);
              const force = overlap * config.repulsion;
              const fx = Math.cos(angle) * force;
              const fy = Math.sin(angle) * force;
              p1.vx -= fx; p1.vy -= fy; p2.vx += fx; p2.vy += fy;
              const moveX = Math.cos(angle) * (overlap * 0.5);
              const moveY = Math.sin(angle) * (overlap * 0.5);
              p1.x -= moveX; p1.y -= moveY; p2.x += moveX; p2.y += moveY;
            }
          }
        }

        setElements([...particles]);
        animationFrame = requestAnimationFrame(update);
      };

      animationFrame = requestAnimationFrame(update);
      return () => cancelAnimationFrame(animationFrame);
    }, [cloudData]);

    return (
      <div ref={containerRef} className="relative w-full h-full overflow-hidden select-none">
        {elements.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-slate-500 animate-pulse">
            <span className="material-symbols-outlined text-6xl">insights</span>
            <p className="font-mono text-[10px] uppercase tracking-[0.4em]">Fast Descent Initializing...</p>
          </div>
        ) : (
          elements.map((p) => {
            const palette = palettes[p.paletteType];
            const colorIndex = Math.floor(p.ratio * (palette.length - 1));
            const hexColor = palette[colorIndex];
            
            return (
              <div 
                key={p.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 will-change-transform group"
                style={{
                  left: p.x,
                  top: p.y,
                  opacity: p.opacity,
                  zIndex: 100 + Math.floor(p.ratio * 20),
                  transform: `translate(-50%, -50%) rotate(${p.rotation}deg)`
                }}
              >
                <div 
                  className="relative flex items-center gap-3 backdrop-blur-3xl bg-white/[0.04] rounded-full px-6 py-2.5 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.5)] transition-all cursor-default group-hover:scale-110 active:scale-95"
                  style={{
                    border: `1px solid ${hexColor}66`,
                    boxShadow: `0 10px 30px -5px ${hexColor}55`
                  }}
                >
                  <div 
                    className="w-2.5 h-2.5 rounded-full shrink-0" 
                    style={{ backgroundColor: hexColor, boxShadow: `0 0 10px ${hexColor}ff` }}
                  ></div>
                  <span 
                    className="font-black tracking-tight whitespace-nowrap"
                    style={{ 
                      fontSize: `${p.fontSize}rem`,
                      color: hexColor,
                      textShadow: p.ratio > 0.4 ? `0 0 15px ${hexColor}aa` : 'none'
                    }}
                  >
                    {p.text}
                  </span>

                  <div className="absolute -top-16 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all bg-slate-950/95 border border-white/10 px-4 py-2 rounded-2xl shadow-2xl z-[500] pointer-events-none translate-y-2 group-hover:translate-y-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: hexColor }}></div>
                      <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">{p.category}</span>
                    </div>
                    <p className="text-white text-xs font-bold text-center">{p.count} Mentions</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  };

  const renderStructuredTable = (content: any) => {
    const rows = flattenData(content);
    return (
      <div className="w-full h-full overflow-auto scrollbar-thin">
        <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-900 border-b border-white/10">
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest w-1/3">分析维度</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">剖析内容</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-amber-500/[0.03] transition-colors group">
                  <td className="px-8 py-5 font-mono text-[11px] text-slate-500 group-hover:text-amber-500/80">
                    <div style={{ paddingLeft: `${row.level * 16}px` }} className="flex items-center gap-2">
                      {row.level > 0 && <span className="opacity-30">└─</span>}
                      {row.key}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-slate-300 font-light leading-relaxed">
                    {row.value === '' ? (
                      <span className="text-[10px] uppercase font-bold text-slate-600 tracking-tighter">展开明细</span>
                    ) : (
                      String(row.value)
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const FullScreenDataPage = () => {
    if (!result || !result.content) return null;
    const { content, description, timestamp, type } = result;
    
    return (
      <div className="fixed inset-0 z-[100] bg-deep-bg flex flex-col animate-in fade-in duration-700 overflow-hidden">
        <BackgroundCanvas hoverTargetId={null} />

        <header className="relative z-10 h-20 border-b border-white/10 bg-white/[0.03] backdrop-blur-3xl px-12 flex items-center justify-between">
          <div className="flex items-center gap-6">
             <button 
               onClick={() => setShowFullScreenResult(false)}
               className="group flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-95"
             >
               <span className="material-symbols-outlined text-sm">arrow_back</span>
               <span className="text-[10px] font-black uppercase tracking-widest">返回工作台</span>
             </button>
             <div className="h-4 w-px bg-white/10"></div>
             <div>
               <h2 className="text-white font-black text-lg tracking-tight">
                 {type === 'word_cloud_trigger' ? 'Semantic Insight Art' : `${description} 详情`}
               </h2>
               <p className="text-[9px] text-amber-500/60 font-mono uppercase tracking-[0.2em]">
                 {type === 'word_cloud_trigger' ? 'Super-Gravity Physics Engine' : 'Structured Data Discovery'} · {timestamp}
               </p>
             </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[9px] font-black text-amber-500 uppercase tracking-widest">
               {Array.isArray(content) ? `ITEM COUNT: ${content.length}` : 'DATA VIEW'}
             </div>
             <button onClick={() => window.print()} className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all bg-white/5">
               <span className="material-symbols-outlined text-lg">print</span>
             </button>
          </div>
        </header>

        <main className="relative z-10 flex-1 p-12 overflow-hidden flex flex-col">
          {type === 'word_cloud_trigger' && Array.isArray(content) ? (
            <div className="glass-window rounded-[3rem] border border-white/5 overflow-hidden flex flex-col flex-1 shadow-[0_0_100px_-20px_rgba(0,0,0,0.9)] bg-black/10">
              <FeatureWordCloudView data={content} />
            </div>
          ) : (
            <div className="glass-window rounded-[2rem] border border-white/5 overflow-hidden flex flex-col flex-1 shadow-[0_0_100px_-20px_rgba(0,0,0,0.8)] bg-black/20">
              {type === 'single_comment_test' ? renderStructuredTable(content) : (
                <div className="flex-1 overflow-auto scrollbar-thin">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-slate-900 border-b border-white/10">
                        {content && Array.isArray(content) && content.length > 0 && Object.keys(content[0]).map(h => (
                          <th key={h} className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {Array.isArray(content) && content.map((row: any, idx: number) => (
                        <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                          {Object.keys(row).map(h => (
                            <td key={h} className="px-8 py-6 text-sm text-slate-400 group-hover:text-slate-100 font-light leading-relaxed">
                              {typeof row[h] === 'object' ? JSON.stringify(row[h]) : String(row[h])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </main>

        <footer className="relative z-10 h-12 border-t border-white/5 bg-black/40 px-12 flex items-center justify-between text-[9px] text-slate-600 font-mono">
           <p>© INSIGHT ENGINE v4.0 · HYPER-DESCENT ENABLED</p>
           <p>SYSTEM STATUS: OPTIMAL · COLORS: ATLAS GOLD & MONGODB GREEN</p>
        </footer>
      </div>
    );
  };

  const actionButtonClass = "group flex flex-row items-center gap-3 px-5 py-2.5 rounded-2xl border border-white/5 bg-white/[0.03] backdrop-blur-xl text-slate-400 hover:text-white hover:border-amber-500/40 hover:bg-amber-500/10 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed h-12";
  const accentButtonClass = "group flex flex-row items-center gap-3 px-5 py-2.5 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-amber-500 hover:bg-amber-500/20 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed h-12";

  return (
    <div className="w-full relative bg-deep-bg h-screen overflow-hidden">
      <BackgroundCanvas hoverTargetId={hoverTargetId} />
      
      {showFullScreenResult && <FullScreenDataPage />}

      <div className="relative z-10 h-full overflow-y-auto scrollbar-hide">
        <section className="min-h-screen flex flex-col items-center justify-center p-6">
          <main className="max-w-[1100px] w-full flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="flex flex-col gap-3 text-center mb-2">
              <h1 className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-500 tracking-tight drop-shadow-2xl pb-2">
                评论洞察工作台
              </h1>
              <p className="text-amber-500/60 text-sm font-bold tracking-[0.4em] uppercase opacity-90">
                AI POWERED · PROFESSIONAL INSIGHT
              </p>
            </div>

            <div className="glass-window rounded-[2.5rem] flex flex-col relative overflow-hidden transition-all duration-700 hover:bg-white/[0.02] group border border-white/10">
              <div className="h-12 flex items-center justify-between px-8 border-b border-white/5 bg-white/[0.01]">
                <div className="flex items-center gap-6">
                  <span className="text-[9px] font-bold text-slate-500 tracking-[0.4em] uppercase">
                    {isLoading ? 'Processing...' : 'Analysis Console v1.0'}
                  </span>
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/5 border border-emerald-500/10">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[8px] font-black text-emerald-500/70 tracking-widest uppercase">DB: ATLAS (ONLINE)</span>
                  </div>
                </div>
              </div>
              <div className="relative min-h-[320px]">
                {isLoading ? (
                  <div className="w-full h-[320px] flex items-center justify-center bg-slate-950/40">
                    <div className="flex flex-col items-center gap-8">
                      <div className="relative flex items-center justify-center">
                        <div className="w-20 h-20 border-2 border-amber-500/10 rounded-full"></div>
                        <div className="w-20 h-20 border-t-2 border-amber-500 rounded-full animate-spin absolute inset-0"></div>
                        <span className="material-symbols-outlined text-amber-500/40 text-2xl absolute">hub</span>
                      </div>
                      <p className="text-slate-400 font-mono text-[10px] max-w-[450px] text-center">{statusMessage}</p>
                    </div>
                  </div>
                ) : result && !showFullScreenResult ? (
                  <div className="w-full h-[320px] overflow-auto p-10 scrollbar-thin">
                    <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                      <div className="flex items-center gap-3">
                         <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                         <span className="text-[10px] font-black text-amber-500/80 uppercase tracking-widest">
                           Analysis Result
                         </span>
                      </div>
                      <button onClick={() => setResult(null)} className="text-[9px] font-bold text-slate-500 hover:text-white uppercase px-4 py-1.5 rounded-full border border-white/10 hover:bg-white/5 transition-all">Reset</button>
                    </div>
                    <div className="whitespace-pre-wrap leading-relaxed font-light text-lg text-slate-200">
                      {typeof result.content === 'string' ? result.content : JSON.stringify(result.content, null, 2)}
                    </div>
                  </div>
                ) : (
                  <textarea 
                    className="w-full h-[320px] bg-transparent text-slate-200 p-10 resize-none border-none text-xl leading-relaxed placeholder-slate-600 font-light focus:ring-0 selection:bg-amber-500/20"
                    placeholder={`在此输入评论地址URL，产品功能文档或单条用户评论……\n\n上传评论数据：通过URL获取对应地址的用户评论。\n喂食产品档案：将产品功能文档上传至产品知识库。\n开始洞察真相：启动评论分析流程。\n创建词云：连接 MongoDB Atlas 同步数据并生成可视化词云。\n秒出PRD：读取分析结果，输出PRD。\n单条评论解析：对单条用户反馈进行深度结构化剖析。`}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 w-full gap-4">
              <button id="btn-upload-url" onMouseEnter={() => onMouseEnter('btn-upload-url')} onMouseLeave={onMouseLeave} onClick={handleUploadData} disabled={isLoading} className={actionButtonClass}>
                <span className="material-symbols-outlined text-xl">cloud_upload</span>
                <span className="text-[10px] font-bold uppercase tracking-widest">上传数据</span>
              </button>
              <button id="btn-feed" onMouseEnter={() => onMouseEnter('btn-feed')} onMouseLeave={onMouseLeave} onClick={handleFeedArchive} disabled={isLoading} className={actionButtonClass}>
                <span className="material-symbols-outlined text-xl">inventory_2</span>
                <span className="text-[10px] font-bold uppercase tracking-widest">喂食档案</span>
              </button>
              <button id="btn-insight" onMouseEnter={() => onMouseEnter('btn-insight')} onMouseLeave={onMouseLeave} onClick={() => handleAction(AnalysisType.INSIGHT)} disabled={isLoading} className={actionButtonClass}>
                <span className="material-symbols-outlined text-xl">stars</span>
                <span className="text-[10px] font-bold uppercase tracking-widest">开始洞察</span>
              </button>
              <button id="btn-wordcloud" onMouseEnter={() => onMouseEnter('btn-wordcloud')} onMouseLeave={onMouseLeave} onClick={handleCreateWordCloud} disabled={isLoading} className={actionButtonClass}>
                <span className="material-symbols-outlined text-xl">cloud</span>
                <span className="text-[10px] font-bold uppercase tracking-widest">创建词云</span>
              </button>
              <button id="btn-prd" onMouseEnter={() => onMouseEnter('btn-prd')} onMouseLeave={onMouseLeave} onClick={() => handleAction(AnalysisType.PRD)} disabled={isLoading} className={actionButtonClass}>
                <span className="material-symbols-outlined text-xl">article</span>
                <span className="text-[10px] font-bold uppercase tracking-widest">秒出 PRD</span>
              </button>
              <button id="btn-single-test" onMouseEnter={() => onMouseEnter('btn-single-test')} onMouseLeave={onMouseLeave} onClick={handleSingleCommentTest} disabled={isLoading} className={accentButtonClass}>
                <span className="material-symbols-outlined text-xl">biotech</span>
                <span className="text-[10px] font-bold uppercase tracking-widest">单条解析</span>
              </button>
            </div>

            <div className="flex gap-4 w-full glass-window rounded-2xl p-2 items-center border border-white/10">
              <input 
                type="text"
                className="flex-1 bg-transparent border-none text-slate-200 px-4 py-2 focus:ring-0 placeholder-slate-600 text-sm"
                placeholder="输入 App 名称获取 URL..."
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
              />
              <button 
                id="btn-get-url"
                onClick={handleFetchUrl}
                disabled={isLoading}
                className="px-6 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 rounded-xl text-xs font-bold uppercase active:scale-95 disabled:opacity-50 transition-all"
              >
                获取 URL
              </button>
            </div>
          </main>
        </section>
      </div>
    </div>
  );
};

export default App;
