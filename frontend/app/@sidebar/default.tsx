import Link from "next/link"

export default function Page() {
  return (
    <div className="m-4 flex flex-col gap-2">
      <Link href="/">Accueil</Link>
      <Link href="/posts">Posts</Link>
      <Link href="/todos">Todos</Link>
    </div>
  )
}
