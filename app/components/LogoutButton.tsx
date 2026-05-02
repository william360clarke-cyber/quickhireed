"use client";
import { signOut } from "next-auth/react";

export default function LogoutButton({ className, style, children }: { className?: string; style?: React.CSSProperties; children: React.ReactNode }) {
  return (
    <button
      onClick={() => signOut({ redirect: false }).then(() => { window.location.href = "/"; })}
      className={className}
      style={{ background: "none", border: "none", cursor: "pointer", padding: 0, font: "inherit", ...style }}
    >
      {children}
    </button>
  );
}
