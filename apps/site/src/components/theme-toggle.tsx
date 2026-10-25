import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme, Themes } from '@rasenganjs/theme';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

export default function ThemeToggle() {
  const { setTheme } = useTheme();
  const mounted = useMounted();

  const trigger = (
    <Button variant="ghost" size="icon" aria-label="Toggle theme">
      <Sun className="dark:hidden" />
      <Moon className="hidden dark:block" />
    </Button>
  );

  // Radix ids come from useId, which differs between the server render and hydration:
  // the server renders the plain button and the menu takes over once mounted.
  if (!mounted) return trigger;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme(Themes.light)}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme(Themes.dark)}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme(Themes.system)}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
