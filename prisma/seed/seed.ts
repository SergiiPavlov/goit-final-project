import { PrismaClient } from '@prisma/client';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type EmotionJson = { _id: { $oid: string }; title: string };

type MomStateJson = {
  _id: { $oid: string };
  weekNumber: number;
  feelings: {
    states: string[];
    sensationDescr: string;
  };
  comfortTips: Array<{ category: string; tip: string }>;
};

type BabyStateJson = {
  _id: { $oid: string };
  weekNumber: number;
  analogy: string | null;
  babySize: number;
  babyWeight: number;
  image: string;
  babyActivity: string;
  babyDevelopment: string;
  interestingFact: string;
  momDailyTips: string[];
};

const prisma = new PrismaClient();

function getDataPath(rel: string) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  return path.join(__dirname, 'data', rel);
}

async function readJson<T>(rel: string): Promise<T> {
  const raw = await readFile(getDataPath(rel), 'utf-8');
  return JSON.parse(raw) as T;
}

async function seedEmotions() {
  const emotions = await readJson<EmotionJson[]>('emotions.json');
  let upserted = 0;

  for (const e of emotions) {
    const id = e?._id?.$oid;
    const title = (e?.title ?? '').trim();
    if (!id || !title) continue;

    await prisma.emotion.upsert({
      where: { id },
      create: { id, title },
      update: { title },
    });
    upserted++;
  }

  return { total: emotions.length, upserted };
}

async function seedMomStates() {
  const momStates = await readJson<MomStateJson[]>('mom_states.json');
  let upserted = 0;

  for (const w of momStates) {
    const weekNumber = Number(w.weekNumber);
    if (!Number.isFinite(weekNumber) || weekNumber < 1 || weekNumber > 42) continue;

    const feelingsStates = (w?.feelings?.states ?? []).map((s) => String(s).trim()).filter(Boolean);
    const sensationDescr = String(w?.feelings?.sensationDescr ?? '').trim();
    const comfortTips = Array.isArray(w?.comfortTips) ? w.comfortTips : [];

    await prisma.weekMomState.upsert({
      where: { weekNumber },
      create: {
        weekNumber,
        feelingsStates,
        sensationDescr,
        comfortTips,
      },
      update: {
        feelingsStates,
        sensationDescr,
        comfortTips,
      },
    });
    upserted++;
  }

  return { total: momStates.length, upserted };
}

async function seedBabyStates() {
  const babyStates = await readJson<BabyStateJson[]>('baby_states.json');
  let upserted = 0;

  for (const w of babyStates) {
    const weekNumber = Number(w.weekNumber);
    if (!Number.isFinite(weekNumber) || weekNumber < 1 || weekNumber > 42) continue;

    const momDailyTips = (w?.momDailyTips ?? []).map((t) => String(t).trim()).filter(Boolean);

    await prisma.weekBabyState.upsert({
      where: { weekNumber },
      create: {
        weekNumber,
        analogy: w.analogy ?? null,
        babySize: Number(w.babySize) || 0,
        babyWeight: Number(w.babyWeight) || 0,
        image: String(w.image ?? '').trim(),
        babyActivity: String(w.babyActivity ?? '').trim(),
        babyDevelopment: String(w.babyDevelopment ?? '').trim(),
        interestingFact: String(w.interestingFact ?? '').trim(),
        momDailyTips,
      },
      update: {
        analogy: w.analogy ?? null,
        babySize: Number(w.babySize) || 0,
        babyWeight: Number(w.babyWeight) || 0,
        image: String(w.image ?? '').trim(),
        babyActivity: String(w.babyActivity ?? '').trim(),
        babyDevelopment: String(w.babyDevelopment ?? '').trim(),
        interestingFact: String(w.interestingFact ?? '').trim(),
        momDailyTips,
      },
    });
    upserted++;
  }

  return { total: babyStates.length, upserted };
}

async function main() {
  const [e, m, b] = await Promise.all([seedEmotions(), seedMomStates(), seedBabyStates()]);
  console.log('[seed] emotions:', e);
  console.log('[seed] mom states:', m);
  console.log('[seed] baby states:', b);
}

main()
  .catch((err) => {
    console.error('[seed] failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
