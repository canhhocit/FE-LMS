import { apiClient, unwrap } from "./api/client";

export const uploadCloudFile = async (file: File): Promise<string> => {
  const form = new FormData();
  form.append("file", file);
  const res = await unwrap<{ url: string }>(
    apiClient.post("/storage/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  );
  return res.url;
};

