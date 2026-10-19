export function parseQuestionsFromText(text: string): Array<{
  question: string;
  options: string[];
  correctIndex: number;
}> {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const questions: Array<{
    question: string;
    options: string[];
    correctIndex: number;
  }> = [];

  let currentQuestion: {
    question: string;
    options: string[];
    correctIndex: number;
  } | null = null;

  const questionStartRegex = /^(?:(?:soal|no\.?|pertanyaan)?\s*(\d+)[\.\)\:\-]\s*|\b(\d+)[\.\)]\s+)(.*)$/i;
  const optionRegex = /^(\*?)\s*(?:[\(\[]?([A-Ea-e])[\)\]\.\:\-]\s*)(.*)$/;
  const answerKeyRegex = /^(?:kunci(?:\s+jawaban)?|jawaban|answer|key)\s*[\:\=]\s*([A-Ea-e])/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if line is an answer key for the current question
    const keyMatch = line.match(answerKeyRegex);
    if (keyMatch && currentQuestion) {
      const char = keyMatch[1].toUpperCase();
      const idx = char.charCodeAt(0) - 65; // A -> 0, B -> 1, ...
      if (idx >= 0 && idx < 5) {
        currentQuestion.correctIndex = idx;
      }
      continue;
    }

    // Check if line is an option (A, B, C, D, E)
    const optMatch = line.match(optionRegex);
    if (optMatch && currentQuestion) {
      const isStarred = optMatch[1] === "*";
      const optLetter = optMatch[2].toUpperCase();
      const optText = optMatch[3].trim();
      const optIdx = optLetter.charCodeAt(0) - 65;

      // If text contains answer key marker like "(kunci)" or "(benar)"
      const isExplicitCorrect = isStarred || /\((?:kunci|benar|correct)\)/i.test(optText);
      const cleanedOptText = optText.replace(/\((?:kunci|benar|correct)\)/gi, "").trim();

      currentQuestion.options.push(cleanedOptText);
      if (isExplicitCorrect || isStarred) {
        currentQuestion.correctIndex = currentQuestion.options.length - 1;
      }
      continue;
    }

    // Check if line is start of a new question
    const qMatch = line.match(questionStartRegex);
    if (qMatch) {
      if (currentQuestion && currentQuestion.question && currentQuestion.options.length >= 2) {
        // Pad options to 4 if less than 4
        while (currentQuestion.options.length < 4) {
          currentQuestion.options.push("");
        }
        questions.push(currentQuestion);
      }
      const qText = (qMatch[3] || "").trim();
      currentQuestion = {
        question: qText || line,
        options: [],
        correctIndex: 0,
      };
      continue;
    }

    // Otherwise, append to current question text if no options added yet
    if (currentQuestion && currentQuestion.options.length === 0) {
      currentQuestion.question += " " + line;
    }
  }

  // Push last question
  if (currentQuestion && currentQuestion.question && currentQuestion.options.length >= 2) {
    while (currentQuestion.options.length < 4) {
      currentQuestion.options.push("");
    }
    questions.push(currentQuestion);
  }

  return questions;
}
