import { useStudio } from '../context/StudioContext';
import AuthModal from './AuthModal';
import SubjectLauncherModal from './SubjectLauncherModal';
import TopToolbar from './TopToolbar';
import LeftDrawer from './LeftDrawer';
import Viewport3D from './Viewport3D';
import RightDrawer from './RightDrawer';

// ============================================================================
// 5. ГОЛОВНИЙ КОНТЕЙНЕР ЗАСТОСУНКУ (App)
// ============================================================================
export default function StudioShell() {
  const { theme } = useStudio();
  return (
    <div className={`w-screen h-screen flex flex-col overflow-hidden select-none font-sans ${theme.appBg}`}>
      <AuthModal />
      <SubjectLauncherModal />
      <TopToolbar />
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        <LeftDrawer />
        <Viewport3D />
        <RightDrawer />
      </div>
    </div>
  );
}

