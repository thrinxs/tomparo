import Image from "next/image";
import Link from "next/link";

type LogoSize = "sm" | "md" | "lg" | "xl";

interface LogoProps {
  size?: LogoSize;
  href?: string;
  className?: string;
}

const sizeConfig: Record<LogoSize, string> = {
  sm: "h-5",
  md: "h-6",
  lg: "h-7",
  xl: "h-8",
};

export default function Logo({
  size = "md",
  href = "/",
  className = "",
}: LogoProps) {
  const imageClass = sizeConfig[size];

  const logoContent = (
    <Image
      src="/images/tomparo_logo.png"
      alt="TomParo"
      width={500}
      height={200}
      className={`${imageClass} w-auto`}
      priority
    />
  );

  if (href) {
    return (
      <Link href={href} className={`flex items-center ${className}`}>
        {logoContent}
      </Link>
    );
  }

  return <div className={`flex items-center ${className}`}>{logoContent}</div>;
}
