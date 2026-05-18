require('dotenv').config();
const { Pool } = require('pg');

const USER_ID = 1;
const FRIEND_ID = 2;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

function daysAgo(n, hour = 9) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d;
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

async function seedUsersAndFriends(client) {
  const pwdHash = '$2b$10$oTPuRIChn9z3KsC63c/0a.tIC3OsCgYVAG9Hgrn712fecnLbnfwmW'; // 'password'
  
  // Ensure FRIEND_ID exists
  const fCheck = await client.query(`SELECT id FROM users WHERE id=$1`, [FRIEND_ID]);
  if (!fCheck.rows.length) {
    await insertRow(client, 'users', {
      id: FRIEND_ID,
      email: 'friend@example.com',
      full_name: 'John Friend',
      nickname: 'johnny_f',
      password_hash: pwdHash,
    });
  }

  // Ensure friendship exists
  const frCheck = await client.query(
    `SELECT id FROM user_friends WHERE (user_id=$1 AND friend_id=$2) OR (user_id=$2 AND friend_id=$1)`,
    [USER_ID, FRIEND_ID]
  );
  if (!frCheck.rows.length) {
    await insertRow(client, 'user_friends', { user_id: USER_ID, friend_id: FRIEND_ID, status: 'ACCEPTED' });
  }
  console.log('  → Users and friendship ready');
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
  // 11–18  WEIGHT_AND_REPS — Dumbbell
  { name: 'Shoulder Press (Dumbbell)',      tt: 'WEIGHT_AND_REPS', eq: 'Dumbbell',      pm: 'Shoulders',  sm: [] },
  { name: 'Bench Press (Dumbbell)',         tt: 'WEIGHT_AND_REPS', eq: 'Dumbbell',      pm: 'Chest',      sm: ['Triceps', 'Shoulders'] },
  { name: 'Arnold Press (Dumbbell)',        tt: 'WEIGHT_AND_REPS', eq: 'Dumbbell',      pm: 'Shoulders',  sm: [] },
  { name: 'Bent Over Row (Dumbbell)',       tt: 'WEIGHT_AND_REPS', eq: 'Dumbbell',      pm: 'Upper Back', sm: [] },
  { name: 'Romanian Deadlift (Dumbbell)',   tt: 'WEIGHT_AND_REPS', eq: 'Dumbbell',      pm: 'Hamstrings', sm: ['Glutes'] },
  { name: 'Lateral Raise (Dumbbell)',       tt: 'WEIGHT_AND_REPS', eq: 'Dumbbell',      pm: 'Shoulders',  sm: [] },
  { name: 'Chest Fly (Dumbbell)',           tt: 'WEIGHT_AND_REPS', eq: 'Dumbbell',      pm: 'Chest',      sm: [] },
  { name: 'Overhead Dumbbell Lunge',        tt: 'WEIGHT_AND_REPS', eq: 'Dumbbell',      pm: 'Quadriceps', sm: [] },
  // 19–30  WEIGHT_AND_REPS — Machine / Cable
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
  // 31–41  REPS_ONLY
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
  // 42–49  TIME_BASED
  { name: 'Plank',                          tt: 'TIME_BASED',    eq: null,            pm: 'Abdominals', sm: [] },
  { name: 'Running',                        tt: 'TIME_BASED',    eq: null,            pm: 'Cardio',     sm: [] },
  { name: 'Jump Rope',                      tt: 'TIME_BASED',    eq: 'Other',         pm: 'Cardio',     sm: [] },
  { name: 'Air Bike',                       tt: 'TIME_BASED',    eq: 'Machine',       pm: 'Cardio',     sm: [] },
  { name: 'Aerobics',                       tt: 'TIME_BASED',    eq: null,            pm: 'Cardio',     sm: [] },
  { name: 'Reverse Plank',                  tt: 'TIME_BASED',    eq: null,            pm: 'Abdominals', sm: [] },
  { name: 'Ab Scissors',                    tt: 'TIME_BASED',    eq: null,            pm: 'Abdominals', sm: [] },
  { name: 'Lateral Raise (Band)',           tt: 'WEIGHT_AND_REPS', eq: 'Resistance Band', pm: 'Shoulders', sm: [] },
];

// Exercise indices per workout type
const PUSH = [0, 5, 3, 16, 22, 32];   // Bench, Incline, OHP, Lateral DB, Tricep Pushdown, Push Up
const PULL = [2, 4, 19, 20, 7, 31];   // Deadlift, BOR, Lat Pulldown, Cable Row, Bicep Curl, Pull Up
const LEGS = [1, 6, 24, 25, 10, 27];  // Squat, RDL, Leg Press, Leg Curl, Hip Thrust BB, Calf Raise

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
  19: { base: 50,  prog: 10   }, // Lat Pulldown
  20: { base: 50,  prog: 10   }, // Cable Row
  22: { base: 30,  prog: 7.5  }, // Tricep Pushdown
  24: { base: 80,  prog: 20   }, // Leg Press
  25: { base: 40,  prog: 10   }, // Leg Curl
  27: { base: 40,  prog: 10   }, // Calf Raise
};

function getWeight(exIdx, wi, total) {
  const wp = WEIGHT_PROG[exIdx];
  if (!wp) return 0;
  return Math.round((wp.base + wp.prog * wi / (total - 1)) / 2.5) * 2.5;
}

const WORKOUT_SCHEDULE = [84, 81, 77, 74, 70, 67, 63, 60, 56, 53, 49, 46, 42, 39, 35, 32, 28, 25, 21, 18, 14, 10, 5, 1];
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
  { name: 'Milk (2%)',         brand: null,      calories: 50,  proteins: 3.4, fats: 2,   carbs: 5   },
  { name: 'Cheddar Cheese',    brand: null,      calories: 402, proteins: 25,  fats: 33,  carbs: 1.3 },
  { name: 'Apple',             brand: null,      calories: 52,  proteins: 0.3, fats: 0.2, carbs: 14  },
  { name: 'Tuna (canned)',     brand: null,      calories: 116, proteins: 26,  fats: 1,   carbs: 0   },
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
];

// ─── Seed functions ──────────────────────────────────────────────────────────

async function seedLookups(client) {
  const vt = {}, tt = {}, units = {}, mealTypes = {}, muscles = {}, equip = {}, metricTypes = {};

  for (const name of ['PRIVATE', 'PUBLIC', 'FRIENDS_ONLY'])
    vt[name] = await nameId(client, 'visibility_type', name);

  for (const name of ['WEIGHT_AND_REPS', 'REPS_ONLY', 'TIME_BASED'])
    tt[name] = await nameId(client, 'tracking_types', name);

  for (const name of ['g', 'ml', 'pcs', 'cup', 'kg', 'cm'])
    units[name] = await nameId(client, 'units', name);

  for (const name of ['Breakfast', 'Lunch', 'Dinner', 'Snack'])
    mealTypes[name] = await nameId(client, 'meal_types', name);

  for (const name of ['Abdominals','Abductors','Adductors','Biceps','Calves','Cardio','Chest',
                       'Forearms','Full Body','Glutes','Hamstrings','Lats','Lower Back','Neck',
                       'Other','Quadriceps','Shoulders','Traps','Triceps','Upper Back'])
    muscles[name] = await nameId(client, 'muscles', name);

  for (const name of ['Barbell','Dumbbell','Kettlebell','Machine','Plate','Resistance Band','Suspension','Other']) {
    const s = await client.query(`SELECT id FROM equipments WHERE name=$1 AND user_id IS NULL LIMIT 1`, [name]);
    if (s.rows.length) { equip[name] = s.rows[0].id; continue; }
    const i = await client.query(`INSERT INTO equipments (name) VALUES ($1) RETURNING id`, [name]);
    equip[name] = i.rows[0].id;
  }

  for (const { name, unit } of [
    { name: 'Body Weight', unit: 'kg' },
    { name: 'Body Fat %',  unit: null },
    { name: 'Waist',       unit: 'cm' },
    { name: 'Chest',       unit: 'cm' },
    { name: 'Hips',        unit: 'cm' },
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
  return { vt, tt, units, mealTypes, muscles, equip, metricTypes };
}

async function seedExercises(client, { vt, tt, equip, muscles }) {
  const exIds = [];
  for (const ex of EXERCISES) {
    const s = await client.query(`SELECT id FROM exercises WHERE name=$1 AND user_id IS NULL LIMIT 1`, [ex.name]);
    if (s.rows.length) { exIds.push(s.rows[0].id); continue; }

    const exId = await insertRow(client, 'exercises', {
      name: ex.name,
      tracking_type_id: tt[ex.tt],
      equipment_id: ex.eq ? equip[ex.eq] : null,
      user_id: null,
      visibility_type_id: vt['PUBLIC'],
    });

    await client.query(
      `INSERT INTO exercise_muscles (exercise_id, muscle_id, is_primary, impact_percentage)
       VALUES ($1, $2, true, 100) ON CONFLICT (exercise_id, muscle_id) DO NOTHING`,
      [exId, muscles[ex.pm]]
    );
    for (const sm of ex.sm) {
      if (!muscles[sm]) continue;
      await client.query(
        `INSERT INTO exercise_muscles (exercise_id, muscle_id, is_primary, impact_percentage)
         VALUES ($1, $2, false, $3) ON CONFLICT (exercise_id, muscle_id) DO NOTHING`,
        [exId, muscles[sm], Math.floor(60 / ex.sm.length)]
      );
    }
    exIds.push(exId);
  }
  console.log(`  → ${exIds.length} exercises ready`);
  return exIds;
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
  const existing = await client.query(
    `SELECT COUNT(*) FROM workouts WHERE user_id=$1 AND status='COMPLETED'`, [USER_ID]
  );
  if (parseInt(existing.rows[0].count) >= 20) { console.log('  → workouts already seeded'); return; }

  const typeMap = { push: PUSH, pull: PULL, legs: LEGS };
  const wNames  = { push: 'Push Day', pull: 'Pull Day', legs: 'Leg Day' };
  const total = WORKOUT_SCHEDULE.length;
  let wCount = 0, leCount = 0, lsCount = 0;

  for (let wi = 0; wi < total; wi++) {
    const da     = WORKOUT_SCHEDULE[wi];
    const wType  = WORKOUT_TYPES[wi];
    const exList = typeMap[wType];
    const startedAt = daysAgo(da, 9 + (wi % 4));
    const endedAt   = new Date(startedAt.getTime() + (50 + (wi % 6) * 5) * 60000);

    const wId = await insertRow(client, 'workouts', {
      user_id:           USER_ID,
      visibility_type_id: vt['PRIVATE'],
      name:              wNames[wType],
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
      leCount++;

      const numSets = order < 2 ? 4 : 3;
      for (let s = 1; s <= numSets; s++) {
        const setData = { log_exercise_id: leId, order: s, is_completed: true };
        if (ex.tt === 'WEIGHT_AND_REPS') {
          setData.weight = getWeight(exIdx, wi, total);
          setData.reps   = 8 + (s === 1 ? 2 : 0);
        } else if (ex.tt === 'REPS_ONLY') {
          setData.reps   = 8 + wi + s;
          setData.weight = 0;
        } else {
          setData.duration = 60 + wi * 3;
        }
        await insertRow(client, 'log_sets', setData);
        lsCount++;
      }
    }
  }
  console.log(`  → ${wCount} workouts, ${leCount} log_exercises, ${lsCount} log_sets`);
}

async function seedTemplates(client, { vt }, exIds) {
  const tplConfigs = [
    { creatorId: USER_ID,   vis: vt['PRIVATE'],      name: 'Push Day', desc: 'Chest, shoulders, triceps',  exList: PUSH },
    { creatorId: USER_ID,   vis: vt['PRIVATE'],      name: 'Pull Day', desc: 'Back and biceps',            exList: PULL },
    { creatorId: USER_ID,   vis: vt['PRIVATE'],      name: 'Leg Day',  desc: 'Quads, hamstrings, glutes',  exList: LEGS },
    { creatorId: FRIEND_ID, vis: vt['FRIENDS_ONLY'], name: 'Home Full Body', desc: 'Friend\'s home routine', exList: [32, 35, 36, 41, 42] },
    { creatorId: FRIEND_ID, vis: vt['FRIENDS_ONLY'], name: 'Dumbbell Only',  desc: 'Hypertrophy with DBs', exList: [12, 11, 14, 15, 16] },
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
        else if (ex.tt === 'REPS_ONLY')     { setData.weight = 0; setData.reps = 10; }
        else                                { setData.duration = 60; }
        await insertRow(client, 'template_sets', setData);
      }
    }
  }
  console.log('  → User and Friend templates ready');
}

async function seedPublicTemplates(client, { vt }, exIds) {
  for (const tpl of [
    { name: 'Full Body (Beginner)', desc: 'Fundamental movements for total body development', exList: [1, 0, 4, 11, 25, 32, 42] },
    { name: 'Upper Body Power', desc: 'Heavy compound lifts for upper body strength', exList: [0, 4, 3, 31, 7] },
    { name: 'Lower Body Strength', desc: 'Leg focused strength routine', exList: [1, 2, 24, 27, 43] },
  ]) {
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
        else if (ex.tt === 'REPS_ONLY')     { setData.weight = 0; setData.reps = 10; }
        else                                { setData.duration = 60; }
        await insertRow(client, 'template_sets', setData);
      }
    }
  }
  console.log('  → 3 public templates ready');
}

async function seedNutrition(client, { mealTypes, units, vt }) {
  const gId = units['g'];

  // Foods
  const foodIds = {};
  for (const f of FOODS) {
    const s = await client.query(`SELECT id FROM foods WHERE name=$1 LIMIT 1`, [f.name]);
    if (s.rows.length) { foodIds[f.name] = s.rows[0].id; continue; }
    foodIds[f.name] = await insertRow(client, 'foods', {
      name: f.name, brand: f.brand,
      calories: f.calories, proteins: f.proteins, fats: f.fats, carbs: f.carbs,
    });
  }
  console.log(`  → ${Object.keys(foodIds).length} foods ready`);

  // Meal log — 14 days
  const existingLogs = await client.query(`SELECT COUNT(*) FROM log_meals WHERE user_id=$1`, [USER_ID]);
  if (parseInt(existingLogs.rows[0].count) >= 40) {
    console.log('  → meal logs already seeded');
  } else {
    const DINNER_VARIANTS = [
      [['Beef Steak', 200], ['Sweet Potato', 200], ['Broccoli', 100]],
      [['Salmon', 200],     ['Potato', 200],        ['Broccoli', 100]],
      [['Chicken Breast', 200], ['Pasta', 150],     ['Broccoli', 100]],
      [['Tuna (canned)', 150],  ['White Rice', 150],['Avocado', 80]],
    ];
    const MEAL_PLAN = [
      { type: 'Breakfast', items: [['Oats', 80], ['Banana', 120], ['Milk (2%)', 200], ['Greek Yogurt', 150]] },
      { type: 'Lunch',     items: [['Chicken Breast', 200], ['White Rice', 150], ['Broccoli', 100], ['Olive Oil', 15]] },
      { type: 'Dinner',    items: null },
      { type: 'Snack',     items: [['Greek Yogurt', 150], ['Almonds', 30], ['Whey Protein', 30]] },
    ];

    let mlCount = 0, mliCount = 0;
    for (let d = 13; d >= 0; d--) {
      const logDate = daysAgo(d, 0).toISOString().split('T')[0];
      for (let mi = 0; mi < MEAL_PLAN.length; mi++) {
        const m = MEAL_PLAN[mi];
        const items = m.type === 'Dinner' ? DINNER_VARIANTS[d % 4] : m.items;
        const mealId = await insertRow(client, 'log_meals', {
          user_id: USER_ID, meal_type_id: mealTypes[m.type],
          consumed_at: daysAgo(d, 7 + mi * 4), day_log_date: logDate,
        });
        mlCount++;
        for (const [fname, amount] of items) {
          if (!foodIds[fname]) continue;
          await insertRow(client, 'log_meal_items', {
            log_meal_id: mealId, food_id: foodIds[fname],
            unit_id: gId, amount, calculated_weight_g: amount,
          });
          mliCount++;
        }
      }
    }
    console.log(`  → ${mlCount} meal logs, ${mliCount} items (14 days)`);
  }

  // Water logs — 14 days
  const existingWater = await client.query(`SELECT COUNT(*) FROM water_logs WHERE user_id=$1`, [USER_ID]);
  if (parseInt(existingWater.rows[0].count) >= 40) {
    console.log('  → water logs already seeded');
  } else {
    const WATER = [[300,8],[500,12],[400,15],[300,18],[500,21]];
    let wCount = 0;
    for (let d = 13; d >= 0; d--) {
      for (let w = 0; w < 3 + (d % 3); w++) {
        const [ml, hour] = WATER[w];
        await client.query(
          `INSERT INTO water_logs (user_id, amount_ml, consumed_at) VALUES ($1, $2, $3)`,
          [USER_ID, ml, daysAgo(d, hour)]
        );
        wCount++;
      }
    }
    console.log(`  → ${wCount} water log entries`);
  }

  // Meal plan
  const mealPlanConfigs = [
    { name: 'Clean Bulk Plan', desc: '7-day high-protein bulk plan', creator: USER_ID, vis: vt['PRIVATE'], assignTo: USER_ID },
    { name: 'Friend Fat Loss Plan', desc: 'Low carb plan', creator: FRIEND_ID, vis: vt['FRIENDS_ONLY'], assignTo: FRIEND_ID },
    { name: 'Public Keto Guide', desc: 'A standard keto approach', creator: null, vis: vt['PUBLIC'], assignTo: null },
    { name: 'Balanced Maintenance', desc: 'Stable calorie maintenance plan', creator: null, vis: vt['PUBLIC'], assignTo: null },
  ];

  for (const plan of mealPlanConfigs) {
    const planEx = plan.creator 
      ? await client.query(`SELECT id FROM meal_plans WHERE creator_id=$1 AND name=$2 LIMIT 1`, [plan.creator, plan.name])
      : await client.query(`SELECT id FROM meal_plans WHERE creator_id IS NULL AND name=$1 LIMIT 1`, [plan.name]);
      
    if (planEx.rows.length) continue; // Skip if already seeded

    const DINNER_VAR = [
      [['Beef Steak', 200], ['Sweet Potato', 200], ['Broccoli', 100]],
      [['Salmon', 200],     ['Potato', 200],        ['Broccoli', 100]],
      [['Chicken Breast', 200], ['Pasta', 150],     ['Broccoli', 100]],
      [['Tuna (canned)', 150],  ['White Rice', 150],['Avocado', 80]],
    ];
    const PLAN_MEALS = [
      { type: 'Breakfast', items: [['Oats', 80], ['Banana', 120], ['Milk (2%)', 200], ['Greek Yogurt', 150]] },
      { type: 'Lunch',     items: [['Chicken Breast', 200], ['White Rice', 150], ['Broccoli', 100], ['Olive Oil', 15]] },
      { type: 'Dinner',    items: null },
      { type: 'Snack',     items: [['Whey Protein', 30], ['Almonds', 30], ['Apple', 150]] },
    ];

    const planId = await insertRow(client, 'meal_plans', {
      creator_id: plan.creator, visibility_type_id: plan.vis,
      name: plan.name, description: plan.desc, total_days: 7,
    });

    for (let day = 1; day <= 7; day++) {
      const dayId = await insertRow(client, 'plan_days', { meal_plan_id: planId, day_number: day });
      for (let mi = 0; mi < PLAN_MEALS.length; mi++) {
        const m = PLAN_MEALS[mi];
        const items = m.type === 'Dinner' ? DINNER_VAR[day % 4] : m.items;
        const pmId = await insertRow(client, 'plan_meals', {
          plan_day_id: dayId, meal_type_id: mealTypes[m.type], order: mi + 1,
        });
        for (const [fname, amount] of items) {
          if (!foodIds[fname]) continue;
          await insertRow(client, 'plan_meal_items', {
            plan_meal_id: pmId, food_id: foodIds[fname], unit_id: gId, amount,
          });
        }
      }
    }

    if (plan.assignTo) {
      const umpEx = await client.query(
        `SELECT id FROM user_meal_plans WHERE user_id=$1 LIMIT 1`, [plan.assignTo]
      );
      if (!umpEx.rows.length) {
        await insertRow(client, 'user_meal_plans', {
          user_id: plan.assignTo, meal_plan_id: planId, is_active: true,
          started_at: new Date().toISOString().split('T')[0],
        });
      }
    }
  }
  console.log('  → Meal plans ready (User 1, Friend, Public)');
}

async function seedAchievements(client, exIds) {
  // Ensure achievement definitions exist (migration may or may not have run)
  const achRows = await client.query(`SELECT id, name FROM achievements ORDER BY "order"`);
  const achMap = {};
  if (achRows.rows.length === 0) {
    const definitions = [
      ['First Workout',    'Complete your first workout',             'GLOBAL_WORKOUTS', 1,     1, null, null],
      ['10 Workouts',      'Complete 10 workouts',                    'GLOBAL_WORKOUTS', 10,    2, null, null],
      ['25 Workouts',      'Complete 25 workouts',                    'GLOBAL_WORKOUTS', 25,    3, null, null],
      ['100 Sets',         'Complete 100 sets across all workouts',   'GLOBAL_SETS',     100,   8, null, null],
      ['500 Sets',         'Complete 500 sets across all workouts',   'GLOBAL_SETS',     500,   9, null, null],
      ['1,000 kg Lifted',  'Lift a total of 1,000 kg',               'GLOBAL_WEIGHT',   1000,  12, null, null],
      ['10,000 kg Lifted', 'Lift a total of 10,000 kg',              'GLOBAL_WEIGHT',   10000, 13, null, null],
      ['100 Hours',        'Train for a total of 100 hours',         'GLOBAL_TIME',     360000, 14, null, null],
    ];

    // Add exercise specific achievements if exIds are available
    if (exIds && exIds.length > 0) {
      definitions.push(['100kg Bench Press', 'Lift 100kg in Bench Press (Barbell)', 'EXERCISE_PERSONAL_RECORD', 100, 20, exIds[0], 'WEIGHT']);
      definitions.push(['140kg Squat', 'Squat 140kg (Barbell)', 'EXERCISE_PERSONAL_RECORD', 140, 21, exIds[1], 'WEIGHT']);
      definitions.push(['180kg Deadlift', 'Deadlift 180kg (Barbell)', 'EXERCISE_PERSONAL_RECORD', 180, 22, exIds[2], 'WEIGHT']);
    }

    for (const [name, desc, type, thr, ord, exId, metric] of definitions) {
      achMap[name] = await insertRow(client, 'achievements', { 
        name, description: desc, type, threshold: thr, order: ord, 
        exercise_id: exId, tracking_metric: metric 
      });
    }
  } else {
    for (const r of achRows.rows) achMap[r.name] = r.id;
  }

  // Unlock achievements
  let unlocked = 0;
  for (const [name, value] of [
    ['First Workout',    1],
    ['10 Workouts',      10],
    ['100 Sets',         100],
    ['1,000 kg Lifted',  1000],
    ['10,000 kg Lifted', 10000],
  ]) {
    const achId = achMap[name];
    if (!achId) continue;
    const ex = await client.query(
      `SELECT id FROM user_achievements WHERE user_id=$1 AND achievement_id=$2`, [USER_ID, achId]
    );
    if (ex.rows.length) continue;
    await insertRow(client, 'user_achievements', {
      user_id: USER_ID, achievement_id: achId,
      unlocked_at: daysAgo(5, 12), value,
    });
    unlocked++;
  }
  console.log(`  → ${unlocked} achievements unlocked`);

  // Personal records for key exercises
  let recCount = 0;
  const records = [
    // [exIdx, metric, value]
    [0, 'WEIGHT', 72.5],
    [0, '1RM', 81.4],
    [1, 'WEIGHT', 95],
    [1, '1RM', 106.7],
    [2, 'WEIGHT', 97.5],
    [2, '1RM', 104.2],
    [3, 'WEIGHT', 47.5],
    [4, 'WEIGHT', 70],
    [7, 'WEIGHT', 35],
    [19, 'WEIGHT', 60],
    [24, 'WEIGHT', 100],
    [42, 'DURATION', 180],
  ];

  for (const [idx, metric, value] of records) {
    const exId = exIds[idx];
    const ex = await client.query(
      `SELECT id FROM user_exercise_records WHERE user_id=$1 AND exercise_id=$2 AND metric_type=$3`, [USER_ID, exId, metric]
    );
    // Ignore existing records for this purpose
    await insertRow(client, 'user_exercise_records', {
      user_id: USER_ID,
      exercise_id: exId,
      metric_type: metric,
      value: value,
      created_at: daysAgo(1, 11),
    });
    recCount++;
  }
  console.log(`  → ${recCount} exercise records`);

  // Mark some sets as isPR in the most recent workouts
  const recentWorkouts = await client.query(
    `SELECT id FROM workouts WHERE user_id=$1 ORDER BY started_at DESC LIMIT 3`, [USER_ID]
  );
  for (const row of recentWorkouts.rows) {
    const sets = await client.query(
      `SELECT ls.id, le.exercise_id FROM log_sets ls 
       JOIN log_exercises le ON ls.log_exercise_id = le.id 
       WHERE le.workout_id = $1 LIMIT 2`, [row.id]
    );
    for (const set of sets.rows) {
      await client.query(`UPDATE log_sets SET is_pr = true WHERE id = $1`, [set.id]);
    }
  }
  console.log('  → Marked some sets as PRs in recent workouts');
}

// ─── Entry point ─────────────────────────────────────────────────────────────

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('\nPhase 0: Users & Friends');
    await seedUsersAndFriends(client);

    console.log('\nPhase 1: Lookup tables');
    const ids = await seedLookups(client);

    console.log('\nPhase 2: Exercises');
    const exIds = await seedExercises(client, ids);

    console.log('\nPhase 3: Body metrics');
    await seedBodyMetrics(client, ids);

    console.log('\nPhase 4: Workouts');
    await seedWorkouts(client, ids, exIds);

    console.log('\nPhase 5: Templates');
    await seedTemplates(client, ids, exIds);
    await seedPublicTemplates(client, ids, exIds);

    console.log('\nPhase 6: Nutrition');
    await seedNutrition(client, ids);

    console.log('\nPhase 7: Achievements');
    await seedAchievements(client, exIds);

    await client.query('COMMIT');
    console.log('\n✓ Seed completed successfully!\n');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n✗ Seed failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
