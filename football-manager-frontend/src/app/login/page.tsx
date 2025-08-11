"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { registerOrLogin } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Helper: classnames joiner
function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

type Mode = "login" | "register";

type ApiErrors = Partial<Record<
  | "email"
  | "password"
  | "name"
  | "lastName"
  | "username"
  | "_form",
  string
>>;

const emailZ = z
  .string()
  .min(1, { message: "Email is required." })
  .email({ message: "Enter a valid email." });
const passwordZ = z
  .string()
  .min(6, { message: "At least 6 characters." });
const usernameZ = z
  .string()
  .min(1, { message: "Username is required." })
  .regex(/^[a-zA-Z0-9_]{3,16}$/, { message: "3–16 chars, letters/numbers/_ only." });

const loginSchema = z.object({
  email: emailZ,
  password: passwordZ,
});

const registerSchema = loginSchema.extend({
  name: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  username: usernameZ,
});

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);
  const { setToken } = useAuth();
  const router = useRouter();

  const resolver = useMemo(
    () => zodResolver(mode === "login" ? loginSchema : registerSchema),
    [mode]
  );

  type LoginValues = z.infer<typeof loginSchema>;
  type RegisterValues = z.infer<typeof registerSchema>;
  type FormValues = LoginValues & Partial<RegisterValues>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver,
    defaultValues: {
      email: "",
      password: "",
      name: "",
      lastName: "",
      username: "",
    },
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  // Remount form when switching modes to refresh validation
  const FormKeyed = ({ children }: { children: React.ReactNode }) => (
    <div key={mode}>{children}</div>
  );

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    const payload: any = { email: values.email, password: values.password };
    if (mode === "register") {
      payload.name = values.name;
      payload.lastName = values.lastName;
      payload.username = values.username;
    }

    try {
      setLoading(true);
      const result = await registerOrLogin(payload);
      const token = result?.data?.token;
      if (!token) throw new Error("Unexpected response from server.");
      setToken(token);
      Cookies.set("fm_token", token, { expires: 7 });
      router.push("/");
    } catch (err: any) {
      const serverMsg = err?.response?.data?.message || err?.message || "Something went wrong.";
      setServerError(serverMsg);
      // Optional: if API returns field-level errors
      const fieldErrors = err?.response?.data?.errors as ApiErrors | undefined;
      if (fieldErrors && Object.keys(fieldErrors).length) {
        // Map them to RHF if needed (left simple to avoid complexity)
      }
    } finally {
      setLoading(false);
    }
  };

  const Switch = () => (
    <div className="flex w-full p-1 bg-gray-100 rounded-xl text-sm font-medium">
      {(["login", "register"] as Mode[]).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => {
            setMode(m);
            setServerError(null);
            reset();
          }}
          className={cn(
            "flex-1 py-2 rounded-lg transition",
            m === mode ? "bg-white shadow" : "opacity-60 hover:opacity-100"
          )}
          aria-pressed={m === mode}
        >
          {m === "login" ? "Login" : "Register"}
        </button>
      ))}
    </div>
  );

  const Field = ({
    label,
    name,
    type = "text",
    placeholder,
  }: {
    label: string;
    name: keyof FormValues;
    type?: string;
    placeholder?: string;
  }) => (
    <div className="space-y-1">
      <label htmlFor={name as string} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={name as string}
        {...register(name as any)}
        type={type}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-xl border bg-white/60 p-3 outline-none transition focus:ring-2",
          errors[name]
            ? "border-red-400 focus:ring-red-200"
            : "border-gray-200 focus:border-transparent focus:ring-blue-200"
        )}
        aria-invalid={!!errors[name]}
        aria-describedby={errors[name] ? `${String(name)}-error` : undefined}
      />
      {errors[name]?.message && (
        <p id={`${String(name)}-error`} className="text-xs text-red-600">
          {String(errors[name]?.message)}
        </p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Football Manager</h1>
          <p className="text-sm text-gray-500">Welcome back — sign in or create an account</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white shadow-xl shadow-black/5 p-6 sm:p-8">
          <div className="mb-6"><Switch /></div>

          {serverError && (
            <div className="mb-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <FormKeyed>
            <form
              className="space-y-4"
              onSubmit={handleSubmit(onSubmit)}
              onKeyDown={(e) => {
                const target = e.target as HTMLElement;
                if (e.key === "Enter" && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
                  e.preventDefault();
                }
              }}
              noValidate
            >
              <Field label="Email" name="email" type="email" placeholder="you@example.com" />

              <div className="space-y-1">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className={cn(
                  "flex items-center rounded-xl border bg-white/60",
                  errors.password ? "border-red-400" : "border-gray-200"
                )}>
                  <input
                    id="password"
                    {...register("password")}
                    type={showPw ? "text" : "password"}
                    placeholder="••••••"
                    className="w-full rounded-xl bg-transparent p-3 outline-none"
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? "password-error" : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="px-3 py-2 text-xs text-gray-500 hover:text-gray-800"
                  >
                    {showPw ? "Hide" : "Show"}
                  </button>
                </div>
                {errors.password?.message && (
                  <p id="password-error" className="text-xs text-red-600">{String(errors.password.message)}</p>
                )}
              </div>

              {mode === "register" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="First name" name="name" placeholder="Jane" />
                  <Field label="Last name" name="lastName" placeholder="Doe" />
                  <div className="sm:col-span-2">
                    <Field label="Username" name="username" placeholder="jane_doe" />
                  </div>
                </div>
              )}

              <button
                className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-white font-medium shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-50"
                disabled={loading || isSubmitting}
              >
                {loading || isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" fill="none" strokeWidth="4" className="opacity-25" />
                      <path d="M4 12a8 8 0 018-8" fill="none" strokeWidth="4" className="opacity-75" />
                    </svg>
                    Processing…
                  </span>
                ) : (
                  <span>{mode === "login" ? "Sign in" : "Create account"}</span>
                )}
              </button>
            </form>
          </FormKeyed>
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          {mode === "login" ? (
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setServerError(null);
                reset();
              }}
              className="font-medium text-blue-600 hover:underline"
            >
              Need an account? Register
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setServerError(null);
                reset();
              }}
              className="font-medium text-blue-600 hover:underline"
            >
              Have an account? Login
            </button>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          By continuing you agree to our Terms & Privacy Policy.
        </p>
      </div>
    </div>
  );
}
