"use client";

import { useActionState } from "react";
import { sendCode, verifyCode, type LoginState } from "./actions";

export function LoginForm({ initialError }: { initialError?: string }) {
  const [emailState, emailAction, sending] = useActionState<LoginState, FormData>(sendCode, {
    step: "email",
    error: initialError,
  });
  const [codeState, codeAction, verifying] = useActionState<LoginState, FormData>(verifyCode, { step: "code" });

  if (emailState.step === "code") {
    return (
      <form action={codeAction} className="space-y-4">
        <p>{emailState.message}</p>
        <input type="hidden" name="email" value={emailState.email} />
        <div>
          <label className="label" htmlFor="code">
            Sign-in code
          </label>
          <input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            autoFocus
            className="input text-center text-2xl tracking-[0.4em]"
          />
        </div>
        {codeState.error && <p className="text-sm text-red-700">{codeState.error}</p>}
        <button className="btn w-full" disabled={verifying}>
          {verifying ? "Checking…" : "Sign in"}
        </button>
      </form>
    );
  }

  return (
    <form action={emailAction} className="space-y-4">
      <div>
        <label className="label" htmlFor="email">
          RWCLL email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoFocus
          defaultValue={emailState.email}
          placeholder="you@rwcll.org"
          className="input"
        />
      </div>
      {emailState.error && <p className="text-sm text-red-700">{emailState.error}</p>}
      <button className="btn w-full" disabled={sending}>
        {sending ? "Sending…" : "Email me a sign-in code"}
      </button>
    </form>
  );
}
