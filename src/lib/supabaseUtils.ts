import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

export const getUser = async (user: User) => {
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error) {
        console.error('Error fetching profile:', error);
        throw error;
    }

    if (profile) {
        return profile;
    }

    return null;
};