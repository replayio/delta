import { createCache } from "suspense";
import { Base64Image, base64ImageCache } from "./ImageCache";
import { downloadSnapshot } from "../utils/ApiClient";

// Fetch base64 encoded snapshot image (with dimensions)
export const snapshotImageCache = createCache<[path: string], Base64Image>({
  debugLabel: "snapshotImage",
  async load([path]) {
    const base64String = await downloadSnapshot({ path });
    return await base64ImageCache.readAsync(base64String);
  },
});
