import * as React from "react"
import { Calendar, Settings2, Search } from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface KeyboardShortcut {
  key: string
  metaKey?: boolean
  ctrlKey?: boolean
  preventDefault?: () => void
}

export function SearchForm() {
  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    const down = (keyboardShortcut: KeyboardShortcut) => {
      if (
        keyboardShortcut.key === "k" &&
        (keyboardShortcut.metaKey || keyboardShortcut.ctrlKey)
      ) {
        keyboardShortcut.preventDefault()
        setIsOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "inline-flex items-center whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input hover:bg-accent hover:text-accent-foreground px-4 py-3 relative h-10 w-full max-w-lg flex-1 overflow-hidden rounded-full bg-muted/50"
        )}
      >
        <Search className="ml-3 mr-2 h-4 w-4 shrink-0 opacity-50" />
        <span className="text-sm text-muted-foreground">Search events...</span>
        <kbd className="pointer-events-none absolute right-3 top-2.5 hidden h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex shadow-sm">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>
      <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
        <CommandInput placeholder="Search events..." />
        <CommandList>
          <CommandEmpty className="py-6 text-center text-sm">
            No results found.
          </CommandEmpty>
          <CommandGroup heading="Suggestions">
            <CommandItem>
              <Calendar className="mr-2 h-4 w-4" />
              <span>Calendar</span>
            </CommandItem>
            <CommandItem>
              <Settings2 className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
