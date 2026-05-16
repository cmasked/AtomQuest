import { cn } from "@/lib/utils";

interface ScoreRingProps {
  score: number | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ScoreRing({ score, size = 'md', className }: ScoreRingProps) {
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = score !== null 
    ? circumference - (Math.min(score, 150) / 100) * circumference 
    : circumference;

  const sizeClasses = {
    sm: 'w-12 h-12 text-xs',
    md: 'w-20 h-20 text-sm',
    lg: 'w-24 h-24 text-base'
  };

  const getColor = (s: number | null) => {
    if (s === null) return 'text-slate-200';
    if (s < 50) return 'text-red-500';
    if (s < 80) return 'text-amber-500';
    if (s <= 100) return 'text-green-500';
    return 'text-blue-500'; // > 100
  };

  return (
    <div className={cn("relative flex items-center justify-center", sizeClasses[size], className)}>
      {/* Background track */}
      <svg className="absolute inset-0 w-full h-full transform -rotate-90">
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          className="stroke-slate-100 fill-none"
          strokeWidth="8"
        />
        {/* Progress ring */}
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          className={cn("fill-none transition-all duration-1000 ease-out", getColor(score))}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center font-medium">
        {score !== null ? (
          <>
            <span className={cn("leading-none", getColor(score))}>{Math.round(score)}%</span>
          </>
        ) : (
          <span className="text-slate-400">—</span>
        )}
      </div>
    </div>
  );
}
