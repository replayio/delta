import { createCache } from "suspense";

export type Base64Image = {
  base64String: string;
  height: number;
  width: number;
};

// Fetch base64 encoded snapshot image (with dimensions)
export const base64ImageCache = createCache<
  [base64String: string],
  Base64Image
>({
  debugLabel: "base64Image",
  async load([base64String]) {
    return await createSnapshotImage(base64String);
  },
});

async function createSnapshotImage(base64String: string): Promise<Base64Image> {
  return new Promise<Base64Image>((resolve, reject) => {
    try {
      const image = new Image();
      image.addEventListener("error", (event) => {
        reject(event.error);
      });
      image.addEventListener("load", () => {
        resolve({
          base64String,
          height: image.naturalHeight,
          width: image.naturalWidth,
        });
      });
      image.src = `data:image/png;base64,${base64String}`;
    } catch (error) {
      reject(error);
    }
  });
}
