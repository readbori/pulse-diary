import { 
  Smile, Heart, Zap, Leaf, Sunrise, Crown, 
  CloudRain, Moon, Flame, AlertTriangle, Waves, Ghost, 
  EyeOff, Ban, Sparkles, HelpCircle, Coffee, Clock 
} from 'lucide-react';
import type { EmotionType } from '@/types';
import { normalizeEmotion, getEmotionDotColor, emotionIconNames } from '@/lib/emotions';

const iconMap: Record<string, React.ComponentType<any>> = {
  Smile, Heart, Zap, Leaf, Sunrise, Crown,
  CloudRain, Moon, Flame, AlertTriangle, Waves, Ghost,
  EyeOff, Ban, Sparkles, HelpCircle, Coffee, Clock
};

interface EmotionIconProps {
  emotion: EmotionType | string | undefined;
  size?: number; // Icon size in pixels
  className?: string; // Class for the badge container
}

export function EmotionIcon({ emotion, size = 24, className }: EmotionIconProps) {
  const normalized = normalizeEmotion(emotion);
  const color = getEmotionDotColor(normalized);
  const iconName = normalized ? emotionIconNames[normalized] : 'HelpCircle';
  const IconComponent = iconMap[iconName] || HelpCircle;

  // Default badge class if not provided
  const badgeClass = className || 'w-10 h-10';

  return (
    <div 
      className={`rounded-full flex items-center justify-center ${badgeClass}`}
      style={{ backgroundColor: `${color}33` }} // 20% opacity
    >
      <IconComponent 
        size={size} 
        color={color} 
        strokeWidth={2.5}
      />
    </div>
  );
}
