import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { EmployeeId, RoomId } from '../types';

interface AppState {
  current: RoomId;
  transitioning: boolean;
  eId: EmployeeId;
  navOpen: boolean;
  panelOpen: boolean;
  notifOpen: boolean;
  toast: string | null;
  vw: number;
  now: Date;
}

interface AppApi extends AppState {
  isMobile: boolean;
  isDesktop: boolean;
  go: (id: RoomId) => void;
  selectEmployee: (id: EmployeeId) => void;
  toggleNav: () => void;
  togglePanel: () => void;
  toggleNotif: () => void;
  closeNotif: () => void;
  showToast: (message: string) => void;
}

const AppCtx = createContext<AppApi | null>(null);

const MOBILE_BREAKPOINT = 900;
const TRANSITION_MS = 620;
const TOAST_MS = 2800;

export function AppProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<RoomId>('lobby');
  const [transitioning, setTransitioning] = useState(false);
  const [eId, setEId] = useState<EmployeeId>('nova');
  const [navOpen, setNavOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [vw, setVw] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1280));
  const [now, setNow] = useState(() => new Date());

  const transitionTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener('resize', onResize);
    const clock = setInterval(() => setNow(new Date()), 30_000);
    return () => {
      window.removeEventListener('resize', onResize);
      clearInterval(clock);
      if (transitionTimer.current) clearTimeout(transitionTimer.current);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const isMobile = vw < MOBILE_BREAKPOINT;
  const isDesktop = !isMobile;

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), TOAST_MS);
  }, []);

  const go = useCallback(
    (id: RoomId) => {
      setCurrent((prevCurrent) => {
        if (id === prevCurrent) {
          setNavOpen(false);
          return prevCurrent;
        }
        setNavOpen(false);
        setNotifOpen(false);
        setTransitioning(true);
        if (transitionTimer.current) clearTimeout(transitionTimer.current);
        transitionTimer.current = setTimeout(() => setTransitioning(false), TRANSITION_MS);
        return id;
      });
    },
    [],
  );

  const selectEmployee = useCallback((id: EmployeeId) => {
    setEId(id);
    setPanelOpen((prev) => (window.innerWidth < MOBILE_BREAKPOINT ? true : prev));
  }, []);

  const toggleNav = useCallback(() => setNavOpen((v) => !v), []);
  const togglePanel = useCallback(() => setPanelOpen((v) => !v), []);
  const toggleNotif = useCallback(() => setNotifOpen((v) => !v), []);
  const closeNotif = useCallback(() => setNotifOpen(false), []);

  const value = useMemo<AppApi>(
    () => ({
      current,
      transitioning,
      eId,
      navOpen,
      panelOpen,
      notifOpen,
      toast,
      vw,
      now,
      isMobile,
      isDesktop,
      go,
      selectEmployee,
      toggleNav,
      togglePanel,
      toggleNotif,
      closeNotif,
      showToast,
    }),
    [
      current,
      transitioning,
      eId,
      navOpen,
      panelOpen,
      notifOpen,
      toast,
      vw,
      now,
      isMobile,
      isDesktop,
      go,
      selectEmployee,
      toggleNav,
      togglePanel,
      toggleNotif,
      closeNotif,
      showToast,
    ],
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp(): AppApi {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
