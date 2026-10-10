import { z } from "zod";

export const starterPathSchema = z.string().min(1).max(160).refine((path) => {
  return path.split("/").every((segment) => /^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(segment) && !segment.endsWith(".") && !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(segment));
}, "Use relative file paths without hidden files, traversal, or reserved names.");

export const starterSchema = z.object({
  summary: z.string().trim().min(1).max(600),
  files: z.array(z.object({ path: starterPathSchema, purpose: z.string().trim().min(1).max(500), content: z.string().min(1).max(10000) }).strict()).min(1).max(10),
  setupSteps: z.array(z.string().trim().min(1).max(1000)).min(1).max(6),
  firstTask: z.string().trim().min(1).max(1000),
}).strict().superRefine((starter, ctx) => {
  const paths = starter.files.map((file) => file.path.toLowerCase());
  if (new Set(paths).size !== paths.length || paths.some((path) => paths.some((other) => other !== path && other.startsWith(`${path}/`)))) ctx.addIssue({ code: "custom", path: ["files"], message: "File paths must be unique and cannot also be directories." });
  if (starter.files.reduce((sum, file) => sum + file.content.length, 0) > 45000) ctx.addIssue({ code: "custom", path: ["files"], message: "Keep the starter small." });
});
export type Starter = z.infer<typeof starterSchema>;
