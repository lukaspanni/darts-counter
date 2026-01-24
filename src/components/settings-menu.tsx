"use client";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useUiSettings } from "@/lib/hooks/use-ui-settings";
import { Settings } from "lucide-react";

export const SettingsMenu = () => {
  const {
    settings,
    updateSettings,
    isLargeScreen,
    enforceSmallScreenDefaults,
  } = useUiSettings();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Open settings</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Settings</DropdownMenuLabel>
        <DropdownMenuCheckboxItem
          checked={settings.enhancedView}
          onCheckedChange={(checked) => {
            if (!isLargeScreen) {
              enforceSmallScreenDefaults();
              return;
            }
            updateSettings({ enhancedView: checked });
          }}
          disabled={!isLargeScreen}
        >
          Large display layout
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
