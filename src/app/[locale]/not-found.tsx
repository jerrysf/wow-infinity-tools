import Link from "next/link";
import { getDictionary } from "@/i18n/get-dictionary";
import { localizedPath } from "@/lib/site";
import { defaultLocale } from "@/i18n/config";

export default function LocaleNotFound() {
  const dict = getDictionary(defaultLocale);
  return (
    <div className="py-16 text-center">
      <h1 className="text-2xl font-bold">{dict.notFound.title}</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">{dict.notFound.description}</p>
      <Link
        href={localizedPath(defaultLocale, "/")}
        className="mt-6 inline-block rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
      >
        {dict.notFound.backHome}
      </Link>
    </div>
  );
}
