const faqs = [
  {
    q: "What is Wizzmo?",
    a: "Wizzmo is a safe space where college girls share honest advice with other students about dating, drama, social life, classes, and style.",
  },
  {
    q: "Is it anonymous?",
    a: "Yes. You can ask questions without your name attached. Mentors respond thoughtfully while your identity stays private.",
  },
  {
    q: "Who are the mentors?",
    a: "Verified college women who care about building a kind, supportive community. We review profiles to keep advice trustworthy.",
  },
  {
    q: "How fast do I get answers?",
    a: "Most questions receive takes within hours. Popular topics and active times may be even faster.",
  },
  {
    q: "Is it free?",
    a: "Asking is free. We may offer optional premium features later to support mentor time and app growth.",
  },
];

const FAQSection = () => {
  return (
    <section id="faq" className="bg-background text-foreground py-20 md:py-32">
      <div className="container">
        <h2 className="text-[3rem] md:text-[4rem] font-bold lowercase text-center">faq</h2>
        <div className="mx-auto mt-8 max-w-3xl space-y-4 md:mt-10">
          {faqs.map((item, idx) => (
            <details
              key={idx}
              className="group rounded-2xl border border-white/10 bg-white/5 p-5 md:p-6"
            >
              <summary className="cursor-pointer list-none text-xl md:text-2xl font-bold lowercase text-white flex items-center justify-between">
                <span>{item.q}</span>
                <span className="ml-4 text-white/60 transition-transform group-open:rotate-180">▾</span>
              </summary>
              <p className="mt-3 text-white/80">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;