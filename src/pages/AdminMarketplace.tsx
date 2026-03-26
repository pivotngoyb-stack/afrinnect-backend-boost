// @ts-nocheck
import React from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import MarketplaceAdmin from '@/components/admin/MarketplaceAdmin';

export default function AdminMarketplace() {
  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar activePage="AdminMarketplace" />
      <main className="flex-1 p-6 overflow-auto">
        <MarketplaceAdmin />
      </main>
    </div>
  );
}
