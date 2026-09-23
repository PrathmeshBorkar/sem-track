import mongoose from 'mongoose';

const componentSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true }, // CCA1, Midsem, CCA2, Endsem, LCA1...
        maxMarks: { type: Number, required: true, min: 0 },
        obtainedMarks: { type: Number, default: null, min: 0 },
    },
    { _id: false }
);

const resourceSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        type: { type: String, enum: ['notes', 'link', 'project', 'file'], required: true },
        url: {
            type: String,
            required: true,
            validate: {
                validator: (v) => /^https?:\/\/.+/i.test(v),
                message: 'URL must start with http:// or https://',
            },
        },
        description: { type: String, default: '', trim: true },
    },
    { _id: false }
);

const subjectSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        name: { type: String, required: true, trim: true },
        code: { type: String, trim: true, default: '' },
        type: { type: String, enum: ['theory', 'lab'], required: true },
        credits: { type: Number, required: true, min: 0 },
        markingScheme: { type: [componentSchema], default: [] },
        resources: { type: [resourceSchema], default: [] },
    },
    { timestamps: true }
);

subjectSchema.index({ userId: 1, name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

export default mongoose.model('Subject', subjectSchema);