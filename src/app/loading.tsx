export default function RootLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-4">
      <div className="flex h-[74px] w-[74px] animate-pulse items-center justify-center rounded-3xl bg-gradient-to-br from-accent to-primary text-3xl">
        🤍
      </div>
      <span className="font-hand text-lg text-muted-foreground">
        불러오는 중...
      </span>
    </div>
  );
}
