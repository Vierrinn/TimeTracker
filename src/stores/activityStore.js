import { defineStore } from 'pinia';

export const useActivityStore = defineStore({
  id: 'activityStore',
  state: () => ({
    categories: JSON.parse(localStorage.getItem('categories')) || [
      { id: 1, name: "Робота" },
      { id: 2, name: "Відпочинок" }
    ],
    activities: JSON.parse(localStorage.getItem('activities') || '[]'),
    activityLogs: JSON.parse(localStorage.getItem('activityLogs') || '[]'),
    currentActivity: JSON.parse(localStorage.getItem('currentActivity')) || null,
    timer: Number(localStorage.getItem('timer')) || 0,
    interval: null
  }),

  actions: {
    startActivity(activity) {
      if (this.currentActivity) {
        this.stopActivity();
      }
      this.currentActivity = { ...activity, startTime: new Date().toISOString() };
      this.timer = 0;
      this.saveState();

      this.interval = setInterval(() => {
        this.timer += 1;
        localStorage.setItem('timer', this.timer);
      }, 1000);
    },

    stopActivity() {
      if (this.currentActivity) {
        const endTime = new Date().toISOString();
        const duration = this.timer;

        this.activityLogs.push({
          id: Date.now(), 
          category: this.currentActivity.category,
          name: this.currentActivity.name,
          startTime: this.currentActivity.startTime,
          endTime,
          duration: isNaN(duration) ? 0 : duration
        });
        

        this.saveLogs();
      }

      this.currentActivity = null;
      clearInterval(this.interval);
      this.interval = null;
      this.saveState();
    },

    addCategory(name) {
      if (!this.categories.some(c => c.name === name)) {
        this.categories.push({ id: Date.now(), name });
        this.saveCategories();
      }
    },

    editCategory(id, newName) {
      const category = this.categories.find(c => c.id === id);
      if (category) {
        const oldName = category.name;
        category.name = newName;
    
        this.activities.forEach(activity => {
          if (activity.category === oldName) {
            activity.category = newName;
          }
        });
    
        this.activityLogs.forEach(log => {
          if (log.category === oldName) {
            log.category = newName;
          }
        });
    
        this.saveState();
      }
    }
    ,

    deleteCategory(id) {
      const category = this.categories.find(c => c.id === id);
      if (!category) return;
    
      this.activities = this.activities.filter(activity => activity.category !== category.name);
    
      this.categories = this.categories.filter(c => c.id !== id);
    
      if (this.currentActivity?.category === category.name) {
        this.stopActivity();
      }
    
      this.saveState();
    }
    
    
    ,

    addActivity(activity) {
      if (!this.activities.some(a => a.name === activity.name)) {
         this.activities.push({ ...activity, id: Date.now() });
         this.saveState();
      }
   },
   

    editActivity(id, newName) {
      const activity = this.activities.find(a => a.id === id);
      if (activity) {
        activity.name = newName;

        if (this.currentActivity?.id === id) {
          this.currentActivity.name = newName;
        }

        this.saveState();
      }
    },
    deleteActivity(activity) {
      this.activities = this.activities.filter(a => a.id !== activity.id);
      
      if (this.currentActivity?.id === activity.id) {
        this.stopActivity();
      }
    
      this.saveState();
    },    
   
    saveState() {
      localStorage.setItem('categories', JSON.stringify(this.categories));
      localStorage.setItem('activities', JSON.stringify(this.activities));
      localStorage.setItem('currentActivity', JSON.stringify(this.currentActivity));
    },

    saveLogs() {
      localStorage.setItem('activityLogs', JSON.stringify(this.activityLogs));
    }
  }
});
