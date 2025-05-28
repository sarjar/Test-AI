"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProvider as NextThemesProviderType } from "next-themes"

type ThemeProviderProps = React.ComponentProps<typeof NextThemesProviderType>

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
