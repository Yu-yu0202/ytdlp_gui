interface Window {
    ytdlp: {
        version: () => string;
        download: (url: string, outputPath: string, formatType: string) => Promise<string>;
        onStdout: (callback: (line: string) => void) => void;
        onStderr: (callback: (line: string) => void) => void;
    }
} 