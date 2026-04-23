import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Check, GraduationCap, Briefcase, Plus, X, Loader2, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  listSavedAccounts,
  removeSavedAccount,
  setAdditiveSignIn,
  type SavedAccount,
} from '@/lib/savedAccounts';
import { toast } from 'sonner';

interface AccountSwitcherProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AccountSwitcher({ open, onOpenChange }: AccountSwitcherProps) {
  const navigate = useNavigate();
  const { user, profile, passenger, switchToAccount, rememberCurrentAccount } = useAuth();
  const [accounts, setAccounts] = useState<SavedAccount[]>([]);
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  // Refresh the saved-account list whenever the sheet opens. Also write
  // the currently active account into storage so it appears in the list.
  const refresh = useCallback(() => {
    rememberCurrentAccount();
    setAccounts(listSavedAccounts());
  }, [rememberCurrentAccount]);

  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  const handleSwitch = async (account: SavedAccount) => {
    if (account.userId === user?.id) {
      onOpenChange(false);
      return;
    }
    setSwitchingId(account.userId);
    const { error } = await switchToAccount(account);
    setSwitchingId(null);
    if (error) {
      toast.error(`Couldn't switch to ${account.email}. Please sign in again.`);
      setAccounts(listSavedAccounts());
      // Send them to /auth in additive mode with the email pre-filled
      const prev = rememberCurrentAccount();
      if (prev) setAdditiveSignIn(prev);
      onOpenChange(false);
      navigate(`/auth?email=${encodeURIComponent(account.email)}`);
      return;
    }
    toast.success(`Switched to ${account.fullName || account.email}`);
    onOpenChange(false);
    navigate('/');
  };

  const handleRemove = (account: SavedAccount, e: React.MouseEvent) => {
    e.stopPropagation();
    if (account.userId === user?.id) {
      toast.error('Sign out from the active account to remove it.');
      return;
    }
    removeSavedAccount(account.userId);
    setAccounts(listSavedAccounts());
  };

  const handleAddAnother = () => {
    const prev = rememberCurrentAccount();
    if (prev) setAdditiveSignIn(prev);
    onOpenChange(false);
    navigate('/auth?additive=1');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl border-border bg-card max-h-[85vh] overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle className="text-foreground">Switch account</SheetTitle>
          <SheetDescription className="text-muted-foreground text-sm">
            Stay signed in to multiple accounts and tap to switch — like Instagram.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-2">
          {accounts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No saved accounts yet.
            </div>
          )}

          {accounts.map((account) => {
            const isActive = account.userId === user?.id;
            const isSwitching = switchingId === account.userId;
            const liveName = isActive ? (profile?.full_name ?? account.fullName) : account.fullName;
            const liveAvatar = isActive ? (profile?.avatar_url ?? account.avatarUrl) : account.avatarUrl;
            const livePassengerType = isActive
              ? (passenger?.passenger_type ?? account.passengerType)
              : account.passengerType;
            const isScholar = livePassengerType === 'scholar';

            return (
              <button
                key={account.userId}
                onClick={() => handleSwitch(account)}
                disabled={isSwitching}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition ${
                  isActive
                    ? 'border-accent bg-accent/10'
                    : 'border-border bg-secondary hover:bg-secondary/70'
                }`}
              >
                <Avatar className="h-12 w-12 border border-border shrink-0">
                  <AvatarImage src={liveAvatar || undefined} />
                  <AvatarFallback className="gradient-accent text-accent-foreground font-bold">
                    {liveName?.charAt(0) || <UserIcon className="h-5 w-5" />}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground truncate">
                      {liveName || account.email.split('@')[0]}
                    </p>
                    {isActive && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold uppercase tracking-wide">
                        <Check className="h-3 w-3" /> Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{account.email}</p>
                  {livePassengerType && (
                    <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-accent font-medium">
                      {isScholar ? (
                        <>
                          <GraduationCap className="h-3 w-3" />
                          Scholar
                        </>
                      ) : (
                        <>
                          <Briefcase className="h-3 w-3" />
                          Staff
                        </>
                      )}
                    </div>
                  )}
                </div>

                {isSwitching ? (
                  <Loader2 className="h-5 w-5 animate-spin text-accent" />
                ) : !isActive ? (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => handleRemove(account, e)}
                    className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-background"
                    aria-label="Remove account"
                  >
                    <X className="h-4 w-4" />
                  </span>
                ) : null}
              </button>
            );
          })}

          <Button
            type="button"
            onClick={handleAddAnother}
            variant="outline"
            className="w-full h-14 mt-2 rounded-2xl border-dashed border-accent/60 text-accent hover:bg-accent/10 hover:text-accent"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add another account
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
