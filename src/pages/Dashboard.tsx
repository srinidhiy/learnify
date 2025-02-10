import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from '@/integrations/supabase/client';
import { getUser } from "@/lib/supabaseUtils";
import { useEffect, useState } from "react";

const documents = [
  { id: 1, title: "Introduction to Neural Networks", topic: "Coding", dueDate: "Today" },
  { id: 2, title: "Market Economics Basics", topic: "Economics", dueDate: "Today" },
  { id: 3, title: "Color Theory Fundamentals", topic: "Design", dueDate: "Tomorrow" },
];


const Dashboard = () => {
  const [signedInUser, setSignedInUser] = useState(null);
  const { user } = useAuth();
  if (!user) return;

  useEffect(() => {
    const fetchUserProfile = async () => {
      setSignedInUser(await getUser(user));
    };
    fetchUserProfile();
  }, [user]);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {signedInUser?.full_name}</h1>
        <p className="text-muted-foreground mt-1">Here's what you need to review today.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map((doc) => (
          <Card key={doc.id} className="p-6 hover:bg-accent/5 cursor-pointer transition-colors">
            <h3 className="text-lg font-semibold mb-2">{doc.title}</h3>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">{doc.topic}</span>
              <span className="text-accent">{doc.dueDate}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;