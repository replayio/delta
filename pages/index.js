import { supabase } from "../lib/initSupabase";
import { Auth } from "@supabase/ui";
import TodoList from "../components/TodoList";

function LoggedOutScreen() {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center p-4">
      <div>
        <Auth
          supabaseClient={supabase}
          providers={["google", "github"]}
          socialLayout="horizontal"
          socialButtonSize="xlarge"
        />
      </div>
    </div>
  );
}

export default function IndexPage() {
  const { user } = Auth.useUser();

  if (!user) {
    return <LoggedOutScreen />;
  }
  return (
    <div className="w-full h-full bg-black" style={{ background: "black" }}>
      <div className="flex w-full h-12 items-center text-white">
        <div className="flex-grow font-bold ">Visuals</div>
        <div className="flex items-center ">
          <img
            className="rounded-2xl w-6 mr-2"
            src={user.user_metadata.avatar_url}
          />{" "}
          <button
            className="text-white mr-2"
            onClick={async () => {
              const { error } = await supabase.auth.signOut();
              if (error) console.log("Error logging out:", error.message);
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div
        className=" h-full flex flex-col justify-center items-center p-4"
        style={{ minWidth: 250, maxWidth: 600, margin: "auto" }}
      >
        <TodoList user={supabase.auth.user()} />
      </div>
    </div>
  );
}
