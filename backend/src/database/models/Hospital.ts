import { Schema, model, models, type InferSchemaType } from 'mongoose';

const hospitalSchema = new Schema(
  {
    hospitalId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    facilityType: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    address: {
      line: { type: String },
      region: { type: String },
      district: { type: String },
      state: { type: String },
      pincode: { type: String },
    },
    contact: { type: String },
    services: { type: [String], default: [] },
    source: { type: String, enum: ['BHUVAN', 'MAPPLS', 'MANUAL'], required: true },
    sourceReference: { type: String },
    verified: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);
hospitalSchema.index({ latitude: 1, longitude: 1 });
hospitalSchema.index({ name: 1 });

export type HospitalDoc = InferSchemaType<typeof hospitalSchema>;

export const Hospital =
  model('Hospital', hospitalSchema);
