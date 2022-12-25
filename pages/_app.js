import "../styles/globals.css";
import { Auth } from "@supabase/ui";
import { supabase } from "../lib/initSupabase";

export default function MyApp({ Component, pageProps }) {
  return (
    <Auth.UserContextProvider supabaseClient={supabase}>
      <Component {...pageProps} />
    </Auth.UserContextProvider>
  );
}
