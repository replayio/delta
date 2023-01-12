import { fetchURI } from "../utils/fetchURI";

(async () => {
  const projectId = "dcb5df26-b418-4fe2-9bdf-5a838e604ec4";
  const uri = `http://localhost:3000/api/getActions?projectId=${projectId}`;

  const response = await fetchURI(uri);

  console.log(response);
})();
