<template>
  <div class="container">
    <h1>Таблиця активностей</h1>

    <div class="filters">
      <label>Виберіть період:</label>
      <input type="date" v-model="startDate" />
      <input type="date" v-model="endDate" />
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
          <th>Дія</th>
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
            <select v-model="log.category" @change="saveChanges">
              <option
                v-for="category in store.categories"
                :key="category.id"
                :value="category.name"
              >
                {{ category.name }}
              </option>
            </select>
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
import { ref, computed, onMounted } from "vue";
import { useActivityStore } from "@/stores/activityStore";
import * as XLSX from "xlsx";
import { useRouter } from "vue-router";

const store = useActivityStore();
const router = useRouter();

const startDate = ref("");
const endDate = ref("");

const filteredLogs = computed(() => {
  return store.activityLogs.filter((log) => {
    const logDate = new Date(log.startTime).toISOString().slice(0, 10);
    return (
      (!startDate.value || logDate >= startDate.value) &&
      (!endDate.value || logDate <= endDate.value)
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

// Formatting Functions
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

const calculateDurationSeconds = (start, end) => {
  const startTime = new Date(start);
  const endTime = new Date(end);
  return Math.round((endTime - startTime) / 1000);
};

// Editing Functions
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

// Data Management
const saveChanges = () => store.saveLogs();

const clearLogs = () => {
  store.activityLogs = store.activityLogs.filter(
    (log) =>
      !startDate.value ||
      new Date(log.startTime).toISOString().slice(0, 10) !== startDate.value
  );
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
</script>

<style scoped>
.container {
  max-width: 900px;
  margin: auto;
  text-align: center;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th,
td {
  border: 1px solid #ddd;
  padding: 8px;
}
th {
  background-color: #f4f4f4;
}
tfoot td {
  font-weight: bold;
}
.filters {
  margin-bottom: 15px;
}
button {
  margin-top: 10px;
  padding: 5px 10px;
}
.back-btn {
  background-color: lightcoral;
  color: white;
  border: none;
  padding: 10px 15px;
  cursor: pointer;
  font-size: 16px;
  border-radius: 5px;
}
.back-btn:hover {
  background-color: darkred;
}
</style>
