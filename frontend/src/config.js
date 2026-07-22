export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const getUploadsUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  
  const base = API_BASE_URL || window.location.origin;
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
};
