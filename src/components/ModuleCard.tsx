import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

interface ModuleCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  colorVar: string;
  features: string[];
  status?: "active" | "coming-soon";
}

const ModuleCard = ({ title, description, icon: Icon, colorVar, features, status = "active" }: ModuleCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="glass-card glow-border rounded-lg p-6 flex flex-col gap-4 relative overflow-hidden group cursor-pointer"
    >
      {/* Animated glow effect */}
      <motion.div
        animate={{
          scale: isHovered ? [1, 1.2, 1] : 1,
          opacity: isHovered ? [0.2, 0.3, 0.2] : 0.1,
        }}
        transition={{ duration: 2, repeat: isHovered ? Infinity : 0 }}
        className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl"
        style={{ background: `hsl(var(${colorVar}))` }}
      />

      {/* Particle effect on hover */}
      {isHovered && (
        <>
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 2], x: -20, y: -20 }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full"
            style={{ background: `hsl(var(${colorVar}))` }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 2], x: 20, y: -20 }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
            className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full"
            style={{ background: `hsl(var(${colorVar}))` }}
          />
        </>
      )}

      <div className="flex items-start justify-between relative z-10">
        <motion.div
          animate={{
            rotate: isHovered ? [0, 10, -10, 0] : 0,
          }}
          transition={{ duration: 0.5 }}
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: `hsl(var(${colorVar}) / 0.15)` }}
        >
          <Icon className="w-5 h-5" style={{ color: `hsl(var(${colorVar}))` }} />
        </motion.div>
        {status === "coming-soon" && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
            Soon
          </span>
        )}
      </div>

      <div className="relative z-10">
        <h3 className="text-foreground font-semibold text-lg mb-1">{title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      </div>

      <ul className="relative z-10 space-y-1.5 mt-auto">
        {features.map((f, i) => (
          <motion.li
            key={f}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: isHovered ? i * 0.1 : 0 }}
            className="text-xs text-muted-foreground flex items-center gap-2"
          >
            <motion.span
              animate={{
                scale: isHovered ? [1, 1.5, 1] : 1,
              }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
              className="w-1 h-1 rounded-full"
              style={{ background: `hsl(var(${colorVar}))` }}
            />
            {f}
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
};

export default ModuleCard;
