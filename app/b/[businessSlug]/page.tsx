import { redirect } from "next/navigation";

export default function BusinessIndexPage({ params }: { params: { businessSlug: string } }) {
  redirect(`/b/${params.businessSlug}/dashboard`);
}
