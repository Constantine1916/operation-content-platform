import PrivateAppShell from '@/components/PrivateAppShell';

function AgentPageContent() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="rounded-3xl border border-gray-200 bg-white px-5 py-5 sm:px-7 sm:py-7">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400">
          Agent Workspace
        </div>
        <h1 className="mt-2 text-2xl font-semibold text-gray-900 sm:text-3xl">
          Agent 智能体
        </h1>
        <p className="mt-2 text-sm leading-6 text-gray-500">
          面向任务执行、自动化协作和智能工作流的能力专区。
        </p>
      </div>

      <div className="mt-6 overflow-hidden rounded-[32px] border border-gray-200 bg-[linear-gradient(135deg,#ffffff_0%,#f7f7f5_54%,#f1efe9_100%)] shadow-[0_24px_64px_-44px_rgba(17,24,39,0.35)]">
        <div className="relative px-5 py-10 sm:px-8 sm:py-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(17,24,39,0.08),transparent_32%)]" />

          <div className="relative mx-auto max-w-2xl text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border border-gray-200 bg-white text-gray-900 shadow-[0_18px_38px_-28px_rgba(17,24,39,0.4)] sm:h-20 sm:w-20">
              <svg className="h-8 w-8 sm:h-10 sm:w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9 3.75H7.5A2.25 2.25 0 005.25 6v1.5m0 9V18A2.25 2.25 0 007.5 20.25H9m6-16.5h1.5A2.25 2.25 0 0118.75 6v1.5m0 9V18A2.25 2.25 0 0116.5 20.25H15M8.25 9.75h7.5m-7.5 4.5h4.5" />
              </svg>
            </div>

            <div className="mt-6 text-[11px] font-semibold uppercase tracking-[0.26em] text-gray-400">
              Coming Soon
            </div>
            <h2 className="mt-3 text-2xl font-semibold text-gray-900 sm:text-3xl">
              即将上线，敬请期待！
            </h2>
            <p className="mt-3 text-sm leading-7 text-gray-500 sm:text-base">
              我们正在打磨 Agent 智能体专区，后续会在这里提供更完整的任务编排、执行与协同能力。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AgentPage() {
  return (
    <PrivateAppShell>
      <AgentPageContent />
    </PrivateAppShell>
  );
}
