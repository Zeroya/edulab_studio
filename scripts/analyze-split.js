const fs = require('fs');
const p = 'C:/Users/Yan/AppData/Roaming/Cursor/User/History/-1f35fc10/VTNI.js';
const lines = fs.readFileSync(p, 'utf8').split(/\n/);
const ranges = {
  provider: [594, 955],
  auth: [961, 1184],
  launcher: [1188, 1380],
  toolbar: [1384, 1587],
  left: [1591, 1842],
  viewport: [1846, 2942],
  right: [2946, 3663],
  shell: [3668, 3682],
};
const symbols = ['EARTH_TEXTURES','ELEMENT_SPECS','UI_THEMES','GEOGRAPHY_MODELS','CHEMISTRY_MODELS','ALL_MODELS','useStudio','StudioContext','THREE','OrbitControls'];
const icons = ['ZoomIn','ZoomOut','RotateCcw','Play','Pause','Grid','Glasses','Layers','FlaskConical','Globe','UserCheck','LogOut','Eye','EyeOff','Maximize2','BookOpen','CheckCircle2','ChevronLeft','ChevronRight','Sliders','Award','Ruler','Wrench','MessageSquarePlus','Check','Palette','AlertCircle','Cpu','Zap','Code2','PlayCircle'];
const hooks = ['useState','useRef','useEffect','useContext','useMemo','useCallback'];
const used = (text, arr) => arr.filter((s) => new RegExp('\\b' + s + '\\b').test(text));
for (const [name, [a, b]] of Object.entries(ranges)) {
  const text = lines.slice(a - 1, b).join('\n');
  console.log('\n== ' + name + ' lines ' + text.split('\n').length + ' ==');
  console.log('syms', used(text, symbols).join(', ') || '-');
  console.log('icons', used(text, icons).join(', ') || '-');
  console.log('hooks', used(text, hooks).join(', ') || '-');
}
