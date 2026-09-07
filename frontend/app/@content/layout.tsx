import React from "react"

export default function layout({ children }: { children: React.ReactNode }) {
  return <div className="container mx-auto w-full max-w-7xl p-4">{children}</div>
}
