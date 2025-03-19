import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import * as React from "react";

import { Toggle } from "@/components/ui/toggle";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Toggle
      aria-label="Toggle theme"
      variant="outline"
      pressed={theme === "dark"}
      onPressedChange={(pressed) => setTheme(pressed ? "dark" : "light")}
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Toggle>
  );
}
