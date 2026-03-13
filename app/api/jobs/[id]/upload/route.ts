import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { Candidate, DegreeLevel } from '@/types'

// Realistic stub data pools for generated candidates
const FIRST_NAMES = ['Ahmed', 'Mohammed', 'Sara', 'Fatima', 'Omar', 'Layla', 'Khalid', 'Rania', 'Yusuf', 'Nadia']
const LAST_NAMES = ['Al-Rashid', 'Hassan', 'Malik', 'Farouq', 'Ibrahim', 'Khalil', 'Nasser', 'Saleh', 'Qureshi', 'Bakr']
const TITLES = ['Site Engineer', 'Project Manager', 'Civil Engineer', 'Structural Engineer', 'Construction Manager']
const COMPANIES = ['ALEC Construction', 'Arabtec', 'Drake & Scull', 'Consolidated Contractors', 'Turner Construction']
const NATIONALITIES = ['UAE', 'Egyptian', 'Indian', 'Pakistani', 'Jordanian', 'Lebanese', 'British', 'Filipino']
const DEGREE_LEVELS: DegreeLevel[] = ['bachelor', 'master', 'diploma']
const DEGREE_FIELDS = ['Civil Engineering', 'Structural Engineering', 'Construction Management', 'Mechanical Engineering']

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateCandidateStub(jobProfileId: string, fileName: string): Candidate {
  const firstName = pickRandom(FIRST_NAMES)
  const lastName = pickRandom(LAST_NAMES)
  const name = `${firstName} ${lastName}`
  const initials = `${firstName[0]}${lastName[0]}`
  const yearsExperience = 2 + Math.floor(Math.random() * 18)

  return {
    id: `cand-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    jobProfileId,
    name,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/[^a-z]/g, '')}@email.com`,
    phone: `+971 5${Math.floor(Math.random() * 9)}${Math.floor(10000000 + Math.random() * 89999999)}`,
    nationality: pickRandom(NATIONALITIES),
    age: 22 + yearsExperience + Math.floor(Math.random() * 5),
    languages: ['English'],
    currentTitle: pickRandom(TITLES),
    currentCompany: pickRandom(COMPANIES),
    yearsExperience,
    degreeLevel: pickRandom(DEGREE_LEVELS),
    degreeField: pickRandom(DEGREE_FIELDS),
    education: [
      {
        institution: 'University of Dubai',
        degree: 'Bachelor of Science',
        field: pickRandom(DEGREE_FIELDS),
        year: new Date().getFullYear() - yearsExperience - 4,
      },
    ],
    experience: [
      {
        company: pickRandom(COMPANIES),
        title: pickRandom(TITLES),
        startDate: `${new Date().getFullYear() - yearsExperience}-01`,
        endDate: null,
        duration: `${yearsExperience} yr`,
      },
    ],
    skills: [],
    certifications: [],
    status: 'uploaded',
    finalScore: 0,
    criterionScores: {},
    aiSummary: '',
    cvFilePath: fileName,
    extractionConfidence: 0,
    createdAt: new Date().toISOString(),
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const job = db.jobs.get(id)
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const formData = await req.formData()
  const files = formData.getAll('files') as File[]

  if (!files.length) {
    return NextResponse.json({ error: 'No files provided' }, { status: 400 })
  }

  const created: Candidate[] = []

  for (const file of files) {
    const stub = generateCandidateStub(id, file.name)
    db.candidates.create(stub)
    created.push(stub)
  }

  // Increment the job's stats.uploaded count
  db.jobs.update(id, {
    stats: {
      ...job.stats,
      uploaded: job.stats.uploaded + files.length,
    },
  })

  return NextResponse.json(created, { status: 201 })
}
