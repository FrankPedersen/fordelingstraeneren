import { useEffect, useState } from 'react';
import { dayOf } from '../engine/dates';
import { ensureItems } from './progression';
import { AlbumScreen } from './screens/AlbumScreen';
import { HomeScreen } from './screens/HomeScreen';
import { KlubaftenScreen } from './screens/KlubaftenScreen';
import { PalaceScreen } from './screens/PalaceScreen';
import { SessionScreen } from './screens/SessionScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { useSaved } from './useSaved';

type Screen = 'home' | 'session' | 'palace' | 'album' | 'club' | 'settings';

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

  function startSession() {
    // Mønstre fra før en ny færdighed kom til, får deres manglende emner.
    const ensured = ensureItems(saved, dayOf(Date.now(), saved.settings.dayStartsAtHour));
    if (ensured !== saved) setSaved(ensured);
    setScreen('session');
  }

  switch (screen) {
    case 'session':
      return <SessionScreen saved={saved} onSave={setSaved} onExit={home} />;
    case 'palace':
      return <PalaceScreen saved={saved} onSave={setSaved} onBack={home} />;
    case 'album':
      return <AlbumScreen saved={saved} onSave={setSaved} onBack={home} />;
    case 'club':
      return <KlubaftenScreen onBack={home} />;
    case 'settings':
      return <SettingsScreen saved={saved} onSave={setSaved} onBack={home} />;
    default:
      return (
        <HomeScreen
          saved={saved}
          updateReady={updateReady}
          onUpdate={onUpdate}
          onStart={startSession}
          onPalace={() => setScreen('palace')}
          onAlbum={() => setScreen('album')}
          onClub={() => setScreen('club')}
          onSettings={() => setScreen('settings')}
        />
      );
  }
}
