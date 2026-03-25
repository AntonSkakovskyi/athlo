const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const axios = require('axios');

// --- Налаштування ---
const CSV_FILE_PATH = 'exercises_data.csv';   // Вхідний CSV файл
const OUTPUT_DIR = 'downloaded_media';        // Папка для медіа
const JSON_FILE_PATH = 'exercises_data.json'; // Вихідний JSON файл

// Створюємо папку, якщо її немає
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Функція для очищення назви файлу від заборонених символів
function sanitizeFilename(name) {
  return name
    .replace(/[<>:"/\\|?*]+/g, '') // Видаляємо заборонені символи ОС
    .trim()
    .replace(/\s+/g, '_');         // Замінюємо пробіли на підкреслення
}

// Функція для визначення розширення файлу з URL
function getExtension(url) {
  // Шукаємо крапку, після якої йдуть літери/цифри до кінця рядка або до символів ? чи #
  const match = url.match(/\.([a-zA-Z0-9]+)(?:[\?#]|$)/);
  // Якщо розширення не знайдено, ставимо .mp4 за замовчуванням (Hevy використовує переважно відео)
  return match ? `.${match[1]}` : '.mp4';
}

// Асинхронна функція для завантаження файлу
async function downloadMedia(url, filepath) {
  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
      timeout: 15000 // 15 секунд таймаут
    });

    return new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(filepath);
      response.data.pipe(writer);
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (error) {
    console.error(`\n❌ Помилка завантаження ${url}:`, error.message);
    return false;
  }
}

async function main() {
  const exercisesList = [];

  console.log('Читання CSV файлу...');

  // Читаємо CSV файл через потік
  fs.createReadStream(CSV_FILE_PATH)
    .pipe(csv())
    .on('data', (row) => {
      exercisesList.push(row);
    })
    .on('end', async () => {
      console.log(`Знайдено ${exercisesList.length} записів. Починаємо завантаження...\n`);

      // Використовуємо цикл for...of для послідовного завантаження
      // Це вбереже від блокування сервером за занадто багато одночасних запитів
      for (const exercise of exercisesList) {
        const exerciseName = exercise['name'] || 'Unknown_Exercise';
        const mediaUrl = exercise['source'] ? exercise['source'].trim() : '';

        if (!mediaUrl) {
          console.log(`[ПРОПУСК] ${exerciseName} — немає посилання на медіа.`);
          exercise.Local_File_Path = null;
          continue;
        }

        const safeName = sanitizeFilename(exerciseName);
        const ext = getExtension(mediaUrl);
        const fileName = `${safeName}${ext}`;
        const filePath = path.join(OUTPUT_DIR, fileName);

        process.stdout.write(`Завантаження: ${fileName} ... `);

        const success = await downloadMedia(mediaUrl, filePath);

        if (success !== false) {
          console.log('✅ Готово');
          exercise.Local_File_Path = filePath; // Додаємо шлях у JSON
        } else {
          exercise.Local_File_Path = null;
        }
      }

      // Зберігаємо оновлений масив у JSON
      fs.writeFileSync(JSON_FILE_PATH, JSON.stringify(exercisesList, null, 4), 'utf-8');

      console.log('\n--- Завершено! ---');
      console.log(`Усі медіа збережено у папку: ${OUTPUT_DIR}`);
      console.log(`Файл JSON збережено як: ${JSON_FILE_PATH}`);
    })
    .on('error', (error) => {
      console.error('Помилка читання CSV:', error.message);
    });
}

main();