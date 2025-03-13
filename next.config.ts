import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL,
    MAX_TOKENS: process.env.MAX_TOKENS,
    TEMPERATURE: process.env.TEMPERATURE,
  },
};

export default nextConfig;
