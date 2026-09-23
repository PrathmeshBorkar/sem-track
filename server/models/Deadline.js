import mongoose from 'mongoose';

const deadlineSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        title: { type: String, required: true, trim: true },
        subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
        dueDate: { type: Date, required: true },
        type: { type: String, enum: ['assignment', 'lab', 'project', 'exam'], default: 'assignment' },
        status: { type: String, enum: ['pending', 'in_progress', 'done'], default: 'pending' },
        notes: { type: String, default: '', trim: true },
        link: {
            type: String,
            default: '',
            validate: {
                validator: (v) => !v || /^https?:\/\/.+/i.test(v),
                message: 'Link must start with http:// or https://',
            },
        },
    },
    { timestamps: true }
);

export default mongoose.model('Deadline', deadlineSchema);