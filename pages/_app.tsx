import Head from "next/head";

import "../styles/globals.css";
import { Auth } from "@supabase/ui";
import { supabase } from "../lib/initSupabase";

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <link rel="shortcut icon" href="/favico.svg" />
      </Head>
      <Auth.UserContextProvider supabaseClient={supabase}>
        <Component {...pageProps} />
      </Auth.UserContextProvider>
    </>
  );
}
