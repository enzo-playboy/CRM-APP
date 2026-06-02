import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-2xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-primary-500 to-primary-400 text-white hover:from-primary-600 hover:to-primary-500 shadow-soft hover:shadow-soft-lg hover:-translate-y-0.5",
        destructive:
          "bg-gradient-to-r from-red-500 to-red-400 text-white hover:from-red-600 hover:to-red-500 shadow-soft hover:shadow-soft-lg",
        outline:
          "border-2 border-white/50 bg-white/70 backdrop-blur-sm text-text-primary hover:bg-white/90 hover:border-primary-400",
        secondary:
          "glass text-text-primary hover:bg-white/90 shadow-glass-sm hover:shadow-glass",
        ghost:
          "bg-transparent text-text-secondary hover:bg-white/50 rounded-2xl",
        link: "text-primary-500 underline-offset-4 hover:underline",
        accent:
          "bg-gradient-to-r from-accent to-accent-light text-white hover:from-accent-dark hover:to-accent shadow-soft hover:shadow-soft-lg",
      },
      size: {
        default: "h-10 px-6 py-3",
        sm: "h-8 rounded-xl px-4 text-sm",
        lg: "h-12 rounded-2xl px-8 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
