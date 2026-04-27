/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  RotateCcw, 
  Trash2, 
  Copy, 
  Check, 
  LayoutGrid, 
  Info,
  Sparkles,
  Type as TypeIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";

type Mode = 'count' | 'size';

interface GroupData {
  name: string;
  members: string[];
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function App() {
  const [namesText, setNamesText] = useState('');
  const [mode, setMode] = useState<Mode>('count');
  const [value, setValue] = useState(2);
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [useAiNames, setUseAiNames] = useState(false);
  const [aiTheme, setAiTheme] = useState('可愛動物');

  const nameList = useMemo(() => {
    return namesText
      .split('\n')
      .map(n => n.trim())
      .filter(n => n !== '');
  }, [namesText]);

  // Chinese Validation: Check if input contains non-Chinese characters (excluding basic punctuation/newlines)
  const isAllChinese = useMemo(() => {
    if (!namesText) return true;
    const chineseRegex = /^[\u4e00-\u9fa5\s]+$/;
    return chineseRegex.test(namesText.replace(/\n/g, ' '));
  }, [namesText]);

  const shuffle = (array: string[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const getAiGroupNames = async (count: number, theme: string) => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `請根據主題「${theme}」生成 ${count} 個有趣且不重複的中文組名。只需返回組名列表（JSON 陣列）。`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
        },
      });
      
      const names = JSON.parse(response.text || '[]');
      return names.length >= count ? names : Array.from({ length: count }, (_, i) => `第 ${i + 1} 隊`);
    } catch (error) {
      return Array.from({ length: count }, (_, i) => `第 ${i + 1} 隊`);
    }
  };

  const handleGenerate = async () => {
    if (nameList.length === 0 || !isAllChinese) return;
    
    setIsGenerating(true);
    const shuffled = shuffle(nameList);
    let rawGroups: string[][] = [];

    if (mode === 'count') {
      const numGroups = Math.max(1, Math.min(value, shuffled.length));
      rawGroups = Array.from({ length: numGroups }, () => []);
      shuffled.forEach((name, index) => {
        rawGroups[index % numGroups].push(name);
      });
    } else {
      const size = Math.max(1, value);
      for (let i = 0; i < shuffled.length; i += size) {
        rawGroups.push(shuffled.slice(i, i + size));
      }
    }

    let finalGroups: GroupData[] = [];
    if (useAiNames) {
      const aiNames = await getAiGroupNames(rawGroups.length, aiTheme);
      finalGroups = rawGroups.map((members, i) => ({
        name: aiNames[i] || `第 ${i + 1} 隊`,
        members
      }));
    } else {
      finalGroups = rawGroups.map((members, i) => ({
        name: `第 ${i + 1} 隊`,
        members
      }));
    }

    setGroups(finalGroups);
    setIsGenerating(false);
    setCopied(false);
  };

  const copyToClipboard = () => {
    if (groups.length === 0) return;
    const text = groups
      .map((group) => `【${group.name}】\n${group.members.join('\n')}`)
      .join('\n\n');
    
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDemo = () => {
    const demoNames = [
      '王明', '李小美', '張大衛', '陳家豪', '林雅婷', 
      '黃志明', '郭春嬌', '蘇大雄', '吳胖虎', '周小夫',
      '謝靜香', '出木杉', '馬克', '花輪', '野口'
    ];
    setNamesText(demoNames.join('\n'));
    setGroups([]);
  };

  return (
    <div className="min-h-screen p-4 md:p-10 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-5xl font-[900] tracking-tighter text-brand-dark flex items-center gap-3">
              隊伍分組器 ⚡️
            </h1>
            <p className="text-brand-orange font-bold text-lg">快速、隨機、充滿活力！</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              {groups.length > 0 && (
                <div className="flex gap-2 bg-brand-cyan px-4 py-2 rounded-xl border-2 border-brand-blue font-bold text-brand-dark text-sm animate-bounce">
                  分組完成！
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Sidebar */}
          <aside className="lg:col-span-4 brutalist-card p-8 flex flex-col gap-6">
            <h2 className="text-2xl font-black text-brand-orange flex items-center gap-2">
              <Users className="w-6 h-6" /> 配置設定
            </h2>

            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <label className="text-sm font-black text-gray-600 uppercase">參與者名單 (限中文)</label>
                <span className={`text-xs font-bold ${isAllChinese ? 'text-gray-400' : 'text-red-500'}`}>
                  {isAllChinese ? `已輸入 ${nameList.length} 位` : '⚠️ 偵測到非中文字符'}
                </span>
              </div>
              <textarea
                value={namesText}
                onChange={(e) => setNamesText(e.target.value)}
                placeholder="王小明&#10;李美美..."
                className={`w-full h-48 p-4 bg-gray-50 border-2 rounded-2xl outline-none transition-all font-mono text-base ${
                  isAllChinese ? 'border-gray-200 focus:border-brand-orange' : 'border-red-400 focus:border-red-500'
                }`}
              />
              {!isAllChinese && (
                <p className="text-xs text-red-500 font-bold">請僅輸入中文字元（包含換行與空格）</p>
              )}
              <div className="flex gap-4">
                <button onClick={handleDemo} className="text-xs font-bold text-brand-dark hover:text-brand-orange underline flex-1 text-left">載入範例名單</button>
                <button onClick={() => {setNamesText(''); setGroups([]);}} className="text-xs font-bold text-red-400 hover:text-red-600 underline">清空名單</button>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-black text-gray-600 uppercase">分組方式</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl border-2 border-gray-200">
                <button
                  onClick={() => setMode('count')}
                  className={`py-2 rounded-lg text-sm font-black transition-all ${
                    mode === 'count' ? 'bg-white border-2 border-brand-orange text-brand-orange' : 'text-gray-400 shadow-none'
                  }`}
                >
                  指定組數
                </button>
                <button
                  onClick={() => setMode('size')}
                  className={`py-2 rounded-lg text-sm font-black transition-all ${
                    mode === 'size' ? 'bg-white border-2 border-brand-orange text-brand-orange' : 'text-gray-400 shadow-none'
                  }`}
                >
                  每組人數
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between font-black text-brand-dark">
                  <span>{mode === 'count' ? '分成幾組？' : '每組幾人？'}</span>
                  <span className="text-xl">{value}</span>
                </div>
                <input
                  type="range" min="1" max={Math.max(20, nameList.length)} value={value}
                  onChange={(e) => setValue(parseInt(e.target.value))}
                  className="w-full appearance-none h-3 rounded-full bg-gray-200 outline-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-orange [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-brand-dark"
                />
              </div>
            </div>

            <div className="pt-4 border-t-2 border-dashed border-gray-200 space-y-4">
              <label className="flex items-center gap-2 font-black text-sm text-brand-dark cursor-pointer group">
                <input 
                  type="checkbox" checked={useAiNames} onChange={(e) => setUseAiNames(e.target.checked)}
                  className="w-5 h-5 rounded-lg border-4 border-brand-dark accent-brand-orange"
                />
                <Sparkles className={`w-5 h-5 group-hover:scale-125 transition-transform ${useAiNames ? 'text-brand-yellow fill-brand-yellow' : 'text-gray-300'}`} />
                AI 創意命名模式
              </label>
              
              <AnimatePresence>
                {useAiNames && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-2">
                    <input 
                      type="text" value={aiTheme} onChange={(e) => setAiTheme(e.target.value)} placeholder="命名主題 (如：水果、動漫)"
                      className="w-full px-4 py-3 bg-white border-2 border-brand-dark rounded-xl font-bold text-sm"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={handleGenerate}
              disabled={nameList.length === 0 || isGenerating || !isAllChinese}
              className={`brutalist-button text-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:active:translate-x-0 disabled:active:translate-y-0`}
            >
              {isGenerating ? <RotateCcw className="w-6 h-6 animate-spin" /> : <>開始隨機分組！</>}
            </button>
          </aside>

          {/* Main Display */}
          <main className="lg:col-span-8 space-y-6">
            <div className="flex justify-between items-center bg-brand-dark text-white p-5 rounded-[24px] shadow-[6px_6px_0px_#FF865E]">
              <div className="flex items-center gap-4">
                <LayoutGrid className="w-6 h-6 text-brand-yellow" />
                <h3 className="text-xl font-black italic">分組結果集</h3>
              </div>
              {groups.length > 0 && (
                <button onClick={copyToClipboard} className="bg-white text-brand-dark px-4 py-2 rounded-xl font-black text-sm flex items-center gap-2 hover:bg-brand-yellow transition-colors">
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  {copied ? '已複製！' : '複製結果'}
                </button>
              )}
            </div>

            <div className="min-h-[600px]">
              <AnimatePresence mode="wait">
                {groups.length > 0 ? (
                  <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {groups.map((group, index) => (
                      <motion.div
                        key={index} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: index * 0.1 }}
                        className="brutalist-item flex flex-col overflow-hidden"
                        style={{ borderColor: index % 2 === 0 ? '#A2D2FF' : '#FEE440', boxShadow: `6px 6px 0px ${index % 2 === 0 ? '#A2D2FF' : '#FEE440'}` }}
                      >
                        <div className="p-4 bg-gray-50/50 border-b-2 border-inherit flex justify-between items-center">
                          <span className="brutalist-tag">{group.name}</span>
                          <span className="text-xs font-black text-brand-dark bg-white px-2 py-1 rounded border-2 border-inherit">
                            {group.members.length} 人
                          </span>
                        </div>
                        <div className="p-5 flex-1">
                          <ul className="grid grid-cols-2 gap-y-3 gap-x-2">
                            {group.members.map((name, i) => (
                              <li key={i} className="flex items-center gap-2 text-brand-dark font-bold text-sm">
                                <div className="w-2 h-2 rounded-full bg-brand-orange" />
                                {name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <div className="h-[500px] border-4 border-dashed border-gray-200 rounded-[40px] flex flex-col items-center justify-center text-gray-300 gap-4">
                    <Sparkles className="w-20 h-20 opacity-10" />
                    <p className="text-2xl font-black italic">等待大顯身手...</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </main>
        </div>

        <footer className="mt-10 p-8 brutalist-card bg-brand-dark flex flex-col md:flex-row items-center justify-between text-white italic border-brand-dark">
          <p className="font-black text-lg">GroupGenie ⚡️ 2024</p>
          <div className="flex gap-8 font-bold text-sm">
            <span># 中文支援</span>
            <span># 隨機公平</span>
            <span># 創意無限</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
