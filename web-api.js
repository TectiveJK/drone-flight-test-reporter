// Browser adapter for the public Web version.
// It replaces Electron's window.api with standard browser APIs.
(() => {
  const pickFiles = (options = {}) => new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = Boolean(options.multi);
    const accept = (options.filters || [])
      .flatMap((f) => (f.extensions || []).map((ext) => `.${ext}`))
      .join(',');
    if (accept) input.accept = accept;
    input.onchange = () => {
      const files = Array.from(input.files || []);
      resolve({ canceled: files.length === 0, filePaths: files.map((f) => f.name), files });
    };
    input.click();
  });

  const download = (content, filename, type = 'text/plain') => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return { canceled: false, filePath: filename };
  };

  window.api = {
    selectFiles: pickFiles,
    async openJSON() {
      const result = await pickFiles({ filters: [{ extensions: ['json'] }] });
      if (result.canceled) return result;
      try {
        const text = await result.files[0].text();
        return { canceled: false, filePath: result.filePaths[0], data: JSON.parse(text) };
      } catch (error) {
        return { canceled: false, error: `Unable to read JSON report: ${error.message}` };
      }
    },
    async saveJSON(data, filename) {
      return download(JSON.stringify(data, null, 2), filename, 'application/json');
    },
    async saveMarkdown(markdown, filename) {
      return download(markdown, filename, 'text/markdown');
    },
    async exportPDF(html) {
      const printWindow = window.open('', '_blank', 'noopener,noreferrer');
      if (!printWindow) {
        return { canceled: true, error: 'Please allow pop-ups to export/print the report.' };
      }
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 300);
      return { canceled: false, filePath: 'Print dialog' };
    }
  };
})();
