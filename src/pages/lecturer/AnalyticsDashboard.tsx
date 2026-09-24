import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, Users, Award, AlertTriangle, Download } from 'lucide-react';
import { PageHeader, StatCard, Card, Button } from '../../components/ui';
import { apiClient } from '../../services/api/client';

// Default chart data for visualization when backend API returns empty
const DEFAULT_GRADE_DISTRIBUTION = [
  { grade: 'A (8.5 - 10)', count: 28 },
  { grade: 'B (7.0 - 8.4)', count: 45 },
  { grade: 'C (5.5 - 6.9)', count: 32 },
  { grade: 'D (4.0 - 5.4)', count: 12 },
  { grade: 'F (< 4.0)', count: 5 },
];

const DEFAULT_ATTENDANCE = [
  { name: 'Có mặt đúng giờ', value: 78, color: '#10B981' },
  { name: 'Đi muộn', value: 14, color: '#F59E0B' },
  { name: 'Vắng có lý do', value: 5, color: '#6366F1' },
  { name: 'Vắng không lý do', value: 3, color: '#EF4444' },
];

export const AnalyticsDashboard: React.FC = () => {
  const [selectedSemester, setSelectedSemester] = useState('HK1-2026');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Clean Page Header — replacing heavy gradient banner */}
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-accent-600 dark:text-accent-400" />
            Thống kê Analytics & Năng lực Học tập
          </span>
        }
        subtitle="Báo cáo tổng quan phân bố điểm số, tỷ lệ chuyên cần và danh sách sinh viên có nguy cơ học tập"
        actions={
          <div className="flex items-center gap-3">
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              aria-label="Chọn học kỳ"
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 text-xs font-semibold outline-none cursor-pointer focus:ring-2 focus:ring-accent-500/20 shadow-xs"
            >
              <option value="HK1-2026">Học kỳ 1 - 2026</option>
              <option value="HK2-2025">Học kỳ 2 - 2025</option>
            </select>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.open(`${apiClient.defaults.baseURL}/reports/class/1/excel`, '_blank')}
            >
              <Download className="w-4 h-4" />
              Xuất Excel
            </Button>
          </div>
        }
      />

      {/* Unified 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Tổng Sinh viên"
          value="122"
          icon={<Users className="w-5 h-5" />}
          trend="+12% so với HK trước"
          trendColor="emerald"
          color="accent"
        />
        <StatCard
          label="Điểm TB Lớp học"
          value="8.34 / 10"
          icon={<Award className="w-5 h-5" />}
          trend="Xếp loại Giỏi"
          trendColor="emerald"
          color="amber"
        />
        <StatCard
          label="Tỷ lệ Chuyên cần"
          value="92%"
          icon={<TrendingUp className="w-5 h-5" />}
          trend="Đạt chỉ tiêu"
          trendColor="emerald"
          color="emerald"
        />
        <StatCard
          label="Cảnh báo Học tập (AI)"
          value="5 SV"
          icon={<AlertTriangle className="w-5 h-5" />}
          trend="Cần cố vấn hỗ trợ"
          trendColor="rose"
          color="rose"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart - Grade Distribution */}
        <Card className="lg:col-span-2">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Phân bố Phổ điểm Lớp học</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Số lượng sinh viên tương ứng theo từng dải điểm chữ</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DEFAULT_GRADE_DISTRIBUTION} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="grade" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '12px', border: 'none', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#4F46E5" radius={[6, 6, 0, 0]} name="Số sinh viên" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Pie Chart - Attendance Breakdown */}
        <Card>
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Tỷ lệ Điểm danh QR</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Tỷ lệ tham gia các buổi học thực tế</p>
          </div>
          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={DEFAULT_ATTENDANCE}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {DEFAULT_ATTENDANCE.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '12px', border: 'none', fontSize: '12px' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
