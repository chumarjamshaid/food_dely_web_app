import Image from "next/image";
import Link from "next/link";
import React from "react";

interface PartnerCardProps {
  image: string;
  title: string;
  description: string;
  buttonText: string;
  link?: string;
}

const PartnerCard: React.FC<PartnerCardProps> = ({
  image,
  title,
  description,
  buttonText,
  link,
}) => {
  const ButtonContent = () => (
    <>
      {buttonText}
      <span>
        <svg
          width="16"
          height="16"
          className="sm:w-5 sm:h-5 lg:w-5 lg:h-5"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5 10h10M11 6l4 4-4 4"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </>
  );

  return (
    <div className="relative flex flex-col justify-between items-center pt-20 sm:pt-24 lg:pt-28 pb-6 sm:pb-8 lg:pb-8 px-6 sm:px-8 lg:px-10 rounded-[20px] border border-[#A1A1A1] backdrop-blur-md bg-[#333333]/50 shadow-lg w-full sm:w-[300px] lg:w-[340px] h-[320px] sm:h-[360px] lg:h-[400px]">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140px] h-[140px] sm:w-[160px] sm:h-[160px] lg:w-[200px] lg:h-[200px] rounded-full overflow-hidden bg-white/10">
        <Image
          src={image}
          alt={title}
          className="rounded-full w-full h-full object-cover"
          width={240}
          height={240}
        />
      </div>
      <div className="flex flex-col items-center w-full mt-6 sm:mt-7 lg:mt-8">
        <h2 className="text-[18px] sm:text-[20px] lg:text-[24px] text-white mb-2 text-center lg:font-normal font-semibold">
          {title}
        </h2>
        <p className="text-gray-200 text-center mb-4 sm:mb-5 lg:mb-6 text-[14px] sm:text-[16px] lg:text-[18px] px-2 lg:leading-normal leading-relaxed">
          {description}
        </p>
      </div>
      {link ? (
        <Link
          href={link}
          className="flex items-center gap-2 bg-[#CD3625] text-white px-4 sm:px-5 lg:px-6 py-3 sm:py-3.5 lg:py-4 rounded-full font-semibold hover:bg-red-700 transition mt-2 sm:mt-3 lg:mt-4 text-[14px] sm:text-[15px] lg:text-base w-full sm:w-auto lg:w-auto justify-center"
        >
          <ButtonContent />
        </Link>
      ) : (
        <button className="flex items-center gap-2 bg-[#CD3625] text-white px-4 sm:px-5 lg:px-6 py-3 sm:py-3.5 lg:py-4 rounded-full font-semibold hover:bg-red-700 transition mt-2 sm:mt-3 lg:mt-4 text-[14px] sm:text-[15px] lg:text-base w-full sm:w-auto lg:w-auto justify-center">
          <ButtonContent />
        </button>
      )}
    </div>
  );
};

export default PartnerCard;
