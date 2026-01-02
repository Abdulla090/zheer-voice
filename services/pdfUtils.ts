
import * as pdfjs from 'pdfjs-dist';

// Configure worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export interface PdfPageImage {
    pageNumber: number;
    base64: string;
    type: string;
}

/**
 * Converts a PDF file into a list of base64 images, one per page.
 */
export async function pdfToImages(file: File): Promise<PdfPageImage[]> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    const images: PdfPageImage[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // High quality

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) continue;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
            canvasContext: context,
            viewport: viewport
        }).promise;

        const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
        images.push({
            pageNumber: i,
            base64,
            type: 'image/jpeg'
        });
    }

    return images;
}
