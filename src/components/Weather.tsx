import { useState, useEffect } from 'react';
import { Cloud, CloudRain, CloudSun, Sun, Wind, CloudSnow, CloudLightning, Loader2, MapPin } from 'lucide-react';

interface WeatherData {
  temp: number;
  condition: string;
  conditionCode: number;
  location: string;
  humidity: number;
  wind: number;
}

const conditionMap: Record<number, string> = {
  0: '晴朗', 1: '晴朗', 2: '局部多云', 3: '多云',
  45: '雾', 48: '雾', 51: '小雨', 53: '中雨', 55: '大雨',
  56: '冻雨', 57: '冻雨', 61: '小雨', 63: '中雨', 65: '大雨',
  66: '冻雨', 67: '冻雨', 71: '小雪', 73: '中雪', 75: '大雪',
  77: '雪', 80: '阵雨', 81: '阵雨', 82: '暴雨',
  85: '阵雪', 86: '阵雪', 95: '雷暴', 96: '雷暴', 99: '雷暴'
};

export const Weather = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
        const geoData = await geoRes.json();
        const city = geoData.address?.city || geoData.address?.town || geoData.address?.county || '未知';

        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`
        );
        const weatherData = await weatherRes.json();
        const current = weatherData.current;

        setWeather({
          temp: Math.round(current.temperature_2m),
          condition: conditionMap[current.weather_code] || '未知',
          conditionCode: current.weather_code,
          location: city,
          humidity: current.relative_humidity_2m,
          wind: Math.round(current.wind_speed_10m)
        });
        setLoading(false);
      } catch (e) {
        setError('获取天气失败');
        setLoading(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => {
          setError('需要位置权限');
          setLoading(false);
        },
        { timeout: 10000 }
      );
    } else {
      setError('浏览器不支持定位');
      setLoading(false);
    }
  }, []);

  const getIcon = () => {
    if (!weather) return <Cloud size={32} className="text-white" />;
    const code = weather.conditionCode;
    if (code >= 95) return <CloudLightning size={32} className="text-yellow-300" />;
    if (code >= 71 && code <= 86) return <CloudSnow size={32} className="text-blue-100" />;
    if (code >= 51 && code <= 82) return <CloudRain size={32} className="text-blue-300" />;
    if (code === 2) return <CloudSun size={32} className="text-yellow-100" />;
    if (code === 3 || code >= 45) return <Cloud size={32} className="text-white" />;
    return <Sun size={32} className="text-yellow-400" />;
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white">
        <Loader2 size={24} className="animate-spin opacity-50" />
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white/60 text-sm">
        {error || '无数据'}
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col justify-center items-center p-4 text-white select-none">
      <div className="flex items-center gap-4">
        {getIcon()}
        <div className="flex flex-col">
          <span className="text-4xl font-light">{weather.temp}°</span>
          <span className="text-sm opacity-80">{weather.condition}</span>
        </div>
      </div>
      <div className="flex gap-4 mt-3 text-xs opacity-70">
        <div className="flex items-center gap-1">
          <Wind size={12} />
          <span>{weather.wind} km/h</span>
        </div>
        <div>湿度: {weather.humidity}%</div>
      </div>
      <div className="mt-1 text-xs font-medium tracking-wider flex items-center gap-1 opacity-60">
        <MapPin size={10} />
        {weather.location}
      </div>
    </div>
  );
};
