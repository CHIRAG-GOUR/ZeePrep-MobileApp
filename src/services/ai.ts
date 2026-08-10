import type { Question, Report } from "../types";

export interface AIGeneratedQuestionSuggestion {
  text: string;
  type: "mcq" | "numerical" | "assertion-reason" | "subjective";
  options?: string[];
  correctAnswer: string | number;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  subject: string;
  grade: string;
  topic: string;
}

// AI Copilot Assistance Helper
export async function suggestQuestionItems(
  subject: string,
  grade: string,
  topic: string,
  count: number = 3
): Promise<AIGeneratedQuestionSuggestion[]> {
  // Returns AI suggested items that teachers can explicitly review and import into the Question Bank
  return [
    {
      text: `Explain the fundamental principles governing ${topic || "Newtonian Physics"} in ${subject}.`,
      type: "mcq",
      options: [
        "First Law of Motion (Inertia)",
        "Law of Universal Gravitation",
        "Principle of Conservation of Energy",
        "Electromagnetic Wave Propagation",
      ],
      correctAnswer: "First Law of Motion (Inertia)",
      explanation: "Calculated based on standard curriculum guidelines for Grade " + grade,
      difficulty: "medium",
      subject,
      grade,
      topic,
    },
    {
      text: `Calculate the net resultant force when two orthogonal vectors of 6N and 8N act on a point mass.`,
      type: "numerical",
      correctAnswer: 10,
      explanation: "Resultant = sqrt(6^2 + 8^2) = sqrt(36 + 64) = sqrt(100) = 10 N",
      difficulty: "hard",
      subject,
      grade,
      topic,
    },
  ];
}

export async function generateTeacherAIReportAnalysis(report: Report): Promise<{
  strongTopics: string[];
  weakTopics: string[];
  recommendation: string;
}> {
  const isHighAccuracy = report.accuracy >= 75;

  return {
    strongTopics: isHighAccuracy ? ["Core Concepts", "Formula Applications"] : ["Basic Knowledge"],
    weakTopics: isHighAccuracy ? ["Time Management"] : ["Complex Problem Solving", "Numerical Accuracy"],
    recommendation: isHighAccuracy
      ? "Student displays strong mastery. Recommend Level 3 advanced problem sets."
      : "Student requires targeted revision in core numerical methods. Assign foundational study resources.",
  };
}
