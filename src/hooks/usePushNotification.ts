import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const VAPID_PUBLIC_KEY  = import.meta.env.VITE_VAPID_PUBLIC_KEY as string;
const ASKED_KEY         = 'push_permission_asked';

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + pad).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone(): boolean {
  return (
    ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true) ||
    window.matchMedia('(display-mode: standalone)').matches
  );
}

export function usePushNotification(userId: string | undefined) {
  const subscribed = useRef(false);

  useEffect(() => {
    if (!userId || subscribed.current) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (localStorage.getItem(ASKED_KEY) === 'denied') return;

    // iOS requires the app to be installed on the home screen
    if (isIOS() && !isStandalone()) return;

    const setup = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const permission   = await Notification.requestPermission();
        localStorage.setItem(ASKED_KEY, permission);
        if (permission !== 'granted') return;

        const existing = await registration.pushManager.getSubscription();
        const sub = existing ?? await registration.pushManager.subscribe({
          userVisibleOnly:      true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });

        const json = sub.toJSON() as {
          endpoint: string;
          keys: { p256dh: string; auth: string };
        };

        await supabase.from('push_subscriptions').upsert(
          {
            user_id:    userId,
            endpoint:   json.endpoint,
            p256dh:     json.keys.p256dh,
            auth:       json.keys.auth,
            user_agent: navigator.userAgent,
          },
          { onConflict: 'user_id,endpoint', ignoreDuplicates: true },
        );

        subscribed.current = true;
      } catch (err) {
        console.warn('[push] subscription failed:', err);
      }
    };

    setup();
  }, [userId]);
}
