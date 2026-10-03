import type { NextConfig } from "next";

const OUTPUT_EXPORT = process.env.NEXT_OUTPUT === "export";
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  ...(OUTPUT_EXPORT
    ? {
        output: "export" as const,
        trailingSlash: true,
      }
    : {}),
  ...(BASE_PATH ? { basePath: BASE_PATH } : {}),
};

export default nextConfig;
