import { Card, CardContent } from '@/components/ui/card';
import { Heart, Sparkles, Coffee, Music, Globe, BookOpen } from 'lucide-react';

const PROMPT_ICONS: Record<string, any> = {
  looking_for: Heart,
  simple_pleasure: Coffee,
  perfect_sunday: Sparkles,
  music_taste: Music,
  cultural_pride: Globe,
  book_rec: BookOpen,
};

const PROMPT_LABELS: Record<string, string> = {
  looking_for: "I'm looking for...",
  simple_pleasure: "My simple pleasure is...",
  perfect_sunday: "A perfect Sunday looks like...",
  music_taste: "My go-to artist right now is...",
  cultural_pride: "I'm most proud of my heritage because...",
  book_rec: "A book that changed my perspective...",
};

interface ProfilePromptsProps {
  prompts: Record<string, string>;
  editable?: boolean;
  onChange?: (key: string, value: string) => void;
}

export default function ProfilePrompts({ prompts, editable = false, onChange }: ProfilePromptsProps) {
  const filledPrompts = Object.entries(prompts || {}).filter(([, v]) => v && v.trim());

  if (!editable && filledPrompts.length === 0) return null;

  const promptKeys = Object.keys(PROMPT_LABELS);

  return (
    <div className="space-y-3">
      {(editable ? promptKeys : filledPrompts.map(([k]) => k)).map((key) => {
        const Icon = PROMPT_ICONS[key] || Sparkles;
        const label = PROMPT_LABELS[key] || key;
        const value = prompts?.[key] || '';

        return (
          <Card key={key} className="border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} className="text-primary" />
                <span className="text-sm font-semibold text-primary">{label}</span>
              </div>
              {editable ? (
                <textarea
                  value={value}
                  onChange={(e) => onChange?.(key, e.target.value)}
                  placeholder="Share something about yourself..."
                  maxLength={200}
                  rows={2}
                  className="w-full bg-transparent text-foreground text-sm resize-none focus:outline-none placeholder:text-muted-foreground/50"
                />
              ) : (
                <p className="text-sm text-foreground leading-relaxed">{value}</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export { PROMPT_LABELS };
