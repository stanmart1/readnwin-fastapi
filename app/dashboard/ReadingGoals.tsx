"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { EnhancedApiClient } from "@/lib/api-enhanced";
import { Plus, Edit, Trash2 } from "lucide-react";
import GoalSettingModal from "./GoalSettingModal";

interface Goal {
  id: number;
  goal_type: string;
  target_value: number;
  current_value: number;
  progress_percentage: number;
  start_date: string;
  end_date: string;
}

interface Achievement {
  id: number;
  achievement_type: string;
  title: string;
  description: string;
  icon: string;
  earned_at: string | null;
}

export default function ReadingGoals() {
  const { user, isAuthenticated } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  useEffect(() => {
    const fetchGoals = async () => {
      if (!isAuthenticated || !user?.id) return;

      try {
        const api = new EnhancedApiClient();
        const token = localStorage.getItem("token");
        if (token) {
          api.setToken(token);
        }

        const [goalsData, achievementsData] = await Promise.all([
          api.request("/reading/goals"),
          api.request("/dashboard/achievements"),
        ]);

        setGoals(goalsData.goals || []);
        setAchievements(achievementsData.achievements || []);
      } catch (error) {
        console.error("Error fetching goals and achievements:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGoals();
  }, [isAuthenticated, user?.id]);

  const handleGoalCreated = () => {
    // Refresh goals after creating/editing
    const fetchGoals = async () => {
      if (!isAuthenticated || !user?.id) return;

      try {
        const api = new EnhancedApiClient();
        const token = localStorage.getItem("token");
        if (token) {
          api.setToken(token);
        }

        const goalsData = await api.request("/reading/goals");
        setGoals(goalsData.goals || []);
      } catch (error) {
        console.error("Error fetching goals:", error);
      }
    };

    fetchGoals();
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setShowGoalModal(true);
  };

  const handleDeleteGoal = async (goalId: number) => {
    if (!confirm("Are you sure you want to delete this goal?")) return;

    try {
      const api = new EnhancedApiClient();
      const token = localStorage.getItem("token");
      if (token) {
        api.setToken(token);
      }

      const response = await api.request(`/reading/goals/${goalId}`, {
        method: "DELETE",
      });

      setGoals((prev) => prev.filter((goal) => goal.id !== goalId));
    } catch (error) {
      console.error("Error deleting goal:", error);
      alert("Failed to delete goal");
    }
  };

  const openGoalModal = () => {
    setEditingGoal(null);
    setShowGoalModal(true);
  };

  const closeGoalModal = () => {
    setShowGoalModal(false);
    setEditingGoal(null);
  };

  // Fallback goals if API is not available - only show when no real goals exist
  const fallbackGoals = [];

  const fallbackAchievements: Achievement[] = [];

  const displayGoals = goals.filter((goal) => goal.id != null);
  const displayAchievements = achievements.filter(
    (achievement) => achievement.id != null,
  );

  const getGoalLabel = (goalType: string) => {
    switch (goalType) {
      case "annual_books":
        return "Annual Reading Goal";
      case "monthly_pages":
        return "Monthly Pages";
      case "reading_streak":
        return "Reading Streak";
      case "daily_hours":
        return "Daily Hours";
      default:
        return goalType;
    }
  };

  const getGoalUnit = (goalType: string) => {
    switch (goalType) {
      case "annual_books":
        return "books";
      case "monthly_pages":
        return "pages";
      case "reading_streak":
        return "days";
      case "daily_hours":
        return "hours";
      default:
        return "";
    }
  };

  const getGoalColor = (goalType: string) => {
    switch (goalType) {
      case "annual_books":
        return "bg-blue-500";
      case "monthly_pages":
        return "bg-green-500";
      case "reading_streak":
        return "bg-purple-500";
      case "daily_hours":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Reading Goals</h2>
          <button
            onClick={openGoalModal}
            className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Goal</span>
          </button>
        </div>

        {/* Goals Progress */}
        <div className="space-y-4 mb-6">
          {displayGoals.map((goal) => (
            <div key={goal.id} className="relative group">
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-sm font-medium text-gray-700">
                  {getGoalLabel(goal.goal_type)}
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    {goal.current_value}/{goal.target_value}{" "}
                    {getGoalUnit(goal.goal_type)}
                  </span>
                  {/* Action buttons - only show for real goals, not fallback */}
                  {goal.id > 0 && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                      <button
                        onClick={() => handleEditGoal(goal)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit goal"
                      >
                        <Edit className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete goal"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`${getGoalColor(goal.goal_type)} h-2 rounded-full transition-all duration-300`}
                  style={{
                    width: `${Math.min(goal.progress_percentage, 100)}%`,
                  }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {goal.start_date} - {goal.end_date}
              </div>
            </div>
          ))}
        </div>

        {/* Empty state for no goals */}
        {displayGoals.length === 0 && !loading && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No reading goals set
            </h3>
            <p className="text-gray-600 mb-4">
              Set your first reading goal to start tracking your progress!
            </p>
            <button
              onClick={openGoalModal}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Set Your First Goal
            </button>
          </div>
        )}

        {/* Achievements */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Achievements
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {displayAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`p-3 rounded-lg border-2 ${
                  achievement.earned_at
                    ? "border-yellow-300 bg-yellow-50"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <div
                    className={`w-6 h-6 flex items-center justify-center ${
                      achievement.earned_at
                        ? "text-yellow-600"
                        : "text-gray-400"
                    }`}
                  >
                    <i className={`${achievement.icon} text-sm`}></i>
                  </div>
                  <h4 className="text-xs font-medium text-gray-900">
                    {achievement.title}
                  </h4>
                </div>
                <p className="text-xs text-gray-600">
                  {achievement.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Goal Setting Modal */}
      <GoalSettingModal
        isOpen={showGoalModal}
        onClose={closeGoalModal}
        onGoalCreated={handleGoalCreated}
        existingGoal={editingGoal}
      />
    </>
  );
}
