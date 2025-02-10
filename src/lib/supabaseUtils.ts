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

export const getTopics = async (user: User) => {
    const { data: topics, error } = await supabase
        .from('topics')
        .select('*')
        .eq('user_id', user.id);

    if (error) {
        console.error('Error fetching topics:', error);
        throw error;
    }

    if (topics) {
        console.log('Topics:', topics);
        return topics;
    }

    return null;
}

export const createTopic = async (user: User, topicName: string) => {
    if (topicName === '') {
        throw new Error('Topic name cannot be empty');
    }
    const newTopic = {
        name: topicName,
        user_id: user.id,
    };

    const { data: topic, error } = await supabase
        .from('topics')
        .insert(newTopic)
        .select();

    if (error) {
        console.error('Error creating topic:', error);
        throw error;
    }

    if (topic) {
        console.log('Topic created:', topic);
        return topic;
    }

    return null;
}