export function MemberAvatar({
  url,
  color,
  name,
  className = "h-9 w-9 text-sm",
}: {
  url?: string | null;
  color: string;
  name: string;
  className?: string;
}) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name}
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }

  const initial = name.trim().charAt(0) || "?";
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-hand font-bold text-surface ${className}`}
      style={{ backgroundColor: color }}
    >
      {initial}
    </span>
  );
}
