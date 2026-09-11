DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'ExperienceLevel'
  ) THEN
    CREATE TYPE "ExperienceLevel" AS ENUM (
      'BEGINNER',
      'ENTRY_LEVEL',
      'MID_LEVEL',
      'SENIOR',
      'EXPERT'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'WorkPreference'
  ) THEN
    CREATE TYPE "WorkPreference" AS ENUM (
      'REMOTE',
      'HYBRID',
      'ONSITE',
      'FLEXIBLE'
    );
  END IF;
END $$;

ALTER TABLE "Profile"
ADD COLUMN IF NOT EXISTS "expectedSalary" TEXT,
ADD COLUMN IF NOT EXISTS "experienceLevel" "ExperienceLevel",
ADD COLUMN IF NOT EXISTS "hourlyRate" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "isAvailableForWork" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "portfolioUrl" TEXT,
ADD COLUMN IF NOT EXISTS "professionalBio" TEXT,
ADD COLUMN IF NOT EXISTS "professionalHeadline" TEXT,
ADD COLUMN IF NOT EXISTS "professionalTitle" TEXT,
ADD COLUMN IF NOT EXISTS "resumeUrl" TEXT,
ADD COLUMN IF NOT EXISTS "workPreference" "WorkPreference";