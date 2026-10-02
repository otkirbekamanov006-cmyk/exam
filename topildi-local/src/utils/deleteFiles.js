const fs = require('fs');
const path = require('path');

const deleteFiles = (files) => {
  if (!files || !files.length) return;
  files.forEach((file) => {
    const filePath = path.join(__dirname, '../../uploads', file.filename || file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });
};

module.exports = deleteFiles;