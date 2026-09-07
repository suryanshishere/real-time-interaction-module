import { forwardRef, useEffect, useRef, useState } from "react";
import type { ChangeEvent, CSSProperties, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

function startCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

interface SharedFieldProps {
  name: string;
  label?: string | boolean;
  error?: boolean;
  helperText?: string;
  outerClassProp?: string;
  errorClassProp?: string;
}

export interface InputProps
  extends SharedFieldProps,
    Omit<InputHTMLAttributes<HTMLInputElement>, "name" | "onChange"> {
  style?: CSSProperties;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
}

function FieldFrame({
  children,
  error,
  outerClassProp,
}: {
  children: ReactNode;
  error?: boolean;
  outerClassProp?: string;
}) {
  return (
    <div className={`relative flex w-full items-center group ${outerClassProp ?? ""}`} role="group">
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 translate-x-1 translate-y-1 bg-black transition-transform duration-200 ease-out group-focus-within:translate-x-0 group-focus-within:translate-y-0 ${error ? "opacity-70" : "opacity-50"}`}
      />
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 border-2 border-black bg-white transition-colors duration-200 ease-out ${error ? "border-red-600 bg-red-100" : ""}`}
      />
      {children}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      name,
      label,
      placeholder,
      required,
      type = "text",
      style,
      value,
      onChange,
      error,
      helperText,
      className,
      outerClassProp,
      errorClassProp,
      autoComplete,
      ...rest
    },
    ref,
  ) => {
    const errorId = helperText && error ? `${name}-error` : undefined;
    return (
      <FieldFrame error={error} outerClassProp={outerClassProp}>
        {label && (
          <label htmlFor={name} className="absolute -top-6 left-0 block text-sm font-medium">
            {typeof label === "string" ? startCase(label) : startCase(name)}
          </label>
        )}
        <input
          {...rest}
          ref={ref}
          id={name}
          name={name}
          type={type}
          required={required}
          placeholder={placeholder || startCase(name)}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          aria-invalid={error || undefined}
          aria-describedby={errorId}
          className={`relative w-full rounded bg-transparent py-2 pl-2 text-base text-black outline-none ${error ? "text-red-700" : ""} ${className ?? ""}`}
          style={style}
        />
        {helperText && error && (
          <p id={errorId} className={`ml-2 mt-px whitespace-nowrap text-xs text-custom_red ${errorClassProp ?? ""}`}>
            {helperText.replace(/_/g, " ")}
          </p>
        )}
      </FieldFrame>
    );
  },
);
Input.displayName = "Input";

export interface TextAreaProps
  extends SharedFieldProps,
    Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "name" | "onChange" | "rows"> {
  row?: number;
  maxHeight?: number;
  onChange?: (event: ChangeEvent<HTMLTextAreaElement>) => void;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      name,
      label,
      row = 4,
      maxHeight = 300,
      value,
      onChange,
      error,
      helperText,
      className,
      outerClassProp,
      errorClassProp,
      ...rest
    },
    forwardedRef,
  ) => {
    const localRef = useRef<HTMLTextAreaElement | null>(null);
    const [height, setHeight] = useState("auto");
    const resize = (element: HTMLTextAreaElement) => {
      element.style.height = "auto";
      setHeight(`${Math.min(element.scrollHeight, maxHeight)}px`);
    };
    useEffect(() => {
      if (localRef.current) resize(localRef.current);
    }, [value, maxHeight]);
    const errorId = helperText && error ? `${name}-error` : undefined;

    return (
      <FieldFrame error={error} outerClassProp={outerClassProp}>
        {label && (
          <label htmlFor={name} className="absolute -top-6 left-0 block text-sm font-medium">
            {typeof label === "string" ? startCase(label) : startCase(name)}
          </label>
        )}
        <textarea
          {...rest}
          ref={(element) => {
            localRef.current = element;
            if (typeof forwardedRef === "function") forwardedRef(element);
            else if (forwardedRef) forwardedRef.current = element;
          }}
          id={name}
          name={name}
          rows={row}
          value={value}
          onChange={(event) => {
            resize(event.target);
            onChange?.(event);
          }}
          aria-invalid={error || undefined}
          aria-describedby={errorId}
          className={`relative w-full resize-none rounded bg-transparent py-2 pl-2 text-base text-black outline-none ${error ? "text-red-700" : ""} ${className ?? ""}`}
          style={{ height, maxHeight, overflowY: height === `${maxHeight}px` ? "auto" : "hidden" }}
        />
        {helperText && error && (
          <p id={errorId} className={`ml-2 mt-px whitespace-nowrap text-xs text-custom_red ${errorClassProp ?? ""}`}>
            {helperText.replace(/_/g, " ")}
          </p>
        )}
      </FieldFrame>
    );
  },
);
TextArea.displayName = "TextArea";
