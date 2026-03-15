import "client-only";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Switch } from "@/components/ui/switch";
import { gameSettingsSchema } from "@/lib/schemas";
import { useGameStore } from "@/lib/store-provider";
import { usePendingGame } from "@/lib/hooks/use-pending-game";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import posthog from "posthog-js";
import { z } from "zod";
import { ArrowRight, RotateCcw } from "lucide-react";

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
  { value: "bestOf", label: "Best of" },
  { value: "firstTo", label: "First to" },
];

const legsOptions = [
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

  const gameMode = form.watch("gameMode");
  const legsToWin = form.watch("legsToWin");

  const getLegsDescription = () => {
    const legs = Number.parseInt(legsToWin || "3");
    if (gameMode === "firstTo") {
      return `First player to win ${legs} legs wins the match`;
    }
    const required = Math.ceil(legs / 2);
    return `Best of ${legs} legs — first to ${required} wins`;
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
  const player1Error = form.formState.errors.player1?.message;

  return (
    <div className="w-full lg:mx-auto lg:max-w-xl">
      {hasPendingGame && (
        <div className="border-primary/20 dark:border-primary/30 bg-primary/5 dark:bg-primary/10 mb-6 flex items-center justify-between gap-4 rounded-lg border px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-medium">You have an unfinished game</p>
            <p className="text-muted-foreground text-xs">
              Pick up where you left off, or start fresh.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={clearPendingGame}
              className="text-muted-foreground"
            >
              Discard
            </Button>
            <Button
              size="sm"
              onClick={() => restorePendingGame(pendingGame.snapshot)}
            >
              <RotateCcw className="size-3.5" />
              Resume
            </Button>
          </div>
        </div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <h2 className="mb-6 text-2xl font-bold tracking-tight">New Match</h2>

        {/* Game Rules */}
        <div className="space-y-5">
          <fieldset>
            <legend className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wider">
              Starting Score
            </legend>
            <Controller
              control={form.control}
              name="startingScore"
              render={({ field }) => (
                <SegmentedControl
                  options={startingScoreOptions}
                  value={field.value}
                  onValueChange={field.onChange}
                />
              )}
            />
          </fieldset>

          <fieldset>
            <legend className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wider">
              Out Mode
            </legend>
            <Controller
              control={form.control}
              name="outMode"
              render={({ field }) => (
                <SegmentedControl
                  options={outModeOptions}
                  value={field.value}
                  onValueChange={field.onChange}
                />
              )}
            />
          </fieldset>

          <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
            <fieldset>
              <legend className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wider">
                Match Format
              </legend>
              <Controller
                control={form.control}
                name="gameMode"
                render={({ field }) => (
                  <SegmentedControl
                    options={gameModeOptions}
                    value={field.value}
                    onValueChange={field.onChange}
                  />
                )}
              />
            </fieldset>

            <fieldset>
              <legend className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wider">
                Legs
              </legend>
              <Controller
                control={form.control}
                name="legsToWin"
                render={({ field }) => (
                  <SegmentedControl
                    options={legsOptions}
                    value={field.value}
                    onValueChange={field.onChange}
                  />
                )}
              />
            </fieldset>
          </div>

          <p className="text-muted-foreground text-xs">
            {getLegsDescription()}
          </p>
        </div>

        {/* Divider */}
        <div className="border-border my-6 border-t" />

        {/* Players */}
        <fieldset className="space-y-5">
          <legend className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
            Players
          </legend>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="player1"
                className="mb-1.5 block text-sm font-medium"
              >
                Player 1
              </label>
              <Input
                id="player1"
                placeholder="Name"
                aria-invalid={!!player1Error}
                aria-describedby={player1Error ? "player1-error" : undefined}
                {...form.register("player1")}
              />
              {player1Error && (
                <p id="player1-error" className="text-destructive mt-1 text-xs">
                  {player1Error}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="player2"
                className="text-muted-foreground mb-1.5 block text-sm font-medium"
              >
                Player 2
                <span className="ml-1 font-normal">(optional)</span>
              </label>
              <Input
                id="player2"
                placeholder="Leave empty for solo"
                {...form.register("player2")}
              />
            </div>
          </div>
        </fieldset>

        {/* Divider */}
        <div className="border-border my-6 border-t" />

        {/* Footer: checkout assist + submit */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Controller
            control={form.control}
            name="checkoutAssist"
            render={({ field }) => (
              <label className="flex cursor-pointer items-center gap-2.5">
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <span className="text-sm font-medium select-none">
                  Checkout assist
                </span>
              </label>
            )}
          />

          <Button type="submit" size="lg">
            Continue
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
