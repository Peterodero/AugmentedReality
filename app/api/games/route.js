import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const GAMES_FILE_PATH = path.join(process.cwd(), 'public', 'games.json');

const INITIAL_GAMES = [
  {
    id: 'safaricom-runner',
    title: 'Safaricom Safari Runner 3D',
    description: 'Dodge obstacles, collect M-PESA coins, and race for the high score!',
    category: 'Arcade / Action',
    badge: 'Popular',
    color: '#00A651',
    url: 'https://safaricom-runner.vercel.app'
  },
  {
    id: 'mpesa-spin-win',
    title: 'M-PESA Wheel of Fortune',
    description: 'Spin the lucky wheel for instant prizes and bonus points.',
    category: 'Casual / Luck',
    badge: 'Prize Game',
    color: '#FFD100',
    url: 'https://mpesa-spin-win.vercel.app'
  },
  {
    id: 'safaricom-trivia-dash',
    title: 'Safaricom 5G Trivia Master',
    description: 'Test your tech knowledge in a fast-paced live quiz countdown!',
    category: 'Trivia / Quiz',
    badge: 'Brain Teaser',
    color: '#008741',
    url: 'https://safaricom-trivia.vercel.app'
  }
];

// Helper to load games from file or write defaults
function readGamesFromFile() {
  try {
    if (!fs.existsSync(GAMES_FILE_PATH)) {
      fs.writeFileSync(GAMES_FILE_PATH, JSON.stringify(INITIAL_GAMES, null, 2), 'utf-8');
      return INITIAL_GAMES;
    }
    const raw = fs.readFileSync(GAMES_FILE_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading games.json:', err);
    return INITIAL_GAMES;
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
