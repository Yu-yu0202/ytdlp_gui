import { Readable } from "node:stream"

declare global {
    interface Window {
        ytdlp: {
            version: () => Promise<string>
            download: (url: string, outputPath: string | undefined, formatType: string, stdout: HTMLElement, stderr: HTMLElement, ext: string) => Promise<string>
            onStdout: (callback: (data: string) => void) => void
            onStderr: (callback: (data: string) => void) => void
        }
    }
}

export {}; 