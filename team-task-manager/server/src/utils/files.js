const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(__dirname, '../../uploads');

const deleteUploadedFiles = (attachments = []) => {
  attachments.forEach((attachment) => {
    if (!attachment?.fileUrl) return;

    const filename = path.basename(attachment.fileUrl);
    const filePath = path.join(uploadsDir, filename);

    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error(`Failed to delete uploaded file ${filename}:`, error.message);
    }
  });
};

module.exports = { deleteUploadedFiles };
