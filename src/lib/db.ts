import { get, set, del } from 'idb-keyval';

export const saveVideoToDB = async (file: File): Promise<string> => {
  const key = 'custom-bg-video';
  await set(key, file);
  return URL.createObjectURL(file);
};

export const getVideoFromDB = async (): Promise<string | null> => {
  const key = 'custom-bg-video';
  const file = await get<File>(key);
  if (file) {
    return URL.createObjectURL(file);
  }
  return null;
};

export const clearVideoFromDB = async () => {
    await del('custom-bg-video');
};

export const saveImageToDB = async (file: File): Promise<string> => {
    const key = 'custom-bg-image';
    await set(key, file);
    return URL.createObjectURL(file);
};

export const getImageFromDB = async (): Promise<string | null> => {
    const key = 'custom-bg-image';
    const file = await get<File>(key);
    if (file) {
        return URL.createObjectURL(file);
    }
    return null;
};

export const clearImageFromDB = async () => {
    await del('custom-bg-image');
};

// Tile Images Support
export const saveTileImage = async (id: string, file: File): Promise<string> => {
    const key = `tile-image-${id}`;
    await set(key, file);
    return URL.createObjectURL(file);
};

export const getTileImage = async (id: string): Promise<string | null> => {
    const key = `tile-image-${id}`;
    const file = await get<File>(key);
    if (file) {
        return URL.createObjectURL(file);
    }
    return null;
};

export const deleteTileImage = async (id: string) => {
    await del(`tile-image-${id}`);
};

// Pomodoro Audio Support
export const savePomodoroAudio = async (file: File): Promise<string> => {
    const key = 'pomodoro-audio';
    await set(key, file);
    return URL.createObjectURL(file);
};

export const getPomodoroAudio = async (): Promise<string | null> => {
    const key = 'pomodoro-audio';
    const file = await get<File>(key);
    if (file) {
        return URL.createObjectURL(file);
    }
    return null;
};

export const clearPomodoroAudio = async () => {
    await del('pomodoro-audio');
};
