const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const src = path.join(root, 'src');
const lines = fs.readFileSync(path.join(src, 'App.js'), 'utf8').split(/\n/);

function slice(start, end) {
  return lines.slice(start - 1, end).join('\n').replace(/\s+$/, '') + '\n';
}

function write(rel, body) {
  const full = path.join(src, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, body.replace(/\r?\n/g, '\n'), 'utf8');
  console.log('wrote', rel);
}

function exportConst(block, name) {
  return block.replace(`const ${name} =`, `export const ${name} =`);
}

write('data/earthTextures.js', exportConst(slice(46, 56), 'EARTH_TEXTURES'));
write('data/elementSpecs.js', exportConst(slice(58, 66), 'ELEMENT_SPECS'));
write('data/themes.js', exportConst(slice(68, 139), 'UI_THEMES'));
write(
  'data/geographyModels.js',
  slice(141, 143) + exportConst(slice(144, 350), 'GEOGRAPHY_MODELS')
);
write(
  'data/chemistryModels.js',
  slice(352, 354) + exportConst(slice(355, 590), 'CHEMISTRY_MODELS')
);
write(
  'data/models.js',
  `import { GEOGRAPHY_MODELS } from './geographyModels';
import { CHEMISTRY_MODELS } from './chemistryModels';

export const ALL_MODELS = [...GEOGRAPHY_MODELS, ...CHEMISTRY_MODELS];
`
);

const providerBody = slice(594, 955)
  .replace('function StudioProvider', 'export function StudioProvider');
const hookBody = slice(956, 956).replace(
  'const useStudio =',
  'export const useStudio ='
);

write(
  'context/StudioContext.js',
  `import { useState, useRef, useEffect, createContext, useContext } from 'react';
import { UI_THEMES } from '../data/themes';
import { GEOGRAPHY_MODELS } from '../data/geographyModels';
import { CHEMISTRY_MODELS } from '../data/chemistryModels';
import { ALL_MODELS } from '../data/models';

const StudioContext = createContext(null);

${providerBody}
${hookBody}
`
);

write(
  'components/AuthModal.js',
  `import { useState } from 'react';
import { Globe, Palette, AlertCircle } from 'lucide-react';
import { UI_THEMES } from '../data/themes';
import { useStudio } from '../context/StudioContext';

${slice(958, 1184).replace('function AuthModal', 'export default function AuthModal')}
`
);

write(
  'components/SubjectLauncherModal.js',
  `import { useState } from 'react';
import { FlaskConical, Globe, Cpu } from 'lucide-react';
import { GEOGRAPHY_MODELS } from '../data/geographyModels';
import { CHEMISTRY_MODELS } from '../data/chemistryModels';
import { useStudio } from '../context/StudioContext';

${slice(1185, 1380).replace('function SubjectLauncherModal', 'export default function SubjectLauncherModal')}
`
);

write(
  'components/TopToolbar.js',
  `import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Play,
  Pause,
  Grid,
  Glasses,
  Layers,
  Globe,
  UserCheck,
  LogOut,
  Maximize2,
  Ruler,
  Wrench,
} from 'lucide-react';
import { UI_THEMES } from '../data/themes';
import { useStudio } from '../context/StudioContext';

${slice(1381, 1587).replace('function TopToolbar', 'export default function TopToolbar')}
`
);

write(
  'components/LeftDrawer.js',
  `import { FlaskConical, Globe, Eye, EyeOff, ChevronLeft, ChevronRight, Cpu } from 'lucide-react';
import { GEOGRAPHY_MODELS } from '../data/geographyModels';
import { CHEMISTRY_MODELS } from '../data/chemistryModels';
import { useStudio } from '../context/StudioContext';

${slice(1588, 1842).replace('function LeftDrawer', 'export default function LeftDrawer')}
`
);

write(
  'components/Viewport3D.js',
  `import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EARTH_TEXTURES } from '../data/earthTextures';
import { ELEMENT_SPECS } from '../data/elementSpecs';
import { CHEMISTRY_MODELS } from '../data/chemistryModels';
import { useStudio } from '../context/StudioContext';

${slice(1843, 2942).replace('function Viewport3D', 'export default function Viewport3D')}
`
);

write(
  'components/RightDrawer.js',
  `import { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Award,
  MessageSquarePlus,
  Check,
  Zap,
  Code2,
  PlayCircle,
} from 'lucide-react';
import { useStudio } from '../context/StudioContext';

${slice(2943, 3663).replace('function RightDrawer', 'export default function RightDrawer')}
`
);

write(
  'components/StudioShell.js',
  `import { useStudio } from '../context/StudioContext';
import AuthModal from './AuthModal';
import SubjectLauncherModal from './SubjectLauncherModal';
import TopToolbar from './TopToolbar';
import LeftDrawer from './LeftDrawer';
import Viewport3D from './Viewport3D';
import RightDrawer from './RightDrawer';

${slice(3665, 3682).replace('function StudioShell', 'export default function StudioShell')}
`
);

write(
  'App.js',
  `import { StudioProvider } from './context/StudioContext';
import StudioShell from './components/StudioShell';

export default function App() {
  return (
    <StudioProvider>
      <StudioShell />
    </StudioProvider>
  );
}
`
);
