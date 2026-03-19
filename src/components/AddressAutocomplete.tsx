import { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Loader2, X, Check } from 'lucide-react';

// ── South Africa constants ──────────────────────────────────────────
const SA_BBOX = '16.3,-35.0,33.0,-22.0';
const SA_CENTER_LAT = -28.5;
const SA_CENTER_LNG = 24.5;

const PROVINCE_MAP: Record<string, string> = {
  'gauteng': 'Gauteng',
  'gauteng province': 'Gauteng',
  'western cape': 'Western Cape',
  'western cape province': 'Western Cape',
  'eastern cape': 'Eastern Cape',
  'eastern cape province': 'Eastern Cape',
  'kwazulu-natal': 'KwaZulu-Natal',
  'kwazulu natal': 'KwaZulu-Natal',
  'kzn': 'KwaZulu-Natal',
  'free state': 'Free State',
  'free state province': 'Free State',
  'limpopo': 'Limpopo',
  'limpopo province': 'Limpopo',
  'mpumalanga': 'Mpumalanga',
  'mpumalanga province': 'Mpumalanga',
  'north west': 'North West',
  'north west province': 'North West',
  'north-west': 'North West',
  'northern cape': 'Northern Cape',
  'northern cape province': 'Northern Cape',
};

function normaliseProvince(raw?: string): string | undefined {
  if (!raw) return undefined;
  return PROVINCE_MAP[raw.toLowerCase().trim()] ?? raw;
}

// ── Types ───────────────────────────────────────────────────────────
interface PhotonResult {
  properties: {
    name?: string;
    street?: string;
    housenumber?: string;
    city?: string;
    state?: string;
    country?: string;
    countrycode?: string;
    postcode?: string;
    suburb?: string;
    locality?: string;
    district?: string;
    type?: string;
    osm_key?: string;
    osm_value?: string;
  };
  geometry: {
    coordinates: [number, number]; // [lng, lat]
  };
}

export interface AddressSelection {
  formatted_address: string;
  latitude: number;
  longitude: number;
  street?: string;
  suburb?: string;
  city?: string;
  province?: string;
  postcode?: string;
}

type AddressContext = 'home' | 'company' | 'school';

interface AddressAutocompleteProps {
  address_context: AddressContext;
  value?: string;
  onSelect: (selection: AddressSelection) => void;
  onClear?: () => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
}

const contextLabels: Record<AddressContext, string> = {
  home: 'Home Address',
  company: 'Company Address',
  school: 'School Address',
};

const contextPlaceholders: Record<AddressContext, string> = {
  home: 'Search for your home address...',
  company: 'Search for company address...',
  school: 'Search for school address...',
};

// ── SA address formatting ───────────────────────────────────────────
function formatSAAddress(props: PhotonResult['properties']): string {
  const parts: string[] = [];

  if (props.housenumber && props.street) {
    parts.push(`${props.housenumber} ${props.street}`);
  } else if (props.street) {
    parts.push(props.street);
  } else if (props.name && props.name !== props.city && props.name !== props.suburb) {
    parts.push(props.name);
  }

  const suburb = props.suburb || props.locality || props.district;
  if (suburb && suburb !== props.name) {
    parts.push(suburb);
  }

  if (props.city) {
    parts.push(props.city);
  }

  const province = normaliseProvince(props.state);
  if (province) {
    parts.push(province);
  }

  if (props.postcode) {
    if (parts.length > 0) {
      parts[parts.length - 1] += ` ${props.postcode}`;
    } else {
      parts.push(props.postcode);
    }
  }

  return parts.filter(Boolean).join(', ') || 'Unknown Address';
}

// ── Result scoring — street-level addresses rank highest ────────────
function scoreResult(props: PhotonResult['properties']): number {
  let score = 0;
  if (props.housenumber) score += 4;
  if (props.street) score += 3;
  if (props.suburb || props.locality) score += 2;
  if (props.city) score += 1;
  if (props.postcode) score += 1;
  return score;
}

function deduplicateResults(results: PhotonResult[]): PhotonResult[] {
  const seen = new Set<string>();
  return results.filter((r) => {
    const key = formatSAAddress(r.properties).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isSouthAfrica(props: PhotonResult['properties']): boolean {
  const country = (props.country || '').toLowerCase();
  const code = (props.countrycode || '').toLowerCase();
  return (
    country === 'south africa' ||
    country === 'za' ||
    country === 'rsa' ||
    code === 'za'
  );
}

// ── Nominatim fallback ──────────────────────────────────────────────
async function searchNominatim(query: string, signal?: AbortSignal): Promise<PhotonResult[]> {
  const url =
    `https://nominatim.openstreetmap.org/search?` +
    `q=${encodeURIComponent(query)}` +
    `&countrycodes=za&format=jsonv2&addressdetails=1&limit=8` +
    `&viewbox=${SA_BBOX}&bounded=1`;

  const resp = await fetch(url, {
    headers: { 'Accept-Language': 'en' },
    signal,
  });
  if (!resp.ok) return [];

  const data: any[] = await resp.json();
  return data.map((item) => ({
    properties: {
      name: item.name,
      housenumber: item.address?.house_number,
      street: item.address?.road,
      suburb: item.address?.suburb || item.address?.neighbourhood,
      city: item.address?.city || item.address?.town || item.address?.village,
      state: item.address?.state,
      country: item.address?.country || 'South Africa',
      countrycode: item.address?.country_code || 'za',
      postcode: item.address?.postcode,
      locality: item.address?.locality,
      district: item.address?.city_district || item.address?.county,
    },
    geometry: {
      coordinates: [parseFloat(item.lon), parseFloat(item.lat)],
    },
  }));
}

// ── Component ───────────────────────────────────────────────────────
export function AddressAutocomplete({
  address_context,
  value = '',
  onSelect,
  onClear,
  placeholder,
  label,
  required = false,
  error,
  disabled = false,
}: AddressAutocompleteProps) {
  if (!address_context) return null;

  const [searchQuery, setSearchQuery] = useState(value);
  const [results, setResults] = useState<PhotonResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<AddressSelection | null>(null);
  const [showResults, setShowResults] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (value && value !== searchQuery) {
      setSearchQuery(value);
    }
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const searchAddresses = useCallback(async (query: string) => {
    if (query.length < 3) {
      setResults([]);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsSearching(true);
    try {
      const photonQuery = query.toLowerCase().includes('south africa')
        ? query
        : `${query}, South Africa`;
      const photonUrl =
        `https://photon.komoot.io/api/` +
        `?q=${encodeURIComponent(photonQuery)}` +
        `&limit=12` +
        `&bbox=${SA_BBOX}` +
        `&lat=${SA_CENTER_LAT}&lon=${SA_CENTER_LNG}` +
        `&lang=en`;

      const resp = await fetch(photonUrl, { signal: controller.signal });
      let zaResults: PhotonResult[] = [];

      if (resp.ok) {
        const data = await resp.json();
        zaResults = (data.features || []).filter((f: PhotonResult) =>
          isSouthAfrica(f.properties)
        );
      }

      // Fallback to Nominatim if Photon gave nothing
      if (zaResults.length === 0) {
        zaResults = await searchNominatim(query, controller.signal);
      }

      zaResults.sort((a, b) => scoreResult(b.properties) - scoreResult(a.properties));
      zaResults = deduplicateResults(zaResults).slice(0, 8);

      if (!controller.signal.aborted) {
        setResults(zaResults);
        setShowResults(true);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Address search failed:', err);
        setResults([]);
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsSearching(false);
      }
    }
  }, []);

  useEffect(() => {
    if (selectedAddress) return;
    if (searchQuery.length < 3) {
      setResults([]);
      setShowResults(false);
      return;
    }
    const timer = setTimeout(() => searchAddresses(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchAddresses, selectedAddress]);

  const handleSelect = (result: PhotonResult) => {
    const [lng, lat] = result.geometry.coordinates;
    const props = result.properties;
    const formattedAddress = formatSAAddress(props);

    const selection: AddressSelection = {
      formatted_address: formattedAddress,
      latitude: lat,
      longitude: lng,
      street: props.housenumber
        ? `${props.housenumber} ${props.street || ''}`
        : props.street || props.name,
      suburb: props.suburb || props.locality || props.district,
      city: props.city,
      province: normaliseProvince(props.state),
      postcode: props.postcode,
    };

    setSelectedAddress(selection);
    setSearchQuery(formattedAddress);
    setResults([]);
    setShowResults(false);
    onSelect(selection);
  };

  const handleClear = () => {
    setSearchQuery('');
    setSelectedAddress(null);
    setResults([]);
    setShowResults(false);
    onClear?.();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (selectedAddress) {
      setSelectedAddress(null);
      onClear?.();
    }
  };

  const displayLabel = label || contextLabels[address_context];
  const displayPlaceholder = placeholder || contextPlaceholders[address_context];

  return (
    <div className="relative space-y-2" ref={containerRef}>
      {displayLabel && (
        <Label className="text-foreground font-medium">
          {displayLabel} {required && <span className="text-accent">*</span>}
        </Label>
      )}

      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder={displayPlaceholder}
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => {
            if (results.length > 0 && !selectedAddress) setShowResults(true);
          }}
          disabled={disabled}
          className={`pl-10 pr-10 h-12 bg-secondary border-border rounded-xl text-foreground ${
            error ? 'border-destructive' : selectedAddress ? 'border-accent' : ''
          }`}
        />

        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        )}

        {!isSearching && searchQuery && !selectedAddress && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {selectedAddress && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-accent hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {showResults && results.length > 0 && !selectedAddress && (
        <div className="absolute left-0 right-0 z-50 bg-card border border-border rounded-xl overflow-hidden shadow-lg">
          <div className="max-h-56 overflow-y-auto">
            {results.map((result, index) => {
              const props = result.properties;
              const province = normaliseProvince(props.state);
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelect(result)}
                  className="w-full p-3 text-left hover:bg-muted transition-colors border-b border-border last:border-b-0 flex items-start gap-3"
                >
                  <MapPin className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{formatSAAddress(props)}</p>
                    {province && (
                      <p className="text-xs text-muted-foreground">{province}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* No results */}
      {searchQuery.length >= 3 && !isSearching && results.length === 0 && !selectedAddress && showResults && (
        <p className="text-sm text-muted-foreground px-1">
          No addresses found. Try adding a suburb or city name (e.g. "Main Rd Sandton").
        </p>
      )}

      {/* Selected Address Confirmation */}
      {selectedAddress && (
        <div className="bg-accent/10 border border-accent/30 rounded-xl p-3">
          <div className="flex items-start gap-2">
            <Check className="w-4 h-4 text-accent mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {selectedAddress.formatted_address}
              </p>
              {selectedAddress.province && (
                <p className="text-xs text-muted-foreground">
                  {selectedAddress.province}{selectedAddress.postcode ? ` ${selectedAddress.postcode}` : ''}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive px-1">{error}</p>
      )}
    </div>
  );
}
