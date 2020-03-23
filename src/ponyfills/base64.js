import base64ab from 'base64-arraybuffer';

export default {
  encode: function(bytes) {
    return typeof btoa !== 'undefined' ? btoa(bytes) : Buffer.from(bytes).toString('base64');
  },
  decode: function(string) {
    return typeof atob !== 'undefined' ? atob(string) : Buffer.from(string, 'base64').toString();
  },
  encodeFromArrayBuffer: base64ab.encode,
  decodeToArrayBuffer: base64ab.decode
};
