<template>
  <div class="container">
    <h1>Таблиця активностей</h1>

    <div class="filters">
  <label>Виберіть період:</label>
  <input type="date" v-model="startDate" />
  <input type="date" v-model="endDate" />

  <label>Виберіть категорію:</label>
  <select v-model="categoryFilter">
    <option value="">Всі категорії</option>
    <option v-for="category in uniqueCategories" :key="category" :value="category">{{ category }}</option>
  </select>
</div>

    <table>
      <thead>
        <tr>
          <th>Дата</th>
          <th>Активність</th>
          <th>Категорія</th>
          <th>Початок</th>
          <th>Закінчення</th>
          <th>Тривалість</th>
        
        </tr>
      </thead>
      <tbody>
        <tr v-for="log in sortedLogs" :key="log.id">
          <td contenteditable @blur="editDate(log, $event)">
            {{ formatDate(log.startTime) }}
          </td>
          <td contenteditable @blur="editField(log, 'name', $event)">
            {{ log.name }}
          </td>
          <td>
            <input
              v-if="isEditingCategory(log.id)"
              v-model="log.category"
              @blur="saveCategoryEdit(log.id, log.category)"
            />
            <span v-else @click="startEditingCategory(log.id)">
              {{ log.category }}
            </span>
          </td>
          <td contenteditable @blur="editTime(log, 'startTime', $event)">
            {{ formatTime(log.startTime) }}
          </td>
          <td contenteditable @blur="editTime(log, 'endTime', $event)">
            {{ formatTime(log.endTime) }}
          </td>
          <td>{{ formatDuration(log.startTime, log.endTime) }}</td>
          <td>
            <button @click="deleteActivity1(log.id)">🗑️</button>
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td colspan="5">Загальний час</td>
          <td>{{ totalDuration }}</td>
        </tr>
      </tfoot>
    </table>

    <button @click="exportToExcel">Експорт в Excel</button>
    <button @click="clearLogs">Очистити</button>
    <button @click="goToTimerPage" class="back-btn">
      Повернутися до таймера
    </button>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useActivityStore } from "@/stores/activityStore";
import * as XLSX from "xlsx";
import { useRouter } from "vue-router";

const store = useActivityStore();
const router = useRouter();

const startDate = ref("");
const endDate = ref("");

const categoryFilter = ref(""); 

const uniqueCategories = computed(() => {
  const categories = store.activityLogs.map(log => log.category);
  return [...new Set(categories)]; 
});

const filteredLogs = computed(() => {
  return store.activityLogs.filter((log) => {
    const logDate = new Date(log.startTime).toISOString().slice(0, 10);
    const isCategoryMatch = !categoryFilter.value || log.category === categoryFilter.value;
    return (
      (!startDate.value || logDate >= startDate.value) &&
      (!endDate.value || logDate <= endDate.value) &&
      isCategoryMatch
    );
  });
});


const sortedLogs = computed(() =>
  [...filteredLogs.value].sort(
    (a, b) => new Date(a.startTime) - new Date(b.startTime)
  )
);

const totalDuration = computed(() => {
  let totalSeconds = sortedLogs.value.reduce(
    (sum, log) => sum + calculateDurationSeconds(log.startTime, log.endTime),
    0
  );
  return formatTotalDuration(totalSeconds);
});


const formatDate = (date) => new Date(date).toLocaleDateString();
const formatTime = (time) =>
  new Date(time).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

const formatDuration = (start, end) => {
  const totalSeconds = calculateDurationSeconds(start, end);
  return formatTotalDuration(totalSeconds);
};

const formatTotalDuration = (totalSeconds) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours} год ${minutes} хв ${seconds} сек`;
};

function calculateDurationSeconds(start, end) {
  const startTime = new Date(start);
  const endTime = new Date(end);
  return Math.round((endTime - startTime) / 1000);
}


const editDate = (log, event) => {
  const newDate = event.target.innerText.split(".");
  if (newDate.length === 3) {
    const newDateStr = `${newDate[2]}-${newDate[1]}-${newDate[0]}`;
    const oldStart = new Date(log.startTime);
    const oldEnd = new Date(log.endTime);

    const newStart = new Date(newDateStr);
    newStart.setHours(
      oldStart.getHours(),
      oldStart.getMinutes(),
      oldStart.getSeconds()
    );

    const newEnd = new Date(newDateStr);
    newEnd.setHours(
      oldEnd.getHours(),
      oldEnd.getMinutes(),
      oldEnd.getSeconds()
    );

    if (!isNaN(newStart) && !isNaN(newEnd)) {
      log.startTime = newStart.toISOString();
      log.endTime = newEnd.toISOString();
      saveChanges();
    } else {
      event.target.innerText = formatDate(log.startTime);
    }
  }
};

const editField = (log, field, event) => {
  log[field] = event.target.innerText;
  saveChanges();
};

const editTime = (log, field, event) => {
  const [hours, minutes, seconds] = event.target.innerText
    .split(":")
    .map(Number);
  if (!isNaN(hours) && !isNaN(minutes) && !isNaN(seconds)) {
    const date = new Date(log[field]);
    date.setHours(hours, minutes, seconds);
    log[field] = date.toISOString();
    saveChanges();
  } else {
    event.target.innerText = formatTime(log[field]);
  }
};


const saveChanges = () => store.saveLogs();

const clearLogs = () => {
  
  if (!startDate.value && !endDate.value) {
    store.activityLogs = [];
  } else {
    
    store.activityLogs = store.activityLogs.filter(
      (log) =>
        (startDate.value && new Date(log.startTime).toISOString().slice(0, 10) < startDate.value) ||
        (endDate.value && new Date(log.startTime).toISOString().slice(0, 10) > endDate.value)
    );
  }
  saveChanges();
};


const deleteActivity1 = (id) => {
  store.activityLogs = store.activityLogs.filter((log) => log.id !== id);
  store.saveLogs();
};

const exportToExcel = () => {
  const logs = sortedLogs.value.map((log) => ({
    Дата: formatDate(log.startTime),
    Активність: log.name,
    Категорія: log.category,
    Початок: formatTime(log.startTime),
    Закінчення: formatTime(log.endTime),
    Тривалість: formatDuration(log.startTime, log.endTime),
  }));

  const ws = XLSX.utils.json_to_sheet(logs);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Activity Logs");
  XLSX.writeFile(wb, "ActivityLogs.xlsx");
};

const goToTimerPage = () => router.push("/");


let editingCategoryId = null;

const isEditingCategory = (id) => id === editingCategoryId;

const startEditingCategory = (id) => {
  editingCategoryId = id;
};

const saveCategoryEdit = (id, name) => {
  store.editCategory(id, name);  
  editingCategoryId = null; 
};
</script>

<style scoped>

.container {
  text-align: center;
  max-width: 900px;
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

.filters {
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
  gap: 15px;
}

.filters label {
  font-size: 16px;
  color: #0d47a1;
}

.filters input {
  padding: 8px;
  width: 200px;
  border: 2px solid #0d47a1;
  border-radius: 10px;
  font-size: 16px;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

th,
td {
  border: 1px solid #ddd;
  padding: 10px;
  text-align: center;
}

th {
  background-color: #f4f4f4;
  color: #1565c0;
}

tfoot td {
  font-weight: bold;
  background-color: #e1f5fe;
}

tr:nth-child(even) {
  background-color: #f1f8e9;
}

td[contenteditable] {
  background-color: #fff7e6;
  border-radius: 8px;
  font-weight: bold;
}

select {
  padding: 10px;
  border: 2px solid #0d47a1;
  border-radius: 10px;
  font-size: 16px;
  width: 100%;
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

button:not(.back-btn) {
  background: #0d47a1;
  color: white;
  margin-top: 10px;
}

button:not(.back-btn):hover {
  background: #1565c0;
}

.back-btn {
  background-color: #ff80ab;
  color: white;
  border: none;
  padding: 12px 20px;
  cursor: pointer;
  font-size: 16px;
  border-radius: 10px;
}

.back-btn:hover {
  background-color: #f48fb1;
}

button.delete-btn {
  background: transparent;
  color: #d32f2f;
  font-size: 18px;
  cursor: pointer;
}

@media (max-width: 768px) {
  .filters {
    flex-direction: column;
    gap: 10px;
  }

  .filters input {
    width: 100%;
  }

  table {
    font-size: 14px;
  }

  th, td {
    padding: 6px;
  }

  button {
    padding: 6px 12px;
    font-size: 14px;
  }

  .back-btn {
    padding: 10px 18px;
  }
}
</style>