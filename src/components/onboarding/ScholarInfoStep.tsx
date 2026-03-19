import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GraduationCap, User, Phone, Mail, ArrowLeft, ArrowRight, Loader2, Shield } from 'lucide-react';
import logo from '@/assets/logo.webp';

export interface ScholarInfoData {
  school_name: string;
  grade_year: string;
  guardian_full_name: string;
  guardian_phone: string;
  guardian_email?: string;
}

interface ScholarInfoStepProps {
  initialData?: Partial<ScholarInfoData>;
  onSubmit: (data: ScholarInfoData) => Promise<void>;
  onBack: () => void;
}

const GRADES = [
  'Grade R',
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9',
  'Grade 10',
  'Grade 11',
  'Grade 12',
];

export function ScholarInfoStep({ initialData, onSubmit, onBack }: ScholarInfoStepProps) {
  const [schoolName, setSchoolName] = useState(initialData?.school_name || '');
  const [gradeYear, setGradeYear] = useState(initialData?.grade_year || '');
  const [guardianName, setGuardianName] = useState(initialData?.guardian_full_name || '');
  const [guardianPhone, setGuardianPhone] = useState(initialData?.guardian_phone || '');
  const [guardianEmail, setGuardianEmail] = useState(initialData?.guardian_email || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!schoolName.trim()) {
      newErrors.schoolName = 'School name is required';
    }
    if (!gradeYear) {
      newErrors.gradeYear = 'Grade/Year is required';
    }
    if (!guardianName.trim()) {
      newErrors.guardianName = 'Guardian name is required';
    }
    if (!guardianPhone.trim()) {
      newErrors.guardianPhone = 'Guardian phone is required';
    } else if (!/^(\+27|0)[0-9]{9}$/.test(guardianPhone.replace(/\s/g, ''))) {
      newErrors.guardianPhone = 'Please enter a valid SA phone number';
    }
    if (guardianEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guardianEmail)) {
      newErrors.guardianEmail = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        school_name: schoolName.trim(),
        grade_year: gradeYear,
        guardian_full_name: guardianName.trim(),
        guardian_phone: guardianPhone.trim(),
        guardian_email: guardianEmail.trim() || undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="safe-top px-6 pt-8 pb-4 text-center">
        <img src={logo} alt="Street Surfers" className="h-12 w-auto mx-auto mb-6" />
        <h1 className="text-2xl font-display font-bold text-foreground mb-2">
          Scholar Details
        </h1>
        <p className="text-muted-foreground">
          Enter school and guardian information
        </p>
      </div>

      <div className="flex-1 px-5 pb-8 overflow-y-auto">
        <div className="space-y-4 max-w-md mx-auto">
          {/* School Information Card */}
          <Card className="bg-card border-border rounded-2xl">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full gradient-accent flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-accent-foreground" />
                </div>
                <div>
                  <CardTitle className="text-base font-display">School Information</CardTitle>
                  <CardDescription>Your school details</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-foreground font-medium">School Name *</Label>
                <Input
                  placeholder="e.g. Greenwood High School"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className={`h-12 bg-secondary border-border rounded-xl text-foreground ${
                    errors.schoolName ? 'border-destructive' : ''
                  }`}
                />
                {errors.schoolName && (
                  <p className="text-xs text-destructive">{errors.schoolName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-foreground font-medium">Grade / Year *</Label>
                <Select value={gradeYear} onValueChange={setGradeYear}>
                  <SelectTrigger className={`h-12 bg-secondary border-border rounded-xl ${
                    errors.gradeYear ? 'border-destructive' : ''
                  }`}>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADES.map((grade) => (
                      <SelectItem key={grade} value={grade}>
                        {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.gradeYear && (
                  <p className="text-xs text-destructive">{errors.gradeYear}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Guardian Information Card */}
          <Card className="bg-card border-border rounded-2xl">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <CardTitle className="text-base font-display">Guardian Information</CardTitle>
                  <CardDescription>Parent or guardian contact details</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-foreground font-medium flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Guardian Full Name *
                </Label>
                <Input
                  placeholder="e.g. John Doe"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  className={`h-12 bg-secondary border-border rounded-xl text-foreground ${
                    errors.guardianName ? 'border-destructive' : ''
                  }`}
                />
                {errors.guardianName && (
                  <p className="text-xs text-destructive">{errors.guardianName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-foreground font-medium flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Guardian Phone *
                </Label>
                <Input
                  type="tel"
                  placeholder="e.g. 0821234567"
                  value={guardianPhone}
                  onChange={(e) => setGuardianPhone(e.target.value)}
                  className={`h-12 bg-secondary border-border rounded-xl text-foreground ${
                    errors.guardianPhone ? 'border-destructive' : ''
                  }`}
                />
                {errors.guardianPhone && (
                  <p className="text-xs text-destructive">{errors.guardianPhone}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-foreground font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Guardian Email (optional)
                </Label>
                <Input
                  type="email"
                  placeholder="e.g. guardian@example.com"
                  value={guardianEmail}
                  onChange={(e) => setGuardianEmail(e.target.value)}
                  className={`h-12 bg-secondary border-border rounded-xl text-foreground ${
                    errors.guardianEmail ? 'border-destructive' : ''
                  }`}
                />
                {errors.guardianEmail && (
                  <p className="text-xs text-destructive">{errors.guardianEmail}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Info Notice */}
          <Card className="bg-warning/10 border-warning/30 rounded-2xl">
            <CardContent className="p-4">
              <p className="text-sm text-foreground">
                <strong>Important:</strong> Guardian contact details will be shared with drivers for safety purposes. 
                They may be contacted in case of emergencies or trip-related matters.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="max-w-md mx-auto mt-6 flex gap-3">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex-1 h-14 border-border text-foreground rounded-xl"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 h-14 gradient-accent text-accent-foreground rounded-xl font-semibold"
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
        </div>
      </div>
    </div>
  );
}
