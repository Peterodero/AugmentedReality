import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const META_PATH = path.join(process.cwd(), 'public', 'targets-meta.json');
const TARGET_MIND_PATH = path.join(process.cwd(), 'public', 'targets.mind');
const PREVIEWS_DIR = path.join(process.cwd(), 'public', 'target-previews');

// Helper to ensure directory exists
function ensurePreviewsDir() {
  if (!fs.existsSync(PREVIEWS_DIR)) {
    fs.mkdirSync(PREVIEWS_DIR, { recursive: true });
  }
}

// Helper to read metadata
function getMetadata() {
  try {
    if (fs.existsSync(META_PATH)) {
      const content = fs.readFileSync(META_PATH, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading targets metadata:', err);
  }
  return { targets: [] };
}

// Helper to save metadata
function saveMetadata(data) {
  try {
    fs.writeFileSync(META_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error saving targets metadata:', err);
  }
}

// GET: Fetch list of uploaded target logos and active target status
export async function GET() {
  try {
    const meta = getMetadata();
    const hasMindFile = fs.existsSync(TARGET_MIND_PATH);

    // If targets.mind exists but metadata is empty, construct a default entry
    let targetsList = meta.targets || [];
    if (hasMindFile && targetsList.length === 0) {
      const stats = fs.statSync(TARGET_MIND_PATH);
      targetsList = [
        {
          id: 'default-active-target',
          name: 'Active_Safaricom_Logo.mind',
          size: `${(stats.size / 1024).toFixed(1)} KB`,
          createdAt: stats.mtime.toISOString(),
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

// POST: Upload/Save new target logo compiled buffer
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

    // Save/overwrite public/targets.mind (active binary used by MindAR scanner)
    fs.writeFileSync(TARGET_MIND_PATH, buffer);

    ensurePreviewsDir();
    const targetId = `target-${Date.now()}`;
    let previewRelativeUrl = null;

    // Save preview image file if provided as base64 data URL
    if (previewDataUrl && previewDataUrl.startsWith('data:image/')) {
      try {
        const base64Data = previewDataUrl.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');
        const previewFileName = `${targetId}.png`;
        const previewFilePath = path.join(PREVIEWS_DIR, previewFileName);
        fs.writeFileSync(previewFilePath, imageBuffer);
        previewRelativeUrl = `/target-previews/${previewFileName}`;
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
      bufferBase64: buffer.toString('base64'), // Store buffer for re-activation if needed
    };

    const meta = getMetadata();
    // Mark previous targets as inactive
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

// DELETE: Remove a target logo by ID (or delete active target)
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetId = searchParams.get('id');

    const meta = getMetadata();
    let targetsList = meta.targets || [];

    if (!targetId && targetsList.length === 0 && fs.existsSync(TARGET_MIND_PATH)) {
      // Delete standalone targets.mind file
      fs.unlinkSync(TARGET_MIND_PATH);
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

    // Filter out target to delete
    targetsList = targetsList.filter(t => t.id !== deleteId);

    // If deleted target preview file exists, clean it up
    if (targetToDelete?.preview) {
      const previewFile = path.join(process.cwd(), 'public', targetToDelete.preview);
      if (fs.existsSync(previewFile)) {
        try { fs.unlinkSync(previewFile); } catch (e) { /* ignore */ }
      }
    }

    // If deleted target was active, activate the next available target or remove targets.mind
    if (wasActive) {
      if (targetsList.length > 0) {
        targetsList[0].isActive = true;
        if (targetsList[0].bufferBase64) {
          const buf = Buffer.from(targetsList[0].bufferBase64, 'base64');
          fs.writeFileSync(TARGET_MIND_PATH, buf);
        }
      } else {
        if (fs.existsSync(TARGET_MIND_PATH)) {
          fs.unlinkSync(TARGET_MIND_PATH);
        }
      }
    }

    saveMetadata({ targets: targetsList });

    return NextResponse.json({
      success: true,
      message: `Deleted target logo "${targetToDelete?.name || 'Target'}".`,
      targets: targetsList,
      hasActiveTarget: fs.existsSync(TARGET_MIND_PATH) && targetsList.length > 0,
    });
  } catch (error) {
    console.error('Delete target error:', error);
    return NextResponse.json(
      { error: 'Failed to delete target logo: ' + error.message },
      { status: 500 }
    );
  }
}
