import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const GAMES_FILE_PATH = path.join(process.cwd(), 'public', 'games.json');

// Helper to load games from file — returns empty array if file doesn't exist yet
function readGamesFromFile() {
  try {
    if (!fs.existsSync(GAMES_FILE_PATH)) {
      return [];
    }
    const raw = fs.readFileSync(GAMES_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error reading games.json:', err);
    return [];
  }
}

// Helper to write games array to file
function writeGamesToFile(games) {
  fs.writeFileSync(GAMES_FILE_PATH, JSON.stringify(games, null, 2), 'utf-8');
}

// GET /api/games - returns list of games
export async function GET() {
  const games = readGamesFromFile();
  return NextResponse.json({ success: true, games });
}

// POST /api/games - adds a new game
export async function POST(request) {
  try {
    const body = await request.json();
    const { title, url, description, category, badge } = body;

    if (!title || !url) {
      return NextResponse.json(
        { success: false, error: 'Game Title and URL are required.' },
        { status: 400 }
      );
    }

    // Ensure URL has protocol
    let formattedUrl = url.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl;
    }

    const currentGames = readGamesFromFile();
    const newGame = {
      id: 'game-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      title: title.trim(),
      url: formattedUrl,
      description: description?.trim() || 'Exciting Safaricom event game! Play and win instant rewards.',
      category: category?.trim() || 'Event Game',
      badge: badge?.trim() || 'Admin Pick',
      color: '#00A651'
    };

    const updatedGames = [newGame, ...currentGames];
    writeGamesToFile(updatedGames);

    return NextResponse.json({ success: true, games: updatedGames, addedGame: newGame });
  } catch (err) {
    console.error('Error adding game:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to add game.' },
      { status: 500 }
    );
  }
}

// DELETE /api/games - deletes a game by id
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');

    if (!id) {
      const body = await request.json().catch(() => ({}));
      id = body.id;
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Game ID is required for deletion.' },
        { status: 400 }
      );
    }

    const currentGames = readGamesFromFile();
    const updatedGames = currentGames.filter(g => g.id !== id);
    writeGamesToFile(updatedGames);

    return NextResponse.json({ success: true, games: updatedGames });
  } catch (err) {
    console.error('Error deleting game:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to delete game.' },
      { status: 500 }
    );
  }
}
