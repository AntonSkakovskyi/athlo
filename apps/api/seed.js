const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const { spawnSync } = require('child_process');

const MAIN_USER = {
  email: 'skanton3@gmail.com',
  full_name: 'Anton Skakovskyi',
  nickname: 'Truba',
  password: '123456',
};

let USER_ID = 1;
let FRIEND_ID;
let STRANGER_ID;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

function daysAgo(n, hour = 9) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d;
}

// ── Simulation helpers (realistic, non-uniform data) ─────────────────────────
const rand = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const roundTo = (v, step) => Math.round(v / step) * step;
const chance = (p) => Math.random() < p;

/**
 * Working-set weight for session `wi` of `total`, given a per-exercise base and
 * total expected progression. Produces fast early gains that taper (diminishing
 * returns), periodic deloads (~every 8th session), and ±2.5 kg noise — so the
 * curve shows growth, plateaus and the occasional dip rather than a clean line.
 */
function sessionWeight(base, prog, wi, total) {
  const p = total > 1 ? wi / (total - 1) : 1;
  const trend = base + prog * Math.pow(p, 0.7);
  const deload = wi > 0 && wi % 8 === 0 ? 0.92 : 1; // periodic back-off week
  const noise = chance(0.4) ? (chance(0.5) ? 2.5 : -2.5) : 0;
  return Math.max(roundTo(base * 0.7, 2.5), roundTo(trend * deload + noise, 2.5));
}

async function nameId(client, table, name) {
  const s = await client.query(`SELECT id FROM "${table}" WHERE name = $1 LIMIT 1`, [name]);
  if (s.rows.length) return s.rows[0].id;
  const i = await client.query(`INSERT INTO "${table}" (name) VALUES ($1) RETURNING id`, [name]);
  return i.rows[0].id;
}

async function insertRow(client, table, data) {
  const keys = Object.keys(data);
  const vals = Object.values(data);
  const cols = keys.map(k => `"${k}"`).join(', ');
  const ph = vals.map((_, i) => `$${i + 1}`).join(', ');
  const r = await client.query(`INSERT INTO "${table}" (${cols}) VALUES (${ph}) RETURNING id`, vals);
  return r.rows[0].id;
}

async function seedUsersAndFriends(client, { friendStatuses }) {
  const pwdHash = '$2b$10$oTPuRIChn9z3KsC63c/0a.tIC3OsCgYVAG9Hgrn712fecnLbnfwmW'; // 'password'

  // Ensure the main user exists and matches MAIN_USER details.
  const mainCheck = await client.query(
    `SELECT id FROM users WHERE email=$1`,
    [MAIN_USER.email],
  );
  if (!mainCheck.rows.length) {
    const mainHash = await bcrypt.hash(MAIN_USER.password, 10);
    USER_ID = await insertRow(client, 'users', {
      email: MAIN_USER.email,
      full_name: MAIN_USER.full_name,
      nickname: MAIN_USER.nickname,
      password_hash: mainHash,
      gender: 'male',
      birth_date: '2001-01-01',
      height: 182,
      weight: 82,
      activity_level: 'moderate',
      fitness_goal: 'build_muscle',
    });
    console.log(`  → Main user "${MAIN_USER.nickname}" created (id=${USER_ID})`);
  } else {
    USER_ID = mainCheck.rows[0].id;
    await client.query(
      `UPDATE users SET full_name=$1, nickname=$2 WHERE id=$3`,
      [MAIN_USER.full_name, MAIN_USER.nickname, USER_ID],
    );
  }

  // Ensure FRIEND exists
  const fCheck = await client.query(`SELECT id FROM users WHERE email=$1`, ['friend@example.com']);
  if (!fCheck.rows.length) {
    FRIEND_ID = await insertRow(client, 'users', {
      email: 'friend@example.com',
      full_name: 'John Friend',
      nickname: 'johnny_f',
      password_hash: pwdHash,
      gender: 'male',
      birth_date: '1998-01-01',
      height: 180,
      weight: 80,
      activity_level: 'moderate',
      fitness_goal: 'maintain'
    });
  } else {
    FRIEND_ID = fCheck.rows[0].id;
  }

  // Ensure STRANGER exists
  const sCheck = await client.query(`SELECT id FROM users WHERE email=$1`, ['stranger@example.com']);
  if (!sCheck.rows.length) {
    STRANGER_ID = await insertRow(client, 'users', {
      email: 'stranger@example.com',
      full_name: 'Mike Public',
      nickname: 'mike_p',
      password_hash: pwdHash,
      gender: 'male',
      birth_date: '1994-01-01',
      height: 175,
      weight: 85,
      activity_level: 'light',
      fitness_goal: 'lose_weight'
    });
  } else {
    STRANGER_ID = sCheck.rows[0].id;
  }

  // Populate USER_ID 1 if it exists but missing data
  await client.query(
    `UPDATE users SET
      gender = COALESCE(gender, 'male'),
      birth_date = COALESCE(birth_date, '2001-01-01'),
      height = COALESCE(height, 182),
      weight = COALESCE(weight, 82),
      activity_level = COALESCE(activity_level, 'moderate'),
      fitness_goal = COALESCE(fitness_goal, 'build_muscle')
     WHERE id = $1 AND (gender IS NULL OR birth_date IS NULL)`,
    [USER_ID]
  );

  // Ensure friendship exists
  const frCheck = await client.query(
    `SELECT id FROM user_friends WHERE (user_id=$1 AND friend_id=$2) OR (user_id=$2 AND friend_id=$1)`,
    [USER_ID, FRIEND_ID]
  );
  if (!frCheck.rows.length) {
    await insertRow(client, 'user_friends', { user_id: USER_ID, friend_id: FRIEND_ID, status_id: friendStatuses['ACCEPTED'] });
  }

  // Ensure settings exist
  for (const uid of [USER_ID, FRIEND_ID, STRANGER_ID]) {
    const sCheck = await client.query(`SELECT id FROM settings WHERE user_id=$1`, [uid]);
    if (!sCheck.rows.length) {
      await insertRow(client, 'settings', {
        user_id: uid,
        calorie_goal: 2400,
        water_goal: 2500,
        protein_goal: 150,
        fat_goal: 70,
        carb_goal: 250
      });
    }
  }

  console.log('  → Users, friendship, and settings ready');
}

// ─── Exercise definitions ───────────────────────────────────────────────────
const EXERCISES = [
  // 0–10  WEIGHT_AND_REPS — Barbell
  { name: 'Bench Press (Barbell)',          tt: 'WEIGHT_AND_REPS', eq: 'Barbell',       pm: 'Chest',      sm: ['Triceps', 'Shoulders'] },
  { name: 'Squat (Barbell)',                tt: 'WEIGHT_AND_REPS', eq: 'Barbell',       pm: 'Quadriceps', sm: ['Hamstrings', 'Glutes'] },
  { name: 'Deadlift (Barbell)',             tt: 'WEIGHT_AND_REPS', eq: 'Barbell',       pm: 'Hamstrings', sm: ['Quadriceps', 'Lower Back', 'Glutes'] },
  { name: 'Overhead Press (Barbell)',       tt: 'WEIGHT_AND_REPS', eq: 'Barbell',       pm: 'Shoulders',  sm: ['Triceps'] },
  { name: 'Bent Over Row (Barbell)',        tt: 'WEIGHT_AND_REPS', eq: 'Barbell',       pm: 'Upper Back', sm: [] },
  { name: 'Incline Bench Press (Barbell)',  tt: 'WEIGHT_AND_REPS', eq: 'Barbell',       pm: 'Chest',      sm: [] },
  { name: 'Romanian Deadlift (Barbell)',    tt: 'WEIGHT_AND_REPS', eq: 'Barbell',       pm: 'Hamstrings', sm: ['Glutes'] },
  { name: 'Bicep Curl (Barbell)',           tt: 'WEIGHT_AND_REPS', eq: 'Barbell',       pm: 'Biceps',     sm: [] },
  { name: 'Front Squat',                    tt: 'WEIGHT_AND_REPS', eq: 'Barbell',       pm: 'Quadriceps', sm: ['Hamstrings', 'Glutes'] },
  { name: 'Hack Squat',                     tt: 'WEIGHT_AND_REPS', eq: 'Barbell',       pm: 'Quadriceps', sm: ['Hamstrings', 'Glutes'] },
  { name: 'Hip Thrust (Barbell)',           tt: 'WEIGHT_AND_REPS', eq: 'Barbell',       pm: 'Glutes',     sm: [] },
  // 11–21  WEIGHT_AND_REPS — Dumbbell
  { name: 'Shoulder Press (Dumbbell)',      tt: 'WEIGHT_AND_REPS', eq: 'Dumbbell',      pm: 'Shoulders',  sm: [] },
  { name: 'Bench Press (Dumbbell)',         tt: 'WEIGHT_AND_REPS', eq: 'Dumbbell',      pm: 'Chest',      sm: ['Triceps', 'Shoulders'] },
  { name: 'Arnold Press (Dumbbell)',        tt: 'WEIGHT_AND_REPS', eq: 'Dumbbell',      pm: 'Shoulders',  sm: [] },
  { name: 'Bent Over Row (Dumbbell)',       tt: 'WEIGHT_AND_REPS', eq: 'Dumbbell',      pm: 'Upper Back', sm: [] },
  { name: 'Romanian Deadlift (Dumbbell)',   tt: 'WEIGHT_AND_REPS', eq: 'Dumbbell',      pm: 'Hamstrings', sm: ['Glutes'] },
  { name: 'Lateral Raise (Dumbbell)',       tt: 'WEIGHT_AND_REPS', eq: 'Dumbbell',      pm: 'Shoulders',  sm: [] },
  { name: 'Chest Fly (Dumbbell)',           tt: 'WEIGHT_AND_REPS', eq: 'Dumbbell',      pm: 'Chest',      sm: [] },
  { name: 'Overhead Dumbbell Lunge',        tt: 'WEIGHT_AND_REPS', eq: 'Dumbbell',      pm: 'Quadriceps', sm: [] },
  { name: 'Hammer Curl (Dumbbell)',         tt: 'WEIGHT_AND_REPS', eq: 'Dumbbell',      pm: 'Biceps',     sm: ['Forearms'] },
  { name: 'Goblet Squat (Dumbbell)',        tt: 'WEIGHT_AND_REPS', eq: 'Dumbbell',      pm: 'Quadriceps', sm: ['Glutes'] },
  { name: 'Bulgarian Split Squat',          tt: 'WEIGHT_AND_REPS', eq: 'Dumbbell',      pm: 'Quadriceps', sm: ['Glutes', 'Hamstrings'] },
  // 22–35  WEIGHT_AND_REPS — Machine / Cable
  { name: 'Lat Pulldown (Cable)',           tt: 'WEIGHT_AND_REPS', eq: 'Machine',       pm: 'Lats',       sm: [] },
  { name: 'Seated Cable Row - Bar Grip',    tt: 'WEIGHT_AND_REPS', eq: 'Machine',       pm: 'Upper Back', sm: [] },
  { name: 'Cable Fly Crossovers',           tt: 'WEIGHT_AND_REPS', eq: 'Machine',       pm: 'Chest',      sm: [] },
  { name: 'Triceps Pushdown',               tt: 'WEIGHT_AND_REPS', eq: 'Machine',       pm: 'Triceps',    sm: [] },
  { name: 'Bicep Curl (Cable)',             tt: 'WEIGHT_AND_REPS', eq: 'Machine',       pm: 'Biceps',     sm: [] },
  { name: 'Leg Press (Machine)',            tt: 'WEIGHT_AND_REPS', eq: 'Machine',       pm: 'Quadriceps', sm: [] },
  { name: 'Lying Leg Curl (Machine)',       tt: 'WEIGHT_AND_REPS', eq: 'Machine',       pm: 'Hamstrings', sm: [] },
  { name: 'Leg Extension (Machine)',        tt: 'WEIGHT_AND_REPS', eq: 'Machine',       pm: 'Quadriceps', sm: [] },
  { name: 'Standing Calf Raise (Machine)',  tt: 'WEIGHT_AND_REPS', eq: 'Machine',       pm: 'Calves',     sm: [] },
  { name: 'Face Pull',                      tt: 'WEIGHT_AND_REPS', eq: 'Machine',       pm: 'Shoulders',  sm: [] },
  { name: 'Lateral Raise (Cable)',          tt: 'WEIGHT_AND_REPS', eq: 'Machine',       pm: 'Shoulders',  sm: [] },
  { name: 'Back Extension (Hyperextension)',tt: 'WEIGHT_AND_REPS', eq: 'Machine',       pm: 'Lower Back', sm: [] },
  { name: 'Pec Deck (Machine)',             tt: 'WEIGHT_AND_REPS', eq: 'Machine',       pm: 'Chest',      sm: [] },
  { name: 'Seated Row (Machine)',           tt: 'WEIGHT_AND_REPS', eq: 'Machine',       pm: 'Upper Back', sm: [] },
  // 36–48  REPS_ONLY
  { name: 'Pull Up',                        tt: 'REPS_ONLY',     eq: 'Machine',       pm: 'Lats',       sm: ['Upper Back'] },
  { name: 'Push Up',                        tt: 'REPS_ONLY',     eq: null,            pm: 'Chest',      sm: ['Triceps', 'Shoulders'] },
  { name: 'Chin Up',                        tt: 'REPS_ONLY',     eq: 'Machine',       pm: 'Lats',       sm: [] },
  { name: 'Hanging Leg Raise',              tt: 'REPS_ONLY',     eq: null,            pm: 'Abdominals', sm: [] },
  { name: 'Bicycle Crunch',                 tt: 'REPS_ONLY',     eq: null,            pm: 'Abdominals', sm: [] },
  { name: 'Hip Thrust',                     tt: 'REPS_ONLY',     eq: null,            pm: 'Glutes',     sm: [] },
  { name: 'Assisted Pistol Squats',         tt: 'REPS_ONLY',     eq: null,            pm: 'Quadriceps', sm: ['Hamstrings', 'Glutes'] },
  { name: 'Diamond Push Up',               tt: 'REPS_ONLY',     eq: null,            pm: 'Triceps',    sm: ['Chest'] },
  { name: 'Chest Dip',                      tt: 'REPS_ONLY',     eq: 'Machine',       pm: 'Chest',      sm: ['Triceps'] },
  { name: 'Floor Triceps Dip',              tt: 'REPS_ONLY',     eq: null,            pm: 'Triceps',    sm: [] },
  { name: 'Ab Wheel',                       tt: 'REPS_ONLY',     eq: 'Other',         pm: 'Abdominals', sm: [] },
  { name: 'Burpees',                        tt: 'REPS_ONLY',     eq: null,            pm: 'Cardio',     sm: ['Full Body'] },
  // 49–55  TIME_BASED (duration only)
  { name: 'Plank',                          tt: 'TIME_BASED',    eq: null,            pm: 'Abdominals', sm: [] },
  { name: 'Jump Rope',                      tt: 'TIME_BASED',    eq: 'Other',         pm: 'Cardio',     sm: [] },
  { name: 'Aerobics',                       tt: 'TIME_BASED',    eq: null,            pm: 'Cardio',     sm: [] },
  { name: 'Reverse Plank',                  tt: 'TIME_BASED',    eq: null,            pm: 'Abdominals', sm: [] },
  { name: 'Ab Scissors',                    tt: 'TIME_BASED',    eq: null,            pm: 'Abdominals', sm: [] },
  { name: 'Mountain Climbers',              tt: 'TIME_BASED',    eq: null,            pm: 'Cardio',     sm: ['Abdominals'] },
  // 55–56  DISTANCE_AND_TIME (duration + distance)
  { name: 'Running',                        tt: 'DISTANCE_AND_TIME', eq: null,            pm: 'Cardio',     sm: [] },
  { name: 'Air Bike',                       tt: 'DISTANCE_AND_TIME', eq: 'Machine',       pm: 'Cardio',     sm: [] },
  { name: 'Lateral Raise (Band)',           tt: 'WEIGHT_AND_REPS', eq: 'Resistance Band', pm: 'Shoulders', sm: [] },
];

// Exercise indices per workout type
const PUSH = [0, 5, 3, 16, 25, 37];   // Bench, Incline, OHP, Lateral DB, Tricep Pushdown, Push Up
const PULL = [2, 4, 22, 23, 7, 36];   // Deadlift, BOR, Lat Pulldown, Cable Row, Bicep Curl, Pull Up
const LEGS = [1, 6, 27, 28, 10, 30];  // Squat, RDL, Leg Press, Leg Curl, Hip Thrust BB, Calf Raise

const WEIGHT_PROG = {
  0:  { base: 60,  prog: 12.5 }, // Bench Press
  1:  { base: 80,  prog: 15   }, // Squat
  2:  { base: 80,  prog: 17.5 }, // Deadlift
  3:  { base: 40,  prog: 7.5  }, // OHP
  4:  { base: 60,  prog: 10   }, // Bent Over Row
  5:  { base: 50,  prog: 10   }, // Incline Bench
  6:  { base: 60,  prog: 10   }, // RDL
  7:  { base: 30,  prog: 5    }, // Bicep Curl
  10: { base: 60,  prog: 12.5 }, // Hip Thrust
  16: { base: 10,  prog: 4    }, // Lateral Raise
  22: { base: 50,  prog: 10   }, // Lat Pulldown
  23: { base: 50,  prog: 10   }, // Cable Row
  25: { base: 30,  prog: 7.5  }, // Tricep Pushdown
  27: { base: 80,  prog: 20   }, // Leg Press
  28: { base: 40,  prog: 10   }, // Leg Curl
  30: { base: 40,  prog: 10   }, // Calf Raise
};

const WORKOUT_SCHEDULE =[84, 81, 77, 74, 70, 67, 63, 60, 56, 53, 49, 46, 42, 39, 35, 32, 28, 25, 21, 18, 14, 10, 5, 1];
const WORKOUT_TYPES    = ['push','pull','legs','push','pull','legs','push','pull','legs','push','pull','legs',
                          'push','pull','legs','push','pull','legs','push','pull','legs','push','pull','legs'];

// ─── Foods ──────────────────────────────────────────────────────────────────
const FOODS = [
  { name: 'Chicken Breast',    brand: null,      calories: 165, proteins: 31,  fats: 3.6, carbs: 0   },
  { name: 'White Rice',        brand: null,      calories: 130, proteins: 2.7, fats: 0.3, carbs: 28  },
  { name: 'Eggs',              brand: null,      calories: 155, proteins: 13,  fats: 11,  carbs: 1.1 },
  { name: 'Oats',              brand: null,      calories: 389, proteins: 17,  fats: 7,   carbs: 66  },
  { name: 'Banana',            brand: null,      calories: 89,  proteins: 1.1, fats: 0.3, carbs: 23  },
  { name: 'Broccoli',          brand: null,      calories: 34,  proteins: 2.8, fats: 0.4, carbs: 7   },
  { name: 'Greek Yogurt',      brand: null,      calories: 97,  proteins: 9,   fats: 5,   carbs: 4   },
  { name: 'Almonds',           brand: null,      calories: 579, proteins: 21,  fats: 50,  carbs: 22  },
  { name: 'Salmon',            brand: null,      calories: 208, proteins: 20,  fats: 13,  carbs: 0   },
  { name: 'Whole Wheat Bread', brand: null,      calories: 247, proteins: 13,  fats: 4.2, carbs: 41  },
  { name: 'Pasta',             brand: null,      calories: 371, proteins: 13,  fats: 1.5, carbs: 75  },
  { name: 'Milk',              brand: null,      calories: 50,  proteins: 3.4, fats: 2,   carbs: 5   },
  { name: 'Cheddar Cheese',    brand: null,      calories: 402, proteins: 25,  fats: 33,  carbs: 1.3 },
  { name: 'Apple',             brand: null,      calories: 52,  proteins: 0.3, fats: 0.2, carbs: 14  },
  { name: 'Tuna',              brand: null,      calories: 116, proteins: 26,  fats: 1,   carbs: 0   },
  { name: 'Peanut Butter',     brand: null,      calories: 588, proteins: 25,  fats: 50,  carbs: 20  },
  { name: 'Olive Oil',         brand: null,      calories: 884, proteins: 0,   fats: 100, carbs: 0   },
  { name: 'Sweet Potato',      brand: null,      calories: 86,  proteins: 1.6, fats: 0.1, carbs: 20  },
  { name: 'Beef Steak',        brand: null,      calories: 271, proteins: 26,  fats: 18,  carbs: 0   },
  { name: 'Cottage Cheese',    brand: null,      calories: 98,  proteins: 11,  fats: 4.3, carbs: 3.4 },
  { name: 'Lentils',           brand: null,      calories: 116, proteins: 9,   fats: 0.4, carbs: 20  },
  { name: 'Orange',            brand: null,      calories: 47,  proteins: 0.9, fats: 0.1, carbs: 12  },
  { name: 'Whey Protein',      brand: 'Generic', calories: 375, proteins: 75,  fats: 5,   carbs: 10  },
  { name: 'Avocado',           brand: null,      calories: 160, proteins: 2,   fats: 15,  carbs: 9   },
  { name: 'Potato',            brand: null,      calories: 77,  proteins: 2,   fats: 0.1, carbs: 17  },
  // Added foods
  { name: 'Turkey Breast',     brand: null,      calories: 135, proteins: 30,  fats: 1,   carbs: 0   },
  { name: 'Quinoa',            brand: null,      calories: 120, proteins: 4.4, fats: 1.9, carbs: 21  },
  { name: 'Tofu',              brand: null,      calories: 76,  proteins: 8,   fats: 4.8, carbs: 1.9 },
  { name: 'Spinach',           brand: null,      calories: 23,  proteins: 2.9, fats: 0.4, carbs: 3.6 },
  { name: 'Blueberries',       brand: null,      calories: 57,  proteins: 0.7, fats: 0.3, carbs: 14  },
  { name: 'Walnuts',           brand: null,      calories: 654, proteins: 15,  fats: 65,  carbs: 14  },
  { name: 'Egg White',         brand: null,      calories: 52,  proteins: 11,  fats: 0.2, carbs: 0.7 },
  { name: 'Cod',               brand: null,      calories: 82,  proteins: 18,  fats: 0.7, carbs: 0   },
  { name: 'Brown Rice',        brand: null,      calories: 123, proteins: 2.7, fats: 1,   carbs: 26  },
  { name: 'Green Beans',       brand: null,      calories: 31,  proteins: 1.8, fats: 0.2, carbs: 7   },
  { name: 'Tomato',            brand: null,      calories: 18,  proteins: 0.9, fats: 0.2, carbs: 3.9 },
  { name: 'Carrot',            brand: null,      calories: 41,  proteins: 0.9, fats: 0.2, carbs: 9.6 },
  { name: 'Onion',             brand: null,      calories: 40,  proteins: 1.1, fats: 0.1, carbs: 9.3 },
  { name: 'Greek Salad',       brand: 'Homemade',calories: 120, proteins: 3.5, fats: 9,   carbs: 8   },
  { name: 'Protein Bar',       brand: 'Quest',   calories: 190, proteins: 21,  fats: 7,   carbs: 21  },
  { name: 'Rice Cakes',        brand: null,      calories: 387, proteins: 8,   fats: 2.8, carbs: 82  },
  { name: 'Scrambled Eggs',    brand: 'Homemade',calories: 148, proteins: 10,  fats: 11,  carbs: 1.6 },
  // "My Products" for USER_ID
  { name: 'Grandma\'s Borscht', brand: 'Private', calories: 45,  proteins: 1.5, fats: 2.5, carbs: 5, creatorId: USER_ID },
  { name: 'Morning Protein Shake', brand: 'My Mix', calories: 250, proteins: 40, fats: 5, carbs: 15, creatorId: USER_ID },
];

// ─── Seed functions ──────────────────────────────────────────────────────────

async function seedLookups(client) {
  const vt = {}, tt = {}, units = {}, mealTypes = {}, muscles = {}, equip = {}, metricTypes = {};
  const friendStatuses = {}, trackingMetrics = {};

  for (const name of ['PRIVATE', 'PUBLIC', 'FRIENDS_ONLY'])
    vt[name] = await nameId(client, 'visibility_type', name);

  for (const name of ['WEIGHT_AND_REPS', 'REPS_ONLY', 'TIME_BASED', 'DISTANCE_AND_TIME', 'DISTANCE_ONLY'])
    tt[name] = await nameId(client, 'tracking_types', name);

  for (const name of ['g', 'ml', 'pcs', 'cup', 'kg', 'cm', 'kcal', '%'])
    units[name] = await nameId(client, 'units', name);

  for (const name of ['PENDING', 'ACCEPTED'])
    friendStatuses[name] = await nameId(client, 'friend_statuses', name);

  for (const name of ['WEIGHT', 'REPS', 'DURATION', 'DISTANCE', 'VOLUME', '1RM'])
    trackingMetrics[name] = await nameId(client, 'tracking_metrics', name);

  for (const name of ['Breakfast', 'Lunch', 'Dinner', 'Snack'])
    mealTypes[name] = await nameId(client, 'meal_types', name);

  for (const name of ['Abdominals','Abductors','Adductors','Biceps','Calves','Cardio','Chest',
                       'Forearms','Full Body','Glutes','Hamstrings','Lats','Lower Back','Neck',
                       'Other','Quadriceps','Shoulders','Traps','Triceps','Upper Back']) {
    const s = await client.query(`SELECT id FROM muscles WHERE name=$1 LIMIT 1`, [name]);
    if (s.rows.length) { muscles[name] = s.rows[0].id; continue; }
    const i = await client.query(`INSERT INTO muscles (name) VALUES ($1) RETURNING id`, [name]);
    muscles[name] = i.rows[0].id;
  }

  for (const name of ['Barbell','Dumbbell','Kettlebell','Machine','Plate','Resistance Band','Suspension','Other']) {
    const s = await client.query(`SELECT id FROM equipments WHERE name=$1 AND user_id IS NULL LIMIT 1`, [name]);
    if (s.rows.length) { equip[name] = s.rows[0].id; continue; }
    const i = await client.query(`INSERT INTO equipments (name) VALUES ($1) RETURNING id`, [name]);
    equip[name] = i.rows[0].id;
  }

  for (const { name, unit } of [
    { name: 'Body Weight', unit: 'kg' },
    { name: 'Body Fat %',  unit: '%'  },
    { name: 'Waist',       unit: 'cm' },
    { name: 'Chest',       unit: 'cm' },
    { name: 'Hips',        unit: 'cm' },
    { name: 'Neck',        unit: 'cm' },
    { name: 'Thigh',       unit: 'cm' },
    { name: 'Bicep',       unit: 'cm' },
    { name: 'Shoulders',   unit: 'cm' },
    { name: 'Height',      unit: 'cm' },
  ]) {
    const s = await client.query(`SELECT id FROM metric_types WHERE name=$1 LIMIT 1`, [name]);
    if (s.rows.length) { metricTypes[name] = s.rows[0].id; continue; }
    const i = await client.query(
      `INSERT INTO metric_types (name, unit_id) VALUES ($1, $2) RETURNING id`,
      [name, unit ? units[unit] : null]
    );
    metricTypes[name] = i.rows[0].id;
  }

  console.log('  → lookup tables ready');
  return { vt, tt, units, mealTypes, muscles, equip, metricTypes, friendStatuses, trackingMetrics };
}

// Custom exercises owned by USER_ID (showcase the user-created exercise feature)
const USER_EXERCISES = [
  { name: 'My Cable Lateral Raise', tt: 'WEIGHT_AND_REPS', eq: 'Machine',        pm: 'Shoulders',  sm: [] },
  { name: 'Home Band Row',          tt: 'WEIGHT_AND_REPS', eq: 'Resistance Band', pm: 'Upper Back', sm: ['Biceps'] },
  { name: 'Wall Sit',               tt: 'DISTANCE_AND_TIME',      eq: null,              pm: 'Quadriceps', sm: ['Glutes'] },
];

async function addExerciseMuscles(client, exId, ex, muscles) {
  await client.query(
    `INSERT INTO exercise_muscles (exercise_id, muscle_id, is_primary, impact_percentage)
     VALUES ($1, $2, true, 100) ON CONFLICT (exercise_id, muscle_id) DO NOTHING`,
    [exId, muscles[ex.pm]],
  );
  for (const sm of ex.sm) {
    if (!muscles[sm]) continue;
    await client.query(
      `INSERT INTO exercise_muscles (exercise_id, muscle_id, is_primary, impact_percentage)
       VALUES ($1, $2, false, $3) ON CONFLICT (exercise_id, muscle_id) DO NOTHING`,
      [exId, muscles[sm], Math.floor(60 / ex.sm.length)],
    );
  }
}

// SYSTEM data: the curated public exercise catalog (user_id IS NULL). This is the
// stable anchor the workout simulation depends on; the ETL (wger) adds hundreds
// more catalog exercises alongside these via the partial unique index on
// LOWER(name) WHERE user_id IS NULL.
async function seedExercises(client, { vt, tt, equip, muscles }) {
  const exIds = [];
  for (const ex of EXERCISES) {
    const s = await client.query(`SELECT id FROM exercises WHERE LOWER(name)=LOWER($1) AND user_id IS NULL LIMIT 1`, [ex.name]);
    if (s.rows.length) { exIds.push(s.rows[0].id); continue; }

    const exId = await insertRow(client, 'exercises', {
      name: ex.name,
      tracking_type_id: tt[ex.tt],
      equipment_id: ex.eq ? equip[ex.eq] : null,
      user_id: null,
      visibility_type_id: vt['PUBLIC'],
    });
    await addExerciseMuscles(client, exId, ex, muscles);
    exIds.push(exId);
  }
  console.log(`  → ${exIds.length} system exercises ready`);
  return exIds;
}

// TEST data: custom exercises owned by the showcase user (user-created feature).
async function seedUserExercises(client, { vt, tt, equip, muscles }) {
  let userExCount = 0;
  for (const ex of USER_EXERCISES) {
    const s = await client.query(
      `SELECT id FROM exercises WHERE LOWER(name)=LOWER($1) AND user_id=$2 LIMIT 1`,
      [ex.name, USER_ID],
    );
    if (s.rows.length) continue;

    const exId = await insertRow(client, 'exercises', {
      name: ex.name,
      tracking_type_id: tt[ex.tt],
      equipment_id: ex.eq ? equip[ex.eq] : null,
      user_id: USER_ID,
      visibility_type_id: vt['PRIVATE'],
    });
    await addExerciseMuscles(client, exId, ex, muscles);
    userExCount++;
  }
  if (userExCount > 0) console.log(`  → ${userExCount} custom user exercises seeded`);
}

async function seedBodyMetrics(client, { metricTypes }) {
  const existing = await client.query(`SELECT COUNT(*) FROM body_metrics WHERE user_id=$1`, [USER_ID]);
  if (parseInt(existing.rows[0].count) >= 50) { console.log('  → body metrics already seeded'); return; }

  let count = 0;
  for (const { name, start, end } of [
    { name: 'Body Weight', start: 82.0, end: 78.5 },
    { name: 'Waist',       start: 86.0, end: 82.0 },
    { name: 'Chest',       start: 99.0, end: 102.0 },
    { name: 'Hips',        start: 96.0, end: 93.0 },
    { name: 'Body Fat %',  start: 18.0, end: 14.5 },
  ]) {
    for (let w = 0; w <= 12; w++) {
      const value = +(start + (end - start) * w / 12).toFixed(1);
      await insertRow(client, 'body_metrics', {
        metric_type_id: metricTypes[name],
        user_id: USER_ID,
        value,
        recorded_at: daysAgo(84 - w * 7, 8),
      });
      count++;
    }
  }
  console.log(`  → ${count} body metric records`);
}

async function seedWorkouts(client, { vt }, exIds) {
  // The friend trains FRIENDS_ONLY and the stranger PUBLIC, so the social feed
  // and the "friend's workouts" view have real sessions to demonstrate.
  const userConfigs = [
    { uid: USER_ID,     vis: vt['PRIVATE'],      schedule: WORKOUT_SCHEDULE,  types: WORKOUT_TYPES,                              suffix: '' },
    { uid: FRIEND_ID,   vis: vt['FRIENDS_ONLY'], schedule: [12, 9, 6, 3],     types: ['push', 'pull', 'legs', 'push'],           suffix: ' (Friends Only)' },
    { uid: STRANGER_ID, vis: vt['PUBLIC'],       schedule: [10, 8, 6, 4, 2],  types: ['push', 'pull', 'legs', 'push', 'pull'],   suffix: ' (Public)' },
  ];
  const typeMap = { push: PUSH, pull: PULL, legs: LEGS };
  const wNames  = { push: 'Push Day', pull: 'Pull Day', legs: 'Leg Day' };

  for (const cfg of userConfigs) {
    const { uid, vis: visibility, schedule, types, suffix } = cfg;
    const total = schedule.length;

    const existing = await client.query(
      `SELECT COUNT(*) FROM workouts WHERE user_id=$1 AND status='COMPLETED'`, [uid]
    );
    if (parseInt(existing.rows[0].count) >= total) continue;

    let wCount = 0;
    for (let wi = 0; wi < total; wi++) {
      const da     = schedule[wi];
      const wType  = types[wi];
      const exList = typeMap[wType];
      const startedAt = daysAgo(da, 9 + (wi % 4));
      const endedAt   = new Date(startedAt.getTime() + (50 + (wi % 6) * 5) * 60000);

      const wId = await insertRow(client, 'workouts', {
        user_id:           uid,
        visibility_type_id: visibility,
        name:              wNames[wType] + suffix,
        status:            'COMPLETED',
        started_at:        startedAt,
        ended_at:          endedAt,
        calories:          300 + wi * 12,
        avg_heart_rate:    132 + (wi % 18),
        max_heart_rate:    158 + (wi % 12),
        rpe:               Math.min(6 + Math.floor(wi / 8), 9),
        feeling_score:     Math.min(3 + Math.floor(wi / 12), 5),
      });
      wCount++;

      for (let order = 0; order < exList.length; order++) {
        const exIdx = exList[order];
        const exId  = exIds[exIdx];
        const ex    = EXERCISES[exIdx];

        const leId = await insertRow(client, 'log_exercises', {
          workout_id:  wId,
          exercise_id: exId,
          order:       order + 1,
          rest_time:   90,
        });

        const numSets = order < 2 ? 4 : 3;
        const wp = WEIGHT_PROG[exIdx];
        const topWeight = wp ? sessionWeight(wp.base, wp.prog, wi, total) : 0;
        for (let s = 1; s <= numSets; s++) {
          // Occasionally a final set is left unfinished — realistic, and the
          // achievement recalc correctly ignores incomplete sets.
          const completed = !(s === numSets && chance(0.08));
          const setData = { log_exercise_id: leId, order: s, is_completed: completed };
          if (ex.tt === 'WEIGHT_AND_REPS') {
            // Light top-set noise per set; first set a touch heavier rep range.
            setData.weight = Math.max(0, topWeight - (s - 1) * (chance(0.5) ? 2.5 : 0));
            setData.reps   = randInt(s === 1 ? 8 : 6, s === 1 ? 12 : 10);
          } else if (ex.tt === 'REPS_ONLY') {
            setData.reps   = randInt(6, 10) + Math.floor(wi / 4); // calisthenics creep up
          } else if (ex.tt === 'DISTANCE_ONLY') {
            setData.distance = roundTo(500 + wi * 40 + rand(-50, 80), 10);
          } else {
            // TIME_BASED or DISTANCE_AND_TIME
            setData.duration = Math.round(60 + wi * 3 + rand(-8, 12));
            if (ex.tt === 'DISTANCE_AND_TIME') setData.distance = roundTo(500 + wi * 45 + rand(-40, 90), 10);
          }
          await insertRow(client, 'log_sets', setData);
        }
      }
    }
    console.log(`  → ${wCount} workouts seeded for user ${uid}`);
  }
}

async function seedTemplates(client, { vt }, exIds) {
  const tplConfigs = [
    { creatorId: USER_ID,   vis: vt['PRIVATE'],      name: 'Push Day', desc: 'Chest, shoulders, triceps',  exList: PUSH },
    { creatorId: USER_ID,   vis: vt['PRIVATE'],      name: 'Pull Day', desc: 'Back and biceps',            exList: PULL },
    { creatorId: USER_ID,   vis: vt['PRIVATE'],      name: 'Leg Day',  desc: 'Quads, hamstrings, glutes',  exList: LEGS },
    { creatorId: USER_ID,   vis: vt['PRIVATE'],      name: 'Upper Body', desc: 'Full upper-body session: chest, back, shoulders, arms', exList: [0, 4, 3, 22, 7, 25] },
    { creatorId: FRIEND_ID, vis: vt['FRIENDS_ONLY'], name: 'Home Full Body', desc: 'Friend\'s home routine', exList: [36, 39, 40, 45, 49] },
    { creatorId: FRIEND_ID, vis: vt['FRIENDS_ONLY'], name: 'Dumbbell Only',  desc: 'Hypertrophy with DBs', exList: [12, 11, 14, 15, 16] },
    { creatorId: FRIEND_ID, vis: vt['FRIENDS_ONLY'], name: 'Upper Pump',     desc: 'Friend\'s upper-body pump day', exList: [12, 16, 14, 19, 37] },
    { creatorId: STRANGER_ID, vis: vt['PUBLIC'],     name: 'Stranger\'s Power Plan', desc: 'Public heavy routine', exList: [1, 2, 0, 4, 3] },
  ];

  for (const tpl of tplConfigs) {
    const s = await client.query(
      `SELECT id FROM workout_templates WHERE name=$1 AND creator_id=$2 LIMIT 1`, [tpl.name, tpl.creatorId]
    );
    let tId = s.rows.length
      ? s.rows[0].id
      : await insertRow(client, 'workout_templates', {
          creator_id: tpl.creatorId, visibility_type_id: tpl.vis,
          name: tpl.name, description: tpl.desc,
        });

    const us = await client.query(
      `SELECT id FROM user_workout_templates WHERE user_id=$1 AND workout_template_id=$2 LIMIT 1`,
      [tpl.creatorId, tId]
    );
    if (!us.rows.length)
      await insertRow(client, 'user_workout_templates', { user_id: tpl.creatorId, workout_template_id: tId });

    for (let order = 0; order < tpl.exList.length; order++) {
      const exIdx = tpl.exList[order];
      const exId  = exIds[exIdx];
      const ex    = EXERCISES[exIdx];

      const te = await client.query(
        `SELECT id FROM template_exercises WHERE workout_template_id=$1 AND exercise_id=$2 LIMIT 1`,
        [tId, exId]
      );
      let teId = te.rows.length
        ? te.rows[0].id
        : await insertRow(client, 'template_exercises', {
            workout_template_id: tId, exercise_id: exId, order: order + 1, rest_time: 90,
          });

      const setCount = await client.query(`SELECT COUNT(*) FROM template_sets WHERE template_exercise_id=$1`, [teId]);
      if (parseInt(setCount.rows[0].count) > 0) continue;

      for (let s = 1; s <= 3; s++) {
        const setData = { template_exercise_id: teId, order: s };
        if (ex.tt === 'WEIGHT_AND_REPS')      { setData.weight = WEIGHT_PROG[exIdx]?.base || 0; setData.reps = 8; }
        else if (ex.tt === 'REPS_ONLY')       { setData.weight = 0; setData.reps = 10; }
        else if (ex.tt === 'DISTANCE_ONLY')   { setData.distance = 500; }
        else                                  { setData.duration = 60; }
        await insertRow(client, 'template_sets', setData);
      }
    }
  }
  console.log('  → Workout templates ready');
}

async function seedPublicTemplates(client, { vt }, exIds) {
  const templates = [
    { name: 'Full Body (Beginner)', desc: 'Fundamental movements for total body development', exList: [1, 0, 4, 11, 29, 37, 49] },
    { name: 'Upper Body Power', desc: 'Heavy compound lifts for upper body strength', exList: [0, 4, 3, 36, 7] },
    { name: 'Lower Body Strength', desc: 'Leg focused strength routine', exList: [1, 2, 27, 30, 50] },
    { name: 'Push Pull Legs', desc: 'Classic 6-day PPL split, one session of each', exList: [0, 3, 4, 22, 1, 27] },
    { name: 'Conditioning Circuit', desc: 'Bodyweight + cardio circuit for conditioning', exList: [47, 48, 49, 54] },
  ];
  for (const tpl of templates) {
    const s = await client.query(
      `SELECT id FROM workout_templates WHERE name=$1 AND creator_id IS NULL LIMIT 1`, [tpl.name]
    );
    let tId = s.rows.length
      ? s.rows[0].id
      : await insertRow(client, 'workout_templates', {
          creator_id: null, visibility_type_id: vt['PUBLIC'],
          name: tpl.name, description: tpl.desc,
        });

    for (let order = 0; order < tpl.exList.length; order++) {
      const exIdx = tpl.exList[order];
      const exId  = exIds[exIdx];
      const ex    = EXERCISES[exIdx];

      const te = await client.query(
        `SELECT id FROM template_exercises WHERE workout_template_id=$1 AND exercise_id=$2 LIMIT 1`,
        [tId, exId]
      );
      let teId = te.rows.length
        ? te.rows[0].id
        : await insertRow(client, 'template_exercises', {
            workout_template_id: tId, exercise_id: exId, order: order + 1, rest_time: 90,
          });

      const setCount = await client.query(`SELECT COUNT(*) FROM template_sets WHERE template_exercise_id=$1`, [teId]);
      if (parseInt(setCount.rows[0].count) > 0) continue;

      for (let s = 1; s <= 3; s++) {
        const setData = { template_exercise_id: teId, order: s };
        if (ex.tt === 'WEIGHT_AND_REPS')      { setData.weight = WEIGHT_PROG[exIdx]?.base || 0; setData.reps = 8; }
        else if (ex.tt === 'REPS_ONLY')       { setData.weight = 0; setData.reps = 10; }
        else if (ex.tt === 'DISTANCE_ONLY')   { setData.distance = 500; }
        else                                  { setData.duration = 60; }
        await insertRow(client, 'template_sets', setData);
      }
    }
  }
  console.log('  → 5 global (public) workout templates ready');
}

// Days of meal/water history to simulate for the showcase user.
const NUTRITION_DAYS = 42;

/**
 * Daily intake multiplier for `d` days ago. Tells a 6-week story:
 *   weeks 0–1 → maintenance, weeks 2–3 → a cut (under-eating), weeks 4–5 → a
 *   bulk (over-eating). Weekends drift higher, plus small day-to-day noise — so
 *   the calorie graph has dips, plateaus and spikes rather than a flat line.
 */
function intakeFactor(d) {
  const week = Math.floor((NUTRITION_DAYS - 1 - d) / 7);
  let base;
  if (week <= 1) base = 1.0;       // maintenance
  else if (week <= 3) base = 0.83; // cut → under-eating
  else base = 1.15;                // bulk → over-eating
  const dow = daysAgo(d).getDay();
  if (dow === 0 || dow === 6) base += 0.08; // weekend overeating
  return base + rand(-0.07, 0.07);
}

// Per-plan macro shapes shared by global and user meal plans.
function buildPlanTemplates() {
  const breakfast = (oats, ban) => [['Oats', oats], ['Banana', ban], ['Milk', 200], ['Greek Yogurt', 150]];
  return {
    bulk: [
      { type: 'Breakfast', items: breakfast(100, 150) },
      { type: 'Lunch',     items: [['Chicken Breast', 220], ['White Rice', 200], ['Broccoli', 120], ['Olive Oil', 15]] },
      { type: 'Dinner',    items: [['Beef Steak', 220], ['Sweet Potato', 220], ['Spinach', 80]] },
      { type: 'Snack',     items: [['Greek Yogurt', 200], ['Peanut Butter', 30], ['Apple', 150]] },
    ],
    cut: [
      { type: 'Breakfast', items: [['Egg White', 200], ['Oats', 50], ['Blueberries', 80]] },
      { type: 'Lunch',     items: [['Chicken Breast', 200], ['Quinoa', 120], ['Spinach', 100]] },
      { type: 'Dinner',    items: [['Cod', 200], ['Broccoli', 150], ['Olive Oil', 8]] },
      { type: 'Snack',     items: [['Cottage Cheese', 150], ['Almonds', 20]] },
    ],
    maintenance: [
      { type: 'Breakfast', items: breakfast(70, 120) },
      { type: 'Lunch',     items: [['Turkey Breast', 200], ['Brown Rice', 150], ['Green Beans', 100]] },
      { type: 'Dinner',    items: [['Salmon', 180], ['Potato', 200], ['Broccoli', 100]] },
      { type: 'Snack',     items: [['Greek Yogurt', 150], ['Walnuts', 20], ['Orange', 130]] },
    ],
    vegetarian: [
      { type: 'Breakfast', items: [['Oats', 70], ['Banana', 120], ['Greek Yogurt', 150], ['Walnuts', 20], ['Blueberries', 80]] },
      { type: 'Lunch',     items: [['Tofu', 200], ['Quinoa', 150], ['Spinach', 100], ['Olive Oil', 10]] },
      { type: 'Dinner',    items: [['Lentils', 200], ['Brown Rice', 150], ['Broccoli', 120], ['Avocado', 60]] },
      { type: 'Snack',     items: [['Cottage Cheese', 150], ['Almonds', 25], ['Apple', 150]] },
    ],
    mediterranean: [
      { type: 'Breakfast', items: [['Greek Yogurt', 200], ['Oats', 60], ['Blueberries', 80], ['Walnuts', 15]] },
      { type: 'Lunch',     items: [['Salmon', 180], ['Quinoa', 150], ['Greek Salad', 200], ['Olive Oil', 10]] },
      { type: 'Dinner',    items: [['Cod', 200], ['Sweet Potato', 200], ['Spinach', 100], ['Olive Oil', 10]] },
      { type: 'Snack',     items: [['Cottage Cheese', 150], ['Orange', 150], ['Almonds', 20]] },
    ],
    highProtein: [
      { type: 'Breakfast', items: [['Egg White', 200], ['Scrambled Eggs', 100], ['Oats', 80], ['Whey Protein', 30], ['Banana', 120]] },
      { type: 'Lunch',     items: [['Chicken Breast', 250], ['Brown Rice', 180], ['Broccoli', 120], ['Olive Oil', 10]] },
      { type: 'Dinner',    items: [['Beef Steak', 220], ['Sweet Potato', 200], ['Spinach', 100]] },
      { type: 'Snack',     items: [['Cottage Cheese', 200], ['Protein Bar', 60], ['Almonds', 25]] },
    ],
    lowCarb: [
      { type: 'Breakfast', items: [['Eggs', 150], ['Avocado', 100], ['Spinach', 80], ['Cheddar Cheese', 30]] },
      { type: 'Lunch',     items: [['Salmon', 200], ['Broccoli', 150], ['Greek Salad', 150], ['Olive Oil', 15]] },
      { type: 'Dinner',    items: [['Beef Steak', 220], ['Green Beans', 150], ['Avocado', 80]] },
      { type: 'Snack',     items: [['Walnuts', 30], ['Cottage Cheese', 150], ['Almonds', 20]] },
    ],
    easyEveryday: [
      { type: 'Breakfast', items: [['Scrambled Eggs', 150], ['Whole Wheat Bread', 80], ['Apple', 120]] },
      { type: 'Lunch',     items: [['Chicken Breast', 200], ['White Rice', 150], ['Broccoli', 100], ['Olive Oil', 10]] },
      { type: 'Dinner',    items: [['Pasta', 100], ['Turkey Breast', 150], ['Tomato', 100], ['Olive Oil', 10]] },
      { type: 'Snack',     items: [['Banana', 120], ['Peanut Butter', 30]] },
    ],
    budgetFriendly: [
      { type: 'Breakfast', items: [['Oats', 80], ['Milk', 200], ['Banana', 120]] },
      { type: 'Lunch',     items: [['Lentils', 150], ['White Rice', 150], ['Carrot', 100], ['Olive Oil', 10]] },
      { type: 'Dinner',    items: [['Eggs', 150], ['Potato', 250], ['Onion', 50], ['Olive Oil', 10]] },
      { type: 'Snack',     items: [['Apple', 150], ['Peanut Butter', 20]] },
    ],
  };
}

// Insert one meal plan (+ days/meals/items + optional user assignment). Idempotent.
async function insertMealPlan(client, plan, { mealTypes, gId, foodIds, dishes }) {
  const planEx = plan.creator
    ? await client.query(`SELECT id FROM meal_plans WHERE creator_id=$1 AND name=$2 LIMIT 1`, [plan.creator, plan.name])
    : await client.query(`SELECT id FROM meal_plans WHERE creator_id IS NULL AND name=$1 LIMIT 1`, [plan.name]);
  if (planEx.rows.length) return;

  const pickDish = () => (dishes.length ? dishes[randInt(0, dishes.length - 1)] : null);
  const planId = await insertRow(client, 'meal_plans', {
    creator_id: plan.creator, visibility_type_id: plan.vis,
    name: plan.name, description: plan.desc, total_days: 7,
  });

  for (let day = 1; day <= 7; day++) {
    const dayId = await insertRow(client, 'plan_days', { meal_plan_id: planId, day_number: day });
    for (let mi = 0; mi < plan.meals.length; mi++) {
      const m = plan.meals[mi];
      const pmId = await insertRow(client, 'plan_meals', {
        plan_day_id: dayId, meal_type_id: mealTypes[m.type], order: mi + 1,
      });
      // One day per week swaps dinner for a composite dish, for variety.
      if (m.type === 'Dinner' && day % 3 === 0 && dishes.length) {
        const dish = pickDish();
        await insertRow(client, 'plan_meal_items', {
          plan_meal_id: pmId, food_id: dish.id, unit_id: gId, amount: 350,
        });
        continue;
      }
      for (const [fname, amount] of m.items) {
        if (!foodIds[fname]) continue;
        await insertRow(client, 'plan_meal_items', {
          plan_meal_id: pmId, food_id: foodIds[fname], unit_id: gId, amount,
        });
      }
    }
  }

  if (plan.assignTo) {
    // The unique partial index allows many inactive links but one active link
    // per user — so a user can "own" several plans with one set active.
    const umpEx = await client.query(
      `SELECT id FROM user_meal_plans WHERE user_id=$1 AND meal_plan_id=$2 LIMIT 1`,
      [plan.assignTo, planId],
    );
    if (!umpEx.rows.length) {
      await insertRow(client, 'user_meal_plans', {
        user_id: plan.assignTo, meal_plan_id: planId, is_active: plan.active,
        started_at: new Date().toISOString().split('T')[0],
      });
    }
  }
}

// SYSTEM nutrition: foods (creator IS NULL) + global public meal plans. Returns a
// food context reused by the (optional) user-activity simulation.
async function seedSystemNutrition(client, { mealTypes, units, vt }) {
  const gId = units['g'];

  // Resolve system foods by name. Reuse ETL rows when present (they carry photos);
  // otherwise insert a fallback row + per-100g macros so the seed still works
  // standalone (no Spoonacular key). My-products (creatorId) are TEST data.
  const foodIds = {};
  for (const f of FOODS) {
    if (f.creatorId) continue;
    const s = await client.query(
      `SELECT id FROM foods
       WHERE LOWER(name)=LOWER($1) AND creator_id IS NULL
       ORDER BY (brand IS NULL) DESC LIMIT 1`,
      [f.name],
    );
    if (s.rows.length) {
      foodIds[f.name] = s.rows[0].id;
    } else {
      foodIds[f.name] = await insertRow(client, 'foods', { name: f.name, brand: f.brand, creator_id: null });
      await insertRow(client, 'nutrition_facts', {
        food_id: foodIds[f.name], unit_id: gId, amount: 100,
        calories: f.calories, proteins: f.proteins, fats: f.fats, carbs: f.carbs,
      });
    }
  }

  // Composite dishes («страви») loaded by the ETL — sprinkled into logs/plans.
  const dishRows = await client.query(
    `SELECT id, name FROM foods WHERE brand='Dish' AND creator_id IS NULL ORDER BY id`,
  );
  const ctx = { mealTypes, gId, foodIds, dishes: dishRows.rows };
  console.log(`  → ${Object.keys(foodIds).length} system foods ready (+${ctx.dishes.length} dishes)`);

  const T = buildPlanTemplates();
  const globalPlans = [
    { name: 'Balanced Maintenance', desc: 'Stable calorie maintenance plan',           creator: null, vis: vt['PUBLIC'], meals: T.maintenance,  assignTo: null, active: false },
    { name: 'High-Protein Bulk',    desc: 'System surplus plan for muscle gain',        creator: null, vis: vt['PUBLIC'], meals: T.bulk,         assignTo: null, active: false },
    { name: 'Lean Cut Plan',        desc: 'System deficit plan for fat loss',           creator: null, vis: vt['PUBLIC'], meals: T.cut,          assignTo: null, active: false },
    { name: 'Vegetarian Power',     desc: 'Plant-based plan with eggs and dairy',       creator: null, vis: vt['PUBLIC'], meals: T.vegetarian,   assignTo: null, active: false },
    { name: 'Mediterranean Plan',   desc: 'Fish, olive oil and vegetable-rich diet',    creator: null, vis: vt['PUBLIC'], meals: T.mediterranean,assignTo: null, active: false },
    { name: 'High-Protein Athlete', desc: 'Elevated protein intake for advanced lifters',creator: null, vis: vt['PUBLIC'], meals: T.highProtein,  assignTo: null, active: false },
    { name: 'Low-Carb Plan',        desc: 'Reduced carbohydrate, higher fat approach',  creator: null, vis: vt['PUBLIC'], meals: T.lowCarb,      assignTo: null, active: false },
    { name: 'Easy Everyday',        desc: 'Simple, accessible meals for everyday living',creator: null, vis: vt['PUBLIC'], meals: T.easyEveryday,assignTo: null, active: false },
    { name: 'Budget Friendly',      desc: 'Nutritious meals using cost-effective staples',creator: null, vis: vt['PUBLIC'], meals: T.budgetFriendly,assignTo: null, active: false },
  ];
  for (const plan of globalPlans) await insertMealPlan(client, plan, ctx);
  console.log(`  → ${globalPlans.length} global meal plans ready`);

  return ctx;
}

// TEST nutrition: my-products foods, meal/water logs for the showcase user, and
// the user/friend/stranger meal plans. Reuses the system food context.
async function seedUserNutrition(client, { vt }, ctx) {
  const { mealTypes, gId, foodIds, dishes } = ctx;
  const pickDish = () => (dishes.length ? dishes[randInt(0, dishes.length - 1)] : null);

  // "My Products" — user-created foods (creatorId = USER_ID).
  for (const f of FOODS) {
    if (!f.creatorId) continue;
    const s = await client.query(
      `SELECT id FROM foods WHERE LOWER(name)=LOWER($1) AND creator_id=$2 LIMIT 1`,
      [f.name, f.creatorId],
    );
    if (s.rows.length) { foodIds[f.name] = s.rows[0].id; continue; }
    foodIds[f.name] = await insertRow(client, 'foods', { name: f.name, brand: f.brand, creator_id: f.creatorId });
    await insertRow(client, 'nutrition_facts', {
      food_id: foodIds[f.name], unit_id: gId, amount: 100,
      calories: f.calories, proteins: f.proteins, fats: f.fats, carbs: f.carbs,
    });
  }

  // Meal log — NUTRITION_DAYS for USER_ID with phase-based portions.
  const existingLogs = await client.query(`SELECT COUNT(*) FROM log_meals WHERE user_id=$1`, [USER_ID]);
  if (parseInt(existingLogs.rows[0].count) < NUTRITION_DAYS * 2) {
    const DINNER_VARIANTS = [
      [['Beef Steak', 200], ['Sweet Potato', 200], ['Broccoli', 100]],
      [['Salmon', 200],     ['Potato', 200],        ['Broccoli', 100]],
      [['Chicken Breast', 200], ['Pasta', 150],     ['Broccoli', 100]],
      [['Tuna', 150],       ['White Rice', 150],    ['Avocado', 80]],
      [['Turkey Breast', 200], ['Quinoa', 150],     ['Spinach', 80]],
    ];
    const MEAL_PLAN = [
      { type: 'Breakfast', items: [['Oats', 80], ['Banana', 120], ['Milk', 200], ['Greek Yogurt', 150]] },
      { type: 'Lunch',     items: [['Chicken Breast', 200], ['White Rice', 150], ['Broccoli', 100], ['Olive Oil', 15]] },
      { type: 'Dinner',    items: null },
      { type: 'Snack',     items: [['Greek Yogurt', 150], ['Almonds', 30], ['Apple', 150]] },
    ];

    let mlCount = 0;
    for (let d = NUTRITION_DAYS - 1; d >= 0; d--) {
      const factor = intakeFactor(d);
      const logDate = daysAgo(d, 0).toISOString().split('T')[0];
      for (let mi = 0; mi < MEAL_PLAN.length; mi++) {
        const m = MEAL_PLAN[mi];
        const mealId = await insertRow(client, 'log_meals', {
          user_id: USER_ID, meal_type_id: mealTypes[m.type],
          consumed_at: daysAgo(d, 7 + mi * 4), day_log_date: logDate,
        });
        mlCount++;

        // ~30% of dinners are a single composite dish instead of plated items.
        const dish = m.type === 'Dinner' && chance(0.3) ? pickDish() : null;
        if (dish) {
          const grams = roundTo(rand(300, 450) * factor, 10);
          await insertRow(client, 'log_meal_items', {
            log_meal_id: mealId, food_id: dish.id, unit_id: gId,
            amount: grams, calculated_weight_g: grams,
          });
          continue;
        }

        const items = m.type === 'Dinner' ? DINNER_VARIANTS[d % DINNER_VARIANTS.length] : m.items;
        for (const [fname, amount] of items) {
          if (!foodIds[fname]) continue;
          const scaled = Math.max(5, Math.round(amount * factor));
          await insertRow(client, 'log_meal_items', {
            log_meal_id: mealId, food_id: foodIds[fname],
            unit_id: gId, amount: scaled, calculated_weight_g: scaled,
          });
        }
      }
    }
    console.log(`  → ${mlCount} meal logs for USER_ID over ${NUTRITION_DAYS} days`);
  }

  // Water logs — NUTRITION_DAYS with day-to-day variation.
  const existingWater = await client.query(`SELECT COUNT(*) FROM water_logs WHERE user_id=$1`, [USER_ID]);
  if (parseInt(existingWater.rows[0].count) < NUTRITION_DAYS * 2) {
    const WATER = [[300, 8], [500, 12], [400, 15], [300, 18], [500, 21]];
    for (let d = NUTRITION_DAYS - 1; d >= 0; d--) {
      const pours = randInt(3, 5);
      for (let w = 0; w < pours; w++) {
        const [ml, hour] = WATER[w % WATER.length];
        await client.query(
          `INSERT INTO water_logs (user_id, amount_ml, consumed_at) VALUES ($1, $2, $3)`,
          [USER_ID, ml + randInt(-50, 100), daysAgo(d, hour)],
        );
      }
    }
  }

  // User / friend / stranger meal plans (one active per owner).
  const T = buildPlanTemplates();
  const userPlans = [
    { name: 'Clean Bulk Plan',     desc: '7-day high-protein surplus plan',  creator: USER_ID,   vis: vt['PRIVATE'],      meals: T.bulk,        assignTo: USER_ID,   active: true  },
    { name: 'Shred / Cut Plan',    desc: 'Higher-protein calorie deficit',   creator: USER_ID,   vis: vt['PRIVATE'],      meals: T.cut,         assignTo: USER_ID,   active: false },
    { name: 'Maintenance Plan',    desc: 'Balanced everyday eating',         creator: USER_ID,   vis: vt['PRIVATE'],      meals: T.maintenance, assignTo: USER_ID,   active: false },
    { name: 'Friend Fat Loss Plan',desc: 'Low carb fat-loss week',           creator: FRIEND_ID, vis: vt['FRIENDS_ONLY'], meals: T.cut,         assignTo: FRIEND_ID, active: true  },
    { name: 'Friend Lean Bulk',    desc: 'Gradual lean-gain plan',           creator: FRIEND_ID, vis: vt['FRIENDS_ONLY'], meals: T.bulk,        assignTo: FRIEND_ID, active: false },
    { name: 'Friend Balanced Week',desc: 'Everyday balanced eating',         creator: FRIEND_ID, vis: vt['FRIENDS_ONLY'], meals: T.maintenance, assignTo: FRIEND_ID, active: false },
    { name: 'Public Keto Guide',   desc: 'A standard keto approach',         creator: STRANGER_ID, vis: vt['PUBLIC'],     meals: T.maintenance, assignTo: null,      active: false },
  ];
  for (const plan of userPlans) await insertMealPlan(client, plan, ctx);
  console.log('  → User meal plans ready (3 user, 3 friend, 1 stranger)');
}

async function seedAchievements(client, { trackingMetrics }, exIds) {
  const achMap = {};

  const definitions = [
    ['First Workout',       'Complete your first workout',                   'GLOBAL_WORKOUTS',  1,      null,       null   ],
    ['10 Workouts',         'Complete 10 workouts',                          'GLOBAL_WORKOUTS',  10,     null,       null   ],
    ['25 Workouts',         'Complete 25 workouts',                          'GLOBAL_WORKOUTS',  25,     null,       null   ],
    ['50 Workouts',         'Complete 50 workouts',                          'GLOBAL_WORKOUTS',  50,     null,       null   ],
    ['100 Workouts',        'Complete 100 workouts',                         'GLOBAL_WORKOUTS',  100,    null,       null   ],
    ['100 Sets',            'Complete 100 sets across all workouts',         'GLOBAL_SETS',      100,    null,       null   ],
    ['500 Sets',            'Complete 500 sets across all workouts',         'GLOBAL_SETS',      500,    null,       null   ],
    ['1,000 Sets',          'Complete 1,000 sets across all workouts',       'GLOBAL_SETS',      1000,   null,       null   ],
    ['2,000 Sets',          'Complete 2,000 sets across all workouts',       'GLOBAL_SETS',      2000,   null,       null   ],
    ['10 Hours Trained',    'Train for a total of 10 hours',                 'GLOBAL_TIME',      36000,  null,       null   ],
    ['50 Hours Trained',    'Train for a total of 50 hours',                 'GLOBAL_TIME',      180000, null,       null   ],
    ['100 Hours Trained',   'Train for a total of 100 hours',                'GLOBAL_TIME',      360000, null,       null   ],
    ['200 Hours Trained',   'Train for a total of 200 hours',                'GLOBAL_TIME',      720000, null,       null   ],
    ['1,000 kg Lifted',     'Lift a total of 1,000 kg',                      'GLOBAL_WEIGHT',    1000,   null,       null   ],
    ['10,000 kg Lifted',    'Lift a total of 10,000 kg',                     'GLOBAL_WEIGHT',    10000,  null,       null   ],
    ['50,000 kg Lifted',    'Lift a total of 50,000 kg',                     'GLOBAL_WEIGHT',    50000,  null,       null   ],
    ['100,000 kg Lifted',   'Lift a total of 100,000 kg',                    'GLOBAL_WEIGHT',    100000, null,       null   ],
    ['10 Exercises Tried',  'Perform 10 different exercises',                'GLOBAL_EXERCISES', 10,     null,       null   ],
    ['20 Exercises Tried',  'Perform 20 different exercises',                'GLOBAL_EXERCISES', 20,     null,       null   ],
    ['30 Exercises Tried',  'Perform 30 different exercises',                'GLOBAL_EXERCISES', 30,     null,       null   ],
  ];

  // Thresholds are tuned to the seeded progression: most unlock part-way through
  // the 12-week block (so per-exercise badges show), while a couple stay
  // aspirational ("in progress") for realism. See WEIGHT_PROG for the curves.
  if (exIds && exIds.length > 0) {
    definitions.push(
      ['70 kg Bench Press',   'Bench press 70 kg with Barbell',               'EXERCISE_PERSONAL_RECORD', 70,    exIds[0],  'WEIGHT'],
      ['90 kg Squat',         'Squat 90 kg with Barbell',                     'EXERCISE_PERSONAL_RECORD', 90,    exIds[1],  'WEIGHT'],
      ['120 kg Deadlift',     'Deadlift 120 kg with Barbell',                 'EXERCISE_PERSONAL_RECORD', 120,   exIds[2],  'WEIGHT'],
      ['45 kg Overhead Press','Overhead Press 45 kg with Barbell',            'EXERCISE_PERSONAL_RECORD', 45,    exIds[3],  'WEIGHT'],
      ['65 kg Bent Over Row', 'Bent Over Row 65 kg with Barbell',             'EXERCISE_PERSONAL_RECORD', 65,    exIds[4],  'WEIGHT'],
      ['55 kg Lat Pulldown',  'Lat Pulldown 55 kg on Cable',                  'EXERCISE_PERSONAL_RECORD', 55,    exIds[22], 'WEIGHT'],
      ['90 kg Leg Press',     'Leg Press 90 kg on Machine',                   'EXERCISE_PERSONAL_RECORD', 90,    exIds[27], 'WEIGHT'],
      ['32.5 kg Bicep Curl',  'Bicep Curl 32.5 kg with Barbell',              'EXERCISE_PERSONAL_RECORD', 32.5,  exIds[7],  'WEIGHT'],
      ['20 Pull Ups',         'Complete 20 pull ups in a single set',         'EXERCISE_PERSONAL_RECORD', 20,    exIds[36], 'REPS' ],
    );
  }

  for (const [name, desc, type, thr, exId, metric] of definitions) {
    const existing = await client.query(`SELECT id FROM achievements WHERE name=$1 LIMIT 1`, [name]);
    if (existing.rows.length) {
      achMap[name] = existing.rows[0].id;
    } else {
      achMap[name] = await insertRow(client, 'achievements', {
        name, description: desc, type, threshold: thr,
        exercise_id: exId,
        tracking_metric_id: metric ? trackingMetrics[metric] : null,
      });
    }
  }

  // NOTE: user_exercise_records and user_achievements are intentionally NOT
  // inserted here. They are computed from the real seeded sets by the Nest
  // recalc step (apps/api/seed/recalc-achievements.ts), which replays the exact
  // production AchievementService logic (PRs, is_pr flags, unlocks).
  console.log('  → Achievement catalog ready (records/unlocks computed by recalc step)');
}

async function syncSequences(client) {
  const tables = ['users', 'exercises', 'foods', 'workouts', 'workout_templates', 'meal_plans', 'achievements', 'body_metrics'];
  for (const table of tables) {
    try {
      await client.query(`SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), COALESCE((SELECT MAX(id) FROM "${table}"), 1))`);
    } catch (e) {
      // Ignore errors for tables that might not have standard sequences
    }
  }
  console.log('  → Sequences synchronized');
}

// ─── ETL / recalc orchestration ──────────────────────────────────────────────

/** Run a child Node script, inheriting stdio; throw if it exits non-zero. */
function runScript(scriptPath, args, label) {
  console.log(`\n[seed] running ${label}: node ${path.relative(__dirname, scriptPath)} ${args.join(' ')}`);
  const res = spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: __dirname,
    stdio: 'inherit',
    env: process.env,
  });
  if (res.status !== 0) {
    throw new Error(`${label} failed (exit ${res.status})`);
  }
}

/**
 * Recompute achievements/PRs through the real AchievementService so the seeded
 * data matches production exactly. Runs via ts-node (same toolchain as the
 * TypeORM migration scripts). Spawned AFTER commit so it sees committed rows.
 */
function runAchievementRecalc() {
  // Invoke ts-node's JS entry through node directly — cross-platform and avoids
  // the Windows .cmd/shell quoting issues of the .bin shim.
  const tsNodeBin = require.resolve('ts-node/dist/bin.js');
  const recalcScript = path.join(__dirname, 'seed', 'recalc-achievements.ts');
  console.log('\n[seed] recomputing achievements via Nest AchievementService…');
  const res = spawnSync(
    process.execPath,
    [tsNodeBin, '--transpile-only', recalcScript],
    { cwd: __dirname, stdio: 'inherit', env: process.env },
  );
  if (res.status !== 0) {
    throw new Error(`achievement recalc failed (exit ${res.status})`);
  }
}

// ─── Entry point ─────────────────────────────────────────────────────────────

async function seed() {
  const withEtl = process.argv.includes('--with-etl');
  // Test-data flag: by default only system/reference tables are filled; adding
  // this flag also creates demo users and their workout/nutrition logging.
  const withSimulation =
    process.argv.includes('--with-simulation') ||
    process.argv.includes('--simulate') ||
    process.argv.includes('--demo');

  console.log(
    `[seed] mode: ${withSimulation ? 'system + simulation (test data)' : 'system tables only'}` +
      `${withEtl ? ' | ETL: on' : ''}`,
  );

  // Optionally (re)load the system catalogs (exercises/muscles/equipment +
  // Spoonacular foods/dishes) before seeding. Runs as a child process so the ETL
  // manages its own pool/transaction lifecycle.
  if (withEtl) {
    const etlArgs = ['--all'];
    if (process.argv.includes('--from-dump')) {
      etlArgs.push('--from-dump');
    }
    runScript(path.join(__dirname, 'etl', 'index.js'), etlArgs, 'ETL');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── System / reference data (always) ──────────────────────────────────
    console.log('\nPhase 1: Lookup tables');
    const ids = await seedLookups(client);

    console.log('\nPhase 2: System exercises');
    const exIds = await seedExercises(client, ids);

    console.log('\nPhase 3: System foods & global meal plans');
    const nutritionCtx = await seedSystemNutrition(client, ids);

    console.log('\nPhase 4: Achievement catalog');
    await seedAchievements(client, ids, exIds);

    console.log('\nPhase 5: Global workout templates');
    await seedPublicTemplates(client, ids, exIds);

    // ── Test data / usage simulation (flagged) ────────────────────────────
    if (withSimulation) {
      console.log('\nPhase 6: Demo users & friends');
      await seedUsersAndFriends(client, ids);
      await seedUserExercises(client, ids);

      console.log('\nPhase 7: Body metrics');
      await seedBodyMetrics(client, ids);

      console.log('\nPhase 8: Workout logs');
      await seedWorkouts(client, ids, exIds);

      console.log('\nPhase 9: User templates');
      await seedTemplates(client, ids, exIds);

      console.log('\nPhase 10: Nutrition logs & user plans');
      await seedUserNutrition(client, ids, nutritionCtx);
    } else {
      console.log('\n[seed] skipping demo users, workout/nutrition logs (no --with-simulation)');
    }

    console.log('\nPhase 11: Synchronizing sequences');
    await syncSequences(client);

    await client.query('COMMIT');
    console.log('\n✓ Base seed committed.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n✗ Seed failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }

  // Achievements/PRs are computed from the simulated workouts by the real
  // service — only relevant when test data was created.
  if (withSimulation) {
    try {
      runAchievementRecalc();
    } catch (err) {
      console.error('\n✗ Achievement recalc failed:', err.message);
      process.exit(1);
    }
  }
  console.log('\n✓ Seed completed successfully!\n');
}

seed();
