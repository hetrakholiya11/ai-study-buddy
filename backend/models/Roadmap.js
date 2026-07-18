import mongoose from 'mongoose';

/**
 * MongoDB Mongoose Schema mapping study roadmaps and syllabus deconstruction modules.
 */
const roadmapSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    timeframe: {
      type: String,
      required: true,
    },
    modules: [
      {
        id: { 
          type: Number, 
          required: true 
        },
        title: { 
          type: String, 
          required: true 
        },
        description: { 
          type: String, 
          required: true 
        },
        duration: { 
          type: String, 
          required: true 
        },
        completed: { 
          type: Boolean, 
          default: false 
        },
        tasks: [
          {
            id: { 
              type: Number, 
              required: true 
            },
            name: { 
              type: String, 
              required: true 
            },
            completed: { 
              type: Boolean, 
              default: false 
            },
          }
        ]
      }
    ],
    progress: {
      type: Number,
      default: 0,
    }
  },
  {
    timestamps: true,
  }
);

const Roadmap = mongoose.model('Roadmap', roadmapSchema);

export default Roadmap;
