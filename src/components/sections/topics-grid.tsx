import React from 'react';

const topics = [
  "Dating",
  "Drama Talk",
  "Matchmaking",
  "Classes",
  "Roommates",
  "Style",
  "Wellness",
];

const TopicCard = ({ title }: { title: string }) => {
  return (
    <div className="bg-white rounded-[20px] p-5 flex items-center justify-center aspect-square transition-transform duration-300 ease-in-out hover:scale-105 cursor-pointer">
      <h3 className="text-black font-bold text-2xl md:text-3xl lowercase text-center leading-tight">
        {title}
      </h3>
    </div>
  );
};

const TopicsGrid = () => {
  return (
    <section className="py-10 md:py-20 bg-gradient-to-br from-[#FF4DB8] to-[#8B5CF6]">
      <div className="container">
        <h2 className="font-display text-5xl md:text-[4rem] font-bold text-white lowercase text-center !leading-snug mb-10 md:mb-16">
          explore topics
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-8">
          {topics.map((topic) => (
            <TopicCard key={topic} title={topic} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TopicsGrid;