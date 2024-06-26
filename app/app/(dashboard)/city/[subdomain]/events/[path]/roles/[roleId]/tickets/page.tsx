import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import notFound from "../../../not-found";

export default async function EventTicketSettings({
  params,
}: {
  params: { path: string; subdomain: string, roleId: string };
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  const data = await prisma.event.findFirst({
    where: {
      organization: {
        subdomain: params.subdomain,
      },
      path: params.path,
    },
  });

  if (!data) {
    return notFound();
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-cal text-3xl font-bold dark:text-white">
          {data.name} Tickets
        </h1>
      </div>
    </div>
  );
}
