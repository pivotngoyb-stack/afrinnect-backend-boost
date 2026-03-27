// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { createRecord, filterRecords, updateRecord } from '@/lib/supabase-helpers';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings, Globe, Bell, Shield, DollarSign } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from '@/hooks/use-toast';

export default function SystemSettings() {
  const [settings, setSettings] = useState({
    // Platform Settings
    platformName: 'Afrinnect',
    maintenanceMode: false,
    newUserRegistration: true,
    emailVerificationRequired: true,
    
    // Limits
    freeDailyLikes: 10,
    premiumDailyLikes: 999,
    maxProfilePhotos: 6,
    maxBio: 500,
    
    // Safety
    autoModerationEnabled: true,
    manualReviewRequired: false,
    minAgeRequirement: 18,
    maxAgeAllowed: 100,
    
    // Pricing
    regionalPricingEnabled: true,
    africanDiscount: 50,
    
    // Features
    storiesEnabled: true,
    eventsEnabled: true,
    communitiesEnabled: true,
    videoCallsEnabled: true,
    virtualGiftsEnabled: true,
    isLive: false
  });

  useEffect(() => {
    const fetchSettings = async () => {
      // Use list to debug if filter is failing, but filter should work
      const records = await filterRecords('system_settings', { key: 'launch_configuration' });
      if (records.length > 0) {
        setSettings(prev => ({ ...prev, isLive: records[0].value.is_live }));
      } else {
        // Create default if missing
        try {
          await createRecord('system_settings', {
            key: 'launch_configuration',
            value: { is_live: false },
            description: 'Launch configuration'
          });
        } catch (e) {
          console.error("Failed to init settings", e);
        }
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      // Save launch configuration
      const records = await filterRecords('system_settings', { key: 'launch_configuration' });
      if (records.length > 0) {
        await updateRecord('system_settings', records[0].id, {
          value: { is_live: settings.isLive }
        });
      } else {
        await createRecord('system_settings', {
          key: 'launch_configuration',
          value: { is_live: settings.isLive },
          description: 'Launch configuration'
        });
      }
      toast({ title: 'Settings saved successfully!' });
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({ title: 'Failed to save settings', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">System Settings</h2>
        <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
          Save All Changes
        </Button>
      </div>

      <Tabs defaultValue="platform" className="w-full">
        <TabsList className="bg-card/10">
          <TabsTrigger value="platform">Platform</TabsTrigger>
          <TabsTrigger value="limits">Limits</TabsTrigger>
          <TabsTrigger value="safety">Safety</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
        </TabsList>

        <TabsContent value="platform" className="space-y-4">
          <Card className="bg-card/5 border-card/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Globe size={20} />
                Platform Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Platform Name</Label>
                <Input
                  value={settings.platformName}
                  onChange={(e) => setSettings({...settings, platformName: e.target.value})}
                  className="bg-card/10 border-card/20 text-white"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-purple-500/20 rounded-lg border border-purple-500/50">
                <div>
                  <Label className="text-white text-lg font-bold">GO LIVE / LAUNCH MODE</Label>
                  <p className="text-sm text-muted-foreground">
                    {settings.isLive 
                      ? "APP IS LIVE! Users can access normally." 
                      : "MAINTENANCE MODE. Users are redirected to Waitlist."}
                  </p>
                </div>
                <Switch
                  checked={settings.isLive}
                  onCheckedChange={(checked) => setSettings({...settings, isLive: checked})}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-muted-foreground">Maintenance Mode (Legacy)</Label>
                  <p className="text-sm text-muted-foreground">Disable all user access</p>
                </div>
                <Switch
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => setSettings({...settings, maintenanceMode: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-muted-foreground">New User Registration</Label>
                  <p className="text-sm text-muted-foreground">Allow new users to sign up</p>
                </div>
                <Switch
                  checked={settings.newUserRegistration}
                  onCheckedChange={(checked) => setSettings({...settings, newUserRegistration: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-muted-foreground">Email Verification Required</Label>
                  <p className="text-sm text-muted-foreground">Users must verify email</p>
                </div>
                <Switch
                  checked={settings.emailVerificationRequired}
                  onCheckedChange={(checked) => setSettings({...settings, emailVerificationRequired: checked})}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="limits" className="space-y-4">
          <Card className="bg-card/5 border-card/10">
            <CardHeader>
              <CardTitle className="text-white">User Limits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Free Daily Likes</Label>
                <Input
                  type="number"
                  value={settings.freeDailyLikes}
                  onChange={(e) => setSettings({...settings, freeDailyLikes: parseInt(e.target.value)})}
                  className="bg-card/10 border-card/20 text-white"
                />
              </div>

              <div>
                <Label className="text-muted-foreground">Premium Daily Likes</Label>
                <Input
                  type="number"
                  value={settings.premiumDailyLikes}
                  onChange={(e) => setSettings({...settings, premiumDailyLikes: parseInt(e.target.value)})}
                  className="bg-card/10 border-card/20 text-white"
                />
              </div>

              <div>
                <Label className="text-muted-foreground">Max Profile Photos</Label>
                <Input
                  type="number"
                  value={settings.maxProfilePhotos}
                  onChange={(e) => setSettings({...settings, maxProfilePhotos: parseInt(e.target.value)})}
                  className="bg-card/10 border-card/20 text-white"
                />
              </div>

              <div>
                <Label className="text-muted-foreground">Max Bio Characters</Label>
                <Input
                  type="number"
                  value={settings.maxBio}
                  onChange={(e) => setSettings({...settings, maxBio: parseInt(e.target.value)})}
                  className="bg-card/10 border-card/20 text-white"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="safety" className="space-y-4">
          <Card className="bg-card/5 border-card/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield size={20} />
                Safety Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-muted-foreground">Auto Moderation</Label>
                  <p className="text-sm text-muted-foreground">AI-powered content moderation</p>
                </div>
                <Switch
                  checked={settings.autoModerationEnabled}
                  onCheckedChange={(checked) => setSettings({...settings, autoModerationEnabled: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-muted-foreground">Manual Review Required</Label>
                  <p className="text-sm text-muted-foreground">All photos need admin approval</p>
                </div>
                <Switch
                  checked={settings.manualReviewRequired}
                  onCheckedChange={(checked) => setSettings({...settings, manualReviewRequired: checked})}
                />
              </div>

              <div>
                <Label className="text-muted-foreground">Minimum Age Requirement</Label>
                <Input
                  type="number"
                  value={settings.minAgeRequirement}
                  onChange={(e) => setSettings({...settings, minAgeRequirement: parseInt(e.target.value)})}
                  className="bg-card/10 border-card/20 text-white"
                />
              </div>

              <div>
                <Label className="text-muted-foreground">Maximum Age Allowed</Label>
                <Input
                  type="number"
                  value={settings.maxAgeAllowed}
                  onChange={(e) => setSettings({...settings, maxAgeAllowed: parseInt(e.target.value)})}
                  className="bg-card/10 border-card/20 text-white"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <Card className="bg-card/5 border-card/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <DollarSign size={20} />
                Pricing Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-muted-foreground">Regional Pricing</Label>
                  <p className="text-sm text-muted-foreground">Offer discounts by region</p>
                </div>
                <Switch
                  checked={settings.regionalPricingEnabled}
                  onCheckedChange={(checked) => setSettings({...settings, regionalPricingEnabled: checked})}
                />
              </div>

              <div>
                <Label className="text-muted-foreground">African Countries Discount (%)</Label>
                <Input
                  type="number"
                  value={settings.africanDiscount}
                  onChange={(e) => setSettings({...settings, africanDiscount: parseInt(e.target.value)})}
                  className="bg-card/10 border-card/20 text-white"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <Card className="bg-card/5 border-card/10">
            <CardHeader>
              <CardTitle className="text-white">Feature Toggles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'storiesEnabled', label: 'Stories', desc: 'Allow users to post stories' },
                { key: 'eventsEnabled', label: 'Events', desc: 'Community events feature' },
                { key: 'communitiesEnabled', label: 'Communities', desc: 'User communities' },
                { key: 'videoCallsEnabled', label: 'Video Calls', desc: 'In-app video calling' },
                { key: 'virtualGiftsEnabled', label: 'Virtual Gifts', desc: 'Send virtual gifts' }
              ].map(feature => (
                <div key={feature.key} className="flex items-center justify-between">
                  <div>
                    <Label className="text-muted-foreground">{feature.label}</Label>
                    <p className="text-sm text-muted-foreground">{feature.desc}</p>
                  </div>
                  <Switch
                    checked={settings[feature.key]}
                    onCheckedChange={(checked) => setSettings({...settings, [feature.key]: checked})}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}