import { getSession } from "@/lib/auth";
import { Header } from "./header";

export async function HeaderWrapper() {
  let session = null;
  try {
    session = await getSession();
  } catch {
    // Ignore errors during static rendering
  }
  return <Header user={session} />;
}
