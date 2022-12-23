const { createHash } = require("crypto");
import { diffImages } from "../../lib/diff";
import {
  getImageFromMain,
  fetchSnapshot,
  uploadImage,
  insertSnapshot,
  fetchProjectId,
} from "../../lib/supabase";

export default async function handler(req, res) {
  const { image, actionId } = req.body;

  try {
    console.log("actionId", actionId);

    const projectId = await fetchProjectId(actionId);
    const sha = createHash("sha256").update(image.content).digest("hex");
    const uploadResponse = await uploadImage(image, projectId, sha);

    const mainImage = await getImageFromMain(image, projectId);
    const { data: mainSnapshot } = await fetchSnapshot(mainImage.path);

    const { changed } = diffImages(
      Buffer.from(image.content, "base64"),
      Buffer.from(mainSnapshot, "base64")
    );

    console.log("mainSnapshot", mainSnapshot.slice(0, 100));

    const status = uploadResponse.data?.path
      ? "Uploaded"
      : uploadResponse.error?.error;

    const snapshotResponse = await insertSnapshot(
      sha,
      actionId,
      projectId,
      image,
      status,
      changed
    );

    console.log(snapshotResponse);

    res.status(200).json(snapshotResponse);
  } catch (e) {
    console.error("erro", e);
    res.status(500).json({ error: e });
  }
}
