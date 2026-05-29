import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Cloud, CloudRain, Sun, Wind, Droplets } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface WeatherData {
  temp: number;
  feels_like: number;
  humidity: number;
  description: string;
  icon: string;
  wind_speed: number;
}

interface WeatherWidgetProps {
  destination: string;
}

const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;

export default function WeatherWidget({ destination }: WeatherWidgetProps) {
  const { i18n } = useTranslation();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        setError(false);

        // Extraer solo el nombre de la ciudad (antes de la coma si existe)
        const city = destination.split(/[,\s]/)[0].trim();

        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=${i18n.language === 'en' ? 'en' : 'es'}`
        );

        if (!response.ok) throw new Error('Weather fetch failed');

        const data = await response.json();

        setWeather({
          temp: Math.round(data.main.temp),
          feels_like: Math.round(data.main.feels_like),
          humidity: data.main.humidity,
          description: data.weather[0].description,
          icon: data.weather[0].icon,
          wind_speed: data.wind.speed,
        });
      } catch (err) {
        console.error('Error fetching weather:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (destination) {
      fetchWeather();
    }
  }, [destination]);

  if (loading) {
    return (
      <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          {i18n.language === 'en' ? 'Loading weather...' : 'Cargando clima...'}
        </div>
      </Card>
    );
  }

  if (error || !weather) {
    return null; // No mostrar nada si hay error
  }

  const getWeatherIcon = (iconCode: string) => {
    if (iconCode.includes('01')) return <Sun className="h-8 w-8 text-yellow-500" />;
    if (iconCode.includes('02') || iconCode.includes('03') || iconCode.includes('04')) 
      return <Cloud className="h-8 w-8 text-gray-400" />;
    if (iconCode.includes('09') || iconCode.includes('10') || iconCode.includes('11')) 
      return <CloudRain className="h-8 w-8 text-blue-500" />;
    return <Sun className="h-8 w-8 text-yellow-500" />;
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            {getWeatherIcon(weather.icon)}
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{weather.temp}°</span>
              <span className="text-sm text-muted-foreground">
                {i18n.language === 'en' ? 'Feels like' : 'Sensación'} {weather.feels_like}°
              </span>
            </div>
            <p className="text-sm text-muted-foreground capitalize mt-1">
              {weather.description}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 text-right">
          <div className="flex items-center gap-2 text-sm">
            <Wind className="h-4 w-4 text-muted-foreground" />
            <span>{weather.wind_speed} m/s</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Droplets className="h-4 w-4 text-muted-foreground" />
            <span>{weather.humidity}%</span>
          </div>
        </div>
      </div>
    </Card>
  );
}