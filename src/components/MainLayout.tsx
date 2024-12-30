import { BottomBar } from "./BottomBar";

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-primary">
      <main className="flex-1 p-6">{children}</main>
      <BottomBar />
    </div>
  );
}