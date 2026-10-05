import { lazy, Suspense, useEffect, useState } from 'react';
import { dayOf } from '../engine/dates';
import { setLang, type Lang } from '../i18n';
import { useLang } from '../ui/useLang';
import { ensureItems } from './progression';
import { AlbumScreen } from './screens/AlbumScreen';
import { CurvesScreen } from './screens/CurvesScreen';
import { GuideScreen } from './screens/GuideScreen';
import { HomeScreen } from './screens/HomeScreen';
import { KlubaftenScreen } from './screens/KlubaftenScreen';
import { PalaceScreen } from './screens/PalaceScreen';
import { SessionScreen } from './screens/SessionScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { useSaved } from './useSaved';

// Farvebehandling er et selvstændigt spor; det hentes først, når menupunktet bruges.
const FarvebehandlingScreen = lazy(() => import('../farvebehandling/ui/FarvebehandlingScreen'));
// Pointregnskab er også et selvstændigt spor (SPEC-pointregnskab.md).
const PointregnskabScreen = lazy(() => import('../pointregnskab/ui/PointregnskabScreen'));

type Screen = 'home' | 'session' | 'palace' | 'album' | 'club' | 'curves' | 'settings' | 'guide' | 'farvebehandling' | 'pointregnskab';

interface AppProps {
  /** En ny version af appen er hentet og venter. */
  updateReady?: boolean;
  onUpdate?: () => void;
}

export default function App({ updateReady = false, onUpdate }: AppProps) {
  const [saved, setSaved] = useSaved();
  // Sproget fra lagringen sættes, før noget tegnes; skifter det, tegnes hele appen igen.
  useState(() => setLang(saved.settings.language ?? 'da'));
  useLang();
  const [screen, setScreen] = useState<Screen>('home');
  const home = () => setScreen('home');

  useEffect(() => {
    // Ingen returværdi: scrollTo giver et promise i nyere browsere, og React ville kalde det som oprydning.
    window.scrollTo(0, 0);
  }, [screen]);

  function changeLanguage(language: Lang) {
    setSaved({ ...saved, settings: { ...saved.settings, language } });
    setLang(language);
  }

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
    case 'curves':
      return <CurvesScreen saved={saved} onBack={home} />;
    case 'settings':
      return <SettingsScreen saved={saved} onSave={setSaved} onBack={home} />;
    case 'guide':
      return <GuideScreen onBack={home} />;
    case 'farvebehandling':
      return (
        <Suspense fallback={<main className="screen" aria-busy="true" />}>
          <FarvebehandlingScreen onBack={home} />
        </Suspense>
      );
    case 'pointregnskab':
      return (
        <Suspense fallback={<main className="screen" aria-busy="true" />}>
          <PointregnskabScreen onBack={home} />
        </Suspense>
      );
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
          onCurves={() => setScreen('curves')}
          onSettings={() => setScreen('settings')}
          onFarvebehandling={() => setScreen('farvebehandling')}
          onPointregnskab={() => setScreen('pointregnskab')}
          onLanguage={changeLanguage}
          onGuide={() => setScreen('guide')}
        />
      );
  }
}
