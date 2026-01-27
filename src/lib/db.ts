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
