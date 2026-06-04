"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash;

    // If there's an auth token in the hash, go to set-password with it intact
    if (
      hash.includes("access_token") ||
      hash.includes("type=recovery") ||
      hash.includes("type=magiclink")
    ) {
      router.replace("/set-password" + hash);
      return;
    }

    // Otherwise normal redirect to public home
    router.replace("/home");
  }, [router]);

  // Render nothing while deciding where to go
  return null;
}
