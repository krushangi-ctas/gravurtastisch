#!/usr/bin/env node
/**
 * One-shot migrator:
 * 1) Expand barrel re-exports (controllers/services/models/validations/plugins) to direct requires
 * 2) Rename routes/v1/index.js → routes/v1.routes.js
 * 3) Rename all src .js files to .ts (except deleted barrels)
 * 4) Delete barrel index.js files
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');

const BARREL_MAPS = {
  controllers: {
    authController: 'auth.controller',
    userController: 'user.controller',
    roleController: 'role.controller',
    ipController: 'ip.controller',
    marketplaceController: 'marketplace.controller',
    emailTemplateController: 'email-template.controller',
    systemLogController: 'system-log.controller',
    fileListController: 'file-uploader/file-list.controller',
    uploadFileController: 'file-uploader/upload-file.controller',
    ordersController: 'order-list.controller',
    searchController: 'search.controller',
    cronLogController: 'cron-log.controller',
    generalSettingController: 'generalSetting.controller',
    amazonCredentialsController: 'amazon-credentials.controller',
    supportController: 'support.controller',
    blogController: 'blog.controller',
    universalOtpController: 'universal-otp.controller',
    websiteConfigurationController: 'website-configuration.controller',
    planController: 'plan.controller',
    paymentController: 'payment.controller',
  },
  services: {
    authService: 'auth.service',
    emailService: 'email.service',
    tokenService: 'token.service',
    userService: 'user.service',
    roleService: 'role.service',
    permissionService: 'permission.service',
    systemLogService: 'system-log.service',
    commonService: 'common.service',
    cronLogService: 'cron-log.service',
    ordersService: 'orders.service',
    marketplaceService: 'marketplace.service',
    generalSettings: 'generalSetting.service',
    amazonCredentialsService: 'amazon-credentials.service',
    blogService: 'blog.service',
    universalOtpService: 'universal-otp.service',
    websiteConfigurationService: 'website-configuration.service',
    planService: 'plan.service',
    paymentService: 'payment.service',
    // were imported via barrel but never registered — map to real files
    uploadFileService: 'file-uploader/upload-file.service',
    fileListService: 'file-uploader/file-list.service',
  },
  models: {
    Token: 'token.model',
    User: 'user.model',
    Role: 'role.model',
    RoleModel: 'role.model',
    Error: 'cron-error.model',
    IpModel: 'ip.model',
    SystemLogsModel: 'system-logs.model',
    CronLogsModel: 'cron-log.model',
    EmailTemplatesModel: 'email-templates.model',
    ordermodel: 'order.model',
    MarketplaceModel: 'marketplace.model',
    AmazonCredentialsModel: 'amazon-credentials.model',
    SupportRequestModel: 'support-request.model',
    UserArchive: 'user-archive.model',
    Otp: 'otp.model',
    BlogModel: 'blog.model',
    UniversalOtp: 'universal-otp.model',
    WebsiteConfigurationModel: 'website-configuration.model',
    PlanModel: 'plan.model',
    PaymentModel: 'payment.model',
    // legacy / missing — keep direct path so breakage is obvious at compile time
    ChatModel: 'chat.model',
    Customer: 'customer.model',
    AmzInInventoriesModel: 'amz-in-inventories.model',
  },
  validations: {
    authValidation: 'auth.validation',
    userValidation: 'user.validation',
    orderValidation: 'order.validation',
    emailTemplateValidation: 'email-template.validation',
    sectionsValidation: 'section.validation',
    roleValidation: 'role.validation',
    ipValidation: 'ip.validation',
    systemLogValidation: 'system-log.validation',
    supportValidation: 'support.validation',
    blogValidation: 'blog.validation',
    universalOtpValidation: 'universal-otp.validation',
    websiteConfigurationValidation: 'website-configuration.validation',
    planValidation: 'plan.validation',
    paymentValidation: 'payment.validation',
  },
  plugins: {
    toJSON: 'toJSON.plugin',
    paginate: 'paginate.plugin',
  },
};

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else if (ent.isFile() && p.endsWith('.js')) acc.push(p);
  }
  return acc;
}

function expandBarrelRequires(source, filePath) {
  let out = source;
  const relDir = path.dirname(filePath);

  // Match: const { a, b } = require('.../services'|'.../controllers'|...);
  // Also multiline destructuring.
  const re =
    /const\s*\{([\s\S]*?)\}\s*=\s*require\(\s*['"]([^'"]+)['"]\s*\)\s*;/g;

  out = out.replace(re, (full, destructured, reqPath) => {
    const names = destructured
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => s.split(/\s+as\s+/)[0].trim())
      .filter((n) => /^[A-Za-z_$][\w$]*$/.test(n));

    if (!names.length) return full;

    // Resolve which barrel
    let kind = null;
    const normalized = reqPath.replace(/\\/g, '/');
    if (/(^|\/)controllers\/?$/.test(normalized) || normalized === './controllers')
      kind = 'controllers';
    else if (/(^|\/)services\/?$/.test(normalized) || normalized === './services')
      kind = 'services';
    else if (/(^|\/)models\/?$/.test(normalized) || normalized === './models') kind = 'models';
    else if (/(^|\/)validations\/?$/.test(normalized) || normalized === './validations')
      kind = 'validations';
    else if (/(^|\/)plugins\/?$/.test(normalized) || normalized === './plugins') kind = 'plugins';
    else return full;

    const map = BARREL_MAPS[kind];
    // Compute base require prefix from original path
    // e.g. '../../services' → '../../services/'
    const base = normalized.endsWith('/') ? normalized : `${normalized}/`;

    const lines = names.map((name) => {
      const file = map[name];
      if (!file) {
        console.warn(`⚠  No mapping for ${kind}.${name} in ${path.relative(ROOT, filePath)}`);
        return `const ${name} = require('${base}${name}');`;
      }
      return `const ${name} = require('${base}${file}');`;
    });
    return lines.join('\n');
  });

  return out;
}

function main() {
  const files = walk(SRC);
  let rewritten = 0;

  for (const file of files) {
    const rel = path.relative(SRC, file);
    // Skip barrels themselves for rewrite content (they'll be deleted)
    if (
      rel === 'controllers/index.js' ||
      rel === 'services/index.js' ||
      rel === 'models/index.js' ||
      rel === 'validations/index.js' ||
      rel === 'models/plugins/index.js' ||
      rel === 'routes/v1/index.js'
    ) {
      continue;
    }

    const before = fs.readFileSync(file, 'utf8');
    let after = expandBarrelRequires(before, file);

    // app.js used ./routes/v1 barrel aggregator
    after = after.replace(
      /require\(\s*['"]\.\/routes\/v1['"]\s*\)/g,
      "require('./routes/v1.routes')"
    );

    if (after !== before) {
      fs.writeFileSync(file, after);
      rewritten += 1;
      console.log('rewrote', rel);
    }
  }

  // Rename routes aggregator
  const v1Index = path.join(SRC, 'routes/v1/index.js');
  const v1Routes = path.join(SRC, 'routes/v1.routes.js');
  if (fs.existsSync(v1Index)) {
    let content = fs.readFileSync(v1Index, 'utf8');
    // paths in v1/index were ./auth.route — after move to routes/v1.routes.js they become ./v1/auth.route
    content = content.replace(
      /require\(\s*['"]\.\/([^'"]+)['"]\s*\)/g,
      (_m, p) => `require('./v1/${p}')`
    );
    // config path was ../../config/config → ../config/config
    content = content.replace(
      /require\(\s*['"]\.\.\/\.\.\/config\/config['"]\s*\)/g,
      "require('../config/config')"
    );
    fs.writeFileSync(v1Routes, content);
    fs.unlinkSync(v1Index);
    console.log('moved routes/v1/index.js → routes/v1.routes.js');
  }

  // Delete barrels
  for (const b of [
    'controllers/index.js',
    'services/index.js',
    'models/index.js',
    'validations/index.js',
    'models/plugins/index.js',
  ]) {
    const p = path.join(SRC, b);
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
      console.log('deleted', b);
    }
  }

  // Rename all remaining .js under src to .ts
  const jsFiles = walk(SRC);
  for (const file of jsFiles) {
    const dest = file.replace(/\.js$/, '.ts');
    fs.renameSync(file, dest);
    console.log('renamed', path.relative(SRC, file), '→', path.relative(SRC, dest));
  }

  console.log(`\nDone. Rewrote ${rewritten} files. Renamed ${jsFiles.length} js→ts.`);
}

main();
