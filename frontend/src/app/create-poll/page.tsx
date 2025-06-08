"use client";
import { useState } from "react";
import axios from "axios";
import LiveChart from "@components/LiveChart";
import Timer from "@components/Timer";
import { Input, TextArea } from "@shared/ui/Input";
import ControlPointIcon from "@mui/icons-material/ControlPoint";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";

export default function AdminPanel() {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [poll, setPoll] = useState<any>(null);
  const [error, setError] = useState("");

  const [questionError, setQuestionError] = useState("");
  const [optionsError, setOptionsError] = useState<string[]>([]);

  // Validate whole form on submit
  const validate = () => {
    let valid = true;
    setError("");
    setQuestionError("");
    setOptionsError([]);

    if (!question.trim()) {
      setQuestionError("Question is required.");
      valid = false;
    }

    const newOptionsError = options.map((opt) =>
      !opt.trim() ? "Option is required." : ""
    );

    if (newOptionsError.some((e) => e !== "")) {
      setOptionsError(newOptionsError);
      valid = false;
    }

    return valid;
  };

  const create = async () => {
    if (!validate()) return;

    try {
      const res = await axios.post("http://localhost:4000/api/poll/create", {
        question,
        options: options.filter((o) => o.trim()),
      });
      setPoll(res.data);
      setError("");
    } catch (err) {
      setError("Failed to create poll. Try again.");
      console.error(err);
    }
  };

  const addOption = () => {
    setOptions([...options, ""]);
    setOptionsError([...optionsError, ""]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
    setOptionsError(optionsError.filter((_, i) => i !== index));
  };

  const onOptionChange = (value: string, index: number) => {
    const arr = [...options];
    arr[index] = value;
    setOptions(arr);

    // Clear option error if fixed
    if (optionsError[index]) {
      const newErrors = [...optionsError];
      newErrors[index] = value.trim() ? "" : "Option is required.";
      setOptionsError(newErrors);
    }
  };

  const onOptionBlur = (index: number) => {
    const val = options[index];
    const newErrors = [...optionsError];
    newErrors[index] = val.trim() ? "" : "Option is required.";
    setOptionsError(newErrors);
  };

  const onQuestionChange = (value: string) => {
    setQuestion(value);
    if (questionError) {
      setQuestionError(value.trim() ? "" : "Question is required.");
    }
  };

  const onQuestionBlur = () => {
    setQuestionError(question.trim() ? "" : "Question is required.");
  };

  // Disable create if any errors or empty fields
  const isCreateDisabled =
    !question.trim() ||
    options.some((o) => !o.trim()) ||
    questionError !== "" ||
    optionsError.some((e) => e !== "");

  return (
    <div className="w-[30rem] my-8 mx-2 space-y-6 p-4 shadow rounded-xl">
      <h1 className="text-2xl font-bold">Create a Poll</h1>

      <div>
        <TextArea
          name="question"
          value={question}
          onChange={(e) => onQuestionChange(e.target.value)}
          onBlur={onQuestionBlur}
          placeholder="Enter your question"
          className={`w-full ${
            questionError ? "border border-red-600" : ""
          }`}
        />
        {questionError && (
          <div className="text-sm text-red-600 font-medium mt-1">
            {questionError}
          </div>
        )}
      </div>

      {options.map((o, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="flex-1">
            <Input
              type="text"
              name={`option-${i}`}
              value={o}
              onChange={(e) => onOptionChange(e.target.value, i)}
              onBlur={() => onOptionBlur(i)}
              placeholder={`Option ${i + 1}`}
              className={`w-full ${optionsError[i] ? "border border-red-600" : ""}`}
            />
            {optionsError[i] && (
              <div className="text-sm text-red-600 font-medium mt-1">
                {optionsError[i]}
              </div>
            )}
          </div>

          <button
            onClick={() => removeOption(i)}
            disabled={options.length <= 2}
            className={`p-1 flex items-center justify-center rounded-full hover:bg-gray-200 transition ${
              options.length <= 2
                ? "opacity-50 cursor-not-allowed"
                : "text-red-500"
            }`}
            title={
              options.length <= 2
                ? "At least two options required"
                : "Remove this option"
            }
            type="button"
          >
            <RemoveCircleOutlineIcon />
          </button>
        </div>
      ))}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <button
          onClick={addOption}
          className="flex gap-1 items-center hover:bg-gray-200 mt-1 py-1 px-2 rounded-full"
          type="button"
        >
          <ControlPointIcon />
          <span className="mb-[2px]">Add Option</span>
        </button>
        <button
          onClick={create}
          className={`custom_go ${isCreateDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
          disabled={isCreateDisabled}
          title={isCreateDisabled ? "Fill in question and all options" : ""}
        >
          Create Poll
        </button>
      </div>

      {error && <div className="text-sm text-red-600 font-medium">{error}</div>}

      {poll && (
        <div className="space-y-4 mt-6">
          <div className="text-green-700 font-semibold">
            ✅ Poll Created! <br />
            Session Code:{" "}
            <span className="font-mono text-lg">{poll.sessionCode}</span>
          </div>

          <LiveChart code={poll.sessionCode} options={poll.options} />
          <Timer />
        </div>
      )}
    </div>
  );
}
