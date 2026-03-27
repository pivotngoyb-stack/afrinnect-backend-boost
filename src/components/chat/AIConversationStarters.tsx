// @ts-nocheck
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, X, Loader2, Wand2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface AIConversationStartersProps {
  myProfile: any;
  otherProfile: any;
  matchId: string;
  onSelectQuestion: (question: string) => void;
  onClose: () => void;
}

export default function AIConversationStarters({ myProfile, otherProfile, matchId, onSelectQuestion, onClose }: AIConversationStartersProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const generateSuggestions = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('chat-suggestions', {
        body: { matchId, myProfile, otherProfile },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setSuggestions(data.suggestions || []);
    } catch (e: any) {
      toast({
        title: "Failed to generate suggestions",
        description: e.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-foreground/60 backdrop-blur-sm flex items-end md:items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="w-full max-w-2xl max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="bg-background">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wand2 size={24} className="text-primary" />
                <h3 className="text-xl font-bold">AI Conversation Starters</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X size={20} />
              </Button>
            </div>

            <p className="text-muted-foreground mb-4 text-sm">
              Get AI-powered personalized questions based on your profiles
            </p>

            {suggestions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles size={32} className="text-primary" />
                </div>
                <h4 className="text-lg font-bold mb-2">Get Smart Suggestions</h4>
                <p className="text-muted-foreground mb-6">
                  AI will analyze both profiles and suggest personalized conversation starters
                </p>
                <Button
                  onClick={generateSuggestions}
                  disabled={generating}
                  className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
                >
                  {generating ? (
                    <>
                      <Loader2 size={18} className="mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 size={18} className="mr-2" />
                      Generate Suggestions
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
                  <AnimatePresence>
                    {suggestions.map((question, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <Card 
                          className="hover:shadow-md transition-shadow cursor-pointer group border-primary/20"
                          onClick={() => {
                            onSelectQuestion(question);
                            onClose();
                          }}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-foreground group-hover:text-primary transition-colors">
                                {question}
                              </p>
                              <Send size={16} className="text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <Button
                  onClick={() => {
                    setSuggestions([]);
                    generateSuggestions();
                  }}
                  variant="outline"
                  className="w-full"
                  disabled={generating}
                >
                  <Sparkles size={16} className="mr-2" />
                  Generate New Suggestions
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
