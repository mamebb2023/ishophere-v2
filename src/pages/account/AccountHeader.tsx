import { UserRound } from "lucide-react";

export function AccountHeader() {
  return (
    <div className="flex items-center gap-2 p-2 sm:p-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <UserRound className="h-5 w-5" />
      </span>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        My account
      </h1>
    </div>
  );
}
