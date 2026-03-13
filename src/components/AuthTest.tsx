import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Loader2 } from "lucide-react";

interface TestResult {
  pass: boolean;
  message: string;
}

export default function AuthTest() {
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [testing, setTesting] = useState(false);

  const runTests = async () => {
    setTesting(true);
    const testResults: Record<string, TestResult> = {};

    // TODO: Replace all base44 calls with Supabase client once Cloud is enabled

    testResults.isAuthenticated = {
      pass: false,
      message: "Auth not yet connected to backend",
    };

    testResults.getCurrentUser = {
      pass: false,
      message: "Auth not yet connected to backend",
    };

    testResults.profileExists = {
      pass: false,
      message: "Profile check not yet connected to backend",
    };

    testResults.legalAcceptance = {
      pass: false,
      message: "Legal acceptance not yet connected to backend",
    };

    testResults.logoutFunction = {
      pass: false,
      message: "Logout not yet connected to backend",
    };

    testResults.otpBackend = {
      pass: false,
      message: "OTP not yet connected to backend",
    };

    testResults.rateLimit = {
      pass: false,
      message: "Rate limiting not yet connected to backend",
    };

    testResults.passwordReset = {
      pass: false,
      message: "Password reset not yet connected to backend",
    };

    setResults(testResults);
    setTesting(false);
  };

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>🔐 Auth System Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runTests} disabled={testing} className="w-full">
          {testing ? (
            <>
              <Loader2 className="animate-spin mr-2" size={18} />
              Running Tests...
            </>
          ) : (
            "Run Authentication Tests"
          )}
        </Button>

        {Object.keys(results).length > 0 && (
          <div className="space-y-2 mt-4">
            {Object.entries(results).map(([test, result]) => (
              <div key={test} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium text-sm">{test}</p>
                  <p className="text-xs text-muted-foreground">{result.message}</p>
                </div>
                <Badge variant={result.pass ? "default" : "destructive"}>
                  {result.pass ? <Check size={14} /> : <X size={14} />}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
