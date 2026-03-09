// API Routes for Research Publications
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

// GET all research publications for a user
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
    const publicationType = searchParams.get('type');
    const year = searchParams.get('year');
    const indexation = searchParams.get('indexation');

    let queryText = `
      SELECT 
        rp.id,
        rp.user_id,
        rp.publication_type,
        rp.title,
        rp.authors,
        rp.publication_date,
        rp.journal_name,
        rp.conference_name,
        rp.publisher,
        rp.volume,
        rp.issue,
        rp.pages,
        rp.doi,
        rp.isbn,
        rp.indexation,
        rp.quartile,
        rp.impact_factor,
        rp.url,
        rp.abstract,
        rp.keywords,
        rp.status,
        rp.attachment_url,
        rp.validated_by,
        rp.validation_date,
        rp.created_at,
        rp.updated_at,
        u.first_name || ' ' || u.last_name as validator_name
      FROM research_publications rp
      LEFT JOIN users u ON rp.validated_by = u.id
      WHERE rp.user_id = $1
    `;

    const params: any[] = [decoded.userId];
    let paramCount = 1;

    if (publicationType) {
      paramCount++;
      queryText += ` AND rp.publication_type = $${paramCount}`;
      params.push(publicationType);
    }

    if (year) {
      paramCount++;
      queryText += ` AND EXTRACT(YEAR FROM rp.publication_date) = $${paramCount}`;
      params.push(parseInt(year));
    }

    if (indexation) {
      paramCount++;
      queryText += ` AND rp.indexation = $${paramCount}`;
      params.push(indexation);
    }

    queryText += ' ORDER BY rp.publication_date DESC, rp.created_at DESC';

    const publications = await query(queryText, params);

    // Calculate statistics
    const stats = {
      total: publications.length,
      by_type: {
        Article: publications.filter((p: any) => p.publication_type === 'Article').length,
        Conference: publications.filter((p: any) => p.publication_type === 'Conference').length,
        Book_Chapter: publications.filter((p: any) => p.publication_type === 'Book_Chapter').length,
        Book: publications.filter((p: any) => p.publication_type === 'Book').length,
      },
      by_indexation: {
        Scopus: publications.filter((p: any) => p.indexation === 'Scopus').length,
        'Web of Science': publications.filter((p: any) => p.indexation === 'Web of Science').length,
        PubMed: publications.filter((p: any) => p.indexation === 'PubMed').length,
        Other: publications.filter((p: any) => !['Scopus', 'Web of Science', 'PubMed'].includes(p.indexation)).length,
      },
      by_quartile: {
        Q1: publications.filter((p: any) => p.quartile === 'Q1').length,
        Q2: publications.filter((p: any) => p.quartile === 'Q2').length,
        Q3: publications.filter((p: any) => p.quartile === 'Q3').length,
        Q4: publications.filter((p: any) => p.quartile === 'Q4').length,
      }
    };

    return NextResponse.json({ publications, stats });
  } catch (error) {
    console.error('GET research publications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create new research publication
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
    const {
      publication_type,
      title,
      authors,
      publication_date,
      journal_name,
      conference_name,
      publisher,
      volume,
      issue,
      pages,
      doi,
      isbn,
      indexation,
      quartile,
      impact_factor,
      url,
      abstract,
      keywords,
      status,
      attachment_url
    } = body;

    // Validate required fields
    if (!publication_type || !title || !authors || !publication_date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate publication type
    const validTypes = ['Article', 'Conference', 'Book_Chapter', 'Book'];
    if (!validTypes.includes(publication_type)) {
      return NextResponse.json(
        { error: 'Invalid publication type' },
        { status: 400 }
      );
    }

    // Insert research publication
    const publication = await queryOne(`
      INSERT INTO research_publications (
        user_id, publication_type, title, authors, publication_date,
        journal_name, conference_name, publisher, volume, issue, pages,
        doi, isbn, indexation, quartile, impact_factor, url, abstract,
        keywords, status, attachment_url, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, NOW(), NOW())
      RETURNING 
        id, user_id, publication_type, title, authors, publication_date,
        journal_name, conference_name, publisher, indexation, quartile,
        impact_factor, status, created_at
    `, [
      decoded.userId,
      publication_type,
      title,
      authors,
      publication_date,
      journal_name || null,
      conference_name || null,
      publisher || null,
      volume || null,
      issue || null,
      pages || null,
      doi || null,
      isbn || null,
      indexation || null,
      quartile || null,
      impact_factor || null,
      url || null,
      abstract || null,
      keywords || null,
      status || 'published',
      attachment_url || null
    ]);

    // Create notification for department head
    const user = await queryOne('SELECT department_id FROM users WHERE id = $1', [decoded.userId]);
    if (user?.department_id) {
      await query(`
        INSERT INTO notifications (user_id, type, title, message, related_entity_type, related_entity_id, is_read)
        SELECT 
          u.id,
          'research_publication_created',
          'Nouvelle publication scientifique',
          'Une nouvelle publication scientifique a été ajoutée.',
          'research_publication',
          $1,
          false
        FROM users u
        INNER JOIN roles r ON u.role_id = r.id
        WHERE u.department_id = $2 AND r.name = 'chef_departement'
      `, [publication.id, user.department_id]);
    }

    return NextResponse.json(publication, { status: 201 });
  } catch (error) {
    console.error('POST research publication error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT update research publication
export async function PUT(request: NextRequest) {
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
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Publication ID required' }, { status: 400 });
    }

    // Check ownership
    const existing = await queryOne(
      'SELECT user_id, validated_by FROM research_publications WHERE id = $1',
      [id]
    );

    if (!existing) {
      return NextResponse.json({ error: 'Publication not found' }, { status: 404 });
    }

    if (existing.user_id !== decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Build update query
    const allowedFields = [
      'publication_type', 'title', 'authors', 'publication_date', 'journal_name',
      'conference_name', 'publisher', 'volume', 'issue', 'pages', 'doi', 'isbn',
      'indexation', 'quartile', 'impact_factor', 'url', 'abstract', 'keywords',
      'status', 'attachment_url'
    ];

    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = $${paramCount}`);
        updateValues.push(updates[key]);
        paramCount++;
      }
    });

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    updateValues.push(id);
    const publication = await queryOne(`
      UPDATE research_publications
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING *
    `, updateValues);

    return NextResponse.json(publication);
  } catch (error) {
    console.error('PUT research publication error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE research publication
export async function DELETE(request: NextRequest) {
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
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Publication ID required' }, { status: 400 });
    }

    // Check ownership
    const existing = await queryOne(
      'SELECT user_id FROM research_publications WHERE id = $1',
      [id]
    );

    if (!existing) {
      return NextResponse.json({ error: 'Publication not found' }, { status: 404 });
    }

    if (existing.user_id !== decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await query('DELETE FROM research_publications WHERE id = $1', [id]);

    return NextResponse.json({ message: 'Publication deleted successfully' });
  } catch (error) {
    console.error('DELETE research publication error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
