import JSZip from 'jszip';
import { ProjectFile } from '../types';
import { detectLanguageFromFilename } from './codeParser';

/**
 * Creates a ZIP file containing all project files
 */
export async function createProjectZip(
  files: ProjectFile[],
  projectName: string = 'project'
): Promise<Blob> {
  const zip = new JSZip();

  for (const file of files) {
    // JSZip handles folder paths like "src/components/Header.tsx" automatically
    zip.file(file.path, file.content);
  }

  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 6,
    },
  });

  return zipBlob;
}

/**
 * Triggers a browser download of the generated project ZIP
 */
export async function downloadProjectZip(
  files: ProjectFile[],
  projectName: string = 'codeai-project'
): Promise<void> {
  if (!files || files.length === 0) {
    throw new Error('No files to compress into ZIP.');
  }

  const sanitizedName = projectName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-');

  const zipBlob = await createProjectZip(files, sanitizedName);
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${sanitizedName || 'project'}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Downloads a single file from the project
 */
export function downloadSingleFile(file: ProjectFile): void {
  const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name || file.path.split('/').pop() || 'file.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Unzips an uploaded .zip file and extracts text-based project files
 */
export async function unzipProjectFiles(fileBlob: Blob): Promise<ProjectFile[]> {
  const zip = await JSZip.loadAsync(fileBlob);
  const extractedFiles: ProjectFile[] = [];

  const entries: Array<{ relativePath: string; zipEntry: JSZip.JSZipObject }> = [];
  zip.forEach((relativePath, zipEntry) => {
    if (!zipEntry.dir && !relativePath.startsWith('__MACOSX') && !relativePath.includes('.DS_Store')) {
      entries.push({ relativePath, zipEntry });
    }
  });

  for (const { relativePath, zipEntry } of entries) {
    try {
      const content = await zipEntry.async('string');
      const filename = relativePath.split('/').pop() || relativePath;
      const language = detectLanguageFromFilename(filename);

      extractedFiles.push({
        id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        path: relativePath,
        name: filename,
        content,
        language,
        updatedAt: Date.now(),
        size: new Blob([content]).size,
      });
    } catch (err) {
      console.warn(`Skipping binary or unreadable zip entry: ${relativePath}`);
    }
  }

  return extractedFiles;
}

/**
 * Helper to calculate total project file size
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
