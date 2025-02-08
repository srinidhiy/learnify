import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const AuthPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        navigate("/");
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-primary p-4">
      <div className="w-full max-w-md bg-secondary p-8 rounded-lg shadow-lg">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-foreground">Welcome Back</h2>
          <p className="mt-2 text-muted">Sign in to continue learning</p>
        </div>
        <Auth
          supabaseClient={supabase}
          providers={["google", "github", "apple"]}
          redirectTo={window.location.origin}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#7E69AB',
                  brandAccent: '#403E43',
                  inputBackground: '#1A1F2C',
                  inputText: '#ffffff',
                  inputPlaceholder: '#8E9196',
                }
              }
            },
            className: {
              container: 'w-full',
              button: 'w-full',
              input: 'w-full',
            }
          }}
          view="sign_in"
          showLinks={true}
        />
      </div>
    </div>
  );
};

export default AuthPage;
