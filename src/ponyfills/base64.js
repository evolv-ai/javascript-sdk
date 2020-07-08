import base64ab from 'base64-arraybuffer';

export default {
  encode: function(bytes) {
    // eslint-disable-next-line no-undef
    return typeof btoa !== 'undefined' ? btoa(bytes) : Buffer.from(bytes).toString('base64');
  },
  decode: function(string) {
    // eslint-disable-next-line no-undef
    return typeof atob !== 'undefined' ? atob(string) : Buffer.from(string, 'base64').toString();
  },
  encodeFromArrayBuffer: base64ab.encode,
  decodeToArrayBuffer: base64ab.decode
};
