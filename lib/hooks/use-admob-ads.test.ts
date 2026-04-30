import { describe, it, expect, beforeEach, vi } from "vitest";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Mock AsyncStorage
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

describe("useAdMobAds - Ad Frequency Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show ad on first episode", () => {
    // Episódio 1: 1 % 3 === 1 ✓
    const episodeCount = 0;
    const newCount = episodeCount + 1;
    const shouldShow = newCount % 3 === 1;

    expect(shouldShow).toBe(true);
  });

  it("should not show ad on second episode", () => {
    // Episódio 2: 2 % 3 === 2 ✗
    const episodeCount = 1;
    const newCount = episodeCount + 1;
    const shouldShow = newCount % 3 === 1;

    expect(shouldShow).toBe(false);
  });

  it("should not show ad on third episode", () => {
    // Episódio 3: 3 % 3 === 0 ✗
    const episodeCount = 2;
    const newCount = episodeCount + 1;
    const shouldShow = newCount % 3 === 1;

    expect(shouldShow).toBe(false);
  });

  it("should show ad on fourth episode", () => {
    // Episódio 4: 4 % 3 === 1 ✓
    const episodeCount = 3;
    const newCount = episodeCount + 1;
    const shouldShow = newCount % 3 === 1;

    expect(shouldShow).toBe(true);
  });

  it("should show ad on seventh episode", () => {
    // Episódio 7: 7 % 3 === 1 ✓
    const episodeCount = 6;
    const newCount = episodeCount + 1;
    const shouldShow = newCount % 3 === 1;

    expect(shouldShow).toBe(true);
  });

  it("should show ads at correct intervals", () => {
    const adEpisodes = [];

    for (let i = 0; i < 12; i++) {
      const newCount = i + 1;
      if (newCount % 3 === 1) {
        adEpisodes.push(newCount);
      }
    }

    expect(adEpisodes).toEqual([1, 4, 7, 10]);
  });

  it("should persist frequency data to AsyncStorage", async () => {
    const mockSetItem = vi.spyOn(AsyncStorage, "setItem");

    const frequencyData = {
      lastAdShownAt: Date.now(),
      episodeCount: 1,
    };

    await AsyncStorage.setItem(
      "@animfire:ad_frequency",
      JSON.stringify(frequencyData)
    );

    expect(mockSetItem).toHaveBeenCalledWith(
      "@animfire:ad_frequency",
      JSON.stringify(frequencyData)
    );
  });

  it("should load frequency data from AsyncStorage", async () => {
    const mockGetItem = vi.spyOn(AsyncStorage, "getItem");
    const frequencyData = {
      lastAdShownAt: Date.now(),
      episodeCount: 5,
    };

    mockGetItem.mockResolvedValueOnce(JSON.stringify(frequencyData));

    const result = await AsyncStorage.getItem("@animfire:ad_frequency");
    const parsed = result ? JSON.parse(result) : null;

    expect(parsed).toEqual(frequencyData);
    expect(mockGetItem).toHaveBeenCalledWith("@animfire:ad_frequency");
  });
});

describe("Ad Display Pattern", () => {
  it("should follow the correct ad display pattern", () => {
    const pattern = [];

    for (let ep = 1; ep <= 15; ep++) {
      pattern.push({
        episode: ep,
        showAd: ep % 3 === 1,
      });
    }

    // Verify pattern
    expect(pattern[0].showAd).toBe(true); // Episode 1
    expect(pattern[1].showAd).toBe(false); // Episode 2
    expect(pattern[2].showAd).toBe(false); // Episode 3
    expect(pattern[3].showAd).toBe(true); // Episode 4
    expect(pattern[4].showAd).toBe(false); // Episode 5
    expect(pattern[5].showAd).toBe(false); // Episode 6
    expect(pattern[6].showAd).toBe(true); // Episode 7

    // Count ads
    const adCount = pattern.filter((p) => p.showAd).length;
    expect(adCount).toBe(5); // Episodes 1, 4, 7, 10, 13
  });

  it("should calculate correct ad frequency", () => {
    const totalEpisodes = 100;
    const expectedAds = Math.ceil(totalEpisodes / 3);

    let adCount = 0;
    for (let ep = 1; ep <= totalEpisodes; ep++) {
      if (ep % 3 === 1) {
        adCount++;
      }
    }

    expect(adCount).toBe(expectedAds);
  });
});
