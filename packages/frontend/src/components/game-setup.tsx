import "client-only";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { gameSettingsSchema } from "@/lib/schemas";
import { useGameStore } from "@/lib/store-provider";
import { usePendingGame } from "@/lib/hooks/use-pending-game";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import posthog from "posthog-js";
import { z } from "zod";

const gameSetupSchema = gameSettingsSchema.extend({
  startingScore: z.enum(["301", "501"]),
  gameMode: z.enum(["bestOf", "firstTo"]),
  legsToWin: z.enum(["3", "5", "6", "7", "8", "9"]),
  player1: z.string().min(1, "Player 1 name is required"),
  player2: z.string().optional(),
  // Override checkoutAssist from parent schema to ensure it's always boolean (not optional)
  // In Zod v4, .default() makes fields optional in the input type
  checkoutAssist: z.boolean(),
});

type GameSetupFormValues = z.infer<typeof gameSetupSchema>;

const startingScoreOptions = [
  { value: "501", label: "501" },
  { value: "301", label: "301" },
];

const outModeOptions = [
  { value: "single", label: "Single Out" },
  { value: "double", label: "Double Out" },
];

const gameModeOptions = [
  { value: "bestOf", label: "Best of X legs" },
  { value: "firstTo", label: "First to X legs" },
];

const legsToWinOptions = [
  { value: "3", label: "3" },
  { value: "5", label: "5" },
  { value: "6", label: "6" },
  { value: "7", label: "7" },
  { value: "8", label: "8" },
  { value: "9", label: "9" },
];

export function GameSetup() {
  const { setGameSettings, setPlayers, setGamePhase, restorePendingGame } =
    useGameStore((state) => state);
  const { pendingGame, clearPendingGame } = usePendingGame();

  const form = useForm<GameSetupFormValues>({
    resolver: zodResolver(gameSetupSchema),
    defaultValues: {
      startingScore: "501",
      outMode: "single",
      gameMode: "bestOf",
      legsToWin: "3",
      player1: "",
      player2: "",
      checkoutAssist: false,
    },
  });

  // Watch the gameMode to provide contextual help text
  const gameMode = form.watch("gameMode");
  const legsToWin = form.watch("legsToWin");

  // Calculate description based on game mode to clarify semantics
  const getLegsDescription = () => {
    const legs = Number.parseInt(legsToWin || "3");
    if (gameMode === "firstTo") {
      return `First player to win ${legs} legs wins the match`;
    } else {
      const required = Math.ceil(legs / 2);
      return `Best of ${legs} legs (first to ${required} wins the match)`;
    }
  };

  const onSubmit = (data: GameSetupFormValues) => {
    clearPendingGame();
    const playerCount = data.player2 && data.player2.trim() !== "" ? 2 : 1;

    posthog.capture("match_setup_completed", {
      history_event: "match_setup_completed",
      starting_score: Number.parseInt(data.startingScore),
      out_mode: data.outMode,
      game_mode: data.gameMode,
      legs_to_win: Number.parseInt(data.legsToWin),
      checkout_assist: data.checkoutAssist,
      player_count: playerCount,
    });

    setGameSettings({
      startingScore: Number.parseInt(data.startingScore),
      outMode: data.outMode,
      gameMode: data.gameMode,
      legsToWin: Number.parseInt(data.legsToWin),
      checkoutAssist: data.checkoutAssist,
    });

    // Note: UI only supports 1-2 players (enforced by form schema)
    const players: { name: string }[] = [{ name: data.player1 }];

    if (data.player2 && data.player2.trim() !== "") {
      players.push({ name: data.player2 });
    }

    setPlayers(players);
    setGamePhase("preGame");
  };

  const hasPendingGame = pendingGame?.status === "pending";

  return (
    <Card className="w-full lg:mx-auto lg:w-xl">
      <CardHeader>
        <CardTitle className="text-center">New Match Setup</CardTitle>
      </CardHeader>
      <CardContent>
        {hasPendingGame && (
          <div className="mb-6 rounded-lg border p-4">
            <p className="mb-3 text-sm font-medium">Pending game found</p>
            <p className="text-muted-foreground mb-4 text-sm">
              Continue your previous game or discard it and start a new match.
            </p>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => restorePendingGame(pendingGame.snapshot)}
              >
                Continue game
              </Button>
              <Button
                className="flex-1"
                variant="outline"
                onClick={clearPendingGame}
              >
                Discard pending game
              </Button>
            </div>
          </div>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="startingScore"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Starting Score</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => field.onChange(value ?? "")}
                    items={startingScoreOptions}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select starting score" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {startingScoreOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="outMode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Game Mode</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => field.onChange(value ?? "")}
                    items={outModeOptions}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select game mode" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {outModeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gameMode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Match Format</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => field.onChange(value ?? "")}
                    items={gameModeOptions}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select match format" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {gameModeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="legsToWin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Legs</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => field.onChange(value ?? "")}
                    items={legsToWinOptions}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select number of legs" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {legsToWinOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>{getLegsDescription()}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="player1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Player 1 Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter name"
                      className="w-full"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="player2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Player 2 Name (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter name for 2-player mode"
                      className="w-full"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="checkoutAssist"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Checkout Assist</FormLabel>
                    <FormMessage />
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked: boolean) =>
                        field.onChange(checked)
                      }
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">
              Continue
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
