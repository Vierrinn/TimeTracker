<template>
  <div class="container">
    <h1>Time Tracker</h1>

    
    <div class="current-activity" v-if="store.currentActivity">
      <h2>Поточна активність</h2>
      <p>{{ store.currentActivity.name }} ({{ store.currentActivity.category }})</p>
      <h3>Час: {{ formattedTime }}</h3>

      <button class="stop-btn" @click="stopActivity">Зупинити</button>
    </div>

    <div class="activities-list">
      <h2>Доступні активності</h2>
      <ul>
        <li v-for="activity in store.activities" :key="activity.id">
          <input v-model="activity.name" @input="editActivity(activity.id, activity.name)" />
          <span>({{ activity.category }})</span>
          <button @click="startActivity(activity)" :disabled="store.currentActivity?.id === activity.id">
            {{ store.currentActivity?.id === activity.id ? "Активна" : "Старт" }}
          </button>
          <button class="delete-btn" @click="deleteActivity(activity)">🗑</button>
        </li>
      </ul>
    </div>

   
    <div class="new-activity">
      <input v-model="newActivityName" placeholder="Назва активності" />
      <select v-model="selectedCategory">
        <option v-for="category in store.categories" :key="category.id" :value="category.name">
          {{ category.name }}
        </option>
      </select>
      <button @click="addActivity">Додати</button>
    </div>

    <div class="category-section">
      <h2>Категорії</h2>
      <ul>
        <li v-for="category in store.categories" :key="category.id">
          <input v-model="category.name" @input="editCategory(category.id, category.name)" />
          <button class="delete-btn" @click="deleteCategory(category.id)">🗑</button>
        </li>
      </ul>
      <input v-model="newCategoryName" placeholder="Нова категорія" />
      <button @click="addCategory">Додати категорію</button>
    </div>

    <button @click="goToActivitiesTable" class="table-btn">Переглянути таблицю активностей</button>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useActivityStore } from '@/stores/activityStore';
import { useRouter } from 'vue-router';

const router = useRouter();
const store = useActivityStore();
const goToActivitiesTable = () => router.push('/activities');

const newActivityName = ref('');
const newCategoryName = ref('');
const selectedCategory = ref(store.categories.length ? store.categories[0].name : '');

const formattedTime = computed(() => {
  const hours = Math.floor(store.timer / 3600);
  const minutes = Math.floor((store.timer % 3600) / 60);
  const seconds = store.timer % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
});

onMounted(() => {
  if (store.currentActivity) {
    store.interval = setInterval(() => {
      store.timer += 1;
      localStorage.setItem('timer', store.timer);
    }, 1000);
  }
});

watch(() => store.categories, (newCategories) => {
  if (!selectedCategory.value && newCategories.length) {
    selectedCategory.value = newCategories[0].name;
  }
}, { deep: true });

const startActivity = (activity) => store.startActivity(activity);
const stopActivity = () => store.stopActivity();

const addActivity = () => {
  if (newActivityName.value.trim() && selectedCategory.value) {
    store.addActivity({ 
      id: Date.now(), 
      name: newActivityName.value, 
      category: selectedCategory.value 
    });
    newActivityName.value = '';
  }
};

const deleteActivity = (activity) => store.deleteActivity(activity);

const addCategory = () => {
  if (newCategoryName.value.trim()) {
    store.addCategory(newCategoryName.value);
    newCategoryName.value = '';
  }
};

const editCategory = (id, name) => store.editCategory(id, name);
const deleteCategory = (id) => {
  const confirmation = confirm("Are you sure you want to delete this category along with its activities?");
  if (confirmation) {
    store.deleteCategory(id); 
  }
};

const editActivity = (id, name) => store.editActivity(id, name);
</script>


<style scoped>
.container {
  text-align: center;
  max-width: 600px;
  margin: auto;
  font-family: 'Arial', sans-serif;
  padding: 20px;
  background: linear-gradient(to bottom, #e3f2fd, #f8bbd0);
  border-radius: 15px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

h1 {
  color: #1565c0;
  font-size: 28px;
  margin-bottom: 20px;
}

h2 {
  color: #0d47a1;
  font-size: 22px;
  margin-bottom: 10px;
}

h3 {
  font-size: 18px;
  color: #283593;
}

.current-activity {
  background: #ff80ab;
  padding: 20px;
  border-radius: 15px;
  color: white;
  margin-bottom: 20px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}

.current-activity p {
  font-size: 18px;
  font-weight: bold;
}

.activities-list ul {
  list-style: none;
  padding: 0;
}

.activities-list li {
  background: #64b5f6;
  margin: 8px 0;
  padding: 12px;
  border-radius: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
}

.activities-list li.active {
  background: #4caf50;
  color: white;
}

button {
  padding: 8px 15px;
  cursor: pointer;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  transition: 0.3s ease-in-out;
}

button:hover {
  opacity: 0.8;
}

button:not(.delete-btn) {
  background: #0d47a1;
  color: white;
}

.stop-btn {
  background: #d32f2f;
  color: white;
  margin-top: 10px;
}

.delete-btn {
  background: transparent;
  color: #d32f2f;
  font-size: 18px;
}

.new-activity input,
.category-section input {
  padding: 10px;
  width: calc(100% - 20px);
  border: 2px solid #0d47a1;
  border-radius: 10px;
  margin-top: 5px;
  font-size: 16px;
}

select {
  padding: 10px;
  border: 2px solid #0d47a1;
  border-radius: 10px;
  margin-top: 5px;
  font-size: 16px;
  width: 100%;
}

.category-section {
  margin-top: 20px;
}

.category-section ul {
  list-style: none;
  padding: 0;
}

.category-section li {
  background: #b39ddb;
  margin: 5px 0;
  padding: 10px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-btn {
  background: #1976d2;
  margin-top: 20px;
  color: white;
}
</style>
