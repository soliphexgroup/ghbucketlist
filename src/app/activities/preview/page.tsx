import { Suspense } from "react";
import { HostCreatedExperienceDetail } from "@/components/activities/detail/host-created-experience-detail";

export default function ActivityPreviewPage() {
  return (
    <Suspense fallback={null}>
      <HostCreatedExperienceDetail />
    </Suspense>
  );
}
