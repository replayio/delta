import { getActionsFromBranch } from "../lib/supabase";

const main = async () => {
  const branchId = "ca7f4ea9-c13a-46c3-96c5-2cb972c514ef";
  const actions = await getActionsFromBranch(branchId);
  console.log(actions);
};

main();
