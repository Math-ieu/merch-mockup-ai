export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Return only the base64 part
        resolve(reader.result.split(',')[1]);
      } else {
        reject(new Error('Failed to read file as base64 string.'));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

export const getMimeType = (fileType: string): string | null => {
    switch (fileType) {
        case 'image/png':
            return 'image/png';
        case 'image/jpeg':
            return 'image/jpeg';
        case 'image/webp':
            return 'image/webp';
        default:
            return null;
    }
}
