import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { createChatChain } from '@/lib/createChatChain';

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
  selectedDocuments: Document[];
  userId: string;
}

export const ChatInterface = ({ selectedDocuments, userId }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [chatChain, setChatChain] = useState<any>(null);

  // Initialiser chatChain au montage
  useEffect(() => {
    const initChain = async () => {
      const chain = await createChatChain(userId, selectedDocuments.map(d => d.id));
      setChatChain(chain);

      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: `Salut ! Tu peux poser des questions sur tes documents sélectionnés.`,
          timestamp: new Date().toISOString(),
        },
      ]);
    };

    initChain();
  }, [userId, selectedDocuments]);

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
    if (!inputValue.trim() || isLoading || !chatChain) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const chatHistory = messages.map((msg) =>
        msg.role === 'user'
          ? new HumanMessage(msg.content)
          : new AIMessage(msg.content)
      );

      const response = await chatChain.invoke({
        input: inputValue,
        chat_history: chatHistory,
      });

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response.answer || 'Je n’ai pas trouvé de réponse pertinente.',
        timestamp: new Date().toISOString(),
        sources: (response.context || []).map((doc: any) => ({
          chunk: doc.pageContent,
          similarity: doc.similarity ?? 0.0,
        })),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Erreur pendant le chat:", err);
    } finally {
      setIsLoading(false);
    }
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
                  {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
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
                            Similarité: {Math.round(source.similarity * 100)}%
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
          placeholder="Ask a question about your documents..."
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
