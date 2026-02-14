import "client-only";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
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

export function GameSetup() {
  const { setGameSettings, setPlayers, setGamePhase } = useGameStore(
    (state) => state,
  );

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

  const onSubmit = (data: GameSetupFormValues) => {
    const playerCount = data.player2 && data.player2.trim() !== "" ? 2 : 1;

    posthog.capture("match_setup_completed", {
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

    const players: { name: string }[] = [{ name: data.player1 }];

    if (data.player2 && data.player2.trim() !== "") {
      players.push({ name: data.player2 });
    }

    setPlayers(players);
    setGamePhase("preGame");
  };

  return (
    <Card className="w-full lg:mx-auto lg:w-xl">
      <CardHeader>
        <CardTitle className="text-center">New Match Setup</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="startingScore"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Starting Score</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select starting score" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="501">501</SelectItem>
                      <SelectItem value="301">301</SelectItem>
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
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select game mode" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="single">Single Out</SelectItem>
                      <SelectItem value="double">Double Out</SelectItem>
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
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select match format" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="bestOf">Best of X legs</SelectItem>
                      <SelectItem value="firstTo">First to X legs</SelectItem>
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
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select number of legs" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="6">6</SelectItem>
                      <SelectItem value="7">7</SelectItem>
                      <SelectItem value="8">8</SelectItem>
                      <SelectItem value="9">9</SelectItem>
                    </SelectContent>
                  </Select>
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
