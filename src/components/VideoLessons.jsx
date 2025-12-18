import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Play, X, ChevronRight, Clock, BookOpen } from 'lucide-react';
import { videos, categories, getVideosByCategory } from '../utils/videoData';

export default function VideoLessons({ onBack }) {
    const [activeCategory, setActiveCategory] = useState('beginner');
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = useRef(null);

    const filteredVideos = getVideosByCategory(activeCategory);

    // Handle video play/pause
    const handleVideoClick = (video) => {
        setSelectedVideo(video);
        setIsPlaying(true);
    };

    // Close video player
    const closePlayer = () => {
        if (videoRef.current) {
            videoRef.current.pause();
        }
        setSelectedVideo(null);
        setIsPlaying(false);
    };

    // Handle escape key to close player
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && selectedVideo) {
                closePlayer();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [selectedVideo]);

    return (
        <div className="flex-1 flex flex-col bg-gradient-to-br from-[#0a0505] via-[#0d0808] to-[#050505] min-h-screen">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-red-900/20">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-red-400" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">
                                紫微课程
                            </h1>
                            <p className="text-xs text-gray-500">跟随古书派学习紫微斗数</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Category Tabs */}
            <div className="sticky top-[73px] z-30 bg-black/60 backdrop-blur-md border-b border-white/5">
                <div className="max-w-4xl mx-auto px-4 py-3">
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${activeCategory === cat.id
                                        ? 'bg-gradient-to-r from-red-900/60 to-orange-900/60 text-orange-300 border border-orange-500/40 shadow-[0_0_15px_rgba(249,115,22,0.2)]'
                                        : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                                    }`}
                            >
                                <span>{cat.icon}</span>
                                <span>{cat.label}</span>
                                <span className="text-xs opacity-60">
                                    ({getVideosByCategory(cat.id).length})
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Video Grid */}
            <div className="flex-1 overflow-auto">
                <div className="max-w-4xl mx-auto px-4 py-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredVideos.map((video, index) => (
                            <button
                                key={video.id}
                                onClick={() => handleVideoClick(video)}
                                className="group relative overflow-hidden rounded-2xl border border-red-900/30 bg-gradient-to-br from-red-950/40 to-black text-left transition-all hover:scale-[1.02] hover:border-orange-500/50 hover:shadow-[0_0_30px_rgba(249,115,22,0.15)] animate-in fade-in slide-in-from-bottom-4"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                {/* Thumbnail / Gradient Background */}
                                <div className="relative aspect-video overflow-hidden">
                                    {video.thumbnail ? (
                                        <img
                                            src={video.thumbnail}
                                            alt={video.title}
                                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-red-900/40 via-orange-900/20 to-black flex items-center justify-center">
                                            <div className="text-6xl opacity-30">🎬</div>
                                        </div>
                                    )}

                                    {/* Play Overlay */}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="w-16 h-16 rounded-full bg-orange-500/90 flex items-center justify-center shadow-lg shadow-orange-500/30 transform scale-90 group-hover:scale-100 transition-transform">
                                            <Play className="w-7 h-7 text-white ml-1" fill="white" />
                                        </div>
                                    </div>

                                    {/* Duration Badge */}
                                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 rounded text-xs text-white font-mono flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {video.duration}
                                    </div>

                                    {/* Lesson Number */}
                                    <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white text-sm font-bold shadow-lg">
                                        {index + 1}
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="p-4 space-y-2">
                                    <h3 className="font-bold text-white group-hover:text-orange-300 transition-colors line-clamp-2">
                                        {video.title}
                                    </h3>
                                    <p className="text-sm text-gray-400 line-clamp-2">
                                        {video.description}
                                    </p>
                                    <div className="flex items-center text-orange-400/70 text-xs font-medium pt-1">
                                        <BookOpen className="w-3 h-3 mr-1" />
                                        点击观看
                                        <ChevronRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Empty State */}
                    {filteredVideos.length === 0 && (
                        <div className="text-center py-20 text-gray-500">
                            <div className="text-5xl mb-4">📚</div>
                            <p>该分类暂无课程</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Video Player Modal */}
            {selectedVideo && (
                <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center animate-in fade-in duration-200">
                    {/* Close Button */}
                    <button
                        onClick={closePlayer}
                        className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-white" />
                    </button>

                    {/* Video Title */}
                    <div className="absolute top-4 left-4 right-16 z-10">
                        <h2 className="text-lg font-bold text-white truncate">
                            {selectedVideo.title}
                        </h2>
                        <p className="text-sm text-gray-400 truncate">
                            {selectedVideo.description}
                        </p>
                    </div>

                    {/* Video Player */}
                    <div className="w-full max-w-5xl mx-4 aspect-video">
                        <video
                            ref={videoRef}
                            src={selectedVideo.url}
                            controls
                            autoPlay
                            className="w-full h-full rounded-lg shadow-2xl"
                            onEnded={() => setIsPlaying(false)}
                        >
                            您的浏览器不支持视频播放
                        </video>
                    </div>

                    {/* Click outside to close */}
                    <div
                        className="absolute inset-0 -z-10"
                        onClick={closePlayer}
                    />
                </div>
            )}
        </div>
    );
}
