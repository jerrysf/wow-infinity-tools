import { describe, expect, it } from "vitest";
import { detectLocale, isLocale, stripLocale, locales } from "./config";
import { getDictionary, pick, t } from "./get-dictionary";

describe("locale config", () => {
  it("validates locales", () => {
    expect(isLocale("zh-cn")).toBe(true);
    expect(isLocale("en-us")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale("")).toBe(false);
  });
  it("detects from Accept-Language", () => {
    expect(detectLocale("zh-CN,zh;q=0.9,en;q=0.8")).toBe("zh-cn");
    expect(detectLocale("en-US,en;q=0.9")).toBe("en-us");
    expect(detectLocale("fr-FR")).toBe("zh-cn"); // falls back to default
    expect(detectLocale(null)).toBe("zh-cn");
  });
  it("strips locale prefixes", () => {
    expect(stripLocale("/zh-cn/builds")).toEqual({ locale: "zh-cn", rest: "/builds" });
    expect(stripLocale("/en-us")).toEqual({ locale: "en-us", rest: "/" });
    expect(stripLocale("/builds")).toEqual({ locale: null, rest: "/builds" });
  });
});

describe("dictionaries", () => {
  it("both locales have the same shape", () => {
    for (const locale of locales) {
      const dict = getDictionary(locale);
      expect(dict.common.nav.talents.length).toBeGreaterThan(0);
      expect(dict.talents.errors["max-rank"].length).toBeGreaterThan(0);
    }
  });
  it("returns a full dictionary for each locale", () => {
    expect(getDictionary("zh-cn").pages.about.title).toBe("关于本站");
    expect(getDictionary("en-us").pages.about.title).toBe("About");
  });
});

describe("pick + t", () => {
  it("picks localized text with fallback", () => {
    expect(pick({ zh: "战士", en: "Warrior" }, "zh-cn")).toBe("战士");
    expect(pick({ zh: "战士", en: "Warrior" }, "en-us")).toBe("Warrior");
    expect(pick({ zh: "战士", en: "" }, "en-us")).toBe("战士");
    expect(pick(undefined, "en-us")).toBe("");
  });
  it("interpolates templates", () => {
    expect(t("第 {current} / {total} 题", { current: 2, total: 5 })).toBe("第 2 / 5 题");
    expect(t("{a}", { other: 1 })).toBe("{a}");
  });
});
