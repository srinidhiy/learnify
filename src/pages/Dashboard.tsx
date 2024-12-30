import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-mindmosaic-800">Welcome back!</h1>
        <Button className="bg-mindmosaic-600 hover:bg-mindmosaic-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Subject
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6 hover:animate-card-hover cursor-pointer">
          <h3 className="text-xl font-semibold mb-2">Due for Review</h3>
          <p className="text-3xl font-bold text-mindmosaic-600">12</p>
          <p className="text-sm text-gray-500">flashcards</p>
        </Card>
        
        <Card className="p-6 hover:animate-card-hover cursor-pointer">
          <h3 className="text-xl font-semibold mb-2">Saved Links</h3>
          <p className="text-3xl font-bold text-mindmosaic-600">24</p>
          <p className="text-sm text-gray-500">articles & resources</p>
        </Card>
        
        <Card className="p-6 hover:animate-card-hover cursor-pointer">
          <h3 className="text-xl font-semibold mb-2">Active Subjects</h3>
          <p className="text-3xl font-bold text-mindmosaic-600">5</p>
          <p className="text-sm text-gray-500">learning tracks</p>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Recent Activity</h2>
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-mindmosaic-50 rounded-lg">
              <div>
                <p className="font-medium">Added new flashcards</p>
                <p className="text-sm text-gray-500">Mathematics - Calculus</p>
              </div>
              <span className="text-sm text-gray-500">2 hours ago</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-mindmosaic-50 rounded-lg">
              <div>
                <p className="font-medium">Saved article</p>
                <p className="text-sm text-gray-500">Introduction to Neural Networks</p>
              </div>
              <span className="text-sm text-gray-500">5 hours ago</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}