import { NextRequest, NextResponse } from 'next/server';
import { getSubtitles } from 'youtube-caption-extractor';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { extractVideoId } from '@/lib/youtube';

export async function POST(req: NextRequest) {
    try {
        const { url, apiKey: userApiKey, language = 'English' } = await req.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        const apiKey = userApiKey || process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: 'Gemini API Key is required. Please add it in settings or set GEMINI_API_KEY on the server.' }, { status: 400 });
        }

        const videoId = extractVideoId(url);
        if (!videoId) {
            return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
        }

        let transcriptText = '';
        try {
            console.log('Fetching transcript for:', videoId);
            // Try English first, then Turkish as a fallback
            let subtitles = [];
            try {
                subtitles = await getSubtitles({ videoID: videoId, lang: 'en' });
            } catch (innerError) {
                console.log('English subtitles not found, trying Turkish...');
                try {
                    subtitles = await getSubtitles({ videoID: videoId, lang: 'tr' });
                } catch (trError) {
                    console.log('Turkish subtitles also not found.');
                    throw new Error('No English or Turkish subtitles found.');
                }
            }

            console.log('Transcript chunks found:', subtitles.length);
            transcriptText = subtitles.map((t: any) => t.text).join(' ');
        } catch (e) {
            console.error('Transcript fetch failed:', e);
            return NextResponse.json({
                error: 'Could not fetch transcript. Please ensure the video has English or Turkish captions.'
            }, { status: 400 });
        }

        if (!transcriptText || transcriptText.trim().length === 0) {
            return NextResponse.json({ error: 'This video has no transcript data available.' }, { status: 400 });
        }

        // Initialize Gemini
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

        const prompt = `
You are a Clickbait Destroyer. The user will give you a YouTube video transcript. 
Your job is to find the specific answer to the video's implied hook or title. 
Do NOT summarize the whole video. Just answer the question or reveal the secret immediately. 
Be sarcastic and brief. 

CRITICAL: You MUST respond in ${language}.

${language === 'Turkish' ? `
Örnek:
Başlık: "Tembelliğin çözümünü buldum"
Çıktı: "Çözümün sadece sabah 5'te kalkmak olduğunu söylüyor. 10 dakikanı kurtardım."
` : `
Example: 
Title: "I found the cure for laziness"
Output: "He says the cure is just waking up at 5 AM. Saved you 10 minutes."
`}

Here is the transcript:
${transcriptText.substring(0, 30000)} // Limiting to 30k chars for safety
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const truth = response.text();

        return NextResponse.json({
            truth,
            videoId,
            // Rough estimation: sum of durations / 60
            // But we can just use a placeholder or better logic if we had duration.
            // For now, let's assume we saved them "some" time based on character count (rough proxy for length)
            timeSaved: Math.ceil(transcriptText.split(' ').length / 150) // Assuming 150 words per minute
        });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        console.error('Destroy Error:', error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
