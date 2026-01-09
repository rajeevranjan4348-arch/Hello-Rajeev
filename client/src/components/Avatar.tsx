import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  isOnline?: boolean;
}

export function Avatar({ src, name, size = "md", className, isOnline }: AvatarProps) {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-base",
    xl: "w-24 h-24 text-xl",
  };

  const initial = name.charAt(0).toUpperCase();
  const fallbackSrc = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`;

  return (
    <div className={cn("relative inline-block", className)}>
      <div className={cn(
        "relative rounded-full overflow-hidden bg-muted flex items-center justify-center font-bold text-muted-foreground border-2 border-background shadow-sm ring-2 ring-transparent transition-all group-hover:ring-primary/20",
        sizeClasses[size]
      )}>
        <img 
          src={src || fallbackSrc} 
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = fallbackSrc;
          }}
        />
      </div>
      {isOnline && (
        <span className={cn(
          "absolute bottom-0 right-0 rounded-full bg-green-500 border-2 border-background",
          size === "sm" ? "w-2.5 h-2.5" : 
          size === "md" ? "w-3 h-3" : 
          size === "lg" ? "w-4 h-4" : "w-5 h-5"
        )} />
      )}
    </div>
  );
}
