import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap, ArrowRight, ArrowLeft, Loader2, Plus, Search, X, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AddressAutocomplete, AddressSelection } from '@/components/AddressAutocomplete';
import logo from '@/assets/logo.webp';

interface School {
  id: string;
  company_name: string;
  street: string;
  suburb: string | null;
  city: string | null;
  province: string | null;
  latitude: number;
  longitude: number;
  verification_status: string;
}

interface SchoolStepProps {
  initialSchoolId?: string | null;
  onSubmit: (school: School) => Promise<void>;
  onBack?: () => void;
}

type Step = 'search' | 'create-school';

export function SchoolStep({ initialSchoolId, onSubmit, onBack }: SchoolStepProps) {
  const [step, setStep] = useState<Step>('search');
  const [schools, setSchools] = useState<School[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);

  // New school creation state
  const [newSchoolName, setNewSchoolName] = useState('');
  const [selectedAddress, setSelectedAddress] = useState<AddressSelection | null>(null);

  useEffect(() => {
    async function fetchSchools() {
      setIsLoading(true);
      setError(null);
      
      try {
        const { data, error: fetchError } = await supabase
          .from('companies')
          .select('*')
          .eq('is_school', true)
          .eq('is_active', true)
          .order('company_name', { ascending: true });

        if (fetchError) throw fetchError;

        setSchools(data || []);
        
        // Pre-select if initial school provided
        if (initialSchoolId && data) {
          const initial = data.find(s => s.id === initialSchoolId);
          if (initial) {
            setSearchQuery(initial.company_name);
          }
        }
      } catch (err) {
        console.error('Failed to fetch schools:', err);
        setError('Failed to load schools. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchSchools();
  }, [initialSchoolId]);

  // Filter schools based on search
  const filteredSchools = useMemo(() => {
    if (!searchQuery.trim()) return schools;
    const query = searchQuery.toLowerCase();
    return schools.filter(s => s.company_name.toLowerCase().includes(query));
  }, [schools, searchQuery]);

  const showAddNew = searchQuery.trim().length >= 2 &&
    !filteredSchools.some(s => s.company_name.toLowerCase() === searchQuery.toLowerCase());

  const handleSelectSchool = async (school: School) => {
    setIsSubmitting(true);
    try {
      await onSubmit(school);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddNewSchool = () => {
    setNewSchoolName(searchQuery.trim());
    setStep('create-school');
  };

  const handleAddressSelect = (selection: AddressSelection) => {
    setSelectedAddress(selection);
    setAddressError(null);
  };

  const handleAddressClear = () => {
    setSelectedAddress(null);
  };

  const handleCreateSchool = async () => {
    if (!newSchoolName.trim()) return;
    
    if (!selectedAddress) {
      setAddressError('Please select a valid address from the list.');
      return;
    }

    setIsSubmitting(true);
    setAddressError(null);
    try {
      // Create school as a company with is_school = true
      const { data: schoolData, error: schoolError } = await supabase
        .from('companies')
        .insert({
          company_name: newSchoolName.trim(),
          is_school: true,
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

      if (schoolError) throw schoolError;

      await onSubmit(schoolData);
    } catch (err) {
      console.error('Failed to create school:', err);
      setError('Failed to create school. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetToSearch = () => {
    setStep('search');
    setSearchQuery('');
    setNewSchoolName('');
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
            Select or Add Your School
          </h1>
          <p className="text-muted-foreground">
            Search for your school or add a new one
          </p>
        </div>

        <div className="flex-1 px-5 pb-8">
          <Card className="bg-card border-border rounded-2xl">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full gradient-accent flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-accent-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg font-display">School</CardTitle>
                  <CardDescription>Where you study</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Type school name..."
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
                      onClick={handleAddNewSchool}
                      className="w-full p-4 rounded-xl text-left transition-all bg-accent/10 border-2 border-accent/30 hover:bg-accent/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full gradient-accent flex items-center justify-center shrink-0">
                          <Plus className="w-5 h-5 text-accent-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground">
                            + Add "{searchQuery}" as a new school
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Create a new school entry
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-accent" />
                      </div>
                    </button>
                  )}

                  {/* Existing schools */}
                  {filteredSchools.map((school) => (
                    <button
                      key={school.id}
                      onClick={() => handleSelectSchool(school)}
                      disabled={isSubmitting}
                      className="w-full p-4 rounded-xl text-left transition-all bg-secondary border-2 border-transparent hover:bg-muted hover:border-accent/50 disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <GraduationCap className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground">
                            {school.company_name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {[school.suburb, school.city].filter(Boolean).join(', ')}
                          </p>
                          {school.verification_status === 'pending_verification' && (
                            <p className="text-xs text-yellow-500">Pending verification</p>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </button>
                  ))}

                  {filteredSchools.length === 0 && !showAddNew && searchQuery.length < 2 && (
                    <div className="text-center py-8">
                      <GraduationCap className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">
                        Start typing to search or add a school
                      </p>
                    </div>
                  )}

                  {filteredSchools.length === 0 && !showAddNew && searchQuery.length >= 2 && (
                    <div className="text-center py-8">
                      <GraduationCap className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">
                        No schools found — Add new
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

  // Create school step
  const canProceed = newSchoolName.trim() && selectedAddress;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="safe-top px-6 pt-8 pb-4 text-center">
        <img src={logo} alt="Street Surfers" className="h-12 w-auto mx-auto mb-6" />
        <h1 className="text-2xl font-display font-bold text-foreground mb-2">
          Add New School
        </h1>
        <p className="text-muted-foreground">
          Enter school name and address
        </p>
      </div>

      <div className="flex-1 px-5 pb-8 overflow-y-auto">
        <Card className="bg-card border-border rounded-2xl">
          <CardContent className="p-5 space-y-5">
            {/* School Name */}
            <div className="space-y-2">
              <Label className="text-foreground font-medium">School Name *</Label>
              <Input
                placeholder="e.g. Greenwood High School"
                value={newSchoolName}
                onChange={(e) => setNewSchoolName(e.target.value)}
                className="h-12 bg-secondary border-border rounded-xl text-foreground"
              />
            </div>

            {/* School Address - Using AddressAutocomplete */}
            <AddressAutocomplete
              address_context="school"
              onSelect={handleAddressSelect}
              onClear={handleAddressClear}
              required
              error={addressError || undefined}
            />

            {/* Pending verification note */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
              <p className="text-sm text-yellow-500">
                <strong>Note:</strong> New schools are marked as "pending verification" and will be reviewed by an administrator.
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
                onClick={handleCreateSchool}
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
