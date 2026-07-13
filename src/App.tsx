import { useRef, useEffect } from 'react';
import { AppProvider, useApp } from './state/AppContext';
import { Header } from './components/Header';
import { FloorNav } from './components/FloorNav';
import { EmployeePanel } from './components/EmployeePanel';
import { RoomTransitionOverlay } from './components/RoomTransitionOverlay';
import { Toast } from './components/Toast';
import { Face } from './components/Face';
import { Lobby } from './rooms/Lobby';
import { Mission } from './rooms/Mission';
import { ComingSoon } from './rooms/ComingSoon';
import { employeeById } from './data/employees';
import type { RoomId } from './types';
import styles from './App.module.css';

function RoomOutlet() {
  const { current } = useApp();
  if (current === 'lobby') return <Lobby />;
  if (current === 'mission') return <Mission />;
  return <ComingSoon roomId={current as Exclude<RoomId, 'lobby' | 'mission'>} />;
}

function Shell() {
  const {
    isMobile,
    isDesktop,
    navOpen,
    panelOpen,
    transitioning,
    toggleNav,
    togglePanel,
    eId,
    current,
  } = useApp();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0;
  }, [current]);

  const currentEmp = employeeById(eId);
  const showFab = isMobile && !panelOpen;

  return (
    <div className={styles.root}>
      <div className={styles.bgLayer} aria-hidden>
        <div className={styles.bgGradient} />
        <div className={styles.bgGlowBottom} />
        <div className={styles.bgGlowTop} />
      </div>

      <Header />

      <div className={styles.body}>
        {isDesktop && <FloorNav variant="desktop" />}
        <main ref={mainRef} className={styles.main} data-mobile={isMobile}>
          <RoomOutlet />
          {transitioning && <RoomTransitionOverlay />}
        </main>
        {isDesktop && <EmployeePanel variant="desktop" />}
      </div>

      {isMobile && navOpen && (
        <>
          <div className={styles.scrim} onClick={toggleNav} />
          <FloorNav variant="drawer" />
        </>
      )}
      {isMobile && panelOpen && (
        <>
          <div className={styles.scrim} onClick={togglePanel} />
          <EmployeePanel variant="drawer" onClose={togglePanel} />
        </>
      )}
      {showFab && (
        <button onClick={togglePanel} aria-label="AI社員パネルを開く" className={styles.fab}>
          <Face emp={currentEmp} size={36} />
          <span className={styles.fabName}>{currentEmp.name}</span>
        </button>
      )}

      <Toast />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}

export default App;
