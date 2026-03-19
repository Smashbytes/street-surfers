import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Home, Building2, Search, MapPin, Check, Loader2, ArrowRight, ArrowLeft, Edit3 } from 'lucide-react';
import logo from '@/assets/logo.webp';

interface PhotonResult {
  geometry: {
    coordinates: [number, number]; // [lon, lat]
  };
  properties: {
    osm_id: number;
    name?: string;
    street?: string;
    housenumber?: string;
    postcode?: string;
    city?: string;
    state?: string;
    country?: string;
    locality?: string;
    district?: string;
  };
}

export interface AddressData {
  address: string;
  lat: number;
  lng: number;
  house_number?: string;
  street?: string;
  suburb?: string;
  city?: string;
  province?: string;
  address_confidence?: 'exact' | 'street-level' | 'manual';
}

interface AddressStepProps {
  addressType: 'home' | 'work';
  initialAddress?: string | null;
  onSubmit: (data: AddressData) => Promise<void>;
  onBack?: () => void;
}

// Format Photon result into a readable address
function formatPhotonAddress(properties: PhotonResult['properties']): string {
  const parts: string[] = [];
  
  // Build address from available parts
  if (properties.housenumber && properties.street) {
    parts.push(`${properties.housenumber} ${properties.street}`);
  } else if (properties.street) {
    parts.push(properties.street);
  } else if (properties.name) {
    parts.push(properties.name);
  }
  
  if (properties.locality) {
    parts.push(properties.locality);
  } else if (properties.district) {
    parts.push(properties.district);
  }
  
  if (properties.city) {
    parts.push(properties.city);
  }
  
  if (properties.state) {
    parts.push(properties.state);
  }
  
  if (properties.postcode) {
    parts.push(properties.postcode);
  }
  
  if (properties.country) {
    parts.push(properties.country);
  }
  
  return parts.filter(Boolean).join(', ') || 'Unknown Address';
}

export function AddressStep({ addressType, initialAddress, onSubmit, onBack }: AddressStepProps) {
  const [step, setStep] = useState<'search' | 'house-number' | 'manual'>('search');
  const [searchQuery, setSearchQuery] = useState(initialAddress || '');
  const [results, setResults] = useState<PhotonResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<PhotonResult | null>(null);
  const [houseNumber, setHouseNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Manual address fields
  const [manualStreet, setManualStreet] = useState('');
  const [manualSuburb, setManualSuburb] = useState('');
  const [manualCity, setManualCity] = useState('');
  const [manualProvince, setManualProvince] = useState('');

  // Nominatim fallback for when Photon returns no SA results
  const searchNominatim = useCallback(async (query: string): Promise<PhotonResult[]> => {
    try {
      const url =
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(query)}` +
        `&countrycodes=za&format=jsonv2&addressdetails=1&limit=8` +
        `&viewbox=16.3,-35.0,33.0,-22.0&bounded=1`;

      const resp = await fetch(url, { headers: { 'Accept-Language': 'en' } });
      if (!resp.ok) return [];

      const data: any[] = await resp.json();
      return data.map((item) => ({
        geometry: {
          coordinates: [parseFloat(item.lon), parseFloat(item.lat)],
        },
        properties: {
          osm_id: item.osm_id || 0,
          name: item.name,
          housenumber: item.address?.house_number,
          street: item.address?.road,
          city: item.address?.city || item.address?.town || item.address?.village,
          state: item.address?.state,
          country: item.address?.country || 'South Africa',
          locality: item.address?.locality || item.address?.suburb || item.address?.neighbourhood,
          district: item.address?.city_district || item.address?.county,
          postcode: item.address?.postcode,
        },
      }));
    } catch {
      return [];
    }
  }, []);

  const searchAddresses = useCallback(async (query: string) => {
    if (query.length < 3) {
      setResults([]);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    setSearchError(null);

    try {
      // Append "South Africa" to improve results, add lat/lon center bias
      const photonQuery = query.toLowerCase().includes('south africa')
        ? query
        : `${query}, South Africa`;

      const response = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(photonQuery)}&limit=12&bbox=16.3,-35.0,33.0,-22.0&lat=-28.5&lon=24.5&lang=en`
      );

      let saResults: PhotonResult[] = [];

      if (response.ok) {
        const data = await response.json();

        saResults = (data.features || []).filter(
          (feature: PhotonResult) => {
            const country = (feature.properties.country || '').toLowerCase();
            return country === 'south africa' || country === 'za' || country === 'rsa';
          }
        );
      }

      // Fallback to Nominatim if Photon gave no SA results
      if (saResults.length === 0) {
        saResults = await searchNominatim(query);
      }

      if (saResults.length === 0) {
        setResults([]);
        setSearchError('No matching address found in South Africa. Try adding a suburb or city name, or enter manually.');
      } else {
        // Sort by quality — addresses with street/house number rank higher
        saResults.sort((a, b) => {
          let scoreA = 0, scoreB = 0;
          if (a.properties.housenumber) scoreA += 4;
          if (a.properties.street) scoreA += 3;
          if (a.properties.locality) scoreA += 2;
          if (a.properties.city) scoreA += 1;
          if (b.properties.housenumber) scoreB += 4;
          if (b.properties.street) scoreB += 3;
          if (b.properties.locality) scoreB += 2;
          if (b.properties.city) scoreB += 1;
          return scoreB - scoreA;
        });

        // Deduplicate by formatted address
        const seen = new Set<string>();
        saResults = saResults.filter((r) => {
          const key = formatPhotonAddress(r.properties).toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        setResults(saResults.slice(0, 8));
      }
    } catch (error) {
      console.error('Address search failed:', error);
      setSearchError('Address search failed. Please check your connection or enter manually.');
    } finally {
      setIsSearching(false);
    }
  }, [searchNominatim]);

  useEffect(() => {
    if (step !== 'search') return;
    
    // Clear results immediately when query is too short
    if (searchQuery.length < 3) {
      setResults([]);
      setSearchError(null);
      setHasSearched(false);
      return;
    }
    
    const timer = setTimeout(() => {
      searchAddresses(searchQuery);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, searchAddresses, step]);

  const handleSelect = (result: PhotonResult) => {
    setSelectedResult(result);
    // Pre-fill house number if available
    if (result.properties.housenumber) {
      setHouseNumber(result.properties.housenumber);
    }
    setResults([]);
    setSearchError(null);
    setStep('house-number');
  };

  const handleConfirm = async () => {
    if (!selectedResult) return;
    
    const [lon, lat] = selectedResult.geometry.coordinates;
    const props = selectedResult.properties;
    
    // Build full address with house number
    const streetPart = houseNumber 
      ? `${houseNumber} ${props.street || props.name || ''}`
      : props.street || props.name || '';
    
    const addressParts = [streetPart];
    if (props.locality || props.district) addressParts.push(props.locality || props.district || '');
    if (props.city) addressParts.push(props.city);
    if (props.state) addressParts.push(props.state);
    
    const fullAddress = addressParts.filter(Boolean).join(', ');
    
    setIsSubmitting(true);
    try {
      await onSubmit({
        address: fullAddress,
        lat: lat,
        lng: lon,
        house_number: houseNumber || undefined,
        street: props.street || props.name || undefined,
        suburb: props.locality || props.district || undefined,
        city: props.city || undefined,
        province: props.state || undefined,
        address_confidence: houseNumber ? 'exact' : 'street-level',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!manualStreet || !manualSuburb || !manualCity) return;
    
    const addressParts = [];
    if (houseNumber && manualStreet) {
      addressParts.push(`${houseNumber} ${manualStreet}`);
    } else if (manualStreet) {
      addressParts.push(manualStreet);
    }
    if (manualSuburb) addressParts.push(manualSuburb);
    if (manualCity) addressParts.push(manualCity);
    if (manualProvince) addressParts.push(manualProvince);
    
    const fullAddress = addressParts.filter(Boolean).join(', ');
    
    setIsSubmitting(true);
    try {
      await onSubmit({
        address: fullAddress,
        lat: 0, // Manual entry - no coordinates
        lng: 0,
        house_number: houseNumber || undefined,
        street: manualStreet,
        suburb: manualSuburb,
        city: manualCity,
        province: manualProvince || undefined,
        address_confidence: 'manual',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isHome = addressType === 'home';
  const Icon = isHome ? Home : Building2;

  // Manual Entry Form
  if (step === 'manual') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="safe-top px-6 pt-8 pb-4 text-center">
          <img src={logo} alt="Street Surfers" className="h-12 w-auto mx-auto mb-6" />
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">
            Enter Address Manually
          </h1>
          <p className="text-muted-foreground">
            Please enter your address details below
          </p>
        </div>

        <div className="flex-1 px-5 pb-8">
          <Card className="bg-card border-border rounded-2xl">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full gradient-accent flex items-center justify-center">
                  <Edit3 className="w-6 h-6 text-accent-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg font-display">Manual Address Entry</CardTitle>
                  <CardDescription>Enter your complete address details</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  House / Unit Number <span className="text-muted-foreground">(optional)</span>
                </label>
                <Input
                  value={houseNumber}
                  onChange={(e) => setHouseNumber(e.target.value)}
                  placeholder="e.g. 12, 12A, Unit 4, Flat 6B"
                  className="h-12 bg-input border-border rounded-xl text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Street <span className="text-accent">*</span>
                </label>
                <Input
                  value={manualStreet}
                  onChange={(e) => setManualStreet(e.target.value)}
                  placeholder="e.g. Main Road"
                  className="h-12 bg-input border-border rounded-xl text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Suburb <span className="text-accent">*</span>
                </label>
                <Input
                  value={manualSuburb}
                  onChange={(e) => setManualSuburb(e.target.value)}
                  placeholder="e.g. Sandton"
                  className="h-12 bg-input border-border rounded-xl text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  City <span className="text-accent">*</span>
                </label>
                <Input
                  value={manualCity}
                  onChange={(e) => setManualCity(e.target.value)}
                  placeholder="e.g. Johannesburg"
                  className="h-12 bg-input border-border rounded-xl text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Province <span className="text-muted-foreground">(optional)</span>
                </label>
                <Input
                  value={manualProvince}
                  onChange={(e) => setManualProvince(e.target.value)}
                  placeholder="e.g. Gauteng"
                  className="h-12 bg-input border-border rounded-xl text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div className="bg-secondary/50 border border-border rounded-xl p-3">
                <p className="text-xs text-muted-foreground">
                  ⚠️ Manual addresses will need to be verified by dispatch before routing can be optimized.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep('search')}
                  className="flex-1 h-14 border-border text-foreground rounded-xl"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back to Search
                </Button>
                <Button
                  onClick={handleManualSubmit}
                  disabled={!manualStreet || !manualSuburb || !manualCity || isSubmitting}
                  className="flex-1 h-14 gradient-accent text-accent-foreground font-display font-semibold rounded-xl glow-accent disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Save Address
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

  // House Number Step
  if (step === 'house-number' && selectedResult) {
    const props = selectedResult.properties;
    const streetDisplay = props.street || props.name || 'Selected location';
    const localityDisplay = [props.locality || props.district, props.city].filter(Boolean).join(', ');

    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="safe-top px-6 pt-8 pb-4 text-center">
          <img src={logo} alt="Street Surfers" className="h-12 w-auto mx-auto mb-6" />
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">
            Complete Your Address
          </h1>
          <p className="text-muted-foreground">
            We found your street. Please enter your house or unit number to complete the address.
          </p>
        </div>

        <div className="flex-1 px-5 pb-8">
          <Card className="bg-card border-border rounded-2xl">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full gradient-accent flex items-center justify-center">
                  <Icon className="w-6 h-6 text-accent-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg font-display">{streetDisplay}</CardTitle>
                  <CardDescription>{localityDisplay}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-secondary/50 border border-accent/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Street Found</p>
                    <p className="text-sm text-muted-foreground">
                      {formatPhotonAddress(props)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  House / Unit Number <span className="text-accent">*</span>
                </label>
                <Input
                  value={houseNumber}
                  onChange={(e) => setHouseNumber(e.target.value)}
                  placeholder="e.g. 12, 12A, Unit 4, Flat 6B"
                  className="h-14 bg-input border-border rounded-xl text-foreground placeholder:text-muted-foreground text-lg"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Enter your house number, unit number, or flat number
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep('search');
                    setSelectedResult(null);
                    setHouseNumber('');
                  }}
                  className="flex-1 h-14 border-border text-foreground rounded-xl"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Change Street
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={!houseNumber.trim() || isSubmitting}
                  className="flex-1 h-14 gradient-accent text-accent-foreground font-display font-semibold rounded-xl glow-accent disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Confirm Address
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </div>

              <Button
                variant="ghost"
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="w-full text-muted-foreground text-sm"
              >
                Skip - I don't have a house number
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Search Step
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="safe-top px-6 pt-8 pb-4 text-center">
        <img src={logo} alt="Street Surfers" className="h-12 w-auto mx-auto mb-6" />
        <h1 className="text-2xl font-display font-bold text-foreground mb-2">
          {isHome ? 'Set Your Pickup Address' : 'Set Your Destination'}
        </h1>
        <p className="text-muted-foreground">
          {isHome 
            ? 'Where should we pick you up each morning?' 
            : 'Where do you need to be dropped off? (e.g. your workplace)'
          }
        </p>
      </div>

      <div className="flex-1 px-5 pb-8">
        <Card className="bg-card border-border rounded-2xl">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full gradient-accent flex items-center justify-center">
                <Icon className="w-6 h-6 text-accent-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg font-display">
                  {isHome ? 'Pickup Address' : 'Destination Address'}
                </CardTitle>
                <CardDescription>
                  Search for your street name and suburb
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedResult(null);
                  setSearchError(null);
                }}
                placeholder="e.g. Main Road, Sandton"
                className="h-14 pl-12 bg-input border-border rounded-xl text-foreground placeholder:text-muted-foreground"
              />
              {isSearching && (
                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground animate-spin" />
              )}
            </div>

            {/* Search Results */}
            {results.length > 0 && (
              <div className="bg-secondary rounded-xl overflow-hidden divide-y divide-border max-h-64 overflow-y-auto">
                {results.map((result, index) => (
                  <button
                    key={`${result.properties.osm_id}-${index}`}
                    onClick={() => handleSelect(result)}
                    className="w-full p-4 text-left hover:bg-muted transition-colors flex items-start gap-3"
                  >
                    <MapPin className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                    <span className="text-sm text-foreground line-clamp-2">
                      {formatPhotonAddress(result.properties)}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Error/No results message */}
            {hasSearched && !isSearching && results.length === 0 && searchQuery.length >= 3 && !selectedResult && (
              <div className="text-center py-6 text-muted-foreground">
                <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm mb-4">
                  {searchError || 'No matching address found. Try refining your search.'}
                </p>
                <Button
                  variant="outline"
                  onClick={() => setStep('manual')}
                  className="border-accent text-accent hover:bg-accent/10"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Enter Address Manually
                </Button>
              </div>
            )}

            {/* Manual entry option always visible */}
            {!hasSearched && (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-2">Can't find your address?</p>
                <Button
                  variant="ghost"
                  onClick={() => setStep('manual')}
                  className="text-accent hover:bg-accent/10"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Enter Manually
                </Button>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              {onBack && (
                <Button
                  variant="outline"
                  onClick={onBack}
                  className="flex-1 h-14 border-border text-foreground rounded-xl"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}