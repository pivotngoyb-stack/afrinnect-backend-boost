// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw } from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import EventManagement from '@/components/admin/EventManagement';

export default function AdminEvents() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate('/'); return; }
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin');
        if (!roles?.length) { navigate('/home'); return; }
        setIsAdmin(true);
      } catch { navigate('/home'); }
      setLoading(false);
    };
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <AdminSidebar activePage="AdminEvents" />
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-6 py-4">
          <h1 className="text-xl font-bold text-white">Event Management</h1>
          <p className="text-sm text-slate-400">Create, edit, and manage events</p>
        </header>
        <div className="p-6">
          <EventManagement />
        </div>
      </main>
    </div>
  );
}
