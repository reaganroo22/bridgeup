import Image from "next/image";

const CtaFinal = () => {
  return (
    <section
      id="cta"
      className="relative overflow-hidden bg-gradient-to-br from-[#FF4DB8] to-[#8B5CF6] py-32 px-5 md:rounded-t-[60px] md:py-[80px] md:px-10"
    >
      <div className="container relative flex flex-col items-center gap-10 md:gap-16">
        {/*
          Using two sets of absolutely positioned images for different breakpoints (md and up vs mobile)
          to closely match the two different layouts seen in the screenshots.
        */}

        {/* Desktop Images */}
        <div className="pointer-events-none absolute top-[-4px] right-[236px] hidden h-[160px] w-[160px] md:block">
          <Image
            src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/d2c04693-a477-498b-8d7e-7ecdb4498469-ngl-link/assets/images/KIHJNCllq4hXkrhDsSlNXXJKo0-11.png"
            alt="3D Crown"
            width={160}
            height={160}
          />
        </div>
        <div className="pointer-events-none absolute bottom-[-152px] left-[174px] hidden h-[256px] w-[256px] md:block">
          <Image
            src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/d2c04693-a477-498b-8d7e-7ecdb4498469-ngl-link/assets/images/i7tfa9iMXfDY9eQQLdPpJzwIAdU-12.png"
            alt="3D Monkey Emoji"
            width={256}
            height={256}
          />
        </div>
        <div className="pointer-events-none animate-swing absolute bottom-[-56px] right-[174px] hidden h-[256px] w-[256px] md:block">
          <Image
            src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/d2c04693-a477-498b-8d7e-7ecdb4498469-ngl-link/assets/images/wNwzlleA6uzU0Xk7TO32UzbNQA-13.png"
            alt="3D Waving Hand"
            width={256}
            height={256}
            className="-rotate-10"
          />
        </div>

        {/* Mobile Images */}
        <div className="pointer-events-none absolute top-0 right-0 block h-24 w-24 md:hidden">
          <Image
            src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/d2c04693-a477-498b-8d7e-7ecdb4498469-ngl-link/assets/images/KIHJNCllq4hXkrhDsSlNXXJKo0-11.png"
            alt="3D Crown"
            width={96}
            height={96}
          />
        </div>
        <div className="pointer-events-none absolute bottom-[-50px] -left-10 block h-40 w-40 md:hidden">
          <Image
            src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/d2c04693-a477-498b-8d7e-7ecdb4498469-ngl-link/assets/images/i7tfa9iMXfDY9eQQLdPpJzwIAdU-12.png"
            alt="3D Monkey Emoji"
            width={160}
            height={160}
          />
        </div>
        <div className="pointer-events-none animate-swing absolute bottom-[-50px] -right-10 block h-40 w-40 md:hidden">
          <Image
            src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/d2c04693-a477-498b-8d7e-7ecdb4498469-ngl-link/assets/images/wNwzlleA6uzU0Xk7TO32UzbNQA-13.png"
            alt="3D Waving Hand"
            width={160}
            height={160}
            className="-rotate-10"
          />
        </div>

        {/* Main Content */}
        <div className="relative z-10 text-center">
          <h1 className="font-display text-[80px] font-black leading-none text-white lowercase md:text-[120px]">
            join
          </h1>
          <h1 className="font-display text-[80px] font-black leading-none text-white lowercase md:text-[120px]">
            the fun
          </h1>
        </div>

        <div className="relative z-10 mt-4">
          <Image
            src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/d2c04693-a477-498b-8d7e-7ecdb4498469-ngl-link/assets/svgs/hmSZpaMLU2rHM0jlQdLVDRJajTk-2.svg"
            alt="QR code to download the Wizzmo app"
            width={200}
            height={200}
            className="h-auto w-[150px] md:w-[200px]"
          />
        </div>
      </div>
    </section>
  );
};

export default CtaFinal;