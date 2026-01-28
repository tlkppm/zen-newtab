import { useState, useEffect } from 'react';
import { Cloud, CloudRain, CloudSun, Sun, Wind, CloudSnow, CloudLightning, Loader2, MapPin, CloudFog, CloudDrizzle } from 'lucide-react';

interface WeatherData {
  temp: number;
  condition: string;
  conditionCode: string;
  location: string;
  humidity: number;
  wind: number;
}

export const Weather = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getChineseLocation = async (lat: number, lon: number): Promise<string> => {
      try {
        const res = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=zh`
        );
        if (!res.ok) throw new Error();
        const data = await res.json();
        return data.city || data.locality || data.principalSubdivision || data.countryName || '未知位置';
      } catch {
        return '未知位置';
      }
    };

    const fetchWeatherByIP = async () => {
      try {
        const res = await fetch('https://wttr.in/?format=j1', {
          headers: { 'Accept-Language': 'zh-CN' }
        });
        if (!res.ok) throw new Error('wttr.in 请求失败');
        const data = await res.json();
        const current = data.current_condition?.[0];
        const area = data.nearest_area?.[0];
        
        if (!current) throw new Error('无天气数据');

        let location = '未知位置';
        if (area?.latitude && area?.longitude) {
          location = await getChineseLocation(
            parseFloat(area.latitude),
            parseFloat(area.longitude)
          );
        }

        const conditionCN = current.lang_zh?.[0]?.value || current.weatherDesc?.[0]?.value || '未知';

        setWeather({
          temp: parseInt(current.temp_C, 10),
          condition: conditionCN,
          conditionCode: current.weatherCode || '0',
          location,
          humidity: parseInt(current.humidity, 10),
          wind: Math.round(parseInt(current.windspeedKmph, 10))
        });
        setLoading(false);
      } catch {
        tryFallbackAPI();
      }
    };

    const tryFallbackAPI = async () => {
      if (!navigator.geolocation) {
        setError('浏览器不支持定位');
        setLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const { latitude, longitude } = pos.coords;
            
            const [weatherRes, locationName] = await Promise.all([
              fetch(`https://wttr.in/${latitude},${longitude}?format=j1`, {
                headers: { 'Accept-Language': 'zh-CN' }
              }),
              getChineseLocation(latitude, longitude)
            ]);
            
            if (!weatherRes.ok) throw new Error('请求失败');
            const data = await weatherRes.json();
            const current = data.current_condition?.[0];

            if (!current) throw new Error('无数据');

            const conditionCN = current.lang_zh?.[0]?.value || current.weatherDesc?.[0]?.value || '未知';

            setWeather({
              temp: parseInt(current.temp_C, 10),
              condition: conditionCN,
              conditionCode: current.weatherCode || '0',
              location: locationName,
              humidity: parseInt(current.humidity, 10),
              wind: Math.round(parseInt(current.windspeedKmph, 10))
            });
            setLoading(false);
          } catch {
            setError('获取天气失败');
            setLoading(false);
          }
        },
        () => {
          setError('需要位置权限');
          setLoading(false);
        },
        { timeout: 10000 }
      );
    };

    fetchWeatherByIP();
  }, []);

  const getIcon = () => {
    if (!weather) return <Cloud size={32} className="text-white" />;
    const code = parseInt(weather.conditionCode, 10);
    const condition = weather.condition.toLowerCase();
    
    if (condition.includes('雷') || condition.includes('thunder')) {
      return <CloudLightning size={32} className="text-yellow-300" />;
    }
    if (condition.includes('雪') || condition.includes('snow')) {
      return <CloudSnow size={32} className="text-blue-100" />;
    }
    if (condition.includes('雨') || condition.includes('rain') || condition.includes('drizzle')) {
      return <CloudRain size={32} className="text-blue-300" />;
    }
    if (condition.includes('雾') || condition.includes('fog') || condition.includes('mist')) {
      return <CloudFog size={32} className="text-gray-300" />;
    }
    if (condition.includes('阴') || condition.includes('多云') || condition.includes('overcast') || condition.includes('cloudy')) {
      return <Cloud size={32} className="text-white" />;
    }
    if (condition.includes('晴') || condition.includes('sunny') || condition.includes('clear')) {
      if (condition.includes('云') || condition.includes('partly')) {
        return <CloudSun size={32} className="text-yellow-100" />;
      }
      return <Sun size={32} className="text-yellow-400" />;
    }
    if (code >= 200 && code < 300) return <CloudLightning size={32} className="text-yellow-300" />;
    if (code >= 300 && code < 400) return <CloudDrizzle size={32} className="text-blue-200" />;
    if (code >= 500 && code < 600) return <CloudRain size={32} className="text-blue-300" />;
    if (code >= 600 && code < 700) return <CloudSnow size={32} className="text-blue-100" />;
    if (code >= 700 && code < 800) return <CloudFog size={32} className="text-gray-300" />;
    if (code === 800) return <Sun size={32} className="text-yellow-400" />;
    if (code > 800) return <CloudSun size={32} className="text-yellow-100" />;
    return <Cloud size={32} className="text-white" />;
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
