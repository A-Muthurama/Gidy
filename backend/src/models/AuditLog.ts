import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  actor: string;
  role: string;
  action: string;
  resource: string;
  resourceType: string;
  ipAddress: string;
  region: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'Unresolved' | 'Resolved';
  timestamp: Date;
}

const AuditLogSchema: Schema = new Schema({
  actor: { type: String, required: true, index: true },
  role: { type: String, required: true, index: true },
  action: { type: String, required: true, index: true },
  resource: { type: String, required: true },
  resourceType: { type: String, required: true, index: true },
  ipAddress: { type: String, required: true },
  region: { type: String, required: true, index: true },
  severity: { 
    type: String, 
    required: true, 
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], 
    index: true 
  },
  status: { 
    type: String, 
    required: true, 
    enum: ['Unresolved', 'Resolved'], 
    default: 'Unresolved',
    index: true 
  },
  timestamp: { type: Date, required: true, default: Date.now, index: true }
});

// Create text index for search on actor, resource, and ipAddress
AuditLogSchema.index({ actor: 'text', resource: 'text', ipAddress: 'text' });

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
