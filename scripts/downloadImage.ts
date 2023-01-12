import { fetchURI } from "../utils/fetchURI";

(async () => {
  const path =
    "dcb5df26-b418-4fe2-9bdf-5a838e604ec4/555c9968-4ad1-4601-806a-0bde6522e55b/test/fixtures/console.ts-snapshots/dark/filtered-no-results-linux.png";
  const uri = `http://localhost:3000/api/downloadSnapshot?path=${path}`;

  const response = await fetchURI(uri);

  console.log(response);
})();
