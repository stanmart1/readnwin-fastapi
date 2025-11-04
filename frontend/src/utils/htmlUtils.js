/**
 * Safely render HTML content from ReactQuill
 */
export const renderHTML = (htmlContent) => {
  if (!htmlContent) return '';
  
  // Decode HTML entities
  const decoded = htmlContent
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  
  return decoded;
};

/**
 * Strip HTML tags for plain text preview
 */
export const stripHTML = (htmlContent) => {
  if (!htmlContent) return '';
  
  const decoded = renderHTML(htmlContent);
  return decoded.replace(/<[^>]*>/g, '');
};

/**
 * Create safe HTML props for dangerouslySetInnerHTML
 */
export const createHTMLProps = (htmlContent) => ({
  dangerouslySetInnerHTML: { __html: renderHTML(htmlContent) }
});