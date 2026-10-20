import { lazy, Suspense, useEffect, useState } from 'react';
import { dayOf } from '../engine/dates';
import { setLang, type Lang } from '../i18n';
import { useLang } from '../ui/useLang';
import { ensureItems } from './progression';
import { AlbumScreen } from './screens/AlbumScreen';
import { CurvesScreen } from './screens/CurvesScreen';
import { DistributionScreen } from './screens/DistributionScreen';
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
// Håndevaluering er et selvstændigt spor i gruppen Vurdering (SPEC-haandevaluering.md); forsiden åbner det med onOpen.
const HaandevalueringScreen = lazy(() => import('../haandevaluering/ui/HaandevalueringScreen'));

type Screen =
  | 'home'
  | 'fordeling'
  | 'session'
  | 'palace'
  | 'album'
  | 'club'
  | 'curves'
  | 'settings'
  | 'guide'
  | 'farvebehandling'
  | 'pointregnskab'
  | 'haandevaluering'
  | 'analyse';

/**
 * Sporenes skærme og modulet Analyse (SPEC-analyse-modul.md); de åbnes fra forsiden med `onOpen`, og navnet er også
 * skærmens adresse (#fordeling, #analyse osv.).
 */
const TRACKS: readonly Screen[] = ['fordeling', 'pointregnskab', 'farvebehandling', 'haandevaluering', 'analyse'];

/** Skærmen for en adresse: et spor, eller forsiden uden (eller med en ukendt) hash. */
function screenOf(hash: string): Screen {
  const name = decodeURIComponent(hash.replace(/^#/, '')) as Screen;
  return TRACKS.includes(name) ? name : 'home';
}

/** Markerer historikposter, appen selv har lagt, så Tilbage i appen kan gå et skridt tilbage i browseren. */
const OWN = { fordelingstraeneren: true };

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
  const [screen, setScreen] = useState<Screen>(() => screenOf(window.location.hash));
  // Skærmen, en underskærm (session, huskepalads, …) vender tilbage til.
  const [from, setFrom] = useState<Screen>('home');
  // Sporet, hvis session skal starte, når det åbnes (forsidens "Start dagens session i …").
  const [autoStart, setAutoStart] = useState<Screen | null>(null);

  useEffect(() => {
    // Ingen returværdi: scrollTo giver et promise i nyere browsere, og React ville kalde det som oprydning.
    window.scrollTo(0, 0);
  }, [screen]);

  // Sporenes adresser (SPEC-forside-spor.md): browserens tilbage-knap og links med #spor skifter skærm.
  useEffect(() => {
    const follow = () => {
      setAutoStart(null);
      setScreen(screenOf(window.location.hash));
    };
    window.addEventListener('popstate', follow);
    window.addEventListener('hashchange', follow);
    return () => {
      window.removeEventListener('popstate', follow);
      window.removeEventListener('hashchange', follow);
    };
  }, []);

  /** Åbner et spor: adressen skifter til #spor, så browserens tilbage-knap fører tilbage til forsiden. */
  function openTrack(track: Screen, start = false) {
    setAutoStart(start ? track : null);
    if (window.location.hash !== `#${track}`) window.history.pushState(OWN, '', `#${track}`);
    setScreen(track);
  }

  /** Tilbage til forsiden fra et spor: et skridt tilbage i browseren, hvis appen selv lagde posten, ellers uden hash. */
  function home() {
    setAutoStart(null);
    setScreen('home');
    if (!window.location.hash) return;
    const state = window.history.state as typeof OWN | null;
    if (state?.fordelingstraeneren) window.history.back();
    else window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }

  /** Åbner en underskærm og husker, hvilken skærm den kom fra. */
  function open(next: Screen) {
    setFrom(screen);
    setScreen(next);
  }
  const back = () => (from === 'home' ? home() : setScreen(from));

  function changeLanguage(language: Lang) {
    setSaved({ ...saved, settings: { ...saved.settings, language } });
    setLang(language);
  }

  function startSession() {
    // Mønstre fra før en ny færdighed kom til, får deres manglende emner.
    const ensured = ensureItems(saved, dayOf(Date.now(), saved.settings.dayStartsAtHour));
    if (ensured !== saved) setSaved(ensured);
    open('session');
  }

  switch (screen) {
    case 'session':
      return <SessionScreen saved={saved} onSave={setSaved} onExit={back} />;
    case 'palace':
      return <PalaceScreen saved={saved} onSave={setSaved} onBack={back} />;
    case 'album':
      return <AlbumScreen saved={saved} onSave={setSaved} onBack={back} />;
    case 'club':
      return <KlubaftenScreen onBack={back} />;
    case 'curves':
      return <CurvesScreen saved={saved} onBack={back} />;
    case 'settings':
      return <SettingsScreen saved={saved} onSave={setSaved} onBack={back} />;
    case 'guide':
      return <GuideScreen onBack={back} />;
    case 'fordeling':
      return (
        <DistributionScreen
          saved={saved}
          onStart={startSession}
          onPalace={() => open('palace')}
          onAlbum={() => open('album')}
          onClub={() => open('club')}
          onCurves={() => open('curves')}
          onBack={home}
        />
      );
    case 'farvebehandling':
      return (
        <Suspense fallback={<main className="screen" aria-busy="true" />}>
          <FarvebehandlingScreen onBack={home} start={autoStart === 'farvebehandling'} />
        </Suspense>
      );
    case 'analyse':
      // Analyse som selvstændigt modul: samme skærm og data som fanen, uden fanerne Træning og Selvvalgt.
      return (
        <Suspense fallback={<main className="screen" aria-busy="true" />}>
          <FarvebehandlingScreen onBack={home} analysisOnly />
        </Suspense>
      );
    case 'pointregnskab':
      return (
        <Suspense fallback={<main className="screen" aria-busy="true" />}>
          <PointregnskabScreen onBack={home} start={autoStart === 'pointregnskab'} />
        </Suspense>
      );
    case 'haandevaluering':
      return (
        <Suspense fallback={<main className="screen" aria-busy="true" />}>
          <HaandevalueringScreen onBack={home} start={autoStart === 'haandevaluering'} />
        </Suspense>
      );
    default:
      return (
        <HomeScreen
          saved={saved}
          updateReady={updateReady}
          onUpdate={onUpdate}
          onStart={startSession}
          onClub={() => open('club')}
          onSettings={() => open('settings')}
          onLanguage={changeLanguage}
          onGuide={() => open('guide')}
          onOpen={(target) => {
            if (TRACKS.includes(target as Screen)) openTrack(target as Screen);
          }}
          onStartTrack={(target) => {
            if (TRACKS.includes(target as Screen)) openTrack(target as Screen, true);
          }}
        />
      );
  }
}
