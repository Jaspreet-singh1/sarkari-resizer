// Google Analytics 4 (GA4) Configuration
// Replace 'G-XXXXXXXXXX' with your actual Measurement ID when you get it.
const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX';

// Load the Google Analytics script securely
(function () {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    gtag('js', new Date());

    gtag('config', GA_MEASUREMENT_ID, {
        'anonymize_ip': true,   // Privacy-first
        'cookie_flags': 'SameSite=None;Secure'
    });
})();
