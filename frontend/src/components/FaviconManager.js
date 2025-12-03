import { useEffect } from 'react';
import favicon from '.././assets/images/favicon.ico';
import appleTouchIcon from '.././assets/images/apple-touch-icon.png';
import favicon16 from '.././assets/images/favicon-16x16.png';
import favicon32 from '.././assets/images/favicon-32x32.png';
import androidChrome192 from '.././assets/images/android-chrome-192x192.png';
import androidChrome512 from '.././assets/images/android-chrome-512x512.png';

const FaviconManager = () => {
  useEffect(() => {
    // Remove existing favicons and manifest
    const existingFavicons = document.querySelectorAll('link[rel*="icon"], link[rel="manifest"]');
    existingFavicons.forEach(link => link.remove());

    // Add new favicons using imported paths
    const links = [
      { rel: 'icon', href: favicon, type: 'image/x-icon' },
      { rel: 'apple-touch-icon', href: appleTouchIcon, sizes: '180x180' },
      { rel: 'icon', href: favicon16, sizes: '16x16', type: 'image/png' },
      { rel: 'icon', href: favicon32, sizes: '32x32', type: 'image/png' }
    ];

    links.forEach(linkData => {
      const link = document.createElement('link');
      Object.keys(linkData).forEach(key => {
        link.setAttribute(key, linkData[key]);
      });
      document.head.appendChild(link);
    });

    // ✅ Dynamic manifest generation
    const manifest = {
      "short_name": "CanYouCheat",
      "name": "CanYouCheat - AI proctoring",
      "icons": [
        {
          "src": favicon,
          "sizes": "64x64 32x32 24x24 16x16",
          "type": "image/x-icon"
        },
        {
          "src": appleTouchIcon,
          "sizes": "180x180",
          "type": "image/png"
        },
        {
          "src": androidChrome192,
          "type": "image/png",
          "sizes": "192x192"
        },
        {
          "src": androidChrome512,
          "type": "image/png",
          "sizes": "512x512"
        }
      ],
      "start_url": ".",
      "display": "standalone",
      "theme_color": "#ffffff",
      "background_color": "#ffffff"
    };

    // Create blob URL for manifest
    const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
    const manifestUrl = URL.createObjectURL(manifestBlob);

    // Add manifest link
    const manifestLink = document.createElement('link');
    manifestLink.setAttribute('rel', 'manifest');
    manifestLink.setAttribute('href', manifestUrl);
    document.head.appendChild(manifestLink);

    // Cleanup blob URL when component unmounts
    return () => {
      URL.revokeObjectURL(manifestUrl);
    };
  }, []);

  return null;
};

export default FaviconManager;