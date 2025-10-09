import React from 'react';

const examples = [
  {
    q: "How do I tell my situationship I want something real?",
    a: "Keep it light but clear. Say you vibe and want to be intentional — then pause. Let them respond." ,
    tag: "Dating"
  },
  {
    q: "My roommate keeps inviting her bf over. Help?",
    a: "Set a roommate pact: max nights/week, heads up texts, and quiet hours. Boundaries = peace.",
    tag: "Roommates"
  },
  {
    q: "Is it weird to sit alone in the dining hall?",
    a: "Not at all. Bring headphones, own the main character energy, and smile at one new person.",
    tag: "Social"
  },
];

const Bubble = ({ q, a, tag }: { q: string; a: string; tag: string }) => (
  <div className="bg-white text-black rounded-3xl p-5 md:p-6 shadow-[0_6px_24px_rgba(0,0,0,0.12)] max-w-sm w-full">
    <div className="mb-2 inline-block rounded-full bg-black/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide">{tag}</div>
    <p className="font-bold leading-snug">{q}</p>
    <p className="mt-2 text-black/70 leading-snug">{a}</p>
  </div>
);

const LiveFeed = () => {
  return (
    <section
      id="examples"
      className="flex flex-col items-center justify-center overflow-hidden bg-gradient-to-bl from-[#FF4DB8] to-[#8B5CF6] py-20 px-6 md:py-32 md:px-12"
    >
      <div className="container">
        <div className="text-center mb-10 md:mb-14">
          <h2 className="text-[3rem] md:text-[4rem] font-bold text-white lowercase leading-none">live feed</h2>
          <p className="mt-3 text-white/85">Real questions. Real takes. The vibe you're looking for.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8 place-items-center">
          {examples.map((e, i) => (
            <Bubble key={i} q={e.q} a={e.a} tag={e.tag} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default LiveFeed;