"use client";

import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { SettingsMenu } from "@/components/settings-menu";
import { Sun, Moon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export const Header = () => {
  const { setTheme } = useTheme();
  return (
    <nav className="flex w-full items-center justify-between px-4 py-2">
      <div className="flex items-center">
        <Link href="/" className="mr-4 inline">
          <Image
            src="/icon.png"
            alt="Logo"
            width={300}
            height={300}
            className="h-8 w-8"
          />
        </Link>
        <Link href="/stats" className="font-bold">
          Stats
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <SettingsMenu />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:rotate-90" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
};
