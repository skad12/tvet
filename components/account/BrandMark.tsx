import Image from "next/image";
import Link from "next/link";

import logo from "@/public/images/tvet-logo.png";

/** The TVET Support logo and name, with which workspace this is. */
export default function BrandMark({ workspace, href }: { workspace: string; href: string }) {
  return (
    <Link href={href} className="inline-flex min-w-0 items-center gap-2.5 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <Image src={logo} alt="TVET Support logo" width={32} height={32} className="h-8 w-8 shrink-0 rounded object-contain" priority />
      <span className="min-w-0 leading-tight">
        <span className="block truncate text-base font-bold tracking-tight text-foreground">TVET Support</span>
        <span className="block truncate text-[11px] font-medium uppercase tracking-wider text-muted">{workspace}</span>
      </span>
    </Link>
  );
}
