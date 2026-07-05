import Image from "next/image";
import Link from "next/link";

type LogoSize = "sm" | "md" | "lg" | "xl";

interface LogoProps {
  size?: LogoSize;
  href?: string;
  className?: string;
}

const sizeConfig: Record<LogoSize, string> = {
  sm: "h-8",   // Footer (32px)
  md: "h-10",  // Sidebar (40px)
  lg: "h-11",  // Auth header (44px)
  xl: "h-12",  // Navbar (48px)
};

export default function Logo({
  size = "md",
  href = "/",
  className = "",
}: LogoProps) {
  const imageClass = sizeConfig[size];

  const logoContent = (
    <Image
      src="/images/logo.png"
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