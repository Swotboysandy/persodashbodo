import { NextResponse } from 'next/server';

const OMDB_API_KEY = process.env.NEXT_PUBLIC_OMDB_API_KEY;
const OMDB_BASE_URL = 'http://www.omdbapi.com';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const imdbId = searchParams.get('id');

    if (!OMDB_API_KEY) {
        return NextResponse.json({
            error: 'OMDb API key not configured. Please add NEXT_PUBLIC_OMDB_API_KEY to .env.local'
        }, { status: 500 });
    }

    try {
        if (imdbId) {
            // Get detailed movie information by IMDb ID
            const response = await fetch(
                `${OMDB_BASE_URL}/?i=${imdbId}&apikey=${OMDB_API_KEY}&plot=full`
            );
            const movie = await response.json();

            if (movie.Response === 'False') {
                return NextResponse.json({ error: movie.Error }, { status: 404 });
            }

            return NextResponse.json({
                id: movie.imdbID,
                title: movie.Title,
                poster: movie.Poster !== 'N/A' ? movie.Poster : null,
                plot: movie.Plot !== 'N/A' ? movie.Plot : null,
                releaseYear: movie.Year ? parseInt(movie.Year) : null,
                genres: movie.Genre ? movie.Genre.split(', ') : [],
                rating: movie.imdbRating !== 'N/A' ? parseFloat(movie.imdbRating) : null,
                cast: movie.Actors ? movie.Actors.split(', ') : [],
                director: movie.Director !== 'N/A' ? movie.Director : null,
                runtime: movie.Runtime !== 'N/A' ? movie.Runtime : null
            });
        }

        if (query) {
            // Search for movies by title
            const response = await fetch(
                `${OMDB_BASE_URL}/?s=${encodeURIComponent(query)}&apikey=${OMDB_API_KEY}&type=movie`
            );
            const data = await response.json();

            if (data.Response === 'False') {
                return NextResponse.json([]);
            }

            const results = data.Search?.slice(0, 10).map((movie: any) => ({
                id: movie.imdbID,
                title: movie.Title,
                poster: movie.Poster !== 'N/A' ? movie.Poster : null,
                releaseYear: movie.Year ? parseInt(movie.Year) : null,
            })) || [];

            return NextResponse.json(results);
        }

        return NextResponse.json({ error: 'Query or ID is required' }, { status: 400 });
    } catch (error) {
        console.error('Error fetching movie data:', error);
        return NextResponse.json({ error: 'Failed to fetch movie data' }, { status: 500 });
    }
}
