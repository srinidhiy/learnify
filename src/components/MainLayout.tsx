
import { AppSidebar } from "./AppSidebar";
import { ApiKeyModal } from "./ApiKeyModal";

export const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex w-full bg-primary relative">
       <div className="fixed top-0 bottom-0 left-0">
         <AppSidebar />
       </div>
       <div className="flex-1 flex flex-col ml-[260px]">
         <div className="flex-1 p-6">
          {children}
        </div>
      </div>
    </div>
  );
};
