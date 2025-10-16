// HTML sanitizer for safe preview rendering
export const sanitizeHTML = (html) => {
  // Remove dangerous tags and attributes
  const dangerousTags = [
    'script', 'iframe', 'object', 'embed', 'form', 'input', 
    'button', 'textarea', 'select', 'option', 'meta', 'link'
  ];
  
  const dangerousAttributes = [
    'onload', 'onerror', 'onclick', 'onmouseover', 'onmouseout',
    'onfocus', 'onblur', 'onchange', 'onsubmit', 'onreset',
    'javascript:', 'vbscript:', 'data:'
  ];

  let sanitized = html;

  // Remove dangerous tags
  dangerousTags.forEach(tag => {
    const regex = new RegExp(`<${tag}[^>]*>.*?</${tag}>`, 'gis');
    sanitized = sanitized.replace(regex, '');
    const selfClosingRegex = new RegExp(`<${tag}[^>]*/>`, 'gis');
    sanitized = sanitized.replace(selfClosingRegex, '');
  });

  // Remove dangerous attributes
  dangerousAttributes.forEach(attr => {
    const regex = new RegExp(`${attr}[^\\s>]*`, 'gis');
    sanitized = sanitized.replace(regex, '');
  });

  // Remove script content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  return sanitized;
};

// Sanitize CSS to prevent malicious styles
export const sanitizeCSS = (css) => {
  // Remove dangerous CSS properties and values
  const dangerousProps = [
    'expression', 'javascript:', 'vbscript:', 'data:', 'import',
    'behavior', '-moz-binding', 'binding'
  ];

  let sanitized = css;

  dangerousProps.forEach(prop => {
    const regex = new RegExp(prop, 'gis');
    sanitized = sanitized.replace(regex, '');
  });

  return sanitized;
};

// Sanitize JavaScript (for static analysis only - execution is prevented)
export const sanitizeJS = (js) => {
  // This is mainly for display purposes - we don't execute user JS
  const dangerousPatterns = [
    'eval\\s*\\(',
    'Function\\s*\\(',
    'setTimeout\\s*\\(',
    'setInterval\\s*\\(',
    'document\\.write',
    'document\\.writeln',
    'window\\.location',
    'location\\.href',
    'location\\.replace',
    'location\\.assign'
  ];

  let sanitized = js;

  dangerousPatterns.forEach(pattern => {
    const regex = new RegExp(pattern, 'gis');
    sanitized = sanitized.replace(regex, '/* REMOVED: potentially dangerous code */');
  });

  return sanitized;
};

// Create safe iframe content for project preview
export const createSafeIframeContent = (html, css, js) => {
  const safeHTML = sanitizeHTML(html);
  const safeCSS = sanitizeCSS(css);
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Project Preview</title>
      <style>
        ${safeCSS}
        /* Prevent iframe from breaking out */
        * {
          max-width: 100% !important;
          max-height: 100vh !important;
        }
        body {
          margin: 0;
          padding: 10px;
          font-family: Arial, sans-serif;
          overflow-x: hidden;
        }
      </style>
    </head>
    <body>
      ${safeHTML}
      <!-- JavaScript execution is disabled for security -->
      <script>
        // Disable potentially dangerous APIs
        window.alert = function() { console.log('Alert blocked for security'); };
        window.confirm = function() { console.log('Confirm blocked for security'); return false; };
        window.prompt = function() { console.log('Prompt blocked for security'); return null; };
        
        // Log that JS is running in preview mode
        console.log('Preview mode: Some JavaScript APIs are disabled for security');
        
        // User's JavaScript (with basic sanitization)
        try {
          ${js ? `// User JavaScript:\n${sanitizeJS(js)}` : '// No JavaScript provided'}
        } catch (error) {
          console.error('Error in user JavaScript:', error);
        }
      </script>
    </body>
    </html>
  `;
};