export interface Commit {
  hash: string;
  author: string;
  email: string;
  date: string; // ISO 8601
  subject: string;
  added: number;
  deleted: number;
  files: number;
  tags: string[];
}

export type ChapterKind =
  | "genesis"
  | "release"
  | "rewrite"
  | "revert"
  | "contributors"
  | "gap"
  | "growth";

export interface Chapter {
  kind: ChapterKind;
  title: string;
  summary: string;
  date: string;
  commit: string; // hash that triggered the chapter
  score: number;
}

export interface Story {
  repo: string;
  commits: Commit[];
  chapters: Chapter[];
  stats: { commits: number; authors: number; first: string; last: string; added: number; deleted: number };
}
