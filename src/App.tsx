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
import { Decision } from './rooms/Decision';
import { Finance } from './rooms/Finance';
import { Brain } from './rooms/Brain';
import { Marketing } from './rooms/Marketing';
import { Workflow } from './rooms/Workflow';
import { Documentation } from './rooms/Documentation';
import { EmployeeRoom } from './rooms/EmployeeRoom';
import { employeeById } from './data/employees';
import styles from './App.module.css';

function RoomOutlet() {
  const { current } = useApp();
  switch (current) {
    case 'lobby':
      return <Lobby />;
    case 'mission':
      return <Mission />;
    case 'decision':
      return <Decision />;
    case 'finance':
      return <Finance />;
    case 'brain':
      return <Brain />;
    case 'marketing':
      return <Marketing />;
    case 'workflow':
      return <Workflow />;
    case 'docs':
      return <Documentation />;
    case 'employee':
      return <EmployeeRoom />;
    default:
      return null;
  }
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
