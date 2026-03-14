import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase, Palette, Code, HeartPulse, TrendingUp,
  GraduationCap, Flame, ChevronDown,
} from "lucide-react";
import { useState } from "react";

const PERSONALITIES = [
  { id: "professional", label: "Professional", icon: Briefcase, color: "text-blue-400" },
  { id: "creative", label: "Creative", icon: Palette, color: "text-pink-400" },
  { id: "coding", label: "Coding", icon: Code, color: "text-green-400" },
  { id: "medical", label: "Medical Expert", icon: HeartPulse, color: "text-red-400" },
  { id: "business", label: "Business Advisor", icon: TrendingUp, color: "text-amber-400" },
  { id: "interview", label: "Interview Coach", icon: GraduationCap, color: "text-purple-400" },
  { id: "motivational", label: "Motivational", icon: Flame, color: "text-orange-400" },
];

type Props = {
  value: string;
  onChange: (id: string) => void;
};

const PersonalitySelector = ({ value, onChange }: Props) => {
  const [open, setOpen] = useState(false);
  const selected = PERSONALITIES.find((p) => p.id === value) || PERSONALITIES[0];
  const Icon = selected.icon;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass text-sm hover:bg-secondary/80 transition-colors"
      >
        <Icon className={`w-4 h-4 ${selected.color}`} />
        <span className="text-foreground">{selected.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute top-full mt-1 left-0 w-52 glass-strong rounded-xl p-1.5 z-50 shadow-xl"
          >
            {PERSONALITIES.map((p) => {
              const PIcon = p.icon;
              return (
                <button
                  key={p.id}
                  onClick={() => { onChange(p.id); setOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                    p.id === value ? "bg-primary/15 text-primary" : "text-foreground hover:bg-secondary/50"
                  }`}
                >
                  <PIcon className={`w-4 h-4 ${p.color}`} />
                  {p.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PersonalitySelector;
