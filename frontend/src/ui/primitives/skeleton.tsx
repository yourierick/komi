import { cn } from "~/lib/cn";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-md bg-accent",
        "relative overflow-hidden",
        "after:absolute after:inset-0 after:-translate-x-full",
        "after:animate-[shimmer_1.5s_infinite]",
        "after:bg-gradient-to-r",
        "after:from-transparent after:via-white/10 after:to-transparent",
        className
      )}
      data-slot="skeleton"
      {...props}
    />
  );
}

export { Skeleton };
