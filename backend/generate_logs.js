import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const actors = [
  'priya.nair@company.com', 'john.doe@company.com', 'alice.smith@company.com',
  'bob.jones@company.com', 'charlie.brown@company.com', 'security.admin@company.com',
  'system.engine@company.com', 'developer.one@company.com', 'finance.user@company.com',
  'hr.manager@company.com'
];

const roles = ['admin', 'security_engineer', 'developer', 'user', 'system', 'manager'];

const actions = [
  'DELETE_USER', 'CREATE_USER', 'UPDATE_ROLE', 'ACCESS_RESOURCE',
  'LOGIN_SUCCESS', 'LOGIN_FAILURE', 'DOWNLOAD_SENSITIVE_DATA',
  'REVOKE_ACCESS', 'GRANT_ACCESS', 'MODIFY_SETTINGS', 'EXPORT_LOGS'
];

const resources = [
  '/api/users/334', '/api/auth/login', '/api/admin/settings',
  '/api/reports/financial-2025.csv', '/api/users/profile',
  '/api/system/config', '/api/billing/invoice/998', '/api/files/download'
];

const resourceTypes = ['USER', 'AUTH', 'SETTINGS', 'REPORT', 'SYSTEM', 'BILLING', 'FILE'];

const regions = ['ap-south-1', 'us-east-1', 'eu-west-1', 'us-west-2', 'sa-east-1', 'ap-northeast-1'];

const severities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const statuses = ['Unresolved', 'Resolved'];

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRandomIp() {
  return `192.168.1.${Math.floor(Math.random() * 254) + 1}`;
}

function generateLogs(count) {
  const logs = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    // Distribute timestamps back up to 30 days
    const timestamp = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    
    // Choose severity with custom distribution (mostly low/medium)
    const rand = Math.random();
    let severity = 'LOW';
    if (rand > 0.95) severity = 'CRITICAL';
    else if (rand > 0.8) severity = 'HIGH';
    else if (rand > 0.4) severity = 'MEDIUM';

    logs.push({
      actor: getRandomElement(actors),
      role: getRandomElement(roles),
      action: getRandomElement(actions),
      resource: getRandomElement(resources),
      resourceType: getRandomElement(resourceTypes),
      ipAddress: generateRandomIp(),
      region: getRandomElement(regions),
      severity: severity,
      status: getRandomElement(statuses),
      timestamp: timestamp.toISOString()
    });
  }

  return logs;
}

const count = 10000;
const logs = generateLogs(count);
const outputPath = path.join(__dirname, 'sample_audit_logs.json');

fs.writeFileSync(outputPath, JSON.stringify(logs, null, 2));
console.log(`Successfully generated ${count} sample logs and saved to ${outputPath}`);
