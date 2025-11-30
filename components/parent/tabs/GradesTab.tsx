"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Award, TrendingUp, BookOpen, FileText } from "lucide-react";

interface Assessment {
  id: string;
  assessment_name: string;
  score: number;
  total_marks: number;
  percentage: number;
  assessment_date: string;
  assessment_type: "quiz" | "test" | "exam" | "assignment" | "project";
  remarks?: string;
  curriculum_topics: {
    topic_name: string;
    subject: string;
  };
}

interface SubjectStats {
  subject: string;
  assessmentCount: number;
  averagePercentage: number;
  highestScore: number;
  lowestScore: number;
}

interface GradesTabProps {
  studentId: string;
}

export default function GradesTab({ studentId }: GradesTabProps) {
  const supabase = createClient();

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [subjectStats, setSubjectStats] = useState<SubjectStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string>("all");

  useEffect(() => {
    fetchGrades();
  }, [studentId]);

  const fetchGrades = async () => {
    try {
      setLoading(true);

      // Fetch all assessments
      const { data, error } = await supabase
        .from("academic_progress")
        .select(
          `
          id,
          assessment_type,
          score,
          max_score,
          percentage,
          grade,
          assessment_date,
          teacher_feedback,
          subject_id,
          topic_id,
          curriculum_topics:topic_id (
            topic_name,
            subject_id,
            subjects:subject_id (
              name
            )
          )
        `
        )
        .eq("student_id", studentId)
        .order("assessment_date", { ascending: false });

      if (error) throw error;

      setAssessments(data || []);

      // Calculate subject statistics
      if (data && data.length > 0) {
        const subjectMap = new Map<string, number[]>();

        data.forEach((assessment) => {
          const subject = assessment.curriculum_topics?.subject || "Unknown";
          if (!subjectMap.has(subject)) {
            subjectMap.set(subject, []);
          }
          subjectMap.get(subject)?.push(assessment.percentage);
        });

        const stats: SubjectStats[] = Array.from(subjectMap.entries()).map(
          ([subject, percentages]) => ({
            subject,
            assessmentCount: percentages.length,
            averagePercentage: Math.round(
              percentages.reduce((a, b) => a + b, 0) / percentages.length
            ),
            highestScore: Math.max(...percentages),
            lowestScore: Math.min(...percentages),
          })
        );

        setSubjectStats(
          stats.sort((a, b) => b.averagePercentage - a.averagePercentage)
        );
      }
    } catch (err) {
      console.error("Error fetching grades:", err);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600 dark:text-green-400";
    if (percentage >= 80) return "text-blue-600 dark:text-blue-400";
    if (percentage >= 70) return "text-yellow-600 dark:text-yellow-400";
    if (percentage >= 60) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  const getGradeBgColor = (percentage: number) => {
    if (percentage >= 90) return "bg-green-100 dark:bg-green-900/20";
    if (percentage >= 80) return "bg-blue-100 dark:bg-blue-900/20";
    if (percentage >= 70) return "bg-yellow-100 dark:bg-yellow-900/20";
    if (percentage >= 60) return "bg-orange-100 dark:bg-orange-900/20";
    return "bg-red-100 dark:bg-red-900/20";
  };

  const getAssessmentTypeIcon = (type: string) => {
    switch (type) {
      case "quiz":
        return "📝";
      case "test":
        return "📋";
      case "exam":
        return "📖";
      case "assignment":
        return "✍️";
      case "project":
        return "🎯";
      default:
        return "📄";
    }
  };

  const filteredAssessments =
    selectedSubject === "all"
      ? assessments
      : assessments.filter(
          (a) => a.curriculum_topics?.subject === selectedSubject
        );

  const overallAverage =
    assessments.length > 0
      ? Math.round(
          assessments.reduce((sum, a) => sum + a.percentage, 0) /
            assessments.length
        )
      : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Performance */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Overall Performance
            </h3>
          </div>
          <span
            className={`text-3xl font-bold ${getGradeColor(overallAverage)}`}
          >
            {overallAverage}%
          </span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
          <div
            className="bg-blue-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${overallAverage}%` }}
          ></div>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
          Based on {assessments.length} assessments across all subjects
        </p>
      </div>

      {/* Subject Statistics */}
      {subjectStats.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Performance by Subject
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjectStats.map((stat) => (
              <div
                key={stat.subject}
                className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                      {stat.subject}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {stat.assessmentCount} assessment
                      {stat.assessmentCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <span
                    className={`text-2xl font-bold ${getGradeColor(
                      stat.averagePercentage
                    )}`}
                  >
                    {stat.averagePercentage}%
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-400">
                      Highest:
                    </span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {stat.highestScore}%
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-400">
                      Lowest:
                    </span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {stat.lowestScore}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-3">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${stat.averagePercentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subject Filter */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Assessment History
        </h3>
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Subjects</option>
          {subjectStats.map((stat) => (
            <option key={stat.subject} value={stat.subject}>
              {stat.subject}
            </option>
          ))}
        </select>
      </div>

      {/* Assessments List */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        {filteredAssessments.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-600 dark:text-slate-400">
              {selectedSubject === "all"
                ? "No assessments recorded yet"
                : `No assessments for ${selectedSubject}`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Assessment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Grade
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredAssessments.map((assessment) => (
                  <tr
                    key={assessment.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                      {new Date(assessment.assessment_date).toLocaleDateString(
                        "en-GB"
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {assessment.curriculum_topics?.subject || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-white">
                      <div>
                        <p className="font-medium">
                          {assessment.assessment_name}
                        </p>
                        {assessment.curriculum_topics?.topic_name && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {assessment.curriculum_topics.topic_name}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium">
                        <span>
                          {getAssessmentTypeIcon(assessment.assessment_type)}
                        </span>
                        <span className="capitalize">
                          {assessment.assessment_type}
                        </span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                      {assessment.score}/{assessment.total_marks}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div
                          className={`px-3 py-1 rounded-full ${getGradeBgColor(
                            assessment.percentage
                          )}`}
                        >
                          <span
                            className={`text-sm font-bold ${getGradeColor(
                              assessment.percentage
                            )}`}
                          >
                            {assessment.percentage}%
                          </span>
                        </div>
                        {assessment.remarks && (
                          <div className="group relative">
                            <FileText className="h-4 w-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-help" />
                            <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-64 p-2 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded shadow-lg z-10">
                              {assessment.remarks}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
