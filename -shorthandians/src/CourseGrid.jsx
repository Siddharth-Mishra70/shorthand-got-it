import React from 'react';
import { PlayCircle, FileText } from 'lucide-react';

const CircularCourseCard = ({ title, type, isPremium, onTakeTest }) => (
  <div className="flex flex-col items-center group">
    <div className="relative w-48 h-48 rounded-full bg-white shadow-xl flex flex-col justify-center items-center text-center p-6 border-4 border-transparent group-hover:border-[#1e3a8a] transition-all duration-300">
      <div className="absolute top-2 right-2">
        <span
          className={`px-3 py-1 text-[10px] font-black rounded-full shadow-sm ${
            isPremium ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
          }`}
        >
          {isPremium ? 'PAID' : 'FREE'}
        </span>
      </div>
      <FileText className="w-8 h-8 text-[#1e3a8a] mb-2" />
      <h3 className="font-bold text-gray-800 text-sm leading-tight mb-1">{title}</h3>
      <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">{type}</p>
    </div>
    <button
      onClick={onTakeTest}
      className="mt-6 bg-[#1e3a8a] hover:bg-blue-800 text-white px-8 py-2.5 rounded-full font-black text-xs uppercase tracking-widest shadow-lg transition-transform transform hover:scale-105 active:scale-95 flex items-center space-x-2"
    >
      <PlayCircle className="w-4 h-4" />
      <span>Start Practicing</span>
    </button>
  </div>
);

const CourseGrid = ({ courses, onTakeTest }) => {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block text-xs font-black tracking-widest text-[#1e3a8a] uppercase bg-blue-50 border border-blue-100 px-4 py-1.5 rounded-full mb-4">
            Practice Portal
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4 leading-tight">
            Our Premium{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1e3a8a] to-blue-500">
              Exam Modules
            </span>
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
            All the modules from our student portal are now accessible directly from here. 
            Choose your specialty and start your practice session today.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-y-16 gap-x-8 justify-items-center">
          {courses.map((course, idx) => (
            <CircularCourseCard
              key={idx}
              title={course.title}
              type={course.type}
              isPremium={course.isPremium}
              onTakeTest={() => onTakeTest(course.view)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default CourseGrid;
