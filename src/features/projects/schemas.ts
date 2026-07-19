import { z } from "zod";

export const projectFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(160, "Name is too long"),
  description: z.string().max(2000).optional(),
  color: z.string(),
  icon: z.string(),
  status: z.enum(["active", "paused", "completed", "archived"]),
  deadline: z.string().optional(),
  repositoryUrl: z
    .string()
    .trim()
    .url("Enter a valid URL")
    .or(z.literal(""))
    .optional(),
  tagIds: z.array(z.string()),
  memberIds: z.array(z.string()),
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;
