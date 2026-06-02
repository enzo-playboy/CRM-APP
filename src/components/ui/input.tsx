import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-2xl border-2 border-white/50 bg-white/70 backdrop-blur-sm px-4 py-3 text-sm text-text-primary ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-muted/60 focus-visible:outline-none focus-visible:border-primary-400 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-primary-200 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
