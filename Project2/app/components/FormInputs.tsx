import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ReactNode } from "react";

interface BaseInputProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export function TextInput({
  label,
  error,
  hint,
  required,
  className = "",
  ...props
}: BaseInputProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-dark-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        className={`w-full px-3 py-2.5 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
          error ? "border-red-400 bg-red-50" : "border-dark-300 bg-white"
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="text-xs text-dark-500">{hint}</p>}
    </div>
  );
}

export function TextAreaInput({
  label,
  error,
  hint,
  required,
  className = "",
  rows = 4,
  ...props
}: BaseInputProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-dark-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <textarea
        rows={rows}
        className={`w-full px-3 py-2.5 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-y ${
          error ? "border-red-400 bg-red-50" : "border-dark-300 bg-white"
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="text-xs text-dark-500">{hint}</p>}
    </div>
  );
}

interface SelectOption {
  value: string;
  label: string;
}

export function SelectInput({
  label,
  error,
  hint,
  required,
  options,
  className = "",
  ...props
}: BaseInputProps & SelectHTMLAttributes<HTMLSelectElement> & { options: SelectOption[] }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-dark-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        className={`w-full px-3 py-2.5 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white ${
          error ? "border-red-400 bg-red-50" : "border-dark-300"
        } ${className}`}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="text-xs text-dark-500">{hint}</p>}
    </div>
  );
}

interface FileUploadProps {
  label: string;
  accept?: string;
  error?: string;
  required?: boolean;
  children?: ReactNode;
  onFileSelect?: (file: File) => void;
}

export function FileUpload({ label, accept, error, required, children, onFileSelect }: FileUploadProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileSelect) {
      onFileSelect(file);
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-dark-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <label className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
        error ? "border-red-400 bg-red-50" : "border-dark-300 bg-white hover:bg-dark-50 hover:border-primary-400"
      }`}>
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleChange}
        />
        <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4">
          {children || (
            <>
              <svg className="w-10 h-10 mb-3 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="mb-1 text-sm text-dark-600">
                <span className="font-medium text-primary-600">点击上传</span> 或拖拽文件到此处
              </p>
              <p className="text-xs text-dark-400">支持音乐、视频、文档文件</p>
            </>
          )}
        </div>
      </label>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
