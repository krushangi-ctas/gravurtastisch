const express = require('express');
const fs = require('fs');
const path = require('path');
const multipart = require('connect-multiparty');
const auth = require('../../middlewares/auth');
const {
  requirePermission,
  requireAnyPermission,
} = require('../../middlewares/permission');
const validate = require('../../middlewares/validate');
const blogValidation = require('../../validations/blog.validation');
const blogController = require('../../controllers/blog.controller');

const router = express.Router();

const uploadDir = path.join(__dirname, '../../uploads/blogs');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const multipartMiddleware = multipart({
  uploadDir,
});

router
  .route('/')
  .post(
    auth(),
    requirePermission('blogs', 'create'),
    validate(blogValidation.createBlog),
    blogController.createBlog
  )
  // Public for website; panel still authenticates separately for management UIs
  .get(validate(blogValidation.getBlogs), blogController.getBlogs);

router
  .route('/upload-image')
  .post(
    auth(),
    requireAnyPermission([
      ['blogs', 'create'],
      ['blogs', 'update'],
    ]),
    multipartMiddleware,
    blogController.uploadImage
  );

router
  .route('/:blogId')
  .get(validate(blogValidation.getBlog), blogController.getBlog)
  .put(
    auth(),
    requirePermission('blogs', 'update'),
    validate(blogValidation.updateBlog),
    blogController.updateBlog
  );

router
  .route('/:blogId/status')
  .put(
    auth(),
    async (req, res, next) => {
      const action = Number(req.body?.status) === 2 ? 'delete' : 'update';
      return requirePermission('blogs', action)(req, res, next);
    },
    validate(blogValidation.updateBlogStatus),
    blogController.updateStatus
  );

module.exports = router;
