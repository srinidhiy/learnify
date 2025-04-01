
import { AppSidebar } from "./AppSidebar";
import { ApiKeyModal } from "./ApiKeyModal";

export const MainLayout = ({ children }) => {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 py-8 relative">
          <div className="absolute top-4 right-4">
            <ApiKeyModal />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};
