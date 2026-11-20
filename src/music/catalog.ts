import type { Score } from "./model";

export type LibraryItem = Pick<
  Score,
  "id" | "title" | "composer" | "level" | "bpm" | "license" | "source"
>;
export type LibraryStatus = "draft" | "published" | "hidden";
export interface AdminLibraryItem extends LibraryItem {
  status: LibraryStatus;
  revision: number;
  publishedRevision: number | null;
  updatedAt: string;
}
export interface AdminLibraryDetail extends AdminLibraryItem {
  score: Score;
}
