import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";


export async function extractTextFromPDF(buffer) {


    const uint8Array = new Uint8Array(buffer);


    const pdf = await pdfjsLib.getDocument({

        data: uint8Array,

        disableWorker: true

    }).promise;



    let text = "";


    for(let i = 1; i <= pdf.numPages; i++){

        const page = await pdf.getPage(i);

        const content = await page.getTextContent();


        const pageText = content.items
            .map(item => item.str)
            .join(" ");


        text += pageText + "\n";

    }


    return text;

}