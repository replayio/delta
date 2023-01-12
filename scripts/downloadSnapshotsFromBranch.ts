import { fetchURI } from "../utils/fetchURI";

(async () => {
  const branch = "main";
  const uri = `http://localhost:3000/api/getSnapshotsForBranch?branch=${branch}`;

  const response = await fetchURI(uri);

  console.log(response);
})();
