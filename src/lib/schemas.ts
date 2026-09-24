import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z.string().min(1, 'Vui lòng nhập tài khoản hoặc email'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    newPassword: z
      .string()
      .min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự')
      .regex(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/]/, 'Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu mới'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export const userFormSchema = z.object({
  fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  email: z.string().email('Email không đúng định dạng'),
  role: z.enum(['STUDENT', 'LECTURER', 'ADMIN']),
  password: z.string().optional(),
  studentCode: z.string().optional(),
  lecturerCode: z.string().optional(),
  faculty: z.string().optional(),
  adminClassName: z.string().optional(),
  adminClassId: z.string().optional(),
  active: z.boolean().default(true),
});

export type UserFormData = z.infer<typeof userFormSchema>;

export const createClassSchema = z.object({
  classCode: z.string().min(2, 'Mã lớp phải có ít nhất 2 ký tự'),
  className: z.string().min(2, 'Tên lớp phải có ít nhất 2 ký tự'),
  courseId: z.string().min(1, 'Vui lòng chọn môn học'),
  lecturerId: z.string().optional(),
  maxStudents: z.coerce.number().min(1, 'Sĩ số phải lớn hơn 0'),
  semester: z.string().min(1, 'Vui lòng chọn học kỳ'),
  academicYear: z.string().min(1, 'Vui lòng nhập năm học'),
});

export type CreateClassFormData = z.infer<typeof createClassSchema>;
