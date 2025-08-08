export interface SIGN {
    publicKeyBytes: Promise<number>;
    privateKeyBytes: Promise<number>;
    signatureBytes: Promise<number>;
    keypair: () => Promise<{
        publicKey: Uint8Array;
        privateKey: Uint8Array;
    }>;
    sign: (message: Uint8Array, privateKey: Uint8Array) => Promise<{
        signature: Uint8Array;
    }>;
    verify: (signature: Uint8Array, message: Uint8Array, publicKey: Uint8Array) => Promise<boolean>;
}
declare function signBuilder(useFallback?: boolean, wasmFilePath?: string | undefined): Promise<SIGN>;
export default signBuilder;
