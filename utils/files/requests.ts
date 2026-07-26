// utils/files/requests.ts
type CloudinaryResponse = {
  url: string;
  public_id: string;
};

type CloudinaryError = {
  message: string;
};

type CloudinaryDeleteResponse = {
  success: boolean;
};

export const uploadMedia = async (
  files: File[] | File,
  path?: string
): Promise<CloudinaryResponse[]> => {
  const formData = new FormData();
  const filesArray = Array.isArray(files) ? files : [files];

  filesArray.forEach((file) => {
    formData.append("files", file);
  });

  if (path) {
    formData.append("path", path);
  }

  const response = await fetch("/api/cloudinary", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error: CloudinaryError = await response.json();
    throw new Error(error.message || "Upload failed");
  }

  return (await response.json()) as CloudinaryResponse[];
};

export const deleteMedia = async (
  public_id: string
): Promise<CloudinaryDeleteResponse> => {
  const response = await fetch("/api/cloudinary", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ public_id }),
  });

  if (!response.ok) {
    const error: CloudinaryError = await response.json();
    throw new Error(error.message || "Delete failed");
  }

  return (await response.json()) as CloudinaryDeleteResponse;
};
