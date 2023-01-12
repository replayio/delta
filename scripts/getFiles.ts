import fetch from "node-fetch";

const PROJECT_ID = "dcb5df26-b418-4fe2-9bdf-5a838e604ec4";
const url = `https://${PROJECT_ID}.supabase.co/storage/files`;

fetch(url)
  .then((response) => response.json())
  .then((data: any) => {
    // The response will contain a list of files in the "data" field
    const files = data.data;

    // Print the ID of each file
    for (const file of files) {
      console.log(file.id);
    }
  });
