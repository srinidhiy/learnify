import { AppSidebar } from "./AppSidebar";
import { BottomBar } from "./BottomBar";
import { UploadModal } from "./UploadModal";

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex w-full bg-primary relative">
      <div className="fixed top-0 bottom-10 left-0">
        <AppSidebar />
      </div>
      <div className="flex-1 flex flex-col ml-[260px]">
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