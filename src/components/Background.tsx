import { useStore } from '../store/useStore';
import { useEffect, useState } from 'react';
import { getVideoFromDB, getImageFromDB } from '../lib/db';

const UNSPLASH_COLLECTIONS = [
  '1053828',
  '3330448',
  '1319040',
];

export const Background = () => {
  const { backgroundType, backgroundImage, videoTimestamp, backgroundImageSource, imageTimestamp } = useStore();
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [localImageUrl, setLocalImageUrl] = useState<string | null>(null);
  const [randomBgUrl, setRandomBgUrl] = useState<string | null>(null);

  useEffect(() => {
    if (backgroundType === 'video') {
      getVideoFromDB().then((url) => {
        if (url) {
            setVideoUrl(url);
        }
      });
    } else {
        setVideoUrl(null);
    }
  }, [backgroundType, videoTimestamp]);

  useEffect(() => {
      if (backgroundType === 'image' && backgroundImageSource === 'local') {
          getImageFromDB().then(url => {
              if (url) setLocalImageUrl(url);
              else setLocalImageUrl(null);
          });
      } else {
          setLocalImageUrl(null);
      }
  }, [backgroundType, backgroundImageSource, imageTimestamp]);

  useEffect(() => {
    if (backgroundType === 'image' && backgroundImageSource === 'url' && !backgroundImage) {
      const collection = UNSPLASH_COLLECTIONS[Math.floor(Math.random() * UNSPLASH_COLLECTIONS.length)];
      setRandomBgUrl(`https://source.unsplash.com/collection/${collection}/1920x1080`);
    } else {
      setRandomBgUrl(null);
    }
  }, [backgroundType, backgroundImageSource, backgroundImage]);

  const displayImageUrl = localImageUrl || backgroundImage || randomBgUrl;

  return (
    <div className="fixed inset-0 -z-10 bg-black overflow-hidden h-screen w-screen">
      {backgroundType === 'image' && displayImageUrl && (
        <img
          src={displayImageUrl}
          alt="Background"
          className="w-full h-full object-cover transition-opacity duration-700 ease-in-out"
        />
      )}
      
      {backgroundType === 'video' && videoUrl && (
        <video
            src={videoUrl}
            autoPlay
            muted
            loop
            className="w-full h-full object-cover"
        />
      )}

      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-black/30 pointer-events-none" />
    </div>
  );
};
