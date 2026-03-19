import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, MapPin, ArrowRight, ArrowLeft, Loader2, Check, Plus, Search, X, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AddressAutocomplete, AddressSelection } from '@/components/AddressAutocomplete';
import logo from '@/assets/logo.webp';

interface Company {
  id: string;
  company_name: string;
  verification_status: string;
  street: string | null;
  suburb: string | null;
  city: string | null;
  province: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface Branch {
  id: string;
  company_id: string;
  branch_name: string;
  street: string;
  building_note: string | null;
  suburb: string | null;
  city: string | null;
  province: string | null;
  latitude: number;
  longitude: number;
}

interface CompanyStepProps {
  initialCompanyId?: string | null;
  initialBranchId?: string | null;
  onSubmit: (company: Company, branch: Branch | null) => Promise<void>;
  onBack?: () => void;
}

type Step = 'search' | 'create-company' | 'select-branch' | 'create-branch';

export function CompanyStep({ initialCompanyId, initialBranchId, onSubmit, onBack }: CompanyStepProps) {
  const [step, setStep] = useState<Step>('search');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);

  // New company creation state
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newBranchName, setNewBranchName] = useState('');
  const [selectedAddress, setSelectedAddress] = useState<AddressSelection | null>(null);

  useEffect(() => {
    async function fetchCompanies() {
      setIsLoading(true);
      setError(null);
      
      try {
        const { data, error: fetchError } = await supabase
          .from('companies')
          .select('id, company_name, verification_status, street, suburb, city, province, latitude, longitude')
          .eq('is_school', false)
          .eq('is_active', true)
          .order('company_name', { ascending: true });

        if (fetchError) throw fetchError;

        setCompanies(data || []);
        
        // Pre-select if initial company provided
        if (initialCompanyId && data) {
          const initial = data.find(c => c.id === initialCompanyId);
          if (initial) {
            setSelectedCompany(initial);
            setSearchQuery(initial.company_name);
            // Fetch branches for this company
            await fetchBranchesForCompany(initial.id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch companies:', err);
        setError('Failed to load companies. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchCompanies();
  }, [initialCompanyId]);

  const fetchBranchesForCompany = async (companyId: string) => {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('branch_name', { ascending: true });

      if (error) throw error;

      setBranches(data || []);

      // Auto-select if only one branch
      if (data && data.length === 1) {
        setSelectedBranch(data[0]);
      } else if (initialBranchId && data) {
        const initial = data.find(b => b.id === initialBranchId);
        if (initial) setSelectedBranch(initial);
      }

      return data || [];
    } catch (err) {
      console.error('Failed to fetch branches:', err);
      return [];
    }
  };

  // Filter companies based on search — only show when user has typed at least 2 chars
  const filteredCompanies = useMemo(() => {
    if (searchQuery.trim().length < 2) return [];
    const query = searchQuery.toLowerCase();
    return companies.filter(c => c.company_name.toLowerCase().includes(query));
  }, [companies, searchQuery]);

  const showAddNew = searchQuery.trim().length >= 2 &&
    !filteredCompanies.some(c => c.company_name.toLowerCase() === searchQuery.toLowerCase());

  const handleSelectCompany = async (company: Company) => {
    setSelectedCompany(company);
    setSearchQuery(company.company_name);
    const branchList = await fetchBranchesForCompany(company.id);

    if (branchList.length === 1) {
      // Single branch - auto-select and go to confirm
      setSelectedBranch(branchList[0]);
    }
    // Always go to select-branch — it handles 0, 1, and many branches
    // and includes a "skip / no branch" option
    setStep('select-branch');
  };

  const handleAddNewCompany = () => {
    setNewCompanyName(searchQuery.trim());
    setStep('create-company');
  };

  const handleAddressSelect = (selection: AddressSelection) => {
    setSelectedAddress(selection);
    setAddressError(null);
  };

  const handleAddressClear = () => {
    setSelectedAddress(null);
  };

  const handleCreateCompanyAndBranch = async () => {
    if (!newCompanyName.trim() || !newBranchName.trim()) return;
    
    if (!selectedAddress) {
      setAddressError('Please select a valid address from the list.');
      return;
    }

    setIsSubmitting(true);
    setAddressError(null);
    try {
      // Create company
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert({
          company_name: newCompanyName.trim(),
          street: selectedAddress.street || selectedAddress.formatted_address,
          suburb: selectedAddress.suburb || null,
          city: selectedAddress.city || null,
          province: selectedAddress.province || null,
          latitude: selectedAddress.latitude,
          longitude: selectedAddress.longitude,
          verification_status: 'pending_verification',
          is_active: true,
        })
        .select()
        .single();

      if (companyError) throw companyError;

      // Create branch
      const { data: branchData, error: branchError } = await supabase
        .from('branches')
        .insert({
          company_id: companyData.id,
          branch_name: newBranchName.trim(),
          street: selectedAddress.street || selectedAddress.formatted_address,
          suburb: selectedAddress.suburb || null,
          city: selectedAddress.city || null,
          province: selectedAddress.province || null,
          latitude: selectedAddress.latitude,
          longitude: selectedAddress.longitude,
          is_active: true,
        })
        .select()
        .single();

      if (branchError) throw branchError;

      await onSubmit(companyData, branchData);
    } catch (err) {
      console.error('Failed to create company:', err);
      setError('Failed to create company. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateBranch = async () => {
    if (!selectedCompany || !newBranchName.trim()) return;
    
    if (!selectedAddress) {
      setAddressError('Please select a valid address from the list.');
      return;
    }

    setIsSubmitting(true);
    setAddressError(null);
    try {
      // Create branch
      const { data: branchData, error: branchError } = await supabase
        .from('branches')
        .insert({
          company_id: selectedCompany.id,
          branch_name: newBranchName.trim(),
          street: selectedAddress.street || selectedAddress.formatted_address,
          suburb: selectedAddress.suburb || null,
          city: selectedAddress.city || null,
          province: selectedAddress.province || null,
          latitude: selectedAddress.latitude,
          longitude: selectedAddress.longitude,
          is_active: true,
        })
        .select()
        .single();

      if (branchError) throw branchError;

      await onSubmit(selectedCompany, branchData);
    } catch (err) {
      console.error('Failed to create branch:', err);
      setError('Failed to create branch. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmBranch = async () => {
    if (!selectedCompany || !selectedBranch) return;

    setIsSubmitting(true);
    try {
      await onSubmit(selectedCompany, selectedBranch);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipBranch = async () => {
    if (!selectedCompany) return;

    setIsSubmitting(true);
    try {
      await onSubmit(selectedCompany, null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetToSearch = () => {
    setStep('search');
    setSelectedCompany(null);
    setSelectedBranch(null);
    setSearchQuery('');
    setNewCompanyName('');
    setNewBranchName('');
    setSelectedAddress(null);
    setAddressError(null);
  };

  // Search step
  if (step === 'search') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="safe-top px-6 pt-8 pb-4 text-center">
          <img src={logo} alt="Street Surfers" className="h-12 w-auto mx-auto mb-6" />
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">
            Select or Add Your Company
          </h1>
          <p className="text-muted-foreground">
            Search for your company or add a new one
          </p>
        </div>

        <div className="flex-1 px-5 pb-8">
          <Card className="bg-card border-border rounded-2xl">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full gradient-accent flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-accent-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg font-display">Company / Worksite</CardTitle>
                  <CardDescription>Your destination for work trips</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Type company name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 bg-secondary border-border rounded-xl text-foreground"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-accent animate-spin" />
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-destructive mb-4">{error}</p>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    Try Again
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {/* Add new option */}
                  {showAddNew && (
                    <button
                      onClick={handleAddNewCompany}
                      className="w-full p-4 rounded-xl text-left transition-all bg-accent/10 border-2 border-accent/30 hover:bg-accent/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full gradient-accent flex items-center justify-center shrink-0">
                          <Plus className="w-5 h-5 text-accent-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground">
                            + Add "{searchQuery}" as a new company
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Create a new company entry
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-accent" />
                      </div>
                    </button>
                  )}

                  {/* Existing companies */}
                  {filteredCompanies.map((company) => (
                    <button
                      key={company.id}
                      onClick={() => handleSelectCompany(company)}
                      className="w-full p-4 rounded-xl text-left transition-all bg-secondary border-2 border-transparent hover:bg-muted hover:border-accent/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <Building2 className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground">
                            {company.company_name}
                          </p>
                          {company.verification_status === 'pending_verification' && (
                            <p className="text-xs text-yellow-500">Pending verification</p>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </button>
                  ))}

                  {searchQuery.trim().length < 2 && (
                    <div className="text-center py-8">
                      <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">
                        Search for your company by name
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Can't find it? Type the name to add it
                      </p>
                    </div>
                  )}

                  {filteredCompanies.length === 0 && !showAddNew && searchQuery.trim().length >= 2 && (
                    <div className="text-center py-8">
                      <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">
                        No companies found
                      </p>
                    </div>
                  )}
                </div>
              )}

              {onBack && (
                <div className="pt-4">
                  <Button
                    variant="outline"
                    onClick={onBack}
                    className="w-full h-14 border-border text-foreground rounded-xl"
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Create company step
  if (step === 'create-company') {
    const canProceed = newCompanyName.trim() && newBranchName.trim() && selectedAddress;

    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="safe-top px-6 pt-8 pb-4 text-center">
          <img src={logo} alt="Street Surfers" className="h-12 w-auto mx-auto mb-6" />
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">
            Add New Company
          </h1>
          <p className="text-muted-foreground">
            Enter company details and work address
          </p>
        </div>

        <div className="flex-1 px-5 pb-8 overflow-y-auto">
          <Card className="bg-card border-border rounded-2xl">
            <CardContent className="p-5 space-y-5">
              {/* Company Name */}
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Company Name *</Label>
                <Input
                  placeholder="e.g. ABC Corporation"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  className="h-12 bg-secondary border-border rounded-xl text-foreground"
                />
              </div>

              {/* Branch Name */}
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Branch Name *</Label>
                <Input
                  placeholder="e.g. Head Office, Sandton Branch"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  className="h-12 bg-secondary border-border rounded-xl text-foreground"
                />
              </div>

              {/* Work Address - Using AddressAutocomplete */}
              <AddressAutocomplete
                address_context="company"
                onSelect={handleAddressSelect}
                onClear={handleAddressClear}
                required
                error={addressError || undefined}
              />

              {/* Pending verification note */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                <p className="text-sm text-yellow-500">
                  <strong>Note:</strong> New companies are marked as "pending verification" and will be reviewed by an administrator.
                </p>
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={resetToSearch}
                  className="flex-1 h-14 border-border text-foreground rounded-xl"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleCreateCompanyAndBranch}
                  disabled={!canProceed || isSubmitting}
                  className="flex-1 h-14 gradient-accent text-accent-foreground font-display font-semibold rounded-xl glow-accent disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Create & Continue
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Select branch step
  if (step === 'select-branch') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="safe-top px-6 pt-8 pb-4 text-center">
          <img src={logo} alt="Street Surfers" className="h-12 w-auto mx-auto mb-6" />
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">
            {branches.length > 0 ? 'Select Your Branch' : 'Does your company have branches?'}
          </h1>
          <p className="text-muted-foreground">
            {selectedCompany?.company_name}
          </p>
        </div>

        <div className="flex-1 px-5 pb-8">
          <Card className="bg-card border-border rounded-2xl">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full gradient-accent flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-accent-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg font-display">
                    {branches.length > 0 ? 'Choose Branch' : 'Branch / Location'}
                  </CardTitle>
                  <CardDescription>
                    {branches.length > 0 ? 'Select your work location' : 'Add a branch or skip if not applicable'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing branches */}
              {branches.length > 0 && (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {branches.map((branch) => (
                    <button
                      key={branch.id}
                      onClick={() => setSelectedBranch(branch)}
                      className={`w-full p-4 rounded-xl text-left transition-all ${
                        selectedBranch?.id === branch.id
                          ? 'bg-accent/20 border-2 border-accent'
                          : 'bg-secondary border-2 border-transparent hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          selectedBranch?.id === branch.id
                            ? 'gradient-accent'
                            : 'bg-muted'
                        }`}>
                          {selectedBranch?.id === branch.id ? (
                            <Check className="w-5 h-5 text-accent-foreground" />
                          ) : (
                            <MapPin className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground">
                            {branch.branch_name}
                          </p>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {[branch.street, branch.suburb, branch.city].filter(Boolean).join(', ')}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* No branches — show prominent skip + add options */}
              {branches.length === 0 && (
                <div className="text-center py-4">
                  <Building2 className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mb-4">
                    No branches have been added for this company yet.
                  </p>
                </div>
              )}

              {/* Add new branch option */}
              <button
                onClick={() => setStep('create-branch')}
                className="w-full p-4 rounded-xl text-left transition-all bg-accent/10 border-2 border-accent/30 hover:bg-accent/20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gradient-accent flex items-center justify-center shrink-0">
                    <Plus className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">
                      + Add a {branches.length > 0 ? 'new ' : ''}branch
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {branches.length > 0 ? 'My location is not listed' : 'Add your work location'}
                    </p>
                  </div>
                </div>
              </button>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={resetToSearch}
                  className="flex-1 h-14 border-border text-foreground rounded-xl"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back
                </Button>
                {selectedBranch ? (
                  <Button
                    onClick={handleConfirmBranch}
                    disabled={isSubmitting}
                    className="flex-1 h-14 gradient-accent text-accent-foreground font-display font-semibold rounded-xl glow-accent disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={handleSkipBranch}
                    disabled={isSubmitting}
                    className="flex-1 h-14 border-border text-foreground rounded-xl"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        No Branches — Skip
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Create branch step (for existing company)
  if (step === 'create-branch') {
    const canProceed = newBranchName.trim() && selectedAddress;

    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="safe-top px-6 pt-8 pb-4 text-center">
          <img src={logo} alt="Street Surfers" className="h-12 w-auto mx-auto mb-6" />
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">
            Add New Branch
          </h1>
          <p className="text-muted-foreground">
            {selectedCompany?.company_name}
          </p>
        </div>

        <div className="flex-1 px-5 pb-8 overflow-y-auto">
          <Card className="bg-card border-border rounded-2xl">
            <CardContent className="p-5 space-y-5">
              {/* Branch Name */}
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Branch Name *</Label>
                <Input
                  placeholder="e.g. Sandton Office, Warehouse"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  className="h-12 bg-secondary border-border rounded-xl text-foreground"
                />
              </div>

              {/* Branch Address - Using AddressAutocomplete */}
              <AddressAutocomplete
                address_context="company"
                onSelect={handleAddressSelect}
                onClear={handleAddressClear}
                label="Branch Address"
                required
                error={addressError || undefined}
              />

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (branches.length > 0) {
                      setStep('select-branch');
                    } else {
                      resetToSearch();
                    }
                    setNewBranchName('');
                    setSelectedAddress(null);
                    setAddressError(null);
                  }}
                  className="flex-1 h-14 border-border text-foreground rounded-xl"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleCreateBranch}
                  disabled={!canProceed || isSubmitting}
                  className="flex-1 h-14 gradient-accent text-accent-foreground font-display font-semibold rounded-xl glow-accent disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Add & Continue
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
}
