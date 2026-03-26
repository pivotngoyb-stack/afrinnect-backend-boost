import React, { useState, useEffect } from 'react';
import { getCurrentUser } from '@/lib/supabase-helpers';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { RefreshCw } from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import MarketplaceAdmin from '@/components/admin/MarketplaceAdmin';

export default function AdminMarketplace() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
          navigate(createPageUrl('Home'));
          return;
        }
        setIsAdmin(true);
      } catch (e) {
        navigate(createPageUrl('Home'));
      }
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
      <AdminSidebar activePage="AdminMarketplace" />
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-6 py-4">
          <div>
            <h1 className="text-xl font-bold text-white">Marketplace Management</h1>
            <p className="text-sm text-slate-400">Manage business directory listings</p>
          </div>
        </header>
        <div className="p-6">
          <MarketplaceAdmin />
        </div>
      </main>
    </div>
  );
}
