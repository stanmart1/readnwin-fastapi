"use client";

import { useState, useEffect } from "react";
import { X, Target, Calendar, BookOpen, Clock, TrendingUp } from "lucide-react";

interface GoalSettingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoalCreated: () => void;
  existingGoal?: any;
}

interface GoalFormData {
  goal_type: string;
  target_value: number;
  start_date: string;
  end_date: string;
}

const goalTypes = [
  {
    id: "annual_books",
    label: "Annual Books",
    description: "Number of books to read in a year",
    icon: BookOpen,
    unit: "books",
    defaultTarget: 12,
    minValue: 1,
    maxValue: 100,
  },
  {
    id: "monthly_pages",
    label: "Monthly Pages",
    description: "Number of pages to read per month",
    icon: TrendingUp,
    unit: "pages",
    defaultTarget: 1000,
    minValue: 100,
    maxValue: 10000,
  },
  {
    id: "reading_streak",
    label: "Reading Streak",
    description: "Consecutive days of reading",
    icon: Calendar,
    unit: "days",
    defaultTarget: 30,
    minValue: 7,
    maxValue: 365,
  },
  {
    id: "daily_hours",
    label: "Daily Hours",
    description: "Hours of reading per day",
    icon: Clock,
    unit: "hours",
    defaultTarget: 1,
    minValue: 0.5,
    maxValue: 8,
  },
];

export default function GoalSettingModal({
  isOpen,
  onClose,
  onGoalCreated,
  existingGoal,
}: GoalSettingModalProps) {
  const [formData, setFormData] = useState<GoalFormData>({
    goal_type: "annual_books",
    target_value: 12,
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date(new Date().getFullYear(), 11, 31)
      .toISOString()
      .split("T")[0],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existingGoal) {
      setFormData({
        goal_type: existingGoal.goal_type,
        target_value: existingGoal.target_value,
        start_date: existingGoal.start_date,
        end_date: existingGoal.end_date,
      });
    } else {
      // Set default dates based on goal type
      const now = new Date();
      const currentYear = now.getFullYear();

      setFormData({
        goal_type: "annual_books",
        target_value: 12,
        start_date: new Date(currentYear, 0, 1).toISOString().split("T")[0],
        end_date: new Date(currentYear, 11, 31).toISOString().split("T")[0],
      });
    }
  }, [existingGoal, isOpen]);

  const handleGoalTypeChange = (goalType: string) => {
    const goalTypeConfig = goalTypes.find((gt) => gt.id === goalType);
    if (goalTypeConfig) {
      const now = new Date();
      const currentYear = now.getFullYear();

      let startDate = new Date(currentYear, 0, 1).toISOString().split("T")[0];
      let endDate = new Date(currentYear, 11, 31).toISOString().split("T")[0];

      if (goalType === "monthly_pages") {
        startDate = new Date(currentYear, now.getMonth(), 1)
          .toISOString()
          .split("T")[0];
        endDate = new Date(currentYear, now.getMonth() + 1, 0)
          .toISOString()
          .split("T")[0];
      } else if (goalType === "reading_streak") {
        startDate = now.toISOString().split("T")[0];
        endDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];
      } else if (goalType === "daily_hours") {
        startDate = now.toISOString().split("T")[0];
        endDate = new Date(currentYear, 11, 31).toISOString().split("T")[0];
      }

      setFormData({
        goal_type: goalType,
        target_value: goalTypeConfig.defaultTarget,
        start_date: startDate,
        end_date: endDate,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const url = existingGoal
        ? `${apiUrl}/dashboard/goals/${existingGoal.id}`
        : `${apiUrl}/dashboard/goals`;

      const method = existingGoal ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onGoalCreated();
        onClose();
      } else {
        const data = await response.json();
        setError(data.detail || "Failed to save goal");
      }
    } catch (error) {
      console.error("Error saving goal:", error);
      setError("Failed to save goal. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectedGoalType = goalTypes.find((gt) => gt.id === formData.goal_type);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Target className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {existingGoal ? "Edit Reading Goal" : "Set Reading Goal"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Goal Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Goal Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {goalTypes.map((goalType) => {
                const Icon = goalType.icon;
                return (
                  <button
                    key={goalType.id}
                    type="button"
                    onClick={() => handleGoalTypeChange(goalType.id)}
                    className={`p-4 border-2 rounded-lg text-left transition-colors ${
                      formData.goal_type === goalType.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <Icon className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-gray-900">
                        {goalType.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {goalType.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target {selectedGoalType?.label}
            </label>
            <div className="relative">
              <input
                type="number"
                value={formData.target_value}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    target_value: parseFloat(e.target.value) || 0,
                  }))
                }
                min={selectedGoalType?.minValue}
                max={selectedGoalType?.maxValue}
                step={selectedGoalType?.id === "daily_hours" ? 0.5 : 1}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={`Enter target ${selectedGoalType?.unit}`}
              />
              <span className="absolute right-3 top-2 text-gray-500 text-sm">
                {selectedGoalType?.unit}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Min: {selectedGoalType?.minValue} | Max:{" "}
              {selectedGoalType?.maxValue}
            </p>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    start_date: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, end_date: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading
                ? "Saving..."
                : existingGoal
                  ? "Update Goal"
                  : "Create Goal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
