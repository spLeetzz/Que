"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { LoadingSpinner } from "~/components/shared/loading-spinner";

export default function EditEventRedirect() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    if (params.id) {
      router.replace(`/events/${params.id}?tab=manage`);
    }
  }, [params.id, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <LoadingSpinner />
    </div>
  );
}
