import { siteConfig } from "@/config/site";
import { NextResponse } from "next/server";

export const GET = () => {
  return NextResponse.json({
    name: siteConfig.name,
    shortName: siteConfig.shortName,
    description: siteConfig.description,
    version: siteConfig.version,
    url: "/dashboard",
  });
};
