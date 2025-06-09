import { cookies } from "next/headers";

export async function getServerToken() {
  const cookieStore = await cookies();

  const token = cookieStore.get("token")?.value;
  const tokenExpiration = cookieStore.get("tokenExpiration")?.value;

  return {
    tokenExists: Boolean(token),
    tokenExpiration: tokenExpiration ?? null,
  };
}