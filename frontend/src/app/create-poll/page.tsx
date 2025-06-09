"use client";
import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useMutation } from "@tanstack/react-query";
import LiveChart from "@components/LiveChart";
import Timer from "@components/Timer";
import { Input, TextArea } from "@shared/ui/Input";
import ControlPointIcon from "@mui/icons-material/ControlPoint";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import axiosInstance from "@shared/utils/axios-instance";
import { AppDispatch } from "@shared/store";
import {
  triggerErrorMsg,
  triggerSuccessMsg,
} from "@shared/store/thunks/response-thunk";

interface PollResponse {
  sessionCode: string;
  options: string[];
  message?: string;
}

export default function AdminPanel() {
  const dispatch = useDispatch<AppDispatch>();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [questionError, setQuestionError] = useState("");
  const [optionsError, setOptionsError] = useState<string[]>(["", ""]);
  const [msg, setMsg] = useState<string | null>(null);

  // Keep optionsError in sync when options length changes
  useEffect(() => {
    setOptionsError((prev) => {
      const newArr = [...prev];
      while (newArr.length < options.length) newArr.push("");
      return newArr.slice(0, options.length);
    });
  }, [options]);

  const validate = () => {
    let valid = true;
    setQuestionError("");
    const errs = options.map(() => "");

    if (!question.trim()) {
      setQuestionError("Question is required.");
      valid = false;
    }
    options.forEach((opt, i) => {
      if (!opt.trim()) {
        errs[i] = "Option is required.";
        valid = false;
      }
    });
    setOptionsError(errs);
    return valid;
  };

  const createMutation = useMutation<
    PollResponse,
    any,
    { question: string; options: string[] }
  >({
    mutationFn: (payload) =>
      axiosInstance.post("/poll/create", payload).then((res) => res.data),
    onSuccess: (data) => {
      dispatch(triggerSuccessMsg(data.message || "Poll created successfully."));
    },
    onError: (err) => {
      const msg =
        err.response?.error || "Failed to create poll. Try again.";
      dispatch(triggerErrorMsg(msg));
      setMsg(msg);
    },
  });

  const handleCreate = () => {
    if (!validate()) return;
    createMutation.mutate({
      question,
      options: options.filter((o) => o.trim()),
    });
  };

  const addOption = () => setOptions((prev) => [...prev, ""]);
  const removeOption = (i: number) =>
    setOptions((prev) => prev.filter((_, idx) => idx !== i));

  const onOptionChange = (val: string, i: number) => {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? val : o)));
  };
  const onOptionBlur = (i: number) => {
    setOptionsError((prev) =>
      prev.map((e, idx) =>
        idx === i && !options[i].trim() ? "Option is required." : ""
      )
    );
  };

  const onQuestionChange = (val: string) => {
    setQuestion(val);
    if (questionError && val.trim()) setQuestionError("");
  };
  const onQuestionBlur = () => {
    if (!question.trim()) setQuestionError("Question is required.");
  };

  const isCreating = createMutation.isPending;
  const isDisabled = !question.trim() || options.some((o) => !o.trim());

  return (
    <div className="w-[30rem] my-8 mx-2 space-y-6 p-4 shadow rounded-xl">
      <h1 className="text-2xl font-bold">Create a Poll</h1>

      <TextArea
        name="question"
        value={question}
        onChange={(e) => onQuestionChange(e.target.value)}
        onBlur={onQuestionBlur}
        placeholder="Enter your question"
        className={`w-full ${questionError ? "border-custom_red border" : ""}`}
      />
      {questionError && (
        <p className="text-custom_red text-sm">{questionError}</p>
      )}

      {options.map((opt, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            type="text"
            name={`option-${i}`}
            value={opt}
            onChange={(e) => onOptionChange(e.target.value, i)}
            onBlur={() => onOptionBlur(i)}
            placeholder={`Option ${i + 1}`}
            className={`w-full ${
              optionsError[i] ? "border-custom_red border" : ""
            }`}
          />
          <button
            type="button"
            onClick={() => removeOption(i)}
            disabled={options.length <= 2}
            className={`p-1 rounded-full hover:bg-gray-200 transition ${
              options.length <= 2
                ? "opacity-50 cursor-not-allowed"
                : "text-custom_red"
            }`}
          >
            <RemoveCircleOutlineIcon />
          </button>
        </div>
      ))}

      <div className="flex justify-between items-center gap-2">
        <button
          type="button"
          onClick={addOption}
          className="flex items-center gap-1 hover:bg-gray-200 p-1 rounded-full"
        >
          <ControlPointIcon /> Add Option
        </button>
        <button
          onClick={handleCreate}
          disabled={isDisabled || isCreating}
          className={`custom_go ${
            isDisabled || isCreating ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {isCreating ? "Creating..." : "Create Poll"}
        </button>
      </div>

      {createMutation.isSuccess && createMutation.data && (
        <div className="mt-6 space-y-4">
          <div className="text-green-700 font-semibold">
            ✅ Poll Created!
            <br />
            Session Code:{" "}
            <span className="font-mono text-lg">
              {createMutation.data.sessionCode}
            </span>
          </div>
          <LiveChart
            code={createMutation.data.sessionCode}
            options={createMutation.data.options.map((option) => ({
              label: option,
              votes: 0,
            }))}
          />
          <Timer />
        </div>
      )}

      {msg && createMutation.isError && (
        <p className="text-red-600 text-sm">{msg}</p>
      )}
    </div>
  );
}
