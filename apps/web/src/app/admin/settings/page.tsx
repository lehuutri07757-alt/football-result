'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Wallet,
  Bell,
  Globe,
  Save,
  Loader2,
  Trash2,
  RefreshCw,
  Database,
  Plus,
  Edit,
  Power,
  RotateCcw,
  AlertTriangle,
  Activity,
  X,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { settingsService } from '@/services/settings.service';
import { 
  DataProvider, 
  DataProviderStatus, 
  DataProviderType, 
  PROVIDER_STATUS_COLORS, 
  PROVIDER_STATUS_LABELS,
  PROVIDER_TYPE_LABELS,
  CreateDataProviderPayload
} from '@/types/data-provider';

type SettingSectionId = 'security' | 'payment' | 'notification' | 'system' | 'providers';

interface SettingSection {
  id: SettingSectionId;
  title: string;
  icon: React.ElementType;
  description: string;
}

const sections: SettingSection[] = [
  { 
    id: 'security', 
    title: 'Security', 
    icon: Shield,
    description: 'Manage security protocols, authentication, and access controls.'
  },
  { 
    id: 'payment', 
    title: 'Payments', 
    icon: Wallet,
    description: 'Configure deposit/withdrawal limits, fees, and currency settings.'
  },
  { 
    id: 'notification', 
    title: 'Notifications', 
    icon: Bell,
    description: 'Setup email alerts, push notifications, and system messages.'
  },
  { 
    id: 'providers', 
    title: 'Data Providers', 
    icon: Database,
    description: 'Manage external data providers and API keys.'
  },
  { 
    id: 'system', 
    title: 'System', 
    icon: Globe,
    description: 'General system configuration, maintenance mode, and feature toggles.'
  },
];

export default function AdminSettingsPage() {
  const { theme } = useAdminTheme();
  const isDark = theme === 'dark';
  
  const [activeSection, setActiveSection] = useState<SettingSectionId>('security');
  const [saving, setSaving] = useState(false);

  const [providers, setProviders] = useState<DataProvider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [isProviderDialogOpen, setIsProviderDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<DataProvider | null>(null);
  const [providerForm, setProviderForm] = useState<Partial<CreateDataProviderPayload>>({
    code: '',
    name: '',
    description: '',
    baseUrl: '',
    apiKey: '',
    types: [],
    headers: {},
    priority: 0,
    dailyLimit: 0,
    monthlyLimit: 0,
    status: DataProviderStatus.ACTIVE
  });
  const [headersJson, setHeadersJson] = useState('{}');

  const fetchProviders = useCallback(async () => {
    setLoadingProviders(true);
    try {
      const data = await settingsService.getDataProviders();
      setProviders(data);
    } catch (error) {
      toast.error('Failed to load data providers');
    } finally {
      setLoadingProviders(false);
    }
  }, []);

  useEffect(() => {
    if (activeSection === 'providers') {
      fetchProviders();
    }
  }, [activeSection, fetchProviders]);

  const handleToggleProviderStatus = async (id: string, currentStatus: DataProviderStatus) => {
    try {
      const newStatus = currentStatus === DataProviderStatus.ACTIVE ? 'inactive' : 'active';
      await settingsService.toggleProviderStatus(id, newStatus);
      toast.success(`Provider ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      fetchProviders();
    } catch (error) {
      toast.error('Failed to update provider status');
    }
  };

  const handleDeleteProvider = async (id: string) => {
    if (!confirm('Are you sure you want to delete this provider?')) return;
    try {
      await settingsService.deleteDataProvider(id);
      toast.success('Provider deleted successfully');
      fetchProviders();
    } catch (error) {
      toast.error('Failed to delete provider');
    }
  };

  const handleProviderSubmit = async () => {
    try {
      if (!providerForm.name || !providerForm.baseUrl || !providerForm.code) {
        toast.error('Please fill in all required fields');
        return;
      }

      let parsedHeaders = {};
      try {
        parsedHeaders = JSON.parse(headersJson);
      } catch (e) {
        toast.error('Invalid JSON in Headers field');
        return;
      }

      const payload: any = {
        ...providerForm,
        headers: parsedHeaders,
        priority: Number(providerForm.priority),
        dailyLimit: Number(providerForm.dailyLimit),
        monthlyLimit: Number(providerForm.monthlyLimit),
      };

      if (editingProvider) {
        await settingsService.updateDataProvider(editingProvider.id, payload);
        toast.success('Provider updated successfully');
      } else {
        await settingsService.createDataProvider(payload);
        toast.success('Provider created successfully');
      }
      setIsProviderDialogOpen(false);
      fetchProviders();
    } catch (error) {
      toast.error(editingProvider ? 'Failed to update provider' : 'Failed to create provider');
    }
  };

  const openCreateDialog = () => {
    setEditingProvider(null);
    setProviderForm({
      code: '',
      name: '',
      description: '',
      baseUrl: '',
      apiKey: '',
      types: [],
      headers: {},
      priority: 0,
      dailyLimit: 0,
      monthlyLimit: 0,
      status: DataProviderStatus.ACTIVE
    });
    setHeadersJson('{}');
    setIsProviderDialogOpen(true);
  };

  const openEditDialog = (provider: DataProvider) => {
    setEditingProvider(provider);
    setProviderForm({
      ...provider,
      headers: provider.headers || {},
    });
    setHeadersJson(JSON.stringify(provider.headers || {}, null, 2));
    setIsProviderDialogOpen(true);
  };

  const toggleProviderType = (type: DataProviderType) => {
    const currentTypes = providerForm.types || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];
    setProviderForm({ ...providerForm, types: newTypes });
  };





  const [settings, setSettings] = useState({
    twoFactorEnabled: true,
    loginNotification: false,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    minDeposit: 5,
    maxDeposit: 50000,
    minWithdrawal: 10,
    maxWithdrawal: 25000,
    withdrawalFeePercent: 0,
    withdrawalFeeFixed: 0,
    minBet: 1,
    maxBet: 10000,
    newBetNotification: true,
    largeTransactionAlert: true,
    largeTransactionThreshold: 10000,
    suspiciousActivityAlert: true,
    dailyReportEmail: true,
    maintenanceMode: false,
    registrationEnabled: true,
    bettingEnabled: true,
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof typeof settings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={cn("text-3xl font-bold tracking-tight", isDark ? "text-white" : "text-slate-900")}>
            Settings
          </h1>
          <p className={cn("text-muted-foreground mt-1")}>
            Manage your platform preferences and system configurations.
          </p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="w-full sm:w-auto min-w-[140px]"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-1/4 xl:w-1/5 space-y-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                "w-full flex items-start gap-3 p-3 rounded-xl transition-all text-left group",
                activeSection === section.id
                  ? isDark 
                    ? "bg-slate-800 text-white shadow-sm ring-1 ring-slate-700" 
                    : "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                  : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "p-2 rounded-lg transition-colors",
                activeSection === section.id
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
              )}>
                <section.icon size={18} />
              </div>
              <div className="space-y-0.5">
                <span className="font-medium text-sm block">
                  {section.title}
                </span>
                <span className="text-xs text-muted-foreground line-clamp-1">
                  {section.description}
                </span>
              </div>
            </button>
          ))}
        </aside>

        <div className="flex-1 space-y-6">
          {activeSection === 'security' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Authentication Security</CardTitle>
                  <CardDescription>Configure how administrators access the system.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                      <Label className="text-base">Two-Factor Authentication (2FA)</Label>
                      <p className="text-sm text-muted-foreground">
                        Require 2FA for all admin account logins.
                      </p>
                    </div>
                    <Switch
                      checked={settings.twoFactorEnabled}
                      onCheckedChange={(checked) => updateSetting('twoFactorEnabled', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                      <Label className="text-base">Login Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Send email alerts for new device logins.
                      </p>
                    </div>
                    <Switch
                      checked={settings.loginNotification}
                      onCheckedChange={(checked) => updateSetting('loginNotification', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Session Management</CardTitle>
                  <CardDescription>Control session duration and lockout policies.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Session Timeout (minutes)</Label>
                      <Input
                        type="number"
                        value={settings.sessionTimeout}
                        onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value))}
                        min={5}
                        max={1440}
                      />
                      <p className="text-xs text-muted-foreground">Auto-logout after inactivity.</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Max Login Attempts</Label>
                      <Input
                        type="number"
                        value={settings.maxLoginAttempts}
                        onChange={(e) => updateSetting('maxLoginAttempts', parseInt(e.target.value))}
                        min={3}
                        max={10}
                      />
                      <p className="text-xs text-muted-foreground">Lock account after failed tries.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'payment' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Transaction Limits</CardTitle>
                  <CardDescription>Set global limits for deposits and withdrawals.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Min Deposit (USD)</Label>
                    <Input
                      type="number"
                      value={settings.minDeposit}
                      onChange={(e) => updateSetting('minDeposit', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Deposit (USD)</Label>
                    <Input
                      type="number"
                      value={settings.maxDeposit}
                      onChange={(e) => updateSetting('maxDeposit', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Min Withdrawal (USD)</Label>
                    <Input
                      type="number"
                      value={settings.minWithdrawal}
                      onChange={(e) => updateSetting('minWithdrawal', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Withdrawal (USD)</Label>
                    <Input
                      type="number"
                      value={settings.maxWithdrawal}
                      onChange={(e) => updateSetting('maxWithdrawal', parseInt(e.target.value))}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Fees & Betting Limits</CardTitle>
                  <CardDescription>Configure transaction fees and betting constraints.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Withdrawal Fee (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={settings.withdrawalFeePercent}
                      onChange={(e) => updateSetting('withdrawalFeePercent', parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fixed Fee (USD)</Label>
                    <Input
                      type="number"
                      value={settings.withdrawalFeeFixed}
                      onChange={(e) => updateSetting('withdrawalFeeFixed', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Min Bet (USD)</Label>
                    <Input
                      type="number"
                      value={settings.minBet}
                      onChange={(e) => updateSetting('minBet', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Bet (USD)</Label>
                    <Input
                      type="number"
                      value={settings.maxBet}
                      onChange={(e) => updateSetting('maxBet', parseInt(e.target.value))}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'notification' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Alerts</CardTitle>
                  <CardDescription>Manage real-time notifications and alerts.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                      <Label className="text-base">New Bet Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Notify admins when a new bet is placed.
                      </p>
                    </div>
                    <Switch
                      checked={settings.newBetNotification}
                      onCheckedChange={(checked) => updateSetting('newBetNotification', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                      <Label className="text-base">Suspicious Activity</Label>
                      <p className="text-sm text-muted-foreground">
                        Alert on unusual user behavior or login patterns.
                      </p>
                    </div>
                    <Switch
                      checked={settings.suspiciousActivityAlert}
                      onCheckedChange={(checked) => updateSetting('suspiciousActivityAlert', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                      <Label className="text-base">Daily Reports</Label>
                      <p className="text-sm text-muted-foreground">
                        Email daily summary of system performance.
                      </p>
                    </div>
                    <Switch
                      checked={settings.dailyReportEmail}
                      onCheckedChange={(checked) => updateSetting('dailyReportEmail', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Transaction Alerts</CardTitle>
                  <CardDescription>Configure alerts for financial movements.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                      <Label className="text-base">Large Transaction Alert</Label>
                      <p className="text-sm text-muted-foreground">
                        Notify when deposit/withdrawal exceeds threshold.
                      </p>
                    </div>
                    <Switch
                      checked={settings.largeTransactionAlert}
                      onCheckedChange={(checked) => updateSetting('largeTransactionAlert', checked)}
                    />
                  </div>
                  
                  {settings.largeTransactionAlert && (
                    <div className="space-y-2 pt-4 border-t">
                      <Label>Threshold Amount (USD)</Label>
                      <Input
                        type="number"
                        value={settings.largeTransactionThreshold}
                        onChange={(e) => updateSetting('largeTransactionThreshold', parseInt(e.target.value))}
                      />
                      <p className="text-xs text-muted-foreground">Current: {formatCurrency(settings.largeTransactionThreshold)}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'providers' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-medium">Data Providers</h2>
                  <p className="text-sm text-muted-foreground">Manage external data sources and API connections.</p>
                </div>
                <Button onClick={openCreateDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Provider
                </Button>
              </div>

              {loadingProviders ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid gap-6">
                  {providers.map((provider) => (
                    <Card key={provider.id}>
                      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base font-semibold">
                              {provider.name}
                            </CardTitle>
                            <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium border", PROVIDER_STATUS_COLORS[provider.status])}>
                              {PROVIDER_STATUS_LABELS[provider.status]}
                            </span>
                          </div>
                          <CardDescription>{provider.description || 'No description'}</CardDescription>
                          <div className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded w-fit mt-1">
                            {provider.code}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={provider.status === DataProviderStatus.ACTIVE}
                            onCheckedChange={() => handleToggleProviderStatus(provider.id, provider.status)}
                          />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Health Score</span>
                            <span className={cn("font-medium", provider.healthScore > 80 ? "text-green-600" : provider.healthScore > 50 ? "text-yellow-600" : "text-red-600")}>
                              {provider.healthScore}%
                            </span>
                          </div>
                          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                            <div 
                              className={cn("h-full transition-all", provider.healthScore > 80 ? "bg-green-500" : provider.healthScore > 50 ? "bg-yellow-500" : "bg-red-500")}
                              style={{ width: `${provider.healthScore}%` }}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="space-y-1">
                            <p className="text-muted-foreground text-xs">Daily Usage</p>
                            <div className="font-medium">
                              {provider.dailyUsage.toLocaleString()} / {provider.dailyLimit ? provider.dailyLimit.toLocaleString() : '∞'}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-muted-foreground text-xs">Monthly Usage</p>
                            <div className="font-medium">
                              {provider.monthlyUsage.toLocaleString()} / {provider.monthlyLimit ? provider.monthlyLimit.toLocaleString() : '∞'}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {provider.types.map(type => (
                            <span key={type} className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold text-foreground">
                              {PROVIDER_TYPE_LABELS[type]}
                            </span>
                          ))}
                        </div>
                        
                        {(provider.lastSyncAt || provider.lastError) && (
                          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                            {provider.lastError ? (
                              <>
                                <AlertTriangle className="h-3 w-3 text-red-500 mt-0.5" />
                                <span className="text-red-500">Error: {provider.lastError}</span>
                              </>
                            ) : (
                              <>
                                <Activity className="h-3 w-3 mt-0.5" />
                                <span>Last sync: {new Date(provider.lastSyncAt!).toLocaleString()}</span>
                              </>
                            )}
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="flex justify-end gap-2 border-t pt-4">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(provider)}>
                          <Edit className="mr-2 h-3 w-3" />
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteProvider(provider.id)}>
                          <Trash2 className="mr-2 h-3 w-3" />
                          Delete
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                  
                  {providers.length === 0 && (
                    <div className="text-center py-12 border rounded-lg border-dashed text-muted-foreground">
                      No data providers configured. Add one to get started.
                    </div>
                  )}
                </div>
              )}

              {/* Modal */}
              {isProviderDialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                  <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
                    <div className="flex items-center justify-between p-6 border-b">
                      <h3 className="text-lg font-semibold leading-none tracking-tight">
                        {editingProvider ? 'Edit Provider' : 'Add New Provider'}
                      </h3>
                      <Button variant="ghost" size="icon" onClick={() => setIsProviderDialogOpen(false)} className="h-8 w-8 rounded-full">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Provider Code</Label>
                          <Input 
                            value={providerForm.code} 
                            onChange={e => setProviderForm({...providerForm, code: e.target.value})}
                            disabled={!!editingProvider}
                            placeholder="e.g. SPORT_API"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Name</Label>
                          <Input 
                            value={providerForm.name} 
                            onChange={e => setProviderForm({...providerForm, name: e.target.value})}
                            placeholder="Display Name"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Base URL</Label>
                        <Input 
                          value={providerForm.baseUrl} 
                          onChange={e => setProviderForm({...providerForm, baseUrl: e.target.value})}
                          placeholder="https://api.example.com/v1"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Description</Label>
                        <textarea 
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={providerForm.description || ''}
                          onChange={e => setProviderForm({...providerForm, description: e.target.value})}
                          placeholder="Provider description..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>API Key</Label>
                        <Input 
                          type="password"
                          value={providerForm.apiKey || ''} 
                          onChange={e => setProviderForm({...providerForm, apiKey: e.target.value})}
                          placeholder="Secret API Key"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Data Types</Label>
                        <div className="flex flex-wrap gap-2 pt-2">
                          {Object.values(DataProviderType).map(type => (
                            <button
                              key={type}
                              onClick={() => toggleProviderType(type)}
                              className={cn(
                                "inline-flex items-center rounded-md border px-3 py-1 text-sm transition-colors",
                                providerForm.types?.includes(type)
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-background hover:bg-muted"
                              )}
                            >
                              {providerForm.types?.includes(type) && <Check className="mr-2 h-3 w-3" />}
                              {PROVIDER_TYPE_LABELS[type]}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Priority (0-100)</Label>
                          <Input 
                            type="number"
                            value={providerForm.priority} 
                            onChange={e => setProviderForm({...providerForm, priority: Number(e.target.value)})}
                            min={0}
                            max={100}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Daily Limit</Label>
                          <Input 
                            type="number"
                            value={providerForm.dailyLimit} 
                            onChange={e => setProviderForm({...providerForm, dailyLimit: Number(e.target.value)})}
                            placeholder="0 for unlimited"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Monthly Limit</Label>
                          <Input 
                            type="number"
                            value={providerForm.monthlyLimit} 
                            onChange={e => setProviderForm({...providerForm, monthlyLimit: Number(e.target.value)})}
                            placeholder="0 for unlimited"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Headers (JSON)</Label>
                        <textarea 
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                          value={headersJson}
                          onChange={e => setHeadersJson(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="p-6 border-t flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsProviderDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleProviderSubmit}>
                        {editingProvider ? 'Update Provider' : 'Create Provider'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeSection === 'system' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Feature Toggles</CardTitle>
                  <CardDescription>Enable or disable core system features.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                      <Label className="text-base">User Registration</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow new users to create accounts.
                      </p>
                    </div>
                    <Switch
                      checked={settings.registrationEnabled}
                      onCheckedChange={(checked) => updateSetting('registrationEnabled', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                      <Label className="text-base">Betting System</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable betting functionality globally.
                      </p>
                    </div>
                    <Switch
                      checked={settings.bettingEnabled}
                      onCheckedChange={(checked) => updateSetting('bettingEnabled', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-orange-500/50 bg-orange-500/5">
                <CardHeader>
                  <CardTitle className="text-orange-600 dark:text-orange-400">Maintenance Mode</CardTitle>
                  <CardDescription>System-wide maintenance status.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                      <Label className="text-base font-medium">Enable Maintenance</Label>
                      <p className="text-sm text-muted-foreground">
                        Prevent user access during updates. Admins still have access.
                      </p>
                    </div>
                    <Switch
                      checked={settings.maintenanceMode}
                      onCheckedChange={(checked) => updateSetting('maintenanceMode', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-red-500/50 bg-red-500/5">
                <CardHeader>
                  <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
                  <CardDescription>Irreversible system actions.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-900/50 rounded-lg bg-background">
                    <div className="space-y-0.5">
                      <div className="font-medium text-red-600 dark:text-red-400">Clear System Cache</div>
                      <p className="text-sm text-muted-foreground">
                        Force refresh all cached data (Redis).
                      </p>
                    </div>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Clear Cache
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-900/50 rounded-lg bg-background">
                    <div className="space-y-0.5">
                      <div className="font-medium text-red-600 dark:text-red-400">Reset Settings</div>
                      <p className="text-sm text-muted-foreground">
                        Restore all configurations to defaults.
                      </p>
                    </div>
                    <Button variant="destructive" size="sm">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Reset Defaults
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
