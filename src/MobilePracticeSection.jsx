import React from 'react';
import { 
    Smartphone, 
    Monitor, 
    Zap, 
    Clock, 
    CheckCircle2, 
    Globe, 
    Cpu 
} from 'lucide-react';

const FeatureItem = ({ icon: Icon, title, description }) => (
    <div className="flex items-start space-x-4 group p-4 rounded-2xl hover:bg-white hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300">
        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-blue-600 transition-colors duration-300">
            <Icon className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors duration-300" />
        </div>
        <div>
            <h4 className="text-lg font-black text-gray-900 mb-1">{title}</h4>
            <p className="text-sm text-gray-500 font-medium leading-relaxed">{description}</p>
        </div>
    </div>
);

const Badge = ({ text }) => (
    <div className="inline-flex items-center bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
        <CheckCircle2 className="w-4 h-4 text-green-400 mr-2" />
        <span className="text-xs font-black text-white uppercase tracking-widest">{text}</span>
    </div>
);

const MobilePracticeSection = () => {
    return (
        <section className="py-20 lg:py-32 bg-gray-50 relative overflow-hidden">
            {/* Background Blobs */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-100/50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                {/* Top Header */}
                <div className="text-center mb-16 lg:mb-24">
                    <h2 className="text-4xl lg:text-6xl font-black text-gray-900 mb-6 tracking-tight">
                        Practice <span className="text-blue-600">Anytime</span>, Anywhere
                    </h2>
                    <p className="max-w-2xl mx-auto text-lg text-gray-500 font-medium leading-relaxed">
                        Say goodbye to bulky machines. Our platform is fully optimized for mobile devices, allowing you to master your shorthand skills while traveling, commuting, or relaxing.
                    </p>
                </div>

                {/* Main Split Content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    {/* Left Side (Visual Placeholder) */}
                    <div className="relative group">
                        <div className="absolute -inset-4 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-[2.5rem] blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative h-[450px] lg:h-[550px] bg-white border border-gray-100 rounded-[2rem] shadow-2xl overflow-hidden flex items-center justify-center">
                            {/* Inner Visual Mockup Placeholder */}
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-gray-50 flex items-center justify-center p-12">
                                <div className="w-full h-full border-4 border-dashed border-blue-200 rounded-3xl flex flex-col items-center justify-center text-center opacity-60">
                                    <Smartphone className="w-20 h-20 text-blue-300 mb-4 animate-bounce" />
                                    <p className="text-blue-400 font-black uppercase tracking-[0.2em] text-sm">Mobile Preview Frame</p>
                                    <p className="text-gray-300 text-xs mt-2 italic font-serif">Insert mobile screen mockup here</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side (Features) */}
                    <div className="space-y-6">
                        <div className="mb-10">
                            <h3 className="text-3xl font-black text-gray-900 mb-4">Master on the Go</h3>
                            <div className="h-1.5 w-20 bg-blue-600 rounded-full"></div>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-2">
                            <FeatureItem 
                                icon={Globe} 
                                title="Cross-Platform Compatibility" 
                                description="Access your dashboard, practice materials, and tests from any browser on Android or iOS without any platform-specific limitations." 
                            />
                            <FeatureItem 
                                icon={Clock} 
                                title="Practice Anytime" 
                                description="No need to be tied to a desk. Utilize your free moments to take a quick mock test or review your previous analysis on your phone." 
                            />
                            <FeatureItem 
                                icon={Map} 
                                title="Learn Anywhere" 
                                description="Whether you are in a park or on a train, our high-contrast mobile interface ensures you stay focused on your shorthand transcription." 
                            />
                            <FeatureItem 
                                icon={Cpu} 
                                title="Very Lightweight Software" 
                                description="Built with modern web technologies, our application loads instantly even on slow mobile data connections, saving your time and energy." 
                            />
                        </div>
                    </div>
                </div>

                {/* Bottom CTA Banner */}
                <div className="mt-24 lg:mt-32 relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                    <div className="relative bg-[#0f172a] rounded-3xl p-8 lg:p-16 overflow-hidden">
                        {/* Decorative Patterns */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px]"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px]"></div>

                        <div className="relative z-10 flex flex-col items-center text-center">
                            <h3 className="text-3xl lg:text-5xl font-black text-white mb-8 max-w-3xl leading-tight">
                                Start Your Mobile Learning Journey Today
                            </h3>
                            
                            <div className="flex flex-wrap justify-center gap-4 lg:gap-8">
                                <Badge text="Mobile Optimized" />
                                <Badge text="All Devices Supported" />
                                <Badge text="Offline Ready" />
                            </div>

                            <button className="mt-12 px-10 py-5 bg-white text-[#0f172a] font-black uppercase tracking-widest rounded-2xl hover:bg-blue-50 transition-all hover:scale-105 shadow-xl shadow-white/5 active:scale-95">
                                Join Now
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default MobilePracticeSection;
import { Map } from 'lucide-react';
