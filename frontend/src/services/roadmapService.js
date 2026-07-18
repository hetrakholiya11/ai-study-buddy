import API from './api';

// Sleep helper for simulated offline latency
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const roadmapService = {
  /**
   * Request backend to generate a deconstructed syllabus study roadmap.
   * Falls back to offline generation if backend is unavailable.
   */
  generateRoadmap: async ({ timeframe, text = '', files = null }) => {
    try {
      let response;
      if (files && files.length > 0) {
        const formData = new FormData();
        files.forEach((file) => {
          formData.append('files', file);
        });
        formData.append('timeframe', timeframe);
        response = await API.post('/roadmaps/generate', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        response = await API.post('/roadmaps/generate', { timeframe, text });
      }
      return response.data;
    } catch (error) {
      if (error.response) {
        const errorMsg = error.response.data?.error || 'Roadmap generation failed';
        throw new Error(errorMsg);
      }
      console.warn("Backend unavailable. Generating mock study roadmap offline.", error);
      await sleep(2000); // Simulate network latency and AI parsing time
      
      const mockTitle = text ? text.split('\n')[0].slice(0, 40) : (files && files[0] ? files[0].name.replace(/\.[^/.]+$/, "") : "Syllabus Study Roadmap");
      
      return {
        success: true,
        roadmap: {
          _id: "mock-roadmap-" + Date.now(),
          title: mockTitle || "Study Course Roadmap",
          timeframe: timeframe || "4 Weeks",
          progress: 0,
          modules: [
            {
              id: 1,
              title: "Module 1: Foundations & Core Concepts",
              description: "Introduces key definitions, scope, terminology, and foundational equations.",
              duration: "Week 1",
              completed: false,
              tasks: [
                { id: 1, name: "Read chapter introduction and review core vocabulary terms", completed: false },
                { id: 2, name: "Summarize the primary guidelines in a 1-page notes digest", completed: false },
                { id: 3, name: "Complete foundation worksheet exercises 1 through 5", completed: false }
              ]
            },
            {
              id: 2,
              title: "Module 2: Practical Application Methods",
              description: "Applies foundational concepts to real-world problems and calculations.",
              duration: "Week 2",
              completed: false,
              tasks: [
                { id: 1, name: "Analyze 3 detailed case studies from the uploaded curriculum", completed: false },
                { id: 2, name: "Run algorithm simulation models and document outcomes", completed: false },
                { id: 3, name: "Verify mathematical proofs for core formulas in Unit 2", completed: false }
              ]
            },
            {
              id: 3,
              title: "Module 3: Advanced Optimization Techniques",
              description: "Explores advanced parameters, performance tuning, and edge cases.",
              duration: "Week 3",
              completed: false,
              tasks: [
                { id: 1, name: "Implement performance metrics audit checklist", completed: false },
                { id: 2, name: "Troubleshoot common failure cases and run stress tests", completed: false }
              ]
            },
            {
              id: 4,
              title: "Module 4: Final Consolidation & Assessment",
              description: "Synthesizes all modules and conducts mock reviews.",
              duration: "Week 4",
              completed: false,
              tasks: [
                { id: 1, name: "Create a visual mind map connecting all 4 modules", completed: false },
                { id: 2, name: "Take the comprehensive course final assessment quiz", completed: false }
              ]
            }
          ]
        }
      };
    }
  },

  /**
   * Fetch all saved study roadmaps for the active user.
   */
  getUserRoadmaps: async () => {
    try {
      const response = await API.get('/roadmaps/history');
      return response.data;
    } catch (error) {
      if (error.response) {
        const errorMsg = error.response.data?.error || 'Failed to fetch roadmaps';
        throw new Error(errorMsg);
      }
      // Demo fallback
      console.warn("Backend unavailable. Fetching demo roadmaps list.");
      return {
        success: true,
        roadmaps: [
          {
            _id: "demo-roadmap-1",
            title: "Data Structures and Algorithms",
            timeframe: "8 Weeks",
            progress: 25,
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            _id: "demo-roadmap-2",
            title: "Introduction to General Chemistry",
            timeframe: "4 Weeks",
            progress: 0,
            createdAt: new Date().toISOString()
          }
        ]
      };
    }
  },

  /**
   * Fetch a specific roadmap's modules and task states.
   */
  getRoadmapById: async (id) => {
    try {
      const response = await API.get(`/roadmaps/${id}`);
      return response.data;
    } catch (error) {
      if (error.response) {
        const errorMsg = error.response.data?.error || 'Failed to fetch roadmap details';
        throw new Error(errorMsg);
      }
      console.warn("Backend unavailable. Loading demo roadmap by ID.");
      // Demo roadmap details matching the mock IDs
      const demoTitle = id === "demo-roadmap-1" ? "Data Structures and Algorithms" : "Introduction to General Chemistry";
      const demoTime = id === "demo-roadmap-1" ? "8 Weeks" : "4 Weeks";
      const demoProgress = id === "demo-roadmap-1" ? 25 : 0;
      
      return {
        success: true,
        roadmap: {
          _id: id,
          title: demoTitle,
          timeframe: demoTime,
          progress: demoProgress,
          modules: [
            {
              id: 1,
              title: id === "demo-roadmap-1" ? "Module 1: Big O Notation & Arrays" : "Module 1: Atoms, Molecules & Ions",
              description: id === "demo-roadmap-1" 
                ? "Understand time/space complexity analysis and array manipulations." 
                : "Explore atomic structure, periodic table trends, and chemical naming rules.",
              duration: "Week 1",
              completed: id === "demo-roadmap-1" ? true : false,
              tasks: [
                { id: 1, name: id === "demo-roadmap-1" ? "Review time complexity chart" : "Memorize first 20 elements of periodic table", completed: id === "demo-roadmap-1" ? true : false },
                { id: 2, name: id === "demo-roadmap-1" ? "Complete array reverse quiz problems" : "Study ionic vs covalent bonding definitions", completed: id === "demo-roadmap-1" ? true : false }
              ]
            },
            {
              id: 2,
              title: id === "demo-roadmap-1" ? "Module 2: Linked Lists & Stacks" : "Module 2: Stoichiometry & Chemical Equations",
              description: id === "demo-roadmap-1"
                ? "Differentiate singly, doubly linked lists and stack queues implementations."
                : "Learn to balance chemical equations and calculate molar mass relationships.",
              duration: "Week 2",
              completed: false,
              tasks: [
                { id: 1, name: id === "demo-roadmap-1" ? "Implement a stack using arrays" : "Solve 10 equation balancing problems", completed: false },
                { id: 2, name: id === "demo-roadmap-1" ? "Solve LeetCode #206 (Reverse Linked List)" : "Read chapter on mole concepts", completed: false }
              ]
            }
          ]
        }
      };
    }
  },

  /**
   * Toggle completion status of a task.
   */
  toggleTask: async (roadmapId, moduleId, taskId, completed) => {
    try {
      const response = await API.put(`/roadmaps/${roadmapId}/task`, { moduleId, taskId, completed });
      return response.data;
    } catch (error) {
      if (error.response) {
        const errorMsg = error.response.data?.error || 'Failed to update task progress';
        throw new Error(errorMsg);
      }
      console.warn("Backend unavailable. Updating task progress locally (Demo Mode).");
      return {
        success: true
      };
    }
  },

  /**
   * Delete a roadmap.
   */
  deleteRoadmap: async (id) => {
    try {
      const response = await API.delete(`/roadmaps/${id}`);
      return response.data;
    } catch (error) {
      if (error.response) {
        const errorMsg = error.response.data?.error || 'Failed to delete roadmap';
        throw new Error(errorMsg);
      }
      console.warn("Backend unavailable. Deleting roadmap locally (Demo Mode).");
      return {
        success: true
      };
    }
  }
};
