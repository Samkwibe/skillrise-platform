import { requireVerifiedUser } from "@/lib/auth";
import { store } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { AssistantChat } from "@/components/assistant-chat";

export const dynamic = "force-dynamic";

export default async function AssistantPage() {
  const user = await requireVerifiedUser();
  const history = store.assistantMessages.filter((m) => m.userId === user.id).slice(-40);
  return (
    <div className="section-pad-x py-10">
      <PageHeader
        eyebrow="Study assistant"
        title="Your personal study buddy."
        subtitle="Ask it to quiz you, explain a concept, or practice an interview. Curriculum-aware and context-aware."
      />
      <div className="max-w-[780px] mx-auto">
        <AssistantChat initial={history.map((m) => ({ role: m.role, text: m.text }))} />
      </div>
    </div>
  );
}
