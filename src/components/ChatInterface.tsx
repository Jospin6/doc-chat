
import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';

interface Document {
  id: string;
  name: string;
  uploadedAt: string;
  size: number;
  status: 'processing' | 'ready' | 'error';
  chunksCount?: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: Array<{
    chunk: string;
    similarity: number;
  }>;
}

interface ChatInterfaceProps {
  document: Document;
}

export const ChatInterface = ({ document }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello! I'm ready to answer questions about "${document.name}". What would you like to know?`,
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        setTimeout(() => {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }, 100);
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Based on your document "${document.name}", here's what I found: This is a simulated response to your question "${userMessage.content}". In a real implementation, this would use RAG to search through your document embeddings and generate a contextual answer using GPT-4.`,
        timestamp: new Date().toISOString(),
        sources: [
          {
            chunk: "Relevant text chunk from your document would appear here",
            similarity: 0.89
          },
          {
            chunk: "Another relevant section that helped answer your question",
            similarity: 0.76
          }
        ]
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`flex max-w-[80%] space-x-2 ${
                  message.role === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'
                }`}
              >
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {message.role === 'user' ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>
                
                <div className="space-y-2">
                  <Card
                    className={`p-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-2">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </Card>
                  
                  {message.sources && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium">Sources:</p>
                      {message.sources.map((source, index) => (
                        <Card key={index} className="p-2 bg-secondary/50">
                          <p className="text-xs text-muted-foreground">
                            Similarity: {Math.round(source.similarity * 100)}%
                          </p>
                          <p className="text-sm mt-1">{source.chunk}</p>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex space-x-2 max-w-[80%]">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
                <Card className="p-3 bg-muted">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="flex space-x-2 pt-4 border-t">
        <Input
          placeholder="Ask a question about your document..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
        />
        <Button
          onClick={handleSendMessage}
          disabled={!inputValue.trim() || isLoading}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
