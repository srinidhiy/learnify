import { createContext, useContext, useState, ReactNode } from 'react';

interface TopicsContextType {
  selectedTopicIds: string[];
  toggleTopic: (topicId: string) => void;
  clearTopics: () => void;
}

const TopicsContext = createContext<TopicsContextType>({
  selectedTopicIds: [],
  toggleTopic: () => {},
  clearTopics: () => {},
});

export function TopicsProvider({ children }: { children: ReactNode }) {
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);

  const toggleTopic = (topicId: string) => {
    setSelectedTopicIds(prev => 
      prev.includes(topicId) 
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  const clearTopics = () => setSelectedTopicIds([]);

  return (
    <TopicsContext.Provider value={{ selectedTopicIds, toggleTopic, clearTopics }}>
      {children}
    </TopicsContext.Provider>
  );
}

export const useTopics = () => useContext(TopicsContext); 