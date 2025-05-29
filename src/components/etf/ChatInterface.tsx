"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { SendIcon, Loader2, Trash2 } from "lucide-react";
import { createClient } from "@/supabase/client";
import { API_ENDPOINTS, UI_MESSAGES, CHAT_CONFIG } from "@/lib/constants";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isClearingHistory, setIsClearingHistory] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Load chat history on component mount
  useEffect(() => {
    const loadChatHistory = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        try {
          const { data, error } = await supabase
            .from("chat_history")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: true })
            .limit(CHAT_CONFIG.MAX_HISTORY_ITEMS);

          if (error) {
            // If table doesn't exist or other error, just show welcome message
            console.warn("Chat history not available:", error.message);
            setMessages([
              {
                id: "welcome",
                role: "assistant",
                content: UI_MESSAGES.WELCOME,
                timestamp: new Date(),
              },
            ]);
            return;
          }

          if (data && data.length > 0) {
            const formattedMessages: Message[] = [];

            data.forEach((item) => {
              // Add user message
              formattedMessages.push({
                id: `user-${item.id}`,
                role: "user",
                content: item.query,
                timestamp: new Date(item.created_at),
              });

              // Add assistant response
              formattedMessages.push({
                id: `assistant-${item.id}`,
                role: "assistant",
                content: item.response,
                timestamp: new Date(item.created_at),
              });
            });

            setMessages(formattedMessages);
          } else {
            // Add welcome message if no history
            setMessages([
              {
                id: "welcome",
                role: "assistant",
                content: UI_MESSAGES.WELCOME,
                timestamp: new Date(),
              },
            ]);
          }
        } catch (err) {
          // Handle any unexpected errors
          console.warn("Failed to load chat history:", err);
          setMessages([
            {
              id: "welcome",
              role: "assistant",
              content: UI_MESSAGES.WELCOME,
              timestamp: new Date(),
            },
          ]);
        }
      } else {
        // User not authenticated, show welcome message
        setMessages([
          {
            id: "welcome",
            role: "assistant",
            content: UI_MESSAGES.WELCOME,
            timestamp: new Date(),
          },
        ]);
      }
    };

    loadChatHistory();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Clear chat history function
  const handleClearHistory = async () => {
    setIsClearingHistory(true);
    setShowClearDialog(false);

    try {
      const response = await fetch(API_ENDPOINTS.CHAT_CLEAR, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to clear chat history");
      }

      // Clear local messages and show welcome message
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: UI_MESSAGES.WELCOME,
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error("Error clearing chat history:", error);
      alert("Failed to clear chat history. Please try again.");
    } finally {
      setIsClearingHistory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    const currentInput = input.trim();
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(API_ENDPOINTS.CHAT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: currentInput }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const assistantMessage: Message = {
        id: `response-${userMessage.id}`,
        role: "assistant",
        content:
          data.summary ||
          data.chatResponse ||
          "I'm sorry, I couldn't process your request.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);

      const errorMessage: Message = {
        id: `error-${userMessage.id}`,
        role: "assistant",
        content: `Sorry, there was an error processing your request: ${error instanceof Error ? error.message : "Unknown error"}`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="flex flex-col h-[600px] w-full">
      {/* Chat Header with Clear Button */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold">AI Investment Consultant</h3>
        <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={isClearingHistory || messages.length <= 1}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isClearingHistory ? "Clearing..." : "Clear History"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear Chat History</AlertDialogTitle>
              <AlertDialogDescription>
                {UI_MESSAGES.CLEAR_HISTORY_CONFIRM}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleClearHistory}
                className="bg-red-600 hover:bg-red-700"
              >
                Clear History
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
              <div className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg p-3 bg-muted">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{UI_MESSAGES.LOADING}</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-t p-4 flex items-center space-x-2"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about dividend ETFs, stocks, or investment strategies..."
          disabled={isLoading}
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
          <SendIcon className="h-4 w-4" />
        </Button>
      </form>
    </Card>
  );
}
