import { cache } from "react";
import fs from "node:fs";
import path from "node:path";
import {
  buildSchema,
  classSchema,
  classTalentsSchema,
  communityLinkSchema,
  communityVideoSchema,
  gameVersionSchema,
  guideSchema,
  selectorConfigSchema,
  type Build,
  type ClassTalents,
  type CommunityLink,
  type CommunityVideo,
  type GameClass,
  type GameVersion,
  type Guide,
  type SelectorConfig,
} from "./schema";

const DATA_DIR = path.join(process.cwd(), "data");

function readJson(file: string): unknown {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf8"));
}

function readDirJson(dir: string): { file: string; json: unknown }[] {
  const abs = path.join(DATA_DIR, dir);
  if (!fs.existsSync(abs)) return [];
  return fs
    .readdirSync(abs)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => ({ file: `${dir}/${f}`, json: readJson(`${dir}/${f}`) }));
}

function parseOrThrow<T>(schema: { parse: (v: unknown) => T }, json: unknown, file: string): T {
  try {
    return schema.parse(json);
  } catch (err) {
    throw new Error(`Invalid data in ${file}: ${(err as Error).message}`);
  }
}

export const getGameVersions = cache((): GameVersion[] => {
  return parseOrThrow(
    { parse: (v: unknown) => (v as unknown[]).map((e) => gameVersionSchema.parse(e)) },
    readJson("game/versions.json"),
    "game/versions.json",
  );
});

export const getCurrentVersion = cache((): GameVersion => {
  const versions = getGameVersions();
  return versions.find((v) => v.isCurrent) ?? versions[versions.length - 1];
});

export const getClasses = cache((): GameClass[] => {
  return readDirJson("classes").map(({ file, json }) =>
    parseOrThrow(classSchema, json, file),
  );
});

export const getClassBySlug = cache((slug: string): GameClass | undefined => {
  return getClasses().find((c) => c.slug === slug);
});

export const getClassById = cache((id: string): GameClass | undefined => {
  return getClasses().find((c) => c.id === id);
});

export const getClassTalents = cache((classId: string): ClassTalents | undefined => {
  const file = `talents/${classId}.json`;
  if (!fs.existsSync(path.join(DATA_DIR, file))) return undefined;
  return parseOrThrow(classTalentsSchema, readJson(file), file);
});

export const getBuilds = cache((): Build[] => {
  return readDirJson("builds").map(({ file, json }) =>
    parseOrThrow(buildSchema, json, file),
  );
});

export const getBuildBySlug = cache((slug: string): Build | undefined => {
  return getBuilds().find((b) => b.slug === slug);
});

export const getGuides = cache((): Guide[] => {
  return readDirJson("guides").map(({ file, json }) =>
    parseOrThrow(guideSchema, json, file),
  );
});

export const getGuideBySlug = cache((slug: string): Guide | undefined => {
  return getGuides().find((g) => g.slug === slug);
});

export const getSelectorConfig = cache((): SelectorConfig => {
  return parseOrThrow(selectorConfigSchema, readJson("selector/questions.json"), "selector/questions.json");
});

function readJsonArray<T>(schema: { parse: (v: unknown) => T }, file: string): T[] {
  return parseOrThrow(
    { parse: (v: unknown) => (v as unknown[]).map((e) => schema.parse(e)) },
    readJson(file),
    file,
  );
}

export const getCommunityVideos = cache((): CommunityVideo[] => {
  return readJsonArray(communityVideoSchema, "community/videos.json");
});

export const getCommunityLinks = cache((): CommunityLink[] => {
  return readJsonArray(communityLinkSchema, "community/links.json");
});
