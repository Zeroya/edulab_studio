import { StudioProvider } from './context/StudioContext';
import StudioShell from './components/StudioShell';

export default function App() {
  return (
    <StudioProvider>
      <StudioShell />
    </StudioProvider>
  );
}
