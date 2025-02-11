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


export const getDocuments = async (user: User) => {
    const { data: documents, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id);

    if (error) {
        console.error('Error fetching documents:', error);
        throw error;
    }

    if (documents) {
        console.log('Documents:', documents);
        return documents;
    }

    return null;
}

export const createDocument = async (user: User, documentData: any) => {
    if (!documentData.topic || documentData.topic === '') {
        throw new Error('Document must have a topic');
    }
    try {
        new URL(documentData.document_url);
    } catch (error) {
        throw new Error('Invalid URL');
    }

    // create topic if it doesn't exist, otherwise get the topic id
    const parsedTopic = documentData.topic;
    let topicId = null;
    const { data: existingTopic, error: topicError } = await supabase
        .from('topics')
        .select('id')
        .eq('name', parsedTopic)
        .eq('user_id', user.id)
        .single();
    if (topicError) {
        if (topicError && topicError.code === 'PGRST116') {
            const { data: newTopic, error: createTopicError } = await supabase
                .from('topics')
                .insert({ name: parsedTopic, user_id: user.id })
                .select()
                .single();

            if (createTopicError) {
                console.error('Error creating topic:', createTopicError);
                throw createTopicError;
            }

            topicId = newTopic.id;
        } else if (existingTopic) {
            topicId = existingTopic.id;
        } else {
            console.error('Error fetching topic:', topicError);
            throw topicError;
        }
    }
    topicId = existingTopic.id;
    
    const { topic, ...restDocumentData } = documentData;
    const newDocument = {
        ...restDocumentData,
        title: "",
        user_id: user.id,
        topic_id: topicId,
        status: 'unread',
    };

    console.log('New document:', newDocument);

    const { data: document, error } = await supabase
        .from('documents')
        .insert(newDocument)
        .select();

    if (error) {
        console.error('Error creating document:', error);
        throw error;
    }

    if (document) {
        console.log('Document created:', document);
        return document;
    }

    return null;
}