import Link from "next/link";
import { getDictionary } from "@/i18n/get-dictionary";
import { localizedPath } from "@/lib/site";
import { defaultLocale } from "@/i18n/config";

export default function LocaleNotFound() {
  const dict = getDictionary(defaultLocale);
  return (
    <div className="py-16 text-center">
      <h1 className="text-2xl font-bold">{dict.notFound.title}</h1>
      <p className="mt-2 text-[#9aa8bc]">{dict.notFound.description}</p>
      <Link
        href={localizedPath(defaultLocale, "/")}
        className="btn-gold mt-6"
      >
        {dict.notFound.backHome}
      </Link>
    </div>
  );
}
