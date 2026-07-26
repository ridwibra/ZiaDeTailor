// utils/files/dataUrlToBlob.ts

type DataURI = `data:${string}`;

export default function dataURItoBlob(dataURI: string | DataURI): Blob | null {
  if (!dataURI || typeof dataURI !== "string") {
    console.error("Invalid dataURI provided");
    return null;
  }

  // Early return for URLs
  if (dataURI.startsWith("http://") || dataURI.startsWith("https://")) {
    console.warn("URL provided instead of data URI - conversion not possible");
    return null;
  }

  // Validate data URI format
  if (!dataURI.startsWith("data:")) {
    console.error("Invalid data URI format - must start with 'data:'");
    return null;
  }

  try {
    const [header, data] = dataURI.split(",", 2);
    if (!header || !data) {
      console.error("Malformed dataURI - missing header or data");
      return null;
    }

    // Extract MIME type more safely
    const mimeMatch = header.match(/^data:([^;]+)/);
    if (!mimeMatch) {
      console.error("Could not extract MIME type from data URI");
      return null;
    }
    const mimeString = mimeMatch[1];

    // Decode the data
    let byteString: string;
    if (header.includes("base64")) {
      try {
        byteString = atob(data);
      } catch (e) {
        console.error("Failed to decode base64 data", e);
        return null;
      }
    } else {
      try {
        byteString = decodeURIComponent(data);
      } catch (e) {
        console.error("Failed to decode URI component", e);
        return null;
      }
    }

    // Convert to Uint8Array
    const byteArray = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
      byteArray[i] = byteString.charCodeAt(i);
    }

    return new Blob([byteArray], { type: mimeString });
  } catch (error) {
    console.error("Error converting dataURI to Blob:", error);
    return null;
  }
}
