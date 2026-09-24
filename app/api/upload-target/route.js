import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const TMP_DIR = '/tmp';

// Safe filesystem helpers that fallback to /tmp on serverless read-only filesystems (e.g. Vercel)
function safeWriteFileSync(relativePath, data) {
  const primaryPath = path.join(PUBLIC_DIR, relativePath);
  try {
    const dir = path.dirname(primaryPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(primaryPath, data);
  } catch (err) {
    if (err.code === 'EROFS' || err.message?.includes('read-only')) {
      const tmpPath = path.join(TMP_DIR, relativePath);
      const tmpDir = path.dirname(tmpPath);
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
      fs.writeFileSync(tmpPath, data);
    } else {
      throw err;
    }
  }
}

function safeReadFileSync(relativePath, encoding = null) {
  const tmpPath = path.join(TMP_DIR, relativePath);
  if (fs.existsSync(tmpPath)) {
    return encoding ? fs.readFileSync(tmpPath, encoding) : fs.readFileSync(tmpPath);
  }
  const publicPath = path.join(PUBLIC_DIR, relativePath);
  if (fs.existsSync(publicPath)) {
    return encoding ? fs.readFileSync(publicPath, encoding) : fs.readFileSync(publicPath);
  }
  return null;
}

function safeExistsSync(relativePath) {
  const tmpPath = path.join(TMP_DIR, relativePath);
  if (fs.existsSync(tmpPath)) return true;
  const publicPath = path.join(PUBLIC_DIR, relativePath);
  return fs.existsSync(publicPath);
}

function safeUnlinkSync(relativePath) {
  const tmpPath = path.join(TMP_DIR, relativePath);
  if (fs.existsSync(tmpPath)) {
    try { fs.unlinkSync(tmpPath); } catch (e) { /* ignore */ }
  }
  const publicPath = path.join(PUBLIC_DIR, relativePath);
  if (fs.existsSync(publicPath)) {
    try { fs.unlinkSync(publicPath); } catch (e) { /* ignore */ }
  }
}

function getMetadata() {
  try {
    const content = safeReadFileSync('targets-meta.json', 'utf-8');
    if (content) {
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading targets metadata:', err);
  }
  return { targets: [] };
}

function saveMetadata(data) {
  try {
    safeWriteFileSync('targets-meta.json', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error saving targets metadata:', err);
  }
}

// GET: Fetch targets metadata OR stream binary .mind file if ?raw=1
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const isRaw = searchParams.get('raw') === '1';

    // If requested as raw binary (.mind file for AR scanner)
    if (isRaw) {
      const mindBuffer = safeReadFileSync('targets.mind');
      if (!mindBuffer) {
        return new Response('Target file not found', { status: 404 });
      }
      return new Response(mindBuffer, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }

    const meta = getMetadata();
    const hasMindFile = safeExistsSync('targets.mind');

    let targetsList = meta.targets || [];
    if (hasMindFile && targetsList.length === 0) {
      targetsList = [
        {
          id: 'default-active-target',
          name: 'Active_Safaricom_Logo.mind',
          size: 'Compiled Target',
          createdAt: new Date().toISOString(),
          isActive: true,
          preview: null,
        }
      ];
    }

    return NextResponse.json({
      hasActiveTarget: hasMindFile && targetsList.length > 0,
      targets: targetsList,
    });
  } catch (error) {
    console.error('GET targets error:', error);
    return NextResponse.json({ error: 'Failed to fetch targets' }, { status: 500 });
  }
}

// POST: Upload & activate new compiled target logo
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const fileName = formData.get('fileName') || 'Safaricom_Target_Logo.png';
    const previewDataUrl = formData.get('previewImage');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save active binary target safely (falls back to /tmp on Vercel EROFS)
    safeWriteFileSync('targets.mind', buffer);

    const targetId = `target-${Date.now()}`;
    let previewRelativeUrl = null;

    if (previewDataUrl && previewDataUrl.startsWith('data:image/')) {
      try {
        const base64Data = previewDataUrl.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');
        const previewFileName = `target-previews/${targetId}.png`;
        safeWriteFileSync(previewFileName, imageBuffer);
        previewRelativeUrl = `/${previewFileName}`;
      } catch (e) {
        console.error('Error saving preview image:', e);
      }
    }

    const newTarget = {
      id: targetId,
      name: fileName,
      size: `${(buffer.length / 1024).toFixed(1)} KB`,
      createdAt: new Date().toISOString(),
      isActive: true,
      preview: previewRelativeUrl,
      bufferBase64: buffer.toString('base64'),
    };

    const meta = getMetadata();
    const updatedTargets = (meta.targets || []).map(t => ({ ...t, isActive: false }));
    updatedTargets.unshift(newTarget);

    saveMetadata({ targets: updatedTargets });

    return NextResponse.json({
      success: true,
      message: `Target logo "${fileName}" activated successfully!`,
      target: newTarget,
      targets: updatedTargets,
    });
  } catch (error) {
    console.error('Target upload API error:', error);
    return NextResponse.json(
      { error: 'Failed to update target file: ' + error.message },
      { status: 500 }
    );
  }
}

// DELETE: Remove a target logo by ID
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetId = searchParams.get('id');

    const meta = getMetadata();
    let targetsList = meta.targets || [];

    if (!targetId && targetsList.length === 0 && safeExistsSync('targets.mind')) {
      safeUnlinkSync('targets.mind');
      return NextResponse.json({
        success: true,
        message: 'Active target logo file deleted.',
        targets: [],
      });
    }

    const targetToDelete = targetsList.find(t => t.id === targetId) || targetsList[0];
    if (!targetToDelete && !targetId) {
      return NextResponse.json({ error: 'Target logo not found' }, { status: 404 });
    }

    const deleteId = targetToDelete ? targetToDelete.id : targetId;
    const wasActive = targetToDelete?.isActive;

    targetsList = targetsList.filter(t => t.id !== deleteId);

    if (targetToDelete?.preview) {
      const cleanPath = targetToDelete.preview.startsWith('/') ? targetToDelete.preview.slice(1) : targetToDelete.preview;
      safeUnlinkSync(cleanPath);
    }

    if (wasActive) {
      if (targetsList.length > 0) {
        targetsList[0].isActive = true;
        if (targetsList[0].bufferBase64) {
          const buf = Buffer.from(targetsList[0].bufferBase64, 'base64');
          safeWriteFileSync('targets.mind', buf);
        }
      } else {
        safeUnlinkSync('targets.mind');
      }
    }

    saveMetadata({ targets: targetsList });

    return NextResponse.json({
      success: true,
      message: `Deleted target logo "${targetToDelete?.name || 'Target'}".`,
      targets: targetsList,
      hasActiveTarget: safeExistsSync('targets.mind') && targetsList.length > 0,
    });
  } catch (error) {
    console.error('Delete target error:', error);
    return NextResponse.json(
      { error: 'Failed to delete target logo: ' + error.message },
      { status: 500 }
    );
  }
}
