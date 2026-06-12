import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData
} from "@remix-run/react";
import { json } from "@remix-run/node";
import type { LinksFunction, LoaderFunction } from "@remix-run/node";
import stylesheet from "~/tailwind.css?url";
import Sidebar from "~/components/Sidebar";
import { getCurrentUser, getAllUsers, DEFAULT_LICENSEE_ID } from "~/services/user.server";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet }
];

export const loader: LoaderFunction = async () => {
  const currentUser = await getCurrentUser();
  const allUsers = await getAllUsers();
  return json({ currentUser, allUsers, defaultLicenseeId: DEFAULT_LICENSEE_ID });
};

export function Layout({ children }: { children: React.ReactNode }) {
  const data = useLoaderData<typeof loader>();

  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <div className="flex min-h-screen bg-slate-100">
          <Sidebar
            currentUser={data.currentUser}
            allUsers={data.allUsers}
          />
          <main className="flex-1 ml-64">
            <div className="p-8">
              {children}
            </div>
          </main>
        </div>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
