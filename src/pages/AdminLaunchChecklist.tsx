// @ts-nocheck
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Rocket, Mail, Shield, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default function AdminLaunchChecklist() {
  return (
    <div className="min-h-screen bg-slate-950 flex">
      <AdminSidebar />

      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-6 py-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Rocket className="text-purple-400" size={22} />
              Launch Checklist
            </h1>
            <p className="text-sm text-slate-400">Follow these steps when you are ready to go live</p>
          </div>
        </header>

        <div className="p-6 max-w-3xl space-y-6">
          <Card className="bg-slate-900 border-slate-800 border-l-4 border-l-amber-500">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <span className="bg-amber-500/20 text-amber-400 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                Remove Waitlist Restrictions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg flex gap-3">
                <AlertTriangle className="text-amber-400 shrink-0" />
                <div>
                  <p className="text-amber-300 text-sm font-medium">Action Required:</p>
                  <p className="text-amber-200/80 text-sm mt-1">
                    Tell the AI Agent:
                    <code className="bg-slate-800 px-2 py-1 rounded border border-amber-500/30 block mt-2 font-mono text-xs text-amber-300">
                      "Launch the app and remove waitlist restrictions."
                    </code>
                  </p>
                </div>
              </div>
              <p className="text-slate-400 text-sm pl-11">
                This will automatically revert the Landing page buttons to the signup flow and remove the blockers in the onboarding process.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800 border-l-4 border-l-purple-500">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <span className="bg-purple-500/20 text-purple-400 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                Notify Waitlist Members
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4 pl-2">
                <div className="bg-purple-500/20 p-2 rounded-lg shrink-0">
                  <Mail className="text-purple-400" size={24} />
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-white">Send the Launch Email</p>
                  <ol className="list-decimal list-inside text-sm text-slate-400 space-y-2">
                    <li>Go to your <strong className="text-white">Admin Dashboard</strong></li>
                    <li>Navigate to the <strong className="text-white">Broadcast</strong> page</li>
                    <li>Find the <strong className="text-white">Waitlist Invitations</strong> card</li>
                    <li>Click <strong className="text-white">Draft Launch Email</strong></li>
                    <li>Review and click <strong className="text-white">Send Emails</strong></li>
                  </ol>
                  <Link to="/adminbroadcast">
                    <Button size="sm" className="mt-2 bg-purple-600 hover:bg-purple-700">
                      Go to Broadcast
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800 border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <span className="bg-blue-500/20 text-blue-400 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">3</span>
                Post-Launch Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 pl-2">
                <div className="bg-slate-800 p-4 rounded-lg text-center space-y-2">
                  <div className="mx-auto w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="text-blue-400" size={20} />
                  </div>
                  <h3 className="font-medium text-white">User Growth</h3>
                  <p className="text-xs text-slate-400">Watch the "Users" tab for new signups</p>
                </div>
                <div className="bg-slate-800 p-4 rounded-lg text-center space-y-2">
                  <div className="mx-auto w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                    <Shield className="text-green-400" size={20} />
                  </div>
                  <h3 className="font-medium text-white">Safety</h3>
                  <p className="text-xs text-slate-400">Monitor "Moderation" for reports</p>
                </div>
                <div className="bg-slate-800 p-4 rounded-lg text-center space-y-2">
                  <div className="mx-auto w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                    <AlertTriangle className="text-red-400" size={20} />
                  </div>
                  <h3 className="font-medium text-white">Issues</h3>
                  <p className="text-xs text-slate-400">Check "Error Logs" for any bugs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
