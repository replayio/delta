import { fetchURI } from "../utils/fetchURI";

(async () => {
  const token = await fetchURI(`http://localhost:3000/api/getToken`);
  console.log(token);
})();
