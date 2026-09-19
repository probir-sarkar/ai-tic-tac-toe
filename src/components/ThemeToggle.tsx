import { Moon, Sun } from 'lucide-react'
import type { ComponentProps } from 'react'
import { useTheme } from '#/components/ThemeProvider'
import { cn } from '#/lib/utils'

export function ThemeToggle({ className, ...props }: ComponentProps<'button'>) {
  const { theme, setTheme } = useTheme()

  function toggle() {
    const current =
      theme === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : theme
    setTheme(current === 'dark' ? 'light' : 'dark')
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle dark mode"
      className={cn(
        'grid size-9 place-items-center rounded-xl border border-zinc-300 bg-white text-zinc-600 shadow-sm transition-colors hover:border-zinc-950 hover:text-zinc-950 focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-50 dark:hover:text-zinc-50',
        className,
      )}
      {...props}
    >
      <Sun className="size-4 dark:hidden" />
      <Moon className="hidden size-4 dark:block" />
    </button>
  )
}
