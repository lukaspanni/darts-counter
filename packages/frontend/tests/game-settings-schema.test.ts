import { describe, expect, test } from "vitest";
import {
  gameSettingsSchema,
  getConfiguredLegCount,
  getRequiredLegsToWin,
} from "../src/lib/schemas";

describe("gameSettingsSchema", () => {
  test("parses the explicit first-to shape", () => {
    const settings = gameSettingsSchema.parse({
      startingScore: 501,
      outMode: "double",
      gameMode: "firstTo",
      targetLegs: 3,
      checkoutAssist: false,
    });

    expect(settings).toMatchObject({ gameMode: "firstTo", targetLegs: 3 });
    expect(getConfiguredLegCount(settings)).toBe(3);
    expect(getRequiredLegsToWin(settings)).toBe(3);
  });

  test("migrates the legacy legsToWin field into the new best-of shape", () => {
    const settings = gameSettingsSchema.parse({
      startingScore: 501,
      outMode: "double",
      gameMode: "bestOf",
      legsToWin: 7,
      checkoutAssist: false,
    });

    expect(settings).toMatchObject({ gameMode: "bestOf", totalLegs: 7 });
    expect(getConfiguredLegCount(settings)).toBe(7);
    expect(getRequiredLegsToWin(settings)).toBe(4);
  });
});
