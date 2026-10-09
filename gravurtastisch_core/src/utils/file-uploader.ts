// @ts-nocheck
const fs = require('fs');

module.exports.uploadFile = (file, subPath) => {
  var filename = file.path.split('/').pop();
  var picture = filename.replace(`src/uploads\\${subPath}\\`, '');
  return picture;
};

module.exports.deleteFile = (file, subPath) => {
  if (fs.existsSync(`./src/uploads/${subPath}/${file}`)) {
    fs.unlink(`./src/uploads/${subPath}/${file}`, (err) => {
      if (err) {
        console.error(err);
      }
    });
    return true;
  }
};
