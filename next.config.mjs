/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js', 'lucide-react'],
  },
  webpack: (config, { isServer }) => {
    // canvg (bundled by jspdf) references core-js v2 module paths incompatible with core-js v3.
    // Since jspdf is only used client-side via next/dynamic({ ssr: false }),
    // we provide empty module resolution for these problematic paths.
    config.resolve.alias = {
      ...config.resolve.alias,
      'canvg': false,
      // Additional core-js v2 modules that canvg may reference via jspdf
      'core-js/modules/es.object.to-string.js': false,
      'core-js/modules/es.promise.js': false,
      'core-js/modules/es.reflect.delete-property.js': false,
      'core-js/modules/es.array.map.js': false,
      'core-js/modules/es.parse-float.js': false,
      'core-js/modules/es.regexp.exec.js': false,
      'core-js/modules/es.string.match.js': false,
      'core-js/modules/es.string.replace.js': false,
      'core-js/modules/es.string.starts-with.js': false,
      'core-js/modules/es.array.join.js': false,
    };

    return config;
  },
}

export default nextConfig