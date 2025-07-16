export class FileService {
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'text/plain',
    'text/csv',
    'application/pdf',
    'application/json',
    'text/markdown',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  async processFile(file: File): Promise<{
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
    content?: string;
  }> {
    // Validate file size
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`File size must be less than ${this.MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // Validate file type
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      throw new Error(`File type ${file.type} is not supported`);
    }

    const id = this.generateId();
    const url = URL.createObjectURL(file);

    let content: string | undefined;

    // Process different file types
    if (file.type.startsWith('text/') || file.type === 'application/json') {
      content = await this.readTextFile(file);
    } else if (file.type.startsWith('image/')) {
      content = await this.readImageFile(file);
    } else if (file.type === 'application/pdf') {
      content = 'PDF file attached (content extraction not implemented)';
    }

    return {
      id,
      name: file.name,
      type: file.type,
      size: file.size,
      url,
      content
    };
  }

  private async readTextFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Failed to read text file'));
      reader.readAsText(file);
    });
  }

  private async readImageFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(file);
    });
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  isImageFile(type: string): boolean {
    return type.startsWith('image/');
  }

  getFileIcon(type: string): string {
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('text/')) return '📄';
    if (type === 'application/pdf') return '📕';
    if (type === 'application/json') return '📋';
    return '📎';
  }
}