"use client";

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
import { useGameStore } from "@/lib/store-provider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const gameSetupSchema = z.object({
  startingScore: z.enum(["501", "301"]),
  outMode: z.enum(["single", "double"]),
  roundsToWin: z.enum(["1", "3", "5", "7"]),
  player1: z.string().min(1, "Player 1 name is required"),
  player2: z.string().optional(),
  checkoutAssist: z.boolean().default(false),
});

type GameSetupFormValues = z.infer<typeof gameSetupSchema>;

export function GameSetup() {
  const { setGameSettings, setPlayers, setGamePhase } = useGameStore(
    (state) => state,
  );

  const form = useForm<GameSetupFormValues>({
    resolver: zodResolver(
      gameSetupSchema.and(z.object({ checkoutAssist: z.boolean() })),
    ),
    defaultValues: {
      startingScore: "501",
      outMode: "single",
      roundsToWin: "3",
      player1: "",
      player2: "",
      checkoutAssist: false,
    },
  });

  const onSubmit = (data: GameSetupFormValues) => {
    setGameSettings({
      startingScore: Number.parseInt(data.startingScore),
      outMode: data.outMode as "single" | "double",
      roundsToWin: Number.parseInt(data.roundsToWin),
      checkoutAssist: data.checkoutAssist,
    });

    const players = [
      {
        id: 1,
        name: data.player1,
        score: Number.parseInt(data.startingScore),
        roundsWon: 0,
        dartsThrown: 0,
        totalScore: 0,
      },
    ];

    if (data.player2 && data.player2.trim() !== "") {
      players.push({
        id: 2,
        name: data.player2,
        score: Number.parseInt(data.startingScore),
        roundsWon: 0,
        dartsThrown: 0,
        totalScore: 0,
      });
    }

    setPlayers(players);
    setGamePhase("preGame");
  };

  return (
    <Card className="w-full lg:mx-auto lg:w-xl">
      <CardHeader>
        <CardTitle className="text-center">New Game Setup</CardTitle>
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
              name="roundsToWin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rounds to Win</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select rounds to win" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">1 Round</SelectItem>
                      <SelectItem value="3">3 Rounds</SelectItem>
                      <SelectItem value="5">5 Rounds</SelectItem>
                      <SelectItem value="7">7 Rounds</SelectItem>
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
