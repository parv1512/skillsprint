import { starterSchema, type Starter } from "../domain/starter";

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/** Small, uncompressed ZIP. Generated files are downloaded, never executed or written by the app. */
export function createStarterArchive(value: Starter): Uint8Array<ArrayBuffer> {
  const starter = starterSchema.parse(value);
  const encoder = new TextEncoder();
  const local: Uint8Array[] = [], central: Uint8Array[] = [];
  let offset = 0;
  for (const file of starter.files) {
    const name = encoder.encode(`starter-project/${file.path}`), content = encoder.encode(file.content);
    const crc = crc32(content);
    const header = new Uint8Array(30 + name.length), h = new DataView(header.buffer);
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x800, true);
    h.setUint16(12, 33, true); h.setUint32(14, crc, true); h.setUint32(18, content.length, true);
    h.setUint32(22, content.length, true); h.setUint16(26, name.length, true); header.set(name, 30);
    local.push(header, content);
    const directory = new Uint8Array(46 + name.length), d = new DataView(directory.buffer);
    d.setUint32(0, 0x02014b50, true); d.setUint16(4, 20, true); d.setUint16(6, 20, true); d.setUint16(8, 0x800, true);
    d.setUint16(14, 33, true); d.setUint32(16, crc, true); d.setUint32(20, content.length, true);
    d.setUint32(24, content.length, true); d.setUint16(28, name.length, true); d.setUint32(42, offset, true);
    directory.set(name, 46); central.push(directory); offset += header.length + content.length;
  }
  const centralSize = central.reduce((sum, bytes) => sum + bytes.length, 0);
  const end = new Uint8Array(22), e = new DataView(end.buffer);
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, starter.files.length, true); e.setUint16(10, starter.files.length, true);
  e.setUint32(12, centralSize, true); e.setUint32(16, offset, true);
  const archive = new Uint8Array(offset + centralSize + end.length);
  let cursor = 0;
  for (const bytes of [...local, ...central, end]) { archive.set(bytes, cursor); cursor += bytes.length; }
  return archive;
}
