import { apiClient, unwrap } from "./api/client";

export const uploadCloudFile = async (
  file: File, 
  onProgress?: (percent: number) => void
): Promise<string> => {
  const form = new FormData();
  form.append("file", file);
  const res = await unwrap<{ url: string }>(
    apiClient.post("/storage/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    })
  );
  return res.url;
};

