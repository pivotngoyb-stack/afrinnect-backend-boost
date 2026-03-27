// @ts-nocheck
import React from 'react';
import { Sparkles } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function CompatibilityScore({ score, reasons }: { score: number; reasons?: string[] }) {
  const getColor = (s: number) => s >= 85 ? 'text-green-600' : s >= 70 ? 'text-primary' : 'text-accent';

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-accent/5">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-primary" />
            <span className="font-semibold text-sm text-foreground">Compatibility</span>
          </div>
          <span className={`text-2xl font-bold ${getColor(score)}`}>{score}%</span>
        </div>
        <Progress value={score} className="h-2 mb-3" />
        {reasons && reasons.length > 0 && (
          <div className="space-y-1">
            {reasons.slice(0, 3).map((reason, idx) => (
              <p key={idx} className="text-xs text-muted-foreground flex items-start gap-1">
                <span className="text-primary">•</span>
                {reason}
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
