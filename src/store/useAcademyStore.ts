"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { useEconomyStore } from "./useEconomyStore"
import { JTU_CURRICULUM } from "@/data/academyData"

export interface CourseState {
  status: "locked" | "unlocked" | "completed";
  grade?: number;                     // Final calculated average grade
  completedAt?: string;
  currentWeek: number;                // Active week (1 to 16)
  weeklyGrades: Record<number, number>; // Individual grades per week
}

interface AcademyState {
  kardex: Record<string, CourseState>;
  activeCourseCode: string;
  pkdEarnedTotal: number;

  selectCourse: (code: string) => void;
  completeWeek: (code: string, grade: number) => Promise<{ finishedCourse: boolean; gradeCalculated?: number }>;
  completeCourse: (code: string, grade: number) => Promise<boolean>;
  resetAcademy: () => void;
  getGPA: () => number;
  getCreditsEarned: () => number;
}

// Initial state creator
const createInitialKardex = (): Record<string, CourseState> => {
  const initial: Record<string, CourseState> = {};
  JTU_CURRICULUM.forEach((course) => {
    // Semestre 1 starts unlocked, others locked
    initial[course.code] = {
      status: course.semester === 1 ? "unlocked" : "locked",
      currentWeek: 1,
      weeklyGrades: {},
    };
  });
  return initial;
};

export const useAcademyStore = create<AcademyState>()(
  persist(
    (set, get) => ({
      kardex: createInitialKardex(),
      activeCourseCode: "MAP-101",
      pkdEarnedTotal: 0,

      selectCourse: (code: string) => {
        set({ activeCourseCode: code });
      },

      completeWeek: async (code: string, grade: number) => {
        const { kardex, pkdEarnedTotal } = get();
        const currentCourse = kardex[code];

        if (!currentCourse || currentCourse.status === "locked") {
          return { finishedCourse: false };
        }

        const updatedKardex = { ...kardex };
        
        // Defensive hydration of weekly fields in case loading an older saved store
        const courseState: CourseState = {
          status: currentCourse.status,
          grade: currentCourse.grade,
          completedAt: currentCourse.completedAt,
          currentWeek: currentCourse.currentWeek || (currentCourse.status === "completed" ? 16 : 1),
          weeklyGrades: currentCourse.weeklyGrades || {},
        };

        const activeWeek = courseState.currentWeek;
        
        // Record week grade (keep the highest grade obtained)
        courseState.weeklyGrades[activeWeek] = Math.max(grade, courseState.weeklyGrades[activeWeek] || 0);

        let finishedCourse = false;
        let finalCourseGrade: number | undefined = undefined;
        let newPkdEarned = pkdEarnedTotal;

        if (activeWeek < 16) {
          // Unlock next week
          courseState.currentWeek = activeWeek + 1;
        } else {
          // Week 16 is final exam! Complete the course!
          finishedCourse = true;
          courseState.status = "completed";
          courseState.completedAt = new Date().toISOString();

          // Calculate final grade:
          // 30% weekly average (excluding exams 6 and 12) + 20% parcial1 (week 6) + 20% parcial2 (week 12) + 30% final exam (week 16)
          const wGrades = courseState.weeklyGrades;
          const parcial1 = wGrades[6] || 0;
          const parcial2 = wGrades[12] || 0;
          const finalExam = wGrades[16] || 0;

          const otherWeeksGrades: number[] = [];
          for (let w = 1; w <= 15; w++) {
            if (w !== 6 && w !== 12) {
              otherWeeksGrades.push(wGrades[w] || 0);
            }
          }
          const weeklyAverage = otherWeeksGrades.length > 0 
            ? otherWeeksGrades.reduce((sum, g) => sum + g, 0) / otherWeeksGrades.length
            : 0;

          finalCourseGrade = parseFloat(
            ((weeklyAverage * 0.3) + (parcial1 * 0.2) + (parcial2 * 0.2) + (finalExam * 0.3)).toFixed(2)
          );
          
          courseState.grade = finalCourseGrade;

          // Check if all courses in the semester are completed, to unlock the next semester
          const courseData = JTU_CURRICULUM.find((c) => c.code === code);
          if (courseData) {
            const currentSemester = courseData.semester;
            const semesterCourses = JTU_CURRICULUM.filter(
              (c) => c.semester === currentSemester
            );

            const allSemesterCompleted = semesterCourses.every(
              (c) =>
                c.code === code || updatedKardex[c.code]?.status === "completed"
            );

            if (allSemesterCompleted && currentSemester < 8) {
              // Unlock all courses of the next semester
              const nextSemester = currentSemester + 1;
              JTU_CURRICULUM.filter((c) => c.semester === nextSemester).forEach(
                (c) => {
                  if (updatedKardex[c.code]?.status !== "completed") {
                    updatedKardex[c.code] = {
                      status: "unlocked",
                      currentWeek: 1,
                      weeklyGrades: {},
                    };
                  }
                }
              );
            }

            // Award PKD if it's the first time they pass
            const isFirstTime = currentCourse.status !== "completed";
            if (isFirstTime) {
              const reward = courseData.rewardPKD || 500;
              newPkdEarned += reward;
              
              try {
                await useEconomyStore.getState().modifySaldo(reward, `academy_${code}`);
              } catch (err) {
                console.error("[AcademyStore] Error modifying PKD balance:", err);
              }
            }
          }
        }

        updatedKardex[code] = courseState;

        set({
          kardex: updatedKardex,
          pkdEarnedTotal: newPkdEarned,
        });

        return { finishedCourse, gradeCalculated: finalCourseGrade };
      },

      // Backwards compatibility layer
      completeCourse: async (code: string, grade: number) => {
        const { finishedCourse } = await get().completeWeek(code, grade);
        return finishedCourse || true;
      },

      resetAcademy: () => {
        set({
          kardex: createInitialKardex(),
          activeCourseCode: "MAP-101",
          pkdEarnedTotal: 0,
        });
      },

      getGPA: () => {
        const { kardex } = get();
        const completedCourses = Object.values(kardex).filter(
          (c) => c.status === "completed" && typeof c.grade === "number"
        );
        if (completedCourses.length === 0) return 0;
        const total = completedCourses.reduce((acc, c) => acc + (c.grade || 0), 0);
        return parseFloat((total / completedCourses.length).toFixed(2));
      },

      getCreditsEarned: () => {
        const { kardex } = get();
        // Each completed course gives 3 credits
        const completedCount = Object.values(kardex).filter(
          (c) => c.status === "completed"
        ).length;
        return completedCount * 3;
      },
    }),
    {
      name: "jtu-academy-store-v2", // Updated name to avoid key clashes
    }
  )
);
