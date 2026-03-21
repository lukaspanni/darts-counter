"use client";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buttonVariants } from "@/components/ui/button";
import { useUiSettings } from "@/lib/hooks/use-ui-settings";
import { Settings } from "lucide-react";
import posthog from "posthog-js";

export const SettingsMenu = () => {
  const { settings, updateSettings } = useUiSettings();

  const captureSettingsEvent = (setting: string, value: boolean) => {
    try {
      posthog.capture("settings_changed", {
        history_event: "settings_changed",
        setting,
        value,
      });
    } catch {
      // Analytics may be unavailable - continue without it
    }
  };

  const handleEnhancedViewChange = (checked: boolean) => {
    captureSettingsEvent("enhanced_view", checked);
    updateSettings({ enhancedView: checked });
  };

  const handleVisualGimmicksChange = (checked: boolean) => {
    captureSettingsEvent("visual_gimmicks", checked);
    updateSettings({ visualGimmicks: checked });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        <Settings className="h-4 w-4" />
        <span className="hidden sm:inline">Settings</span>
        <span className="sr-only sm:hidden">Open settings</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Settings</DropdownMenuLabel>
          <DropdownMenuCheckboxItem
            checked={settings.enhancedView}
            onCheckedChange={handleEnhancedViewChange}
          >
            Darts Board Entry
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={settings.visualGimmicks}
            onCheckedChange={handleVisualGimmicksChange}
          >
            Visual gimmicks
          </DropdownMenuCheckboxItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
