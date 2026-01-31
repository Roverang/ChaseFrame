import { Cloud, CloudRain, Sun, Thermometer, Wind, Droplets } from 'lucide-react';
import { WeatherInfo } from '@/types/race';

interface WeatherIndicatorProps {
  weather: WeatherInfo;
}

export function WeatherIndicator({ weather }: WeatherIndicatorProps) {
  const getWeatherIcon = () => {
    switch (weather.condition) {
      case 'clear':
        return <Sun className="w-4 h-4 text-[hsl(var(--weather-clear))]" />;
      case 'cloudy':
        return <Cloud className="w-4 h-4 text-[hsl(var(--weather-cloudy))]" />;
      case 'light-rain':
      case 'heavy-rain':
        return <CloudRain className="w-4 h-4 text-[hsl(var(--weather-rain))]" />;
    }
  };

  const getConditionLabel = () => {
    switch (weather.condition) {
      case 'clear': return 'CLEAR';
      case 'cloudy': return 'CLOUDY';
      case 'light-rain': return 'LIGHT RAIN';
      case 'heavy-rain': return 'HEAVY RAIN';
    }
  };

  return (
    <div className="flex items-center gap-4">
      {/* Weather Condition */}
      <div className="flex items-center gap-1.5">
        {getWeatherIcon()}
        <span className="font-display text-xs tracking-wider text-muted-foreground">
          {getConditionLabel()}
        </span>
      </div>

      {/* Track Temperature */}
      <div className="flex items-center gap-1.5">
        <Thermometer className="w-3.5 h-3.5 text-primary" />
        <span className="font-display text-xs tracking-wider">
          <span className="text-foreground">{weather.trackTemp}°</span>
          <span className="text-muted-foreground ml-1">TRACK</span>
        </span>
      </div>

      {/* Air Temperature */}
      <div className="flex items-center gap-1.5">
        <Wind className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="font-display text-xs tracking-wider text-muted-foreground">
          {weather.airTemp}°
        </span>
      </div>

      {/* Humidity */}
      <div className="flex items-center gap-1.5">
        <Droplets className="w-3.5 h-3.5 text-[hsl(var(--weather-rain))]" />
        <span className="font-display text-xs tracking-wider text-muted-foreground">
          {weather.humidity}%
        </span>
      </div>
    </div>
  );
}
