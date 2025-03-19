import { useTheme } from "@/components/ThemeProvider"
import { Toaster as Sonner } from "sonner"
import { useState, useEffect } from "react"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  // Default to 'system' as a fallback if ThemeProvider is not available
  const [currentTheme, setCurrentTheme] = useState<string>("system")
  
  // Try to use the theme from ThemeProvider
  let themeFromProvider: string | undefined
  try {
    const { theme } = useTheme()
    themeFromProvider = theme
  } catch (error) {
    // ThemeProvider not available, will use the default
    console.log("ThemeProvider not available, using default theme")
  }
  
  // Effect to update the theme when ThemeProvider becomes available
  useEffect(() => {
    if (themeFromProvider) {
      setCurrentTheme(themeFromProvider)
    }
  }, [themeFromProvider])
  
  // Map our theme values to sonner's expected values
  const sonnerTheme = currentTheme === "system" ? "system" : currentTheme

  return (
    <Sonner
      theme={sonnerTheme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
