export const TEACHER_ROLES = ['teacher', 'admin'] as const;

export const isTeacherRole = (role: string) =>
  TEACHER_ROLES.includes(role as (typeof TEACHER_ROLES)[number]);
