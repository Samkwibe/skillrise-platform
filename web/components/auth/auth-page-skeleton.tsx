/** Shared loading UI for login / signup routes (Suspense + loading.tsx). */
export function AuthPageSkeleton() {
  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-ink text-t1">
      <div className="hidden md:flex flex-col justify-between p-12 bg-s2/40 border-r border-border1">
        <div className="h-7 w-36 rounded-lg bg-s3/80 animate-pulse" />
        <div className="space-y-4 max-w-md">
          <div className="h-6 w-28 rounded-full bg-s3/60 animate-pulse" />
          <div className="h-10 w-full rounded-lg bg-s3/70 animate-pulse" />
          <div className="h-20 w-full rounded-lg bg-s3/50 animate-pulse" />
        </div>
        <div className="h-4 w-48 rounded bg-s3/40 animate-pulse" />
      </div>
      <div className="p-6 md:p-12 flex items-center">
        <div className="w-full max-w-[440px] mx-auto space-y-5">
          <div className="h-8 w-44 rounded-lg bg-s2 animate-pulse md:mt-0 mt-8" />
          <div className="h-4 w-64 rounded bg-s2/80 animate-pulse" />
          <div className="auth-form-shell space-y-4">
            <div className="h-12 rounded-xl bg-s2/90 animate-pulse" />
            <div className="h-12 rounded-xl bg-s2/90 animate-pulse" />
            <div className="h-12 rounded-xl bg-s2/90 animate-pulse" />
            <div className="h-12 rounded-xl bg-g/20 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
