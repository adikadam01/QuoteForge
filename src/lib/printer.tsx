import React from 'react';
import { createRoot } from 'react-dom/client';

export type PrintOptions = {
    title?: string;
};

/**
 * Renders a React component into a hidden iframe and triggers the browser print dialog.
 * This guarantees vector-quality PDF output via strict CSS print rules.
 */
export async function printDocument(component: React.ReactElement, options?: PrintOptions) {
    // 1. Create a hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.top = '0';
    iframe.style.left = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.style.visibility = 'hidden';

    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
        document.body.removeChild(iframe);
        throw new Error('Could not access iframe document');
    }

    // 2. Inject basic HTML structure and styles
    doc.open();
    doc.write('<!DOCTYPE html>');
    doc.write('<html><head><title>' + (options?.title || 'Document') + '</title>');

    // Inject global styles and specific document styles
    // We assume main CSS is built/available or we inject the critical parts.
    // For safety, we'll inject the specific documents.css content if we can,
    // OR we link the same stylesheets as the main app.

    // Strategy: Copy all style tags and link tags from main document
    const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
    styles.forEach((styleNode) => {
        doc.write(styleNode.outerHTML);
    });

    // Add strict print overrides directly to ensure they load
    doc.write(`
    <style>
      @page {
        size: A4;
        margin: 0;
      }
      body {
        margin: 0;
        padding: 0;
        background: white;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      /* Ensure no scrollbars in print output */
      html, body {
        overflow: visible; 
        height: auto;
      }
    </style>
  `);

    doc.write('</head><body><div id="print-root"></div></body></html>');
    doc.close();

    // 3. Mount the React component
    const rootEl = doc.getElementById('print-root');
    if (rootEl) {
        const root = createRoot(rootEl);
        root.render(component);

        // 4. Wait for images/fonts to load then print
        // We use a generous timeout or check for load events if strictly needed.
        // For simplicity, we wait for a brief moment and for document load.
        await new Promise<void>((resolve) => {
            // Small delay to allow React layout to settle
            setTimeout(() => {
                // Ensure images are likely loaded
                const images = doc.images;
                if (images.length === 0) {
                    resolve();
                    return;
                }

                // Simple checklist for images
                let loaded = 0;
                const check = () => {
                    loaded++;
                    if (loaded >= images.length) resolve();
                };

                for (let i = 0; i < images.length; i++) {
                    if (images[i].complete) {
                        loaded++;
                    } else {
                        images[i].onload = check;
                        images[i].onerror = check; // proceed anyway
                    }
                }
                if (loaded === images.length) resolve();
            }, 500);
        });

        // 5. Trigger Print
        try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
        } catch (e) {
            console.error('Print failed', e);
        } finally {
            // 6. Cleanup (optional: delay cleanup relative to print interaction)
            // Browsers usually block the thread during print dialog, so this runs after close.
            // However, some browsers are async. 
            // Safe approach: Remove after a minute or let it stay hidden (it's 0x0).
            // We'll remove it after a safe delay.
            setTimeout(() => {
                if (document.body.contains(iframe)) {
                    document.body.removeChild(iframe);
                }
            }, 5000);
        }
    }
}
