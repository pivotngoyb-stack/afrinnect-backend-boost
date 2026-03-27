import { useState } from 'react';
import { filterRecords, getCurrentUser, invokeFunction, isAuthenticated, logout } from '@/lib/supabase-helpers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, Loader2 } from 'lucide-react';

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

    // Test 1: Check if authenticated
    try {
      const isAuth = await isAuthenticated();
      testResults.isAuthenticated = { pass: isAuth, message: isAuth ? 'User is authenticated' : 'User not authenticated' };
    } catch (e: any) {
      testResults.isAuthenticated = { pass: false, message: e.message };
    }

    // Test 2: Get current user
    try {
      const user = await getCurrentUser();
      testResults.getCurrentUser = { pass: !!user, message: user ? `User: ${user.email}` : 'No user found' };
    } catch (e: any) {
      testResults.getCurrentUser = { pass: false, message: e.message };
    }

    // Test 3: Check profile exists
    try {
      const user = await getCurrentUser();
      if (user) {
        const profiles = await filterRecords('user_profiles', { user_id: user.id });
        testResults.profileExists = { pass: profiles.length > 0, message: profiles.length > 0 ? 'Profile found' : 'No profile' };
      }
    } catch (e: any) {
      testResults.profileExists = { pass: false, message: e.message };
    }

    // Test 4: Check legal acceptance
    try {
      const user = await getCurrentUser();
      if (user) {
        const acceptances = await filterRecords('legal_acceptances', { user_id: user.id });
        testResults.legalAcceptance = { pass: acceptances.length > 0, message: acceptances.length > 0 ? 'Legal terms accepted' : 'No acceptance' };
      }
    } catch (e: any) {
      testResults.legalAcceptance = { pass: false, message: e.message };
    }

    // Test 5: Test logout function exists
    try {
      testResults.logoutFunction = { pass: typeof base44.auth.logout === 'function', message: 'Logout function available' };
    } catch (e: any) {
      testResults.logoutFunction = { pass: false, message: e.message };
    }

    // Test 6: Test OTP backend
    try {
      const otpTest = await invokeFunction('sendOTP', { phone_number: '+15555555555' }).catch((e: any) => ({ error: e.message }));
      testResults.otpBackend = {
        pass: !(otpTest as any).error,
        message: (otpTest as any).error || 'OTP backend working'
      };
    } catch (e: any) {
      testResults.otpBackend = { pass: false, message: e.message };
    }

    // Test 7: Test rate limiting
    try {
      const rateLimitTest = await invokeFunction('rateLimitAuth', {
        action: 'login',
        identifier: 'test@test.com'
      }).catch((e: any) => ({ error: e.message }));
      testResults.rateLimit = {
        pass: !(rateLimitTest as any).error,
        message: (rateLimitTest as any).error || 'Rate limiting working'
      };
    } catch (e: any) {
      testResults.rateLimit = { pass: false, message: e.message };
    }

    // Test 8: Test password reset
    try {
      testResults.passwordReset = {
        pass: typeof (base44.auth as any).resetPassword === 'function',
        message: 'Password reset function available'
      };
    } catch (e: any) {
      testResults.passwordReset = { pass: false, message: e.message };
    }

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
            'Run Authentication Tests'
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
                <Badge variant={result.pass ? 'default' : 'destructive'}>
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
