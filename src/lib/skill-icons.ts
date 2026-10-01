import {
  Atom, Braces, Cable, Cloud, Code2, Cpu, Database, FileCode2, GitBranch, Globe, HardDrive,
  Laptop, Lock, Monitor, Network, Palette, Printer, Router, Server, ShieldCheck, Terminal, Wifi,
  Camera, type LucideIcon,
} from "lucide-react";

export const SKILL_ICONS: Record<string, LucideIcon> = {
  code: Code2, palette: Palette, braces: Braces, "file-code": FileCode2, atom: Atom,
  router: Router, network: Network, cable: Cable, database: Database, wifi: Wifi,
  shield: ShieldCheck, git: GitBranch, server: Server, globe: Globe, terminal: Terminal,
  cpu: Cpu, monitor: Monitor, laptop: Laptop, cloud: Cloud, lock: Lock, printer: Printer,
  "hard-drive": HardDrive, camera: Camera,
};

export function skillIcon(name: string): LucideIcon {
  return SKILL_ICONS[name] ?? Code2;
}
