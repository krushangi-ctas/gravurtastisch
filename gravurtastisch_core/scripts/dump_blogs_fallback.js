const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    const db = mongoose.connection.db;
    const blogs = await db.collection('tbl_blogs').find({ status: 1 }).sort({ createdAt: -1 }).toArray();

    const formatted = blogs.map(b => ({
      _id: b._id.toString(),
      id: b._id.toString(),
      blog_title: b.blog_title,
      slug: b.slug,
      short_description: b.short_description,
      description: b.description,
      description_images: b.description_images,
      full_image_urls: b.full_image_urls,
      status: b.status,
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString()
    }));

    const fileContent = `import { BlogItem } from "./api";\n\nexport const FALLBACK_BLOGS: BlogItem[] = ${JSON.stringify(formatted, null, 2)};\n`;

    const targetPath = path.resolve(__dirname, '../../gravurtastisch_web/src/lib/blogsFallback.ts');
    fs.writeFileSync(targetPath, fileContent, 'utf8');
    console.log(`Successfully updated ${targetPath} with ${formatted.length} full blogs!`);

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

run();
