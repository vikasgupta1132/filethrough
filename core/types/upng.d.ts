declare module '@upng/upng-js' {
    const UPNG: {
        encode(
            imgs: ArrayBuffer[],
            width: number,
            height: number,
            colorCount: number
        ): ArrayBuffer;
    };

    export default UPNG;
}