import { useEffect, useState } from 'react';
import { HomeScreen } from './screens/HomeScreen';
import { SessionScreen } from './screens/SessionScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { useSaved } from './useSaved';

type Screen = 'home' | 'session' | 'settings';

interface AppProps {
  /** En ny version af appen er hentet og venter. */
  updateReady?: boolean;
  onUpdate?: () => void;
}

export default function App({ updateReady = false, onUpdate }: AppProps) {
  const [saved, setSaved] = useSaved();
  const [screen, setScreen] = useState<Screen>('home');
  const home = () => setScreen('home');

  useEffect(() => {
    // Ingen returværdi: scrollTo giver et promise i nyere browsere, og React ville kalde det som oprydning.
    window.scrollTo(0, 0);
  }, [screen]);

  if (screen === 'session') return <SessionScreen saved={saved} onSave={setSaved} onExit={home} />;
  if (screen === 'settings') return <SettingsScreen saved={saved} onSave={setSaved} onBack={home} />;
  return (
    <HomeScreen
      saved={saved}
      updateReady={updateReady}
      onUpdate={onUpdate}
      onStart={() => setScreen('session')}
      onSettings={() => setScreen('settings')}
    />
  );
}
