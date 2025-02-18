<template>
  <div class="container">
    <h1>Time Tracker</h1>

    
    <div class="current-activity" v-if="store.currentActivity">
      <h2>Поточна активність</h2>
      <p>{{ store.currentActivity.name }} ({{ store.currentActivity.category }})</p>
      <h3>Час: {{ store.formattedTime }}</h3>
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
import { ref, watch } from 'vue';
import { useActivityStore } from '@/stores/activityStore';
import { useRouter } from 'vue-router';

const router = useRouter();
const store = useActivityStore();
const goToActivitiesTable = () => router.push('/activities');

const newActivityName = ref('');
const newCategoryName = ref('');
const selectedCategory = ref(store.categories.length ? store.categories[0].name : '');

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
const deleteCategory = (id) => store.deleteCategory(id);
const editActivity = (id, name) => store.editActivity(id, name);
</script>


<style scoped>
.container {
  text-align: center;
  max-width: 600px;
  margin: auto;
}

.current-activity {
  background: lightcoral;
  padding: 15px;
  border-radius: 10px;
  color: white;
  margin-bottom: 20px;
}

.activities-list ul {
  list-style: none;
  padding: 0;
}

.activities-list li {
  background: lightblue;
  margin: 5px 0;
  padding: 10px;
  border-radius: 5px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.activities-list li.active {
  background: lightgreen;
}

button {
  padding: 5px 10px;
  cursor: pointer;
}
</style>