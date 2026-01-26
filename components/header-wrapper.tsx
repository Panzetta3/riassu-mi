import { getSession } from "@/lib/auth";
import { Header } from "./header";

export async function HeaderWrapper() {
  const session = await getSession();
  return <Header user={session} />;
}
