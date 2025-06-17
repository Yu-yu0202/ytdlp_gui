'use strict';
import { contextBridge, ipcRenderer } from 'electron';
import { spawn, ChildProcess } from 'child_process';

class FormatType {
    static readonly MP3_320 = new FormatType('audio:mp3:320', ['-x', '--audio-format', 'mp3', '--audio-quality', '0']);
    static readonly MP3_128 = new FormatType('audio:mp3:128', ['-x', '--audio-format', 'mp3', '--audio-quality', '5']);
    static readonly AUDIO_BEST = new FormatType('audio:auto:best', ['-f', 'bestaudio']);
    static readonly MP4_1080 = new FormatType('video:mp4:1080', ['-f', 'bestvideo[ext=mp4][height<=1080]+bestaudio[ext=m4a]/best[ext=mp4][height<=1080]']);
    static readonly MP4_720 = new FormatType('video:mp4:720', ['-f', 'bestvideo[ext=mp4][height<=720]+bestaudio[ext=m4a]/best[ext=mp4][height<=720]']);
    static readonly VIDEO_BEST = new FormatType('video:auto:best', ['-f', 'bestvideo+bestaudio/best']);

    static readonly types: FormatType[] = [
        FormatType.MP3_320,
        FormatType.MP3_128,
        FormatType.AUDIO_BEST,
        FormatType.MP4_1080,
        FormatType.MP4_720,
        FormatType.VIDEO_BEST
    ];

    private constructor(
        public readonly id: string,
        public readonly options: string[]
    ) {}

    private static args(id: string): FormatType | null {
        return FormatType.types.find((f) => f.id === id) ?? null;
    }

    static arg(id: string): string[] {
        const format = FormatType.args(id);
        return format ? format.options : [];
    }

    [Symbol.iterator]() {
        return this.options[Symbol.iterator]();
    }
}

contextBridge.exposeInMainWorld('ytdlp', {
    download: async (url: string, outputPath: string, formatType: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            const args = [
                ...FormatType.arg(formatType), 
                '-o', outputPath,
                url
            ];
            const child: ChildProcess = spawn('yt-dlp', args);
            
            child.stdout?.on('data', (data) => {
                ipcRenderer.send('ytdlp-stdout-renderer', data.toString());
            });
    
            child.stderr?.on('data', (data) => {
                ipcRenderer.send('ytdlp-stderr-renderer', data.toString());
            });
    
            child.on('close', (code) => {
                ipcRenderer.send('ytdlp-stdout-renderer', `process is exited by code ${code}`);
                if (code === 0) {
                    resolve(`Download completed: ${outputPath}`);
                } else {
                    reject(new Error(`yt-dlp process exited with code ${code}`));
                }
            });
        });
    },

    version: async (): Promise<string> => {
        return new Promise((resolve, reject) => {
            const child: ChildProcess = spawn('yt-dlp', ['--version']);

            let versionOutput = '';
            child.stdout?.on('data', (data) => {
                versionOutput += data.toString();
            });
    
            child.stderr?.on('data', (data) => {
                console.error(`stderr: ${data}`);
            });
    
            child.on('close', (code) => {
                if (code === 0) {
                    resolve(versionOutput.trim());
                } else {
                    reject(new Error(`yt-dlp process exited with code ${code}`));
                }
            });
        });
    },

    onStdout: (callback: (data: string) => void) => {
        ipcRenderer.on('ytdlp-stdout-renderer', (_, data) => callback(data));
    },

    onStderr: (callback: (data: string) => void) => {
        ipcRenderer.on('ytdlp-stderr-renderer', (_, data) => callback(data));
    }
});