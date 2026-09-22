export interface CourseScheduleSlot {
  courseCode: string;
  courseName: string;
  dayOfWeek: number; // 2 = Mon, 3 = Tue, ... 7 = Sat, 8 = Sun
  startPeriod: number; // 1 - 12
  endPeriod: number;   // 1 - 12
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflictDetails?: string;
}

export const checkScheduleConflict = (
  enrolledCourses: CourseScheduleSlot[],
  targetCourse: CourseScheduleSlot
): ConflictCheckResult => {
  for (const course of enrolledCourses) {
    if (course.dayOfWeek === targetCourse.dayOfWeek) {
      // Overlap condition: startA <= endB && startB <= endA
      if (
        targetCourse.startPeriod <= course.endPeriod &&
        course.startPeriod <= targetCourse.endPeriod
      ) {
        return {
          hasConflict: true,
          conflictDetails: `Cảnh báo xung đột lịch học: Học phần [${targetCourse.courseName}] trùng lịch Thứ ${targetCourse.dayOfWeek} (Tiết ${targetCourse.startPeriod}-${targetCourse.endPeriod}) với học phần [${course.courseName}] (Tiết ${course.startPeriod}-${course.endPeriod}).`,
        };
      }
    }
  }
  return { hasConflict: false };
};
