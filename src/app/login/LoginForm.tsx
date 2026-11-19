"use client";

import { useActionState, useState } from "react";
import { sendCode, signInWithPassword, verifyCode, type LoginState } from "./actions";

export function LoginForm({ initialError }: { initialError?: string }) {
  const [mode, setMode] = useState<"password" | "code">("password");
  const [emailState, emailAction, sending] = useActionState<LoginState, FormData>(sendCode, {
    step: "email",
    error: initialError,
  });
  const [passwordState, passwordAction, signingIn] = useActionState<LoginState, FormData>(signInWithPassword, {
    step: "email",
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

  const state = mode === "password" ? passwordState : emailState;
  const email = passwordState.email ?? emailState.email;

  return (
    <form action={mode === "password" ? passwordAction : emailAction} className="space-y-4">
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
          autoComplete="username"
          defaultValue={email}
          placeholder="you@rwcll.org"
          className="input"
        />
      </div>
      {mode === "password" && (
        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="input"
          />
        </div>
      )}
      {(state.error || (mode === "password" && emailState.error)) && (
        <p className="text-sm text-red-700">{state.error ?? emailState.error}</p>
      )}
      {mode === "password" ? (
        <>
          <button className="btn w-full" disabled={signingIn}>
            {signingIn ? "Signing in…" : "Sign in"}
          </button>
          <button type="button" className="link block w-full text-center text-sm" onClick={() => setMode("code")}>
            Email me a sign-in code instead
          </button>
        </>
      ) : (
        <>
          <button className="btn w-full" disabled={sending}>
            {sending ? "Sending…" : "Email me a sign-in code"}
          </button>
          <button type="button" className="link block w-full text-center text-sm" onClick={() => setMode("password")}>
            Use my password instead
          </button>
        </>
      )}
    </form>
  );
}
