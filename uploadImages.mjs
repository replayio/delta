import fetch from "node-fetch";
import fs from "fs";

function getFiles(dir) {
  // Use the fs.readdirSync() method to get a list of files in the directory
  const files = fs.readdirSync(dir);

  // Create an empty array to store the list of all files
  const allFiles = [];

  files.forEach((file) => {
    const stats = fs.statSync(`${dir}/${file}`);

    if (stats.isDirectory()) {
      allFiles.push(...getFiles(`${dir}/${file}`));
    } else {
      if (file !== ".DS_Store") {
        allFiles.push(`${dir}/${file}`);
      }
    }
  });

  // Return the list of all files
  return allFiles;
}

function getDateAndMinute() {
  // Format the date and time using dashes as the delimiters
  const dateTimeString = new Date()
    .toLocaleString("en-US", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    })
    .replace(/[/,]/g, "-");

  // Split the string into its individual parts and join them back together with dashes
  const dateTimeParts = dateTimeString.split(" ");
  return `${dateTimeParts[0]}-${dateTimeParts[1]}`;
}

const uploadImages = async (images) => {
  const run = getDateAndMinute();
  const res = await Promise.all(images.map((image) => uploadImage(image, run)));
  console.log(res);
  return res;
};

const uploadImage = async (image, run) => {
  let res;

  try {
    res = await fetch("http://localhost:3000/api/uploadImage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image, run }),
    });

    // const json = await body.json();
    if (res.status !== 200) {
      const body = await res.text();
      console.log(res.status, body);
      return body;
    }
    const body = await res.json();
    return body;
  } catch (e) {
    console.error("erro", e, JSON.stringify(body));
  }
};

const allFiles = getFiles("./test/fixtures");
const firstFive = allFiles.slice(105, 109);
const images = firstFive.map((file) => ({
  file,
  content: fs.readFileSync(file, { encoding: "base64" }),
}));

console.log(getDateAndMinute());
uploadImages(images);

// import { createClient } from "@supabase/supabase-js";
// import dotenv from "dotenv";

// dotenv.config({ path: "./.env.local" });
// console.log(process.env.NEXT_PUBLIC_SUPABASE_URL);

// const apiKey = "0cd8d2b6-919e-4ece-abf2-f91c03616e0f";

// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL,
//   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
//   {
//     // globals: { headers: { apikey: apiKey } },
//     headers: { apikey: apiKey },
//   }
// );

// (async () => {
//   let { data, error } = await supabase.rpc("apikey_to_user_id", {
//     apikey: apiKey,
//     keymode: "{all}",
//   });

//   if (error) console.error(error);
//   else console.log("policy:", data);
// })();

// // (async () => {
// //   let { data: apikeys, error } = await supabase.from("apikeys").select("*");
// //   console.log("apikeys", apikeys, error);
// // })();

// (async () => {
//   let { data: todos, error } = await supabase.from("todos").select("*");
//   console.log("todos", todos, error);
// })();

// // const { data, error } = await supabase.storage
// //   .from("snapshots")
// //   .upload(`${user.id}/${file.name}`, avatarFile, {
// //     cacheControl: "3600",
// //     upsert: false,
// //   });

// // https://gist.github.com/FelixZY/0aef530690458b381b8100afa19202c8

// // (uid() = user_id)

// // is_allowed_apikey(((current_setting('request.headers'::text, true))::json ->> 'apikey'::text), '{all,write}'::key_mode[], app_id)
