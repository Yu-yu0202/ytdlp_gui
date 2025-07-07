document.addEventListener("DOMContentLoaded", async () => {
    console.info("[debug]: DOMContentLoaded Called");
    const ytdlp_version_span: HTMLElement | null = document.getElementById('ytdlp_version');
    const ytdlp_version: string = await window.ytdlp.version();
    if (ytdlp_version_span) {
        ytdlp_version_span.textContent = ytdlp_version;
    } else {
        console.warn("[debug]: ytdlp_version_span not found");
    }
});

const downloadButton: HTMLElement | null = document.getElementById('download');
const stdOut: HTMLElement | null = document.getElementById('stdout');
const stderr: HTMLElement | null = document.getElementById('stderr');
const messageArea: HTMLElement | null = document.getElementById('message-area');

function showMessage(message: string, type: 'success' | 'failure') {
    if (messageArea) {
        messageArea.textContent = message;
        messageArea.className = '';
        messageArea.classList.add(type === 'success' ? 'message-success' : 'message-failure');
        messageArea.style.display = 'block';
        setTimeout(() => {
            if (messageArea) {
                messageArea.style.display = 'none';
                messageArea.textContent = '';
                messageArea.className = '';
            }
        }, 5000);
    }
}

window.ytdlp.onStdout((data: string) => {
    if (stdOut) {
        if (stdOut instanceof HTMLTextAreaElement) {
            stdOut.value += data;
        } else if (stdOut.textContent !== undefined) {
            stdOut.textContent += data;
        }
    }
});

downloadButton?.addEventListener('click', async (event: MouseEvent) => {
    console.info("[debug]: Download button clicked");
    event.preventDefault();
    const url: string | null = (document.getElementById('vurl') as HTMLInputElement).value;
    const outputPath: string | null = (document.getElementById('filename') as HTMLInputElement).value;
    const formatType: string = (document.getElementById('format') as HTMLSelectElement).value;
    if (!url || !formatType) {
        console.error("[debug]: Missing input values");
        alert("Please fill in all fields.");
        return;
    }
    try {
        if (!stdOut || !stderr) {
            console.error("[debug]: stdOut or stderr not found");
            throw new Error("stdOut or stderr not found");
        }
        if (stdOut instanceof HTMLTextAreaElement) {
            stdOut.value = '';
        } else if (stdOut.textContent !== undefined) {
            stdOut.textContent = '';
        }
        if (stderr instanceof HTMLTextAreaElement) {
            stderr.value = '';
        } else if (stderr.textContent !== undefined) {
            stderr.textContent = '';
        }
        
        const format = document.getElementById('format') as HTMLSelectElement | null;
        const ext = format?.selectedOptions?.[0]?.text.toLowerCase() ?? '';

        await window.ytdlp.download(url, outputPath, formatType, stdOut, stderr, ext);
        showMessage("ダウンロードが完了しました！", 'success');
    } catch (error: any) {
        console.error("[debug]: Download failed", error);
        alert(`Download failed: ${error.message}`);
        showMessage(`ダウンロードに失敗しました: ${error.message}`, 'failure');
    }
});