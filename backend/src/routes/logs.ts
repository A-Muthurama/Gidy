import { Router, Request, Response, NextFunction } from 'express';
import AuditLog, { IAuditLog } from '../models/AuditLog';

const router = Router();

// Wrap async handlers
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 1. Bulk Upload API
router.post('/bulk', asyncHandler(async (req: Request, res: Response) => {
  const logs = req.body;
  if (!Array.isArray(logs)) {
    return res.status(400).json({ error: 'Payload must be an array of logs' });
  }

  if (logs.length > 10000) {
    return res.status(400).json({ error: 'Cannot upload more than 10,000 logs at a time' });
  }

  // Basic validation and transformation
  const formattedLogs = logs.map(log => ({
    actor: log.actor || 'unknown',
    role: log.role || 'unknown',
    action: log.action || 'UNKNOWN_ACTION',
    resource: log.resource || 'unknown',
    resourceType: log.resourceType || 'UNKNOWN_TYPE',
    ipAddress: log.ipAddress || '0.0.0.0',
    region: log.region || 'unknown',
    severity: (log.severity || 'LOW').toUpperCase(),
    status: log.status || 'Unresolved',
    timestamp: log.timestamp ? new Date(log.timestamp) : new Date()
  }));

  // Perform bulk insert
  const result = await AuditLog.insertMany(formattedLogs, { ordered: false });

  res.status(201).json({
    message: `Successfully inserted ${result.length} log records`,
    count: result.length
  });
}));

// 2. Fetch Logs with Search, Sort, Filtering, and Pagination
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const sortBy = (req.query.sortBy as string) || 'timestamp';
  const sortOrder = (req.query.sortOrder as string) === 'asc' ? 1 : -1;
  const search = req.query.search as string;

  const query: any = {};

  // Build filters dynamically
  const filterFields = ['severity', 'status', 'region', 'role', 'action', 'resourceType'];
  filterFields.forEach(field => {
    if (req.query[field]) {
      const val = req.query[field];
      if (Array.isArray(val)) {
        query[field] = { $in: val };
      } else if (typeof val === 'string' && val.trim() !== '') {
        // If comma-separated
        if (val.includes(',')) {
          query[field] = { $in: val.split(',').map(s => s.trim()) };
        } else {
          query[field] = val;
        }
      }
    }
  });

  // Search filter
  if (search && search.trim() !== '') {
    const searchRegex = new RegExp(search.trim(), 'i');
    query.$or = [
      { actor: searchRegex },
      { resource: searchRegex },
      { ipAddress: searchRegex }
    ];
  }

  // Execute paginated query
  const total = await AuditLog.countDocuments(query);
  const logs = await AuditLog.find(query)
    .sort({ [sortBy]: sortOrder })
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({
    logs,
    total,
    page,
    pages: Math.ceil(total / limit)
  });
}));

// 3. Get Stats
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  const total = await AuditLog.countDocuments();
  const unresolved = await AuditLog.countDocuments({ status: 'Unresolved' });
  const resolved = await AuditLog.countDocuments({ status: 'Resolved' });
  
  // Group by severity
  const severityGroups = await AuditLog.aggregate([
    { $group: { _id: '$severity', count: { $sum: 1 } } }
  ]);
  
  const severities = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
  severityGroups.forEach(g => {
    if (g._id in severities) {
      (severities as any)[g._id] = g.count;
    }
  });

  // Unique values for filter dropdowns
  const uniqueActors = await AuditLog.distinct('actor');
  const uniqueRoles = await AuditLog.distinct('role');
  const uniqueActions = await AuditLog.distinct('action');
  const uniqueResourceTypes = await AuditLog.distinct('resourceType');
  const uniqueRegions = await AuditLog.distinct('region');

  res.json({
    total,
    unresolved,
    resolved,
    severities,
    filters: {
      actors: uniqueActors,
      roles: uniqueRoles,
      actions: uniqueActions,
      resourceTypes: uniqueResourceTypes,
      regions: uniqueRegions
    }
  });
}));

// 4. Update Log Status (Resolve/Unresolve)
router.patch('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (status !== 'Unresolved' && status !== 'Resolved') {
    return res.status(400).json({ error: 'Invalid status value. Must be Resolved or Unresolved.' });
  }

  const updatedLog = await AuditLog.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  );

  if (!updatedLog) {
    return res.status(404).json({ error: 'Audit log not found' });
  }

  res.json(updatedLog);
}));

export default router;
