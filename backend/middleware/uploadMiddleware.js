import multer from 'multer';
import path from 'path';

// Set up disk storage engine configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads');
  },
  filename: (req, file, cb) => {
    // Generate unique name combining timestamp and original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// File filter checking extensions (allow PDFs, Word, PPTs, TXT)
const fileFilter = (req, file, cb) => {
  const filetypes = /pdf|docx|doc|pptx|ppt|txt/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetypes = /pdf|plain|msword|wordprocessingml|presentationml|powerpoint/;
  const mimetype = mimetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only PDF, Word, PowerPoint, and TXT documents are supported for summaries!'), false);
  }
};

// Configure Multer engine
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB maximum size limit
  },
});

export default upload;
