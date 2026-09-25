import { redirect } from "next/navigation"
export default async function EditRoutePage({params}: {params:Promise<{id:string}>}) {
  const {id} = await params
  redirect(`/carrier/routes/${encodeURIComponent(id)}`)
}
