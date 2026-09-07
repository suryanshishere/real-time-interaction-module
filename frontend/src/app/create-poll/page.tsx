import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import ControlPointIcon from "@mui/icons-material/ControlPoint";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { Input, TextArea } from "@shared/ui/Input";
import axiosInstance from "@shared/utils/axios-instance";
import type { AppDispatch } from "@shared/store";
import { triggerErrorMsg, triggerSuccessMsg } from "@shared/store/thunks/response-thunk";
import LiveChart from "@components/LiveChart";
import Timer from "@components/Timer";

interface PollResponse { sessionCode: string; options: string[]; }

export default function CreatePoll() {
  const dispatch = useDispatch<AppDispatch>();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [copySuccess, setCopySuccess] = useState("");
  const mutation = useMutation<PollResponse, any, { question: string; options: string[] }>({
    mutationFn: (payload) => axiosInstance.post("/polls", payload).then((response) => response.data),
    onSuccess: () => dispatch(triggerSuccessMsg("Poll created successfully.")),
    onError: (error) => dispatch(triggerErrorMsg(error.response?.data?.error?.message || "Sign in with Google and try again.")),
  });
  const cleanedOptions = options.map((option) => option.trim());
  const disabled = !question.trim() || cleanedOptions.some((option) => !option) || mutation.isPending;

  return (
    <section className="w-full max-w-[30rem] space-y-6 rounded-xl p-4 shadow">
      <h1 className="text-2xl font-bold">Create a Poll</h1>
      <TextArea name="question" value={question} maxLength={500} onChange={(event) => setQuestion(event.target.value)} placeholder="Enter your question" className="w-full" />
      {options.map((option, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input type="text" name={`option-${index}`} value={option} maxLength={200} onChange={(event) => setOptions((current) => current.map((value, optionIndex) => optionIndex === index ? event.target.value : value))} placeholder={`Option ${index + 1}`} className="w-full" />
          <button type="button" aria-label={`Remove option ${index + 1}`} onClick={() => setOptions((current) => current.filter((_, optionIndex) => optionIndex !== index))} disabled={options.length <= 2} className="rounded-full p-1 text-custom_red hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"><RemoveCircleOutlineIcon /></button>
        </div>
      ))}
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={() => setOptions((current) => [...current, ""])} disabled={options.length >= 7} className="flex items-center gap-1 rounded-full p-1 hover:bg-gray-200 disabled:opacity-50"><ControlPointIcon /> Add Option</button>
        <button type="button" onClick={() => mutation.mutate({ question: question.trim(), options: cleanedOptions })} disabled={disabled} className="custom_go disabled:cursor-not-allowed disabled:opacity-50">{mutation.isPending ? "Creating…" : "Create Poll"}</button>
      </div>
      {mutation.data && (
        <div className="space-y-4 text-green-700">
          <p className="font-semibold">Poll created. Session code: <span className="font-mono text-lg">{mutation.data.sessionCode}</span></p>
          <div className="flex gap-4 text-sm text-blue-700">
            <button type="button" className="flex items-center gap-1 hover:underline" onClick={() => { void navigator.clipboard.writeText(`${window.location.origin}/poll/${mutation.data!.sessionCode}`); setCopySuccess("Copied."); }}><ContentCopyIcon fontSize="small" /> Copy Link</button>
            <a href={`/poll/${mutation.data.sessionCode}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:underline"><OpenInNewIcon fontSize="small" /> Open Poll</a>
          </div>
          {copySuccess && <p className="text-xs">{copySuccess}</p>}
          <LiveChart options={mutation.data.options.map((label) => ({ label, votes: 0 }))} />
          <Timer />
        </div>
      )}
    </section>
  );
}
