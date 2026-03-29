export const getInitials = (name: string, fallback = '?'): string =>
  name ? name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() : fallback;
