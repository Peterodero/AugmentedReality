import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save/overwrite public/targets.mind
    const targetPath = path.join(process.cwd(), 'public', 'targets.mind');
    fs.writeFileSync(targetPath, buffer);

    return NextResponse.json({
      success: true,
      message: 'Active event target logo updated successfully!',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Target upload API error:', error);
    return NextResponse.json(
      { error: 'Failed to update target file: ' + error.message },
      { status: 500 }
    );
  }
}
