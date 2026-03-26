import React from 'react';

// Simple HTML sanitizer without external dependency
function sanitizeHTML(html: string, allowLinks: boolean): string {
  const div = document.createElement('div');
  div.innerHTML = html;

  const allowedTags = allowLinks
    ? ['B', 'I', 'EM', 'STRONG', 'A', 'P', 'BR', 'UL', 'OL', 'LI']
    : ['B', 'I', 'EM', 'STRONG', 'P', 'BR'];

  const allowedAttrs = allowLinks ? ['href', 'target', 'rel'] : [];

  function clean(node: Element) {
    const children = Array.from(node.childNodes);
    children.forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as Element;
        if (!allowedTags.includes(el.tagName)) {
          // Replace disallowed tags with their text content
          const text = document.createTextNode(el.textContent || '');
          node.replaceChild(text, el);
        } else {
          // Remove disallowed attributes
          Array.from(el.attributes).forEach((attr) => {
            if (!allowedAttrs.includes(attr.name)) {
              el.removeAttribute(attr.name);
            }
          });
          clean(el);
        }
      }
    });
  }

  clean(div);
  return div.innerHTML;
}

interface SafeHTMLProps {
  html: string;
  className?: string;
  allowLinks?: boolean;
}

export default function SafeHTML({ html, className = '', allowLinks = false }: SafeHTMLProps) {
  const sanitized = sanitizeHTML(html, allowLinks);

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
