import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, GraduationCap, ArrowRight, Check } from 'lucide-react';
import logo from '@/assets/logo.webp';

export type PassengerType = 'staff' | 'scholar';

interface PassengerTypeStepProps {
  onSubmit: (type: PassengerType) => void;
}

export function PassengerTypeStep({ onSubmit }: PassengerTypeStepProps) {
  const [selectedType, setSelectedType] = useState<PassengerType | null>(null);

  const handleContinue = () => {
    if (selectedType) {
      onSubmit(selectedType);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="safe-top px-6 pt-8 pb-4 text-center">
        <img src={logo} alt="Street Surfers" className="h-12 w-auto mx-auto mb-6" />
        <h1 className="text-2xl font-display font-bold text-foreground mb-2">
          What type of transport do you need?
        </h1>
        <p className="text-muted-foreground">
          Select your passenger category
        </p>
      </div>

      <div className="flex-1 px-5 pb-8">
        <div className="space-y-4 max-w-md mx-auto">
          {/* Staff Transport Option */}
          <button
            onClick={() => setSelectedType('staff')}
            className={`w-full text-left transition-all rounded-2xl border-2 ${
              selectedType === 'staff' 
                ? 'bg-accent/10 border-accent shadow-lg' 
                : 'bg-card border-border hover:border-accent/50'
            }`}
          >
            <Card className="border-0 bg-transparent">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${
                    selectedType === 'staff' ? 'gradient-accent' : 'bg-secondary'
                  }`}>
                    <Briefcase className={`w-7 h-7 ${
                      selectedType === 'staff' ? 'text-accent-foreground' : 'text-muted-foreground'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg font-display text-foreground flex items-center gap-2">
                      Staff Transport
                      {selectedType === 'staff' && (
                        <Check className="w-5 h-5 text-accent" />
                      )}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      For employees commuting to work
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="text-sm text-muted-foreground space-y-1 ml-[4.5rem]">
                  <li>• Home to workplace transport</li>
                  <li>• Shift-based scheduling</li>
                  <li>• Company/worksite selection</li>
                </ul>
              </CardContent>
            </Card>
          </button>

          {/* Scholar Transport Option */}
          <button
            onClick={() => setSelectedType('scholar')}
            className={`w-full text-left transition-all rounded-2xl border-2 ${
              selectedType === 'scholar' 
                ? 'bg-accent/10 border-accent shadow-lg' 
                : 'bg-card border-border hover:border-accent/50'
            }`}
          >
            <Card className="border-0 bg-transparent">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${
                    selectedType === 'scholar' ? 'gradient-accent' : 'bg-secondary'
                  }`}>
                    <GraduationCap className={`w-7 h-7 ${
                      selectedType === 'scholar' ? 'text-accent-foreground' : 'text-muted-foreground'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg font-display text-foreground flex items-center gap-2">
                      Scholar Transport
                      {selectedType === 'scholar' && (
                        <Check className="w-5 h-5 text-accent" />
                      )}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      For students travelling to school
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="text-sm text-muted-foreground space-y-1 ml-[4.5rem]">
                  <li>• Home to school transport</li>
                  <li>• Guardian contact required</li>
                  <li>• Enhanced safety features</li>
                </ul>
              </CardContent>
            </Card>
          </button>
        </div>

        {/* Continue Button */}
        <div className="max-w-md mx-auto mt-8">
          <Button
            onClick={handleContinue}
            disabled={!selectedType}
            className="w-full h-14 gradient-accent text-accent-foreground rounded-xl text-lg font-semibold disabled:opacity-50"
          >
            Continue
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
