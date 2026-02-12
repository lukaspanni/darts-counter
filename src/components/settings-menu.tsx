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
import posthog from "posthog-js";

export const SettingsMenu = () => {
  const { settings, updateSettings } = useUiSettings();

  const handleEnhancedViewChange = (checked: boolean) => {
    posthog.capture("settings_changed", {
      setting: "enhanced_view",
      value: checked,
    });
    updateSettings({ enhancedView: checked });
  };

  const handleNoBullshitModeChange = (checked: boolean) => {
    posthog.capture("settings_changed", {
      setting: "no_bullshit_mode",
      value: checked,
    });
    updateSettings({ noBullshitMode: checked });
  };

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
          onCheckedChange={handleEnhancedViewChange}
        >
          Darts Board Entry
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={settings.noBullshitMode}
          onCheckedChange={handleNoBullshitModeChange}
        >
          No-bullshit mode
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
