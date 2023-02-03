import Head from "next/head";

import "../styles/globals.css";
import { Auth } from "@supabase/ui";
import { supabase } from "../lib/initSupabase";
import { ErrorBoundary } from "react-error-boundary";
import Error from "../components/Error";

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <link rel="shortcut icon" href="/favico.svg" />
      </Head>
      <Auth.UserContextProvider supabaseClient={supabase}>
        <ErrorBoundary FallbackComponent={Error}>
          <Component {...pageProps} />
        </ErrorBoundary>
      </Auth.UserContextProvider>
    </>
  );
}
