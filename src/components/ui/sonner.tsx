"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:glass-strong group-[.toaster]:rounded-2xl group-[.toaster]:border group-[.toaster]:border-white/50 group-[.toaster]:shadow-glass-lg group-[.toaster]:text-text-primary",
          description: "group-[.toast]:text-text-muted",
          actionButton:
            "group-[.toast]:bg-primary-500 group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-white/50 group-[.toast]:text-text-primary",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
