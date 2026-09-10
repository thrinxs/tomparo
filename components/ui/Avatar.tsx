interface Props {
  name?: string | null;
  image?: string | null;
  size?: "sm" | "md" | "lg";
  color?: string;
  className?: string;
}

const sizes = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-11 w-11 text-base",
};

export function Avatar({ name, image, size = "md", color = "bg-purple-600", className = "" }: Props) {
  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  if (image) {
    return (
      <img
        src={image}
        alt={name ?? "Avatar"}
        className={`rounded-xl object-cover ${sizes[size]} ${className}`}
      />
    );
  }

  return (
    <div className={`flex shrink-0 items-center justify-center rounded-xl font-bold text-white ${color} ${sizes[size]} ${className}`}>
      {initials}
    </div>
  );
}

export default Avatar;
