import { motion } from 'framer-motion';

interface LandingPageProps {
  onEnterRace: () => void;
  onChooseSession?: () => void;
}

export function LandingPage({ onEnterRace, onChooseSession }: LandingPageProps) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-background overflow-hidden">
      {/* Subtle background grid */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(0 0% 50%) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(0 0% 50%) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
      
      {/* Subtle radial gradient */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: 'radial-gradient(ellipse at center, hsl(0 85% 50% / 0.05) 0%, transparent 70%)',
        }}
      />

      {/* Content */}
      <motion.div 
        className="relative z-10 max-w-4xl mx-auto px-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {/* Quote */}
        <motion.blockquote
          className="mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <p className="quote-text text-2xl md:text-3xl lg:text-4xl leading-relaxed font-light tracking-wide">
            "The track moves. Rivals close in. Pressure becomes visible.
          </p>
          <p className="quote-text text-2xl md:text-3xl lg:text-4xl leading-relaxed font-light tracking-wide mt-4">
            You don't watch the race unfold — you follow it."
          </p>
        </motion.blockquote>

        {/* Actions */}
        <motion.div 
          className="flex flex-col items-center gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <button 
            onClick={onEnterRace}
            className="btn-cta rounded text-foreground"
          >
            Enter Race View
          </button>
          
          <button
            type="button"
            onClick={onChooseSession}
            className="btn-secondary rounded"
          >
            Choose Session
          </button>
        </motion.div>
      </motion.div>

      {/* Bottom decorative line */}
      <motion.div 
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, hsl(0 85% 50% / 0.3) 50%, transparent 100%)',
        }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.5, delay: 0.8 }}
      />
    </div>
  );
}
