// Converts a PNG file to ICO using PNG-in-ICO embedding (Vista+ compatible).
// ICO spec: https://en.wikipedia.org/wiki/ICO_(file_format)
const fs = require('fs');
const path = require('path');

const inputPath = path.resolve(__dirname, '../public/favicon.png');
const outputPath = path.resolve(__dirname, '../public/favicon.ico');

const pngData = fs.readFileSync(inputPath);

// ICO header: RESERVED(2) + TYPE(2) + COUNT(2)
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);   // reserved
header.writeUInt16LE(1, 2);   // type: 1 = ICO
header.writeUInt16LE(1, 4);   // image count: 1

// ICO directory entry (16 bytes per image)
const dir = Buffer.alloc(16);
dir.writeUInt8(0, 0);         // width: 0 = 256
dir.writeUInt8(0, 1);         // height: 0 = 256
dir.writeUInt8(0, 2);         // color palette
dir.writeUInt8(0, 3);         // reserved
dir.writeUInt16LE(1, 4);      // color planes
dir.writeUInt16LE(32, 6);     // bits per pixel
dir.writeUInt32LE(pngData.length, 8);           // size of image data
dir.writeUInt32LE(6 + 16, 12);                  // offset of image data (header + 1 dir entry)

const ico = Buffer.concat([header, dir, pngData]);
fs.writeFileSync(outputPath, ico);
console.log(`favicon.ico written (${ico.length} bytes)`);
