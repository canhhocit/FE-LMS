// Clazz service
import { USE_MOCK, apiClient, unwrap } from "./api/client";
import { delay, mockClasses, mockUsers } from "./mock";
import type { Clazz, User } from "../types";

const normalizeClazz = (clazz: Clazz): Clazz => ({
  ...clazz,
  code: clazz.code ?? clazz.classCode ?? '',
  name: clazz.name ?? clazz.className ?? '',
  status: clazz.status ?? 'ACTIVE',
  studentCount: clazz.studentCount ?? clazz.maxStudents ?? 0,
  classCode: clazz.classCode ?? clazz.code ?? '',
  className: clazz.className ?? clazz.name ?? '',
});

export const getMyClasses = async (): Promise<Clazz[]> => {
  if (USE_MOCK) { await delay(); return [...mockClasses].map(normalizeClazz); }
  return unwrap<Clazz[]>(apiClient.get("/me/classes")).then((items) => items.map(normalizeClazz));
};

export const getClazzDetail = async (id: number): Promise<Clazz> => {
  if (USE_MOCK) {
    await delay();
    const c = mockClasses.find((x) => x.id === id);
    if (!c) throw Object.assign(new Error("Not found"), { code: 404 });
    return normalizeClazz(c);
  }
  return unwrap<Clazz>(apiClient.get(`/admin/classes/${id}`)).then(normalizeClazz);
};

export const getClassStudents = async (classId: number): Promise<User[]> => {
  if (USE_MOCK) {
    await delay();
    const c = mockClasses.find((x) => x.id === classId);
    if (!c) return [];
    return mockUsers.filter((u) => u.role === "STUDENT" && c.studentIds?.includes(u.id));
  }
  return unwrap<User[]>(apiClient.get(`/admin/classes/${classId}/students`));
};

export const createClazz = async (data: Omit<Clazz, "id">): Promise<Clazz> => {
  if (USE_MOCK) {
    await delay();
    const c: Clazz = { id: Date.now(), ...data };
    mockClasses.push(c);
    return normalizeClazz(c);
  }
  return unwrap<Clazz>(apiClient.post("/admin/classes", data)).then(normalizeClazz);
};

export const updateClazz = async (id: number, data: Partial<Clazz>): Promise<Clazz> => {
  if (USE_MOCK) {
    await delay();
    const idx = mockClasses.findIndex((x) => x.id === id);
    if (idx < 0) throw Object.assign(new Error("Not found"), { code: 404 });
    mockClasses[idx] = { ...mockClasses[idx], ...data };
    return normalizeClazz(mockClasses[idx]);
  }
  return unwrap<Clazz>(apiClient.put(`/admin/classes/${id}`, data)).then(normalizeClazz);
};

export const deleteClazz = async (id: number): Promise<void> => {
  if (USE_MOCK) {
    await delay();
    const idx = mockClasses.findIndex((x) => x.id === id);
    if (idx >= 0) mockClasses.splice(idx, 1);
    return;
  }
  await unwrap<void>(apiClient.delete(`/admin/classes/${id}`));
};

export const enrollStudents = async (classId: number, studentIds: number[]): Promise<void> => {
  if (USE_MOCK) {
    await delay();
    const c = mockClasses.find((x) => x.id === classId);
    if (c) c.studentIds = Array.from(new Set([...(c.studentIds ?? []), ...studentIds]));
    return;
  }
  await unwrap<void>(apiClient.post(`/admin/classes/${classId}/enroll`, { studentIds }));
};

export const removeStudent = async (classId: number, studentId: number): Promise<void> => {
  if (USE_MOCK) {
    await delay();
    const c = mockClasses.find((x) => x.id === classId);
    if (c?.studentIds) c.studentIds = c.studentIds.filter((s) => s !== studentId);
    return;
  }
  await unwrap<void>(apiClient.delete(`/admin/classes/${classId}/students/${studentId}`));
};
