import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, Users, Award, AlertTriangle, Download, Filter } from 'lucide-react';

const gradeDistributionData: { grade: string; count: number }[] = [];
const attendanceData: { name: string; value: number; color: string }[] = [];

export const AnalyticsDashboard: React.FC = () => {
  const [selectedSemester, setSelectedSemester] = useState('HK1-2026');

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-linear-to-r from-indigo-600 via-blue-600 to-cyan-600 rounded-2xl p-6 text-white shadow-xl">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-7 h-7" />
            Thống kê Analytics & Năng lực Học tập
          </h1>
          <p className="text-blue-100 text-sm mt-1">
            Báo cáo tổng quan phân bố điểm số, tỷ lệ chuyên cần và sinh viên nguy cơ học tập
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            aria-label="Chọn học kỳ"
            className="bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-xl px-4 py-2 text-sm outline-none cursor-pointer focus:ring-2 focus:ring-white/50"
          >
            <option value="HK1-2026" className="text-gray-900">Học kỳ 1 - 2026</option>
            <option value="HK2-2025" className="text-gray-900">Học kỳ 2 - 2025</option>
          </select>
          <button
            onClick={() => window.open('http://localhost:8080/api/v1/reports/class/1/excel', '_blank')}
            className="flex items-center gap-2 bg-white text-indigo-700 font-semibold px-4 py-2 rounded-xl text-sm shadow hover:bg-blue-50 transition"
          >
            <Download className="w-4 h-4" />
            Xuất Excel Báo cáo
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Tổng Sinh viên</p>
            <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">122</p>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-2 inline-block">
              +12% so với HK trước
            </span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Điểm TB Lớp học</p>
            <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">8.34 / 10</p>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-2 inline-block">
              Xếp loại Giỏi
            </span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 rounded-2xl">
            <Award className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Tỷ lệ Chuyên cần</p>
            <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">92%</p>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-2 inline-block">
              Đạt chỉ tiêu
            </span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-2xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Cảnh báo Học tập (AI)</p>
            <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">5 SV</p>
            <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full mt-2 inline-block">
              Cần cố vấn hỗ trợ
            </span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 rounded-2xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart - Grade Distribution */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Phân bố Phổ điểm Lớp học</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Số lượng sinh viên tương ứng theo từng dải điểm chữ</p>
            </div>
            <Filter className="w-4 h-4 text-gray-400" />
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="grade" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', color: '#FFF', borderRadius: '12px', border: 'none' }}
                />
                <Bar dataKey="count" fill="#6366F1" radius={[8, 8, 0, 0]} name="Số sinh viên" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart - Attendance Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Tỷ lệ Điểm danh QR</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Tỷ lệ tham gia các buổi học thực tế</p>
          </div>
          <div className="h-72 w-full flex items-center justify-center">
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
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', color: '#FFF', borderRadius: '12px', border: 'none' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
