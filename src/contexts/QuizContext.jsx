import { createContext, useContext, useEffect, useReducer } from "react";

const QuizContext = createContext();

const initialState = {
  question: [],
  status: "loading", // "loading", "error", "ready", "active", "finished"
  index: 0,
  answer: null,
  points: 0,
  highscore: 0,
  secondsRemaining: null,
};

// Default seconds for each question
const SECS_PER_QUESTION = 30;

// Main useReducer function
function reducer(state, action) {
  switch (action.type) {
    case "dataReceived":
      // API data loaded and ready
      return { ...state, question: action.payload, status: "ready" };
    case "dataFailed":
      // Failed to fetch API data
      return { ...state, status: "error" };
    case "start":
      // Starting the quiz
      return {
        ...state,
        status: "active",
        secondsRemaining: state.question.length * SECS_PER_QUESTION,
      };
    case "newAnswer":
      // Giving an answer
      const question = state.question.at(state.index);
      return {
        ...state,
        answer: action.payload,
        points:
          action.payload === question.correctOption
            ? state.points + question.points
            : state.points,
      };

    case "nextQuestion":
      // Setting/showing the next question
      return { ...state, index: state.index + 1, answer: null };

    case "finish":
      // Setting highscore and showing finished screen
      return {
        ...state,
        status: "finished",
        highscore:
          state.points > state.highscore ? state.points : state.highscore,
      };

    case "restart":
      // Restarting the quiz
      return {
        ...initialState,
        question: state.question,
        status: "ready",
      };

    case "tick":
      // Tick event (each seconds)
      return {
        ...state,
        secondsRemaining: state.secondsRemaining - 1,
        status: state.secondsRemaining <= 0 ? "finished" : state.status,
      };

    default:
      throw new Error("Action unknown");
  }
}

function QuizProvider({ children }) {
  const [
    { question, status, index, answer, points, highscore, secondsRemaining },
    dispatch,
  ] = useReducer(reducer, initialState);

  const numQuestions = question.length;
  const maxPossiblePoints = question.reduce(
    (prev, cur) => prev + cur.points,
    0
  );

  useEffect(function () {
    // Fetching the fake API endpoint
    // json-server --watch data/questions.json --port 8888
    fetch("http://localhost:8888/questions")
      .then(res => res.json())
      .then(data => dispatch({ type: "dataReceived", payload: data }))
      .catch(err => dispatch({ type: "dataFailed" }));
  }, []);

  return (
    <QuizContext.Provider
      value={{
        question,
        status,
        index,
        answer,
        points,
        highscore,
        secondsRemaining,
        numQuestions,
        maxPossiblePoints,
        dispatch,
      }}
    >
      {children}
    </QuizContext.Provider>
  );
}

function useQuiz() {
  const context = useContext(QuizContext);
  if (context === undefined)
    throw new Error("QuizContext was used outside QuizProvider.");
  return context;
}

export { QuizProvider, useQuiz };
