import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist', 'canvas', 'tesseract.js', 'pdf-to-img'],
  devIndicators: false,
};

export default nextConfig;
