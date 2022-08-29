export function createSignatureHeader(signatureKeyId, signature) {
  return 'keyId="' + signatureKeyId + '",algorithm="hmac-sha384",signature="' + signature + '"';
}
