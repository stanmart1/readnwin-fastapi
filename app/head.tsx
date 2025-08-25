export default function Head() {
  return (
    <>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="theme-color" content="#3b82f6" />
      
      {/* Favicon meta tags for better browser compatibility */}
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon.png" />
      <link rel="shortcut icon" href="/favicon.png" />
      <link rel="apple-touch-icon" href="/favicon.png" />
      
      {/* Disable automatic preloading */}
      <meta name="next-head-count" content="0" />
      
      {/* Disable automatic resource hints */}
      <meta name="next-router-prefetch" content="false" />
      <meta name="next-router-prefetch-on-hover" content="false" />
      <meta name="next-router-prefetch-on-viewport" content="false" />
      
      {/* Disable automatic preloading */}
      <meta name="next-router-prefetch" content="false" />
      <meta name="next-router-prefetch-on-hover" content="false" />
      <meta name="next-router-prefetch-on-viewport" content="false" />
    </>
  )
} 