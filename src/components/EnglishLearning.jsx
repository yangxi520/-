import React from 'react';
import { ArrowLeft, BookOpen, Mic, MessageCircle, ExternalLink } from 'lucide-react';

const EnglishLearning = ({ onBack }) => {
    return (
        <div className="flex-1 overflow-auto p-4 md:p-8 relative animate-in fade-in zoom-in duration-500">
            {/* Dynamic Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-1/4 left-1/4 w-[30%] h-[30%] bg-blue-900/20 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-[30%] h-[30%] bg-green-900/20 rounded-full blur-[100px] animate-pulse delay-700"></div>
            </div>

            <div className="relative z-10 max-w-5xl mx-auto space-y-12">

                {/* Navigation */}
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
                >
                    <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-sm">返回主页</span>
                </button>

                {/* Hero Section */}
                <div className="text-center space-y-6">
                    <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-green-500/20 border border-blue-500/30 mb-4">
                        <BookOpen className="w-10 h-10 text-blue-400" />
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-green-400 font-orbitron tracking-wide">
                        人人都能用英语
                    </h1>
                    <p className="max-w-2xl mx-auto text-gray-400 text-lg md:text-xl leading-relaxed">
                        告别“哑巴英语”，开启 AI 私教时代。
                        <br className="hidden md:block" />
                        基于李笑来《人人都能用英语》理念打造，让语言学习回归交流本质。
                    </p>

                    <div className="pt-4">
                        <button
                            onClick={() => window.open('https://enjoy.bot', '_blank')}
                            className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-green-600 rounded-full text-white font-bold text-lg hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] transition-all hover:scale-105 active:scale-95"
                        >
                            <span className="relative z-10">开始免费学习</span>
                            <ExternalLink className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                            <div className="absolute inset-0 rounded-full bg-white/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </button>
                        <p className="mt-3 text-xs text-gray-500 font-mono">
                            跳转至 enjoy.bot (官方Web版)
                        </p>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Feature 1 */}
                    <div className="group relative p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-blue-500/30 transition-all hover:bg-white/[0.07]">
                        <div className="absolute -top-6 -right-6 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
                        <div className="w-14 h-14 rounded-2xl bg-blue-900/30 flex items-center justify-center mb-6 text-3xl border border-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                            🤖
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">AI 专属外教</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            随时随地的一对一对话练习。AI 能够针对您的兴趣和水平进行个性化交流，提供实时纠错反馈，消除开口恐惧。
                        </p>
                    </div>

                    {/* Feature 2 */}
                    <div className="group relative p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-green-500/30 transition-all hover:bg-white/[0.07]">
                        <div className="absolute -top-6 -right-6 w-24 h-24 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-all"></div>
                        <div className="w-14 h-14 rounded-2xl bg-green-900/30 flex items-center justify-center mb-6 text-3xl border border-green-500/20 group-hover:scale-110 transition-transform duration-300">
                            🎤
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">智能发音评分</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            不仅仅是跟读。通过先进的语音识别技术，对您的发音进行多维度打分和矫正，助您练就地道口语。
                        </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="group relative p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-all hover:bg-white/[0.07]">
                        <div className="absolute -top-6 -right-6 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all"></div>
                        <div className="w-14 h-14 rounded-2xl bg-cyan-900/30 flex items-center justify-center mb-6 text-3xl border border-cyan-500/20 group-hover:scale-110 transition-transform duration-300">
                            📅
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">百日进阶计划</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            系统化的课程体系，从基础问候到深度交流。每天只需15分钟，100天见证您的英语蜕变。
                        </p>
                    </div>
                </div>

                {/* Quote/Context Section */}
                <div className="relative rounded-3xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-900 to-black opacity-90"></div>
                    <div className="relative p-8 md:p-12 flex flex-col md:flex-row gap-8 items-center border border-white/10 rounded-3xl">
                        <div className="flex-1 space-y-4">
                            <h4 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-400">
                                “用英语，而不是学英语。”
                            </h4>
                            <p className="text-gray-400 italic">
                                —— 李笑来 /
                                <span className="text-xs ml-2 not-italic text-gray-500 border border-gray-700 px-2 py-0.5 rounded-full">项目发起人</span>
                            </p>
                            <p className="text-sm text-gray-500 pt-2 leading-relaxed">
                                这个开源项目不仅是一个工具，更是一种理念的实践。通过开源共建，Everyone Can Use English 正在帮助成千上万的学习者打破语言壁垒，重塑学习信心。
                            </p>
                        </div>
                        <div className="shrink-0">
                            <button
                                onClick={() => window.open('https://github.com/ZuodaoTech/everyone-can-use-english', '_blank')}
                                className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold text-gray-300 transition-all flex items-center gap-2"
                            >
                                GitHub 开源仓库
                                <ExternalLink className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default EnglishLearning;
