import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, Users, Award, AlertTriangle, Download } from 'lucide-react';
import { PageHeader, StatCard, Card, Button, Spinner } from '../../components/ui';
import { apiClient } from '../../services/api/client';
import * as clazzService from '../../services/clazzService';
import * as gradingService from '../../services/gradingService';
import type { Clazz, Grade } from '../../types';

export const AnalyticsDashboard: React.FC = () => {
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [classes, setClasses] = useState<Clazz[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalStudents, setTotalStudents] = useState(0);
  const [avgScore, setAvgScore] = useState<number | null>(null);
  const [attendanceRate] = useState<number | null>(null);
  const [warningCount, setWarningCount] = useState<number>(0);
  const [gradeDistribution, setGradeDistribution] = useState([
    { grade: 'A (8.5 - 10)', count: 0 },
    { grade: 'B (7.0 - 8.4)', count: 0 },
    { grade: 'C (5.5 - 6.9)', count: 0 },
    { grade: 'D (4.0 - 5.4)', count: 0 },
    { grade: 'F (< 4.0)', count: 0 },
  ]);
  const [attendanceData] = useState<{ name: string; value: number; color: string }[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const myClasses = await clazzService.getMyClasses();
        if (!mounted) return;
        setClasses(myClasses);
        setSelectedClassId(myClasses[0]?.id ?? null);

        let studentSum = 0;
        let totalScoreSum = 0;
        let scoreCount = 0;
        let warningSum = 0;
        const dist = [
          { grade: 'A (8.5 - 10)', count: 0 },
          { grade: 'B (7.0 - 8.4)', count: 0 },
          { grade: 'C (5.5 - 6.9)', count: 0 },
          { grade: 'D (4.0 - 5.4)', count: 0 },
          { grade: 'F (< 4.0)', count: 0 },
        ];

        for (const c of myClasses) {
          studentSum += c.currentStudents || 0;
          try {
            const grades: Grade[] = await gradingService.getGrades(c.id);
            for (const g of grades) {
              const score = g.totalScore ?? g.finalScore ?? g.midtermScore;
              if (score != null) {
                totalScoreSum += score;
                scoreCount += 1;
                if (score >= 8.5) dist[0].count += 1;
                else if (score >= 7.0) dist[1].count += 1;
                else if (score >= 5.5) dist[2].count += 1;
                else if (score >= 4.0) dist[3].count += 1;
                else {
                  dist[4].count += 1;
                  warningSum += 1;
                }
              }
            }
          } catch {
            // Class might not have published grades yet
          }
        }

        if (mounted) {
          setTotalStudents(studentSum);
          setAvgScore(scoreCount > 0 ? totalScoreSum / scoreCount : null);
          setWarningCount(warningSum);
          setGradeDistribution(dist);
        }
      } catch (e: unknown) {
        console.error('Analytics load error:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) return <Spinner />;

  const displayAvgScore = avgScore != null ? `${avgScore.toFixed(2)} / 10` : 'N/A';
  const scoreTrendLabel = avgScore != null ? (avgScore >= 8.0 ? 'Excellent' : avgScore >= 7.0 ? 'Good' : 'Average') : 'No published grades';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-accent-600 dark:text-accent-400" />
            Thống kê Analytics & Năng lực Học tập
          </span>
        }
        subtitle={`Báo cáo tổng quan phân bố điểm số và chuyên cần của ${classes.length} lớp giảng dạy`}
        actions={
          <div className="flex items-center gap-3">
            <select
              value={selectedClassId ?? ''}
              onChange={(event) => setSelectedClassId(event.target.value ? Number(event.target.value) : null)}
              aria-label="Select class to export"
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 text-xs font-semibold outline-none cursor-pointer focus:ring-2 focus:ring-accent-500/20 shadow-xs"
            >
              <option value="">Select a class</option>
              {classes.map((courseClass) => <option key={courseClass.id} value={courseClass.id}>{courseClass.classCode}</option>)}
            </select>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => selectedClassId != null && window.open(`${apiClient.defaults.baseURL}/reports/class/${selectedClassId}/excel`, '_blank')}
              disabled={selectedClassId == null}
            >
              <Download className="w-4 h-4" />
              Xuất Excel
            </Button>
          </div>
        }
      />

      {/* Dynamic 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Tổng Sinh viên"
          value={`${totalStudents} SV`}
          icon={<Users className="w-5 h-5" />}
          trend={`${classes.length} lớp giảng dạy`}
          trendColor="emerald"
          color="accent"
        />
        <StatCard
          label="Điểm TB Lớp học"
          value={displayAvgScore}
          icon={<Award className="w-5 h-5" />}
          trend={scoreTrendLabel}
          trendColor="emerald"
          color="amber"
        />
        <StatCard
          label="Tỷ lệ Chuyên cần"
          value={attendanceRate == null ? 'N/A' : `${attendanceRate}%`}
          icon={<TrendingUp className="w-5 h-5" />}
          trend="Đạt chỉ tiêu"
          trendColor="emerald"
          color="emerald"
        />
        <StatCard
          label="Cảnh báo Học tập (AI)"
          value={`${warningCount} SV`}
          icon={<AlertTriangle className="w-5 h-5" />}
          trend={avgScore == null ? "No published grade data" : warningCount > 0 ? "Students may need support" : "No students flagged"}
          trendColor={warningCount > 0 ? "rose" : "emerald"}
          color={warningCount > 0 ? "rose" : "emerald"}
        />
      </div>

      {/* Dynamic Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart - Grade Distribution */}
        <Card className="lg:col-span-2">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Phân bố Phổ điểm Lớp học</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Số lượng sinh viên tương ứng theo từng dải điểm chữ</p>
          </div>
          {avgScore == null ? <p className="text-sm text-slate-500">No published grades are available.</p> : <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="grade" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '12px', border: 'none', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#4F46E5" radius={[6, 6, 0, 0]} name="Số sinh viên" />
              </BarChart>
            </ResponsiveContainer>
          </div>}
        </Card>

        {/* Pie Chart - Attendance Breakdown */}
        <Card>
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Tỷ lệ Điểm danh QR</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Tỷ lệ tham gia các buổi học thực tế</p>
          </div>
          {attendanceData.length === 0 ? <p className="text-sm text-slate-500">Attendance data is unavailable.</p> : <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={attendanceData}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {attendanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '12px', border: 'none', fontSize: '12px' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>}
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
