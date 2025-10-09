import { ArrowDown } from 'lucide-react';

const ScrollIndicator = () => {
  return (
    <section className="bg-background text-foreground">
      <div className="container flex items-center justify-center gap-2 py-10">
        <div className="animate-bounce [animation-duration:2s]">
          <ArrowDown className="h-[14px] w-[14px]" strokeWidth={1} />
        </div>
        <p className="font-body text-base font-medium leading-[1.2] tracking-[-0.01em]">
          Scroll for more
        </p>
      </div>
    </section>
  );
};

export default ScrollIndicator;