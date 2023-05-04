import Head from "next/head";

import { Auth } from "@supabase/ui";
import { ErrorBoundary } from "react-error-boundary";
import Error from "../components/Error";
import { supabase } from "../lib/client/initSupabase";
import "../styles/globals.css";

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
