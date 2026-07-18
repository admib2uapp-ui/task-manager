"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { tagsApi, type TagPayload } from "@/features/projects/api/tags-api";

export function useTags() {
  return useQuery({
    queryKey: queryKeys.tags.all,
    queryFn: tagsApi.list,
    staleTime: 5 * 60_000,
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TagPayload) => tagsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.all });
    },
    onError: (error) =>
      toast.error(
        error instanceof ApiError ? error.message : "Could not create tag",
      ),
  });
}
