// API Route for Bonus and Performance Calculations
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

// POST - Calculate bonus for a user
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { academic_year, user_id } = body;

    if (!academic_year) {
      return NextResponse.json({ error: 'Academic year required' }, { status: 400 });
    }

    const targetUserId = user_id || decoded.userId;

    // Calculate metrics
    const metrics = await calculateUserMetrics(targetUserId, academic_year);

    // Calculate bonus based on metrics
    const bonusAmount = await calculateBonusAmount(metrics, academic_year);

    // Save performance indicators
    await savePerformanceIndicators(targetUserId, academic_year, metrics);

    // Save or update prime record
    const primeId = await savePrimeRecord(targetUserId, academic_year, bonusAmount, metrics);

    return NextResponse.json({
      metrics,
      bonus_amount: bonusAmount,
      prime_id: primeId,
      calculated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('POST calculate bonus error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Retrieve calculated bonuses
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id') || decoded.userId;
    const academicYear = searchParams.get('academic_year');

    let queryText = `
      SELECT 
        p.id,
        p.user_id,
        u.first_name || ' ' || u.last_name as user_name,
        p.academic_year,
        p.total_amount,
        p.calculation_details,
        p.status,
        p.created_at,
        p.updated_at
      FROM primes p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.user_id = $1
    `;

    const params: any[] = [userId];

    if (academicYear) {
      queryText += ' AND p.academic_year = $2';
      params.push(academicYear);
    }

    queryText += ' ORDER BY p.academic_year DESC, p.created_at DESC';

    const primes = await query(queryText, params);

    return NextResponse.json({ primes });

  } catch (error) {
    console.error('GET primes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper functions

async function calculateUserMetrics(userId: string, academicYear: string) {
  // Teaching hours
  const teachingResult = await queryOne(`
    SELECT COALESCE(SUM(actual_hours), 0) as total_hours
    FROM teaching_activities
    WHERE user_id = $1 AND academic_year = $2
  `, [userId, academicYear]);

  // Supervision counts by type
  const supervisionResult = await query(`
    SELECT 
      supervision_type,
      role,
      COUNT(*) as count
    FROM supervision_activities
    WHERE user_id = $1 AND academic_year = $2
    GROUP BY supervision_type, role
  `, [userId, academicYear]);

  const supervision = {
    total: 0,
    pfe: 0,
    memoire: 0,
    stage: 0,
    these: 0,
    encadrant: 0,
    rapporteur: 0,
    president: 0
  };

  supervisionResult.forEach((row: any) => {
    const count = parseInt(row.count);
    supervision.total += count;

    if (row.supervision_type === 'PFE') supervision.pfe += count;
    if (row.supervision_type === 'Memoire') supervision.memoire += count;
    if (row.supervision_type === 'Stage') supervision.stage += count;
    if (row.supervision_type === 'These') supervision.these += count;

    if (row.role === 'Encadrant') supervision.encadrant += count;
    if (row.role === 'Rapporteur') supervision.rapporteur += count;
    if (row.role === 'President') supervision.president += count;
  });

  // Research publications with details
  const researchResult = await query(`
    SELECT 
      publication_type,
      indexation,
      quartile,
      COUNT(*) as count
    FROM research_publications
    WHERE user_id = $1
      AND EXTRACT(YEAR FROM publication_date)::VARCHAR = $2
    GROUP BY publication_type, indexation, quartile
  `, [userId, academicYear]);

  const research = {
    total: 0,
    articles: 0,
    conferences: 0,
    books: 0,
    chapters: 0,
    scopus: 0,
    wos: 0,
    q1: 0,
    q2: 0,
    q3: 0,
    q4: 0
  };

  researchResult.forEach((row: any) => {
    const count = parseInt(row.count);
    research.total += count;

    if (row.publication_type === 'Article') research.articles += count;
    if (row.publication_type === 'Conference') research.conferences += count;
    if (row.publication_type === 'Book') research.books += count;
    if (row.publication_type === 'Book_Chapter') research.chapters += count;

    if (row.indexation === 'Scopus') research.scopus += count;
    if (row.indexation === 'Web of Science') research.wos += count;

    if (row.quartile === 'Q1') research.q1 += count;
    if (row.quartile === 'Q2') research.q2 += count;
    if (row.quartile === 'Q3') research.q3 += count;
    if (row.quartile === 'Q4') research.q4 += count;
  });

  // Exam supervision hours
  const examResult = await queryOne(`
    SELECT COALESCE(SUM(hours), 0) as total_hours
    FROM exam_supervisions
    WHERE user_id = $1 AND academic_year = $2
  `, [userId, academicYear]);

  // Responsibilities
  const responsibilityResult = await query(`
    SELECT 
      responsibility_type,
      COUNT(*) as count,
      COALESCE(SUM(hours_allocated), 0) as total_hours
    FROM academic_responsibilities
    WHERE user_id = $1
      AND EXTRACT(YEAR FROM start_date)::VARCHAR = $2
    GROUP BY responsibility_type
  `, [userId, academicYear]);

  const responsibilities = {
    total: 0,
    total_hours: 0,
    types: {} as Record<string, number>
  };

  responsibilityResult.forEach((row: any) => {
    responsibilities.total += parseInt(row.count);
    responsibilities.total_hours += parseFloat(row.total_hours);
    responsibilities.types[row.responsibility_type] = parseInt(row.count);
  });

  // Calculate total score
  const score = calculateScore({
    teaching_hours: parseFloat(teachingResult?.total_hours || 0),
    supervision,
    research,
    exam_hours: parseFloat(examResult?.total_hours || 0),
    responsibilities
  });

  return {
    teaching_hours: parseFloat(teachingResult?.total_hours || 0),
    supervision,
    research,
    exam_hours: parseFloat(examResult?.total_hours || 0),
    responsibilities,
    total_score: score
  };
}

function calculateScore(data: any): number {
  let score = 0;

  // Teaching: 1 point per hour (max 200)
  score += Math.min(data.teaching_hours, 200);

  // Supervisions
  score += data.supervision.pfe * 10;
  score += data.supervision.memoire * 15;
  score += data.supervision.these * 50;
  score += data.supervision.president * 8;
  score += data.supervision.rapporteur * 5;

  // Research
  score += data.research.scopus * 100;
  score += data.research.wos * 120;
  score += data.research.q1 * 150;
  score += data.research.q2 * 100;
  score += data.research.conferences * 30;
  score += data.research.books * 200;
  score += data.research.chapters * 50;

  // Exams
  score += data.exam_hours * 0.5;

  // Responsibilities
  score += data.responsibilities.total_hours * 2;

  return Math.round(score * 100) / 100;
}

async function calculateBonusAmount(metrics: any, academicYear: string): Promise<number> {
  // Get active prime rules
  const rules = await query(`
    SELECT 
      pr.*,
      at.name as activity_type_name
    FROM prime_rules pr
    LEFT JOIN activity_types at ON pr.activity_type_id = at.id
    WHERE pr.academic_year = $1 AND pr.is_active = true
  `, [academicYear]);

  let totalBonus = 0;

  for (const rule of rules) {
    let amount = 0;

    switch (rule.activity_type_name) {
      case 'teaching':
        if (metrics.teaching_hours >= rule.minimum_hours) {
          const hours = Math.min(metrics.teaching_hours, rule.maximum_hours || metrics.teaching_hours);
          amount = parseFloat(rule.base_amount || 0) + (hours * parseFloat(rule.hourly_rate || 0));
        }
        break;

      case 'supervision':
        if (metrics.supervision.encadrant >= rule.minimum_hours) {
          const units = Math.min(metrics.supervision.encadrant, rule.maximum_hours || metrics.supervision.encadrant);
          amount = parseFloat(rule.base_amount || 0) + (units * parseFloat(rule.hourly_rate || 0));
        }
        break;

      case 'research':
        if (metrics.research.total >= rule.minimum_hours) {
          amount = parseFloat(rule.base_amount || 0);
          amount += metrics.research.scopus * 500;
          amount += metrics.research.wos * 700;
          amount += metrics.research.q1 * 1000;
        }
        break;
    }

    amount *= parseFloat(rule.multiplier || 1.0);
    totalBonus += amount;
  }

  return Math.round(totalBonus * 100) / 100;
}

async function savePerformanceIndicators(userId: string, academicYear: string, metrics: any): Promise<void> {
  const existing = await queryOne(`
    SELECT id FROM performance_indicators
    WHERE user_id = $1 AND academic_year = $2
  `, [userId, academicYear]);

  if (existing) {
    await query(`
      UPDATE performance_indicators
      SET 
        teaching_hours = $3,
        supervision_hours = $4,
        research_count = $5,
        conference_count = $6,
        responsibilities_count = $7,
        total_score = $8,
        updated_at = NOW()
      WHERE user_id = $1 AND academic_year = $2
    `, [
      userId,
      academicYear,
      metrics.teaching_hours,
      metrics.supervision.total,
      metrics.research.total,
      metrics.research.conferences,
      metrics.responsibilities.total,
      metrics.total_score
    ]);
  } else {
    await query(`
      INSERT INTO performance_indicators (
        user_id, academic_year, teaching_hours, supervision_hours,
        research_count, conference_count, responsibilities_count,
        total_score, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
    `, [
      userId,
      academicYear,
      metrics.teaching_hours,
      metrics.supervision.total,
      metrics.research.total,
      metrics.research.conferences,
      metrics.responsibilities.total,
      metrics.total_score
    ]);
  }
}

async function savePrimeRecord(userId: string, academicYear: string, amount: number, metrics: any): Promise<string> {
  const existing = await queryOne(`
    SELECT id FROM primes
    WHERE user_id = $1 AND academic_year = $2
  `, [userId, academicYear]);

  const details = {
    metrics,
    calculated_at: new Date().toISOString()
  };

  if (existing) {
    await query(`
      UPDATE primes
      SET 
        total_amount = $3,
        calculation_details = $4,
        status = 'calculated',
        updated_at = NOW()
      WHERE user_id = $1 AND academic_year = $2
    `, [userId, academicYear, amount, JSON.stringify(details)]);

    return existing.id;
  } else {
    const result = await queryOne(`
      INSERT INTO primes (
        user_id, academic_year, total_amount, calculation_details,
        status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, 'calculated', NOW(), NOW())
      RETURNING id
    `, [userId, academicYear, amount, JSON.stringify(details)]);

    return result.id;
  }
}
