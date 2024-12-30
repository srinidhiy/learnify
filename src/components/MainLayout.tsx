import { AppSidebar } from "./AppSidebar";
import { BottomBar } from "./BottomBar";
import { UploadModal } from "./UploadModal";

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex w-full bg-primary">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-6">
          <div className="flex justify-end mb-6">
            <UploadModal />
          </div>
          {children}
        </div>
        <BottomBar />
      </div>
    </div>
  );
}